import { AssetManager, assetManager, director, game, native, path, sys } from "cc";
import {
    BundleState,
    CONCURRENT_COUNT, IAssetInfo, IBundleInfo,
    IDownloader, IDownloadIssue, IFileMover, IObsoleteBundleFilter,
    IPatchConfig, IPatchResult, IVersionFetcher, IVersionInfo
} from "./Type";
import { VersionFetcher } from "./version/VersionFetcher";
import { ObsoleteBundleFilter } from "./version/ObsoleteBundleFilter";
import { FileMover } from "./bundle/FileMover";
import { Downloader } from "./bundle/Downloader";

export class PatchManager {
    concurrentCount: number = CONCURRENT_COUNT;

    versionFetcher: IVersionFetcher;

    obsoleteBundleFilter: IObsoleteBundleFilter;

    fileMover: IFileMover;

    downloader: IDownloader;

    private bundleMap: Map<string, string> = new Map();

    constructor() {
        this.versionFetcher = new VersionFetcher();
        this.obsoleteBundleFilter = new ObsoleteBundleFilter();
        this.fileMover = new FileMover();
        this.downloader = new Downloader();

        if (!sys.isNative) {
            console.log('[Patch] 非 native 環境，設定搜尋路徑');
            assetManager.transformPipeline.append((task: AssetManager.Task, done: ((err?: Error | null) => void)) => {
                task.output = task.input;
                for (const input of task.input) {
                    const bundleName = input.url;
                    const route = this.bundleMap.get(bundleName);
                    if (route) {
                        input.url = path.join(route, input.url);
                    }
                }
            });
        }
        else {
            console.log('[Patch] 設定搜尋路徑');
            const searchPaths = native.fileUtils.getSearchPaths();
            const writablePath = native.fileUtils.getWritablePath().replace(/\\/g, '/');
            const remotePath = path.join(writablePath, 'remote');
            native.fileUtils.setSearchPaths([writablePath, remotePath, ...searchPaths]);
            
            const destination = path.join(writablePath, 'remote', remotePath);
            console.log('[Patch] 設定搜尋路徑完成, destination: ', destination);
        }
    }

    async patch(config: IPatchConfig): Promise<IPatchResult> {
        const baseUrl = config.baseUrl;
        const versionInfo = await this.versionFetcher.fetchVersionInfo(baseUrl);
        if (!sys.isNative) {
            console.log('[Patch] 非 native 環境，不進行下載');
            this.addBundleRoutes(baseUrl, versionInfo.bundleInfos);
            this.registerBundleVersions(versionInfo.bundleInfos);
            return {
                version: versionInfo,
                allBundleInfos: versionInfo.bundleInfos,
                obsoleteBundleInfos: [],
            }
        }

        const results = this.obsoleteBundleFilter.filter(versionInfo);
        const obsoleteBundles: IBundleInfo[] = [];
        for (const result of results) {
            if (result.bundleState === BundleState.Obsolete) {
                obsoleteBundles.push(result.bundleInfo);
            }
        }
        if (obsoleteBundles.length === 0) {
            console.log('[Patch] 沒有需要下載的 bundle');
            this.registerBundleVersions(versionInfo.bundleInfos);
            return {
                version: versionInfo,
                allBundleInfos: versionInfo.bundleInfos,
                obsoleteBundleInfos: obsoleteBundles,
            };
        }
        const downloadIssue: IDownloadIssue = {
            config: config,
            concurrentCount: this.concurrentCount,
            bundleInfos: obsoleteBundles,
        };
        console.log('[Patch] 開始下載: ', obsoleteBundles.length);
        await this.downloader.fetchAssetsToTemp(downloadIssue);
        console.log('[Patch] 下載完成，開始移動到 remote');
        await this.moveAssetsToRemote(obsoleteBundles);
        console.log('[Patch] 移動完成，開始註冊 bundle 版本');
        this.registerBundleVersions(versionInfo.bundleInfos);
        console.log('[Patch] 更新完成');
        return {
            version: versionInfo,
            allBundleInfos: versionInfo.bundleInfos,
            obsoleteBundleInfos: obsoleteBundles,
        };
    }

    private registerBundleVersions(bundleInfos: IBundleInfo[]): void {
        const downloader = assetManager.downloader;
        const remoteBundles = downloader.remoteBundles as string[];
        const registerBundles = new Set<string>();
        for (const bundle of remoteBundles) {
            registerBundles.add(bundle);
        }
        for (const bundle of bundleInfos) {
            const bundleName = bundle.name;
            const bundleVersion = bundle.version;
            downloader.bundleVers[bundleName] = bundleVersion;
            if (!registerBundles.has(bundleName)) {
                registerBundles.add(bundleName);
                remoteBundles.push(bundleName);
            }
        }
    }

    private addBundleRoutes(baseUrl: string, bundleInfos: IBundleInfo[]): void {
        for (const bundle of bundleInfos) {
            const bundleName = bundle.name;
            const url = baseUrl;
            this.bundleMap.set(bundleName, url);
        }
    }

    private async moveAssetsToRemote(bundleInfos: IBundleInfo[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const writablePath = native.fileUtils.getWritablePath().replace(/\\/g, '/');
            const tempDir = path.join(writablePath, 'temp');
            const remoteDir = path.join(writablePath, 'remote');
            for (const bundle of bundleInfos) {
                const bundleName = bundle.name;
                const tempBundlePath = path.join(tempDir, bundleName);
                const localBundlePath = path.join(remoteDir, bundleName);
                this.fileMover.move(tempBundlePath, localBundlePath);
            }
            resolve();
        });
    }
}