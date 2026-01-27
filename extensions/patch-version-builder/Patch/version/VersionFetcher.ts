import { assetManager, JsonAsset, path } from "cc";
import { IVersionFetcher, IVersionInfo } from "../Type";

export class VersionFetcher implements IVersionFetcher {
    fetchVersionInfo(baseUrl: string): Promise<IVersionInfo> {
        const versionUrl = path.join(baseUrl, 'version.json?t=' + Date.now());
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