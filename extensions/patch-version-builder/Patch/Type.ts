export type ProgressCallback = (completedCount: number, totalCount: number) => void;

export interface IPatchConfig {
    // 'http://192.168.165.43:8081/' OK
    // 'http://192.168.165.43:8081/version.json' NG
    baseUrl: string;
    onProgress?: ProgressCallback;
}

export interface IAssetInfo {
    relative: string;
    md5: string;
}

export interface IBundleInfo {
    name: string;
    version: string;
    items: IAssetInfo[];
}

export interface IVersionInfo {
    version: number;
    bundleInfos: IBundleInfo[];
}

export interface IRequestConfig {
    base: string;
}

export interface IRequestItem {
    identifier: string;
    bundleName: string;
    config: IRequestConfig;
    assetInfo: IAssetInfo;
}

export const CONCURRENT_COUNT = 12;

export interface IVersionFetcher {
    fetchVersionInfo(baseUrl: string): Promise<IVersionInfo>;
}

export enum BundleState {
    InApp = 'InApp',
    LocalStorage = 'LocalStorage',
    Obsolete = 'Obsolete',
}

export interface IFilterResult {
    bundleState: BundleState;
    bundleInfo: IBundleInfo;
}

export interface IObsoleteBundleFilter {
    filter(versionInfo: IVersionInfo): IFilterResult[];
}

export interface IFileMover {
    move(srcDir: string, destDir: string): void;
}

export interface IDownloader {
    fetchAssetsToTemp(issue: IDownloadIssue): Promise<void>;
}

export interface IPatchResult {
    version: IVersionInfo;
    allBundleInfos: IBundleInfo[];
    obsoleteBundleInfos: IBundleInfo[];
}

export interface IDownloadIssue {
    config: IPatchConfig;
    concurrentCount: number;
    bundleInfos: IBundleInfo[];
}