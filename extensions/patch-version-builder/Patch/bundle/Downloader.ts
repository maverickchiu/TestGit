import { native, path } from "cc";
import { IAssetInfo, IBundleInfo, IDownloader, IDownloadIssue, IPatchConfig, IRequestConfig, IRequestItem } from "../Type";
import SparkMD5 from 'spark-md5';

export class Downloader implements IDownloader {
    private createRequestItems(bundleInfos: IBundleInfo[], config: IRequestConfig): IRequestItem[] {
        let index = 0;
        const requestItems: IRequestItem[] = [];
        bundleInfos.forEach((bundle) => {
            bundle.items.forEach(item => {
                const identifier = index.toString();
                index++;
                const requestItem: IRequestItem = {
                    identifier: identifier,
                    bundleName: bundle.name,
                    config: config,
                    assetInfo: item,
                };
                requestItems.push(requestItem);
            });
        });
        return requestItems;
    }

    private checkMd5(localPath: string, assetInfo: IAssetInfo): boolean {
        const data = native.fileUtils.getDataFromFile(localPath);
        if (!data || data.byteLength <= 0) {
            console.error(`data is empty: ${localPath}`);
            return false;
        }
        else {
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(data);
            const hash = spark.end();
            if (hash !== assetInfo.md5) {
                console.error(`md5 mismatch: ${localPath}`);
                return false;
            }
        }
        return true;
    }

    async fetchAssetsToTemp(issue: IDownloadIssue): Promise<void> {
        const config = issue.config;
        const maxConcurrentCount = issue.concurrentCount;
        const bundleInfos = issue.bundleInfos;
        const baseUrl = config.baseUrl;
        const onProgress = config.onProgress;

        return new Promise<void>((resolve, reject) => {
            let completedCount = 0;
            const writablePath = native.fileUtils.getWritablePath().replace(/\\/g, '/');
            const config: IRequestConfig = {
                base: baseUrl,
            };

            const assetInfoMap: Map<string, IAssetInfo> = new Map();
            const requestItems = this.createRequestItems(bundleInfos, config);
            requestItems.forEach(item => {
                assetInfoMap.set(item.identifier, item.assetInfo);
            });
            const totalCount = requestItems.length;
            onProgress?.(completedCount, totalCount);

            let hasError = false;
            let concurrentCount = maxConcurrentCount;
            const tempDir = path.join(writablePath, 'temp');
            const downloader = new native.Downloader();
            console.log('開始下載: ', requestItems.length);

            const fetchNext = () => {
                if (requestItems.length === 0) {
                    concurrentCount--;
                    if (concurrentCount > 0) {
                        return;
                    }
                    console.log('更新完成');
                    resolve();
                    return;
                }
                const requestItem = requestItems.pop();
                const localPath = path.join(writablePath, 'remote', requestItem.bundleName, requestItem.assetInfo.relative);
                if (native.fileUtils.isFileExist(localPath)) {
                    completedCount++;
                    onProgress?.(completedCount, totalCount);
                    fetchNext();
                    return;
                }
                const tempPath = path.join(tempDir, requestItem.bundleName, requestItem.assetInfo.relative);

                const dir = path.dirname(tempPath);
                if (!native.fileUtils.isDirectoryExist(dir)) {
                    native.fileUtils.createDirectory(dir);
                }

                const url = path.join(requestItem.config.base, requestItem.bundleName, requestItem.assetInfo.relative);
                downloader.createDownloadTask(url, tempPath, requestItem.identifier);
            }

            downloader.onSuccess = (task) => {
                if (hasError) {
                    return;
                }
                const assetInfo = assetInfoMap.get(task.identifier);
                if (!assetInfo) {
                    console.error(`asset info not found: ${task.identifier}`);
                    hasError = true;
                    requestItems.length = 0;
                    reject(new Error(`asset info not found: ${task.identifier}`));
                    return;
                }
                console.log('下載完成: ', task.storagePath);

                if (!this.checkMd5(task.storagePath, assetInfo)) {
                    hasError = true;
                    requestItems.length = 0;
                    reject(new Error(`md5 mismatch: ${task.storagePath}`));
                    return;
                }

                completedCount++;
                onProgress?.(completedCount, totalCount);

                fetchNext();
            };
            downloader.onError = (task, error) => {
                hasError = true;
                requestItems.length = 0;
                reject(error);
            };

            for (let i = 0; i < maxConcurrentCount; i++) {
                fetchNext();
            }
        });
    }
}