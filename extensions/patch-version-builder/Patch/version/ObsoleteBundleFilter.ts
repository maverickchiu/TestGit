import { assetManager, native, path } from "cc";
import { BundleState, IBundleInfo, IFilterResult, IObsoleteBundleFilter, IVersionInfo } from "../Type";

export class ObsoleteBundleFilter implements IObsoleteBundleFilter {
    private getBuiltInVersion(bundleName: string): string | null {
        const builtInVersion = assetManager.downloader.bundleVers[bundleName] ?? null;
        return builtInVersion;
    }

    filter(versionInfo: IVersionInfo): IFilterResult[] {
        const writablePath = native.fileUtils.getWritablePath().replace(/\\/g, '/');
        const results: IFilterResult[] = [];
        for (const bundle of versionInfo.bundleInfos) {
            const bundleName = bundle.name;
            const bundleVersion = bundle.version;

            let bundleState: BundleState = BundleState.InApp;
            const builtInVersion = this.getBuiltInVersion(bundleName);
            if (builtInVersion && builtInVersion === bundleVersion) {
                bundleState = BundleState.InApp;
            }
            else {
                const versionStr = bundleVersion ? `.${bundleVersion}` : '';
                const fileName = `index${versionStr}.js`;
                const localBundlePath = path.join(writablePath, 'remote', bundleName, fileName);
                if (!native.fileUtils.isFileExist(localBundlePath)) {
                    bundleState = BundleState.Obsolete;
                }
                else {
                    bundleState = BundleState.LocalStorage;
                }
            }

            results.push({
                bundleState: bundleState,
                bundleInfo: bundle,
            });
        }

        return results;
    }
}