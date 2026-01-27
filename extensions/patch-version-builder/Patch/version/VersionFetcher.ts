import { assetManager, JsonAsset, path } from "cc";
import { IVersionFetcher, IVersionInfo } from "../Type";

export class VersionFetcher implements IVersionFetcher {
    fetchVersionInfo(baseUrl: string, versionName?: string): Promise<IVersionInfo> {
        versionName = versionName ? versionName : 'version.json';
        const versionUrl = path.join(baseUrl, versionName + '?t=' + Date.now());
        return new Promise<IVersionInfo>((resolve, reject) => {
            assetManager.loadRemote(versionUrl, JsonAsset, (err, asset: JsonAsset) => {
                if (err) {
                    reject(err);
                }
                resolve(asset.json as IVersionInfo);
            });
        });
    }
}