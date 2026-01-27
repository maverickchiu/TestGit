import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { BuildHook, IBuildResult, ITaskOptions } from '../@types';
import { PACKAGE_NAME } from './global';

function log(...arg: any[]) {
    return console.log(`[${PACKAGE_NAME}] `, ...arg);
}

interface ResourceItem {
    relative: string;
    md5: string;
}

interface VersionBundleInfo {
    name: string;
    version: string;
    items: ResourceItem[];
}

interface VersionInfo {
    version: number;
    bundleInfos: VersionBundleInfo[];
}

interface PackageOptions {
    versionName: string;
    buildCode: number;
    environment: string;
    loadOrder?: string[];
}

let allAssets = [];

/**
 * 计算文件的 MD5 哈希值
 */
function calculateMD5(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * 检查文件是否应该被排除
 */
function shouldExclude(fileName: string): boolean {
    // 排除配置文件（可根据需要调整）
    // 注意：Python 版本中这些模式被注释掉了，所以暂时不排除
    // const excludePatterns = [
    //     /^cc\.config\..+\.json$/,
    //     /^index\..+\.js$/,
    //     /^index\.js$/
    // ];
    // for (const pattern of excludePatterns) {
    //     if (pattern.test(fileName)) {
    //         return true;
    //     }
    // }
    return false;
}

/**
 * 递归收集目录下所有资源的相对路径和 MD5
 */
function collectResourceItems(bundleDir: string): ResourceItem[] {
    const items: ResourceItem[] = [];
    
    function walkDir(dir: string, baseDir: string) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                walkDir(fullPath, baseDir);
            } else if (stat.isFile()) {
                const fileName = path.basename(fullPath);
                if (shouldExclude(fileName)) {
                    continue;
                }
                
                // 计算相对路径（相对于 bundle 目录）
                const relativePath = path.relative(baseDir, fullPath);
                // 转换为使用正斜杠的路径（跨平台兼容）
                const relative = relativePath.replace(/\\/g, '/');
                
                // 计算 MD5
                const md5 = calculateMD5(fullPath);
                
                items.push({
                    relative,
                    md5
                });
            }
        }
    }
    
    if (fs.existsSync(bundleDir)) {
        walkDir(bundleDir, bundleDir);
    }
    
    // 按 relative 字段排序以保持一致性
    items.sort((a, b) => a.relative.localeCompare(b.relative));
    
    return items;
}

export const throwError: BuildHook.throwError = true;

export const load: BuildHook.load = async function () {
    console.log(`[${PACKAGE_NAME}] Load cocos plugin example in builder.`);
    allAssets = await Editor.Message.request('asset-db', 'query-assets');
};

export const onBeforeBuild: BuildHook.onBeforeBuild = async function (options: ITaskOptions, result: IBuildResult) {

};

export const onBeforeCompressSettings: BuildHook.onBeforeCompressSettings = async function (options: ITaskOptions, result: IBuildResult) {
};

export const onAfterCompressSettings: BuildHook.onAfterCompressSettings = async function (options: ITaskOptions, result: IBuildResult) {
};

export const onAfterBuild: BuildHook.onAfterBuild = async function (options: ITaskOptions, result: IBuildResult) {
    const packageOptions: PackageOptions = options.packages[PACKAGE_NAME] as unknown as PackageOptions;
    log('插件參數: ', packageOptions);

    const assets = result.settings.assets;
    const bundleVers = assets.bundleVers;
    const remoteBundles = assets.remoteBundles;
    
    // 預設載入順序（與 Python 版本一致）
    const defaultLoadOrder = [
        "bundle-lobby",
        "slot-toolkit",
        "so-big-framework",
        "so-big-business-script",
        "slot-toolkit-script",
        "game-script"
    ];
    
    // 使用提供的順序或預設順序
    const loadOrder = packageOptions.loadOrder || defaultLoadOrder;
    
    // 建立順序索引映射
    const orderMap = new Map<string, number>();
    loadOrder.forEach((bundleName, index) => {
        orderMap.set(bundleName, index);
    });
    
    const bundleInfos: VersionBundleInfo[] = [];
    const orderedItems: Array<[number, VersionBundleInfo]> = [];
    const unorderedItems: VersionBundleInfo[] = [];
    
    // 掃描所有 remote bundles
    for (const bundle of remoteBundles) {
        const version = bundleVers[bundle];
        
        if (!version) {
            log(`警告: 在 bundle '${bundle}' 中找不到版本號，已跳過`);
            continue;
        }
        
        // bundle 目錄路徑
        const bundleDir = path.join(result.paths.dir, 'remote', bundle);
        
        // 收集所有資源的相對路徑和 MD5
        const items = collectResourceItems(bundleDir);
        
        const bundleInfo: VersionBundleInfo = {
            name: bundle,
            version: version,
            items: items
        };
        
        // 根據是否在順序列表中分類
        if (orderMap.has(bundle)) {
            orderedItems.push([orderMap.get(bundle)!, bundleInfo]);
        } else {
            unorderedItems.push(bundleInfo);
        }
    }
    
    // 對有序項目按順序排序
    orderedItems.sort((a, b) => a[0] - b[0]);
    
    // 合併結果：先是有序項目，然後是無序項目（按 bundle 名稱排序）
    bundleInfos.push(...orderedItems.map(item => item[1]));
    unorderedItems.sort((a, b) => a.name.localeCompare(b.name));
    bundleInfos.push(...unorderedItems);
    
    const versionInfo: VersionInfo = {
        version: packageOptions.buildCode,
        bundleInfos: bundleInfos,
    };
    
    log('版本資訊: ', JSON.stringify(versionInfo, null, 2));
    log(`共掃描到 ${bundleInfos.length} 個 bundle`);
    
    // 顯示每個 bundle 的資源數量
    for (const bundleInfo of bundleInfos) {
        log(`  - ${bundleInfo.name}: ${bundleInfo.items.length} 個資源`);
    }
    
    const fileName = `version_${packageOptions.environment}_${packageOptions.versionName}.json`;
    const versionFile = path.join(result.paths.dir, 'remote', fileName);

    const dir = path.dirname(versionFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2), 'utf-8');
    log('建立版本檔案: ', versionFile);
};

export const unload: BuildHook.unload = async function () {
    console.log(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
};

export const onError: BuildHook.onError = async function (options, result) {
    // Todo some thing
    console.warn(`${PACKAGE_NAME} run onError`);
};

export const onBeforeMake: BuildHook.onBeforeMake = async function (root, options) {
    console.log(`onBeforeMake: root: ${root}, options: ${options}`);
};

export const onAfterMake: BuildHook.onAfterMake = async function (root, options) {
    console.log(`onAfterMake: root: ${root}, options: ${options}`);
};
