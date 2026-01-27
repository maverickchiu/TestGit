import os
import zipfile
import glob
import shutil
import sys

def zip_directory(folder_path, output_path):
    """將資料夾壓縮成 ZIP"""
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, folder_path)
                zipf.write(abs_path, rel_path)
    print(f"Successfully zipped {folder_path} to {output_path}")

def main():
    # 透過環境變數或外部參數傳入
    platform = os.getenv('PLATFORM', 'windows').lower()
    env = os.getenv('ENVIRONMENT', 'development').lower() # 'development', 'test', or 'production'
    dev_mode = os.getenv('DEV_MODE', 'true').lower() == 'true'
    workspace = os.getenv('GITHUB_WORKSPACE', os.getcwd())

    # Cocos 輸出的 build 目錄
    # 實際路徑格式: {platform}-{mode}，其中 mode 是 "dev" 或 "release"
    # 根據 dev_mode 決定，而不是 environment
    mode = "dev" if dev_mode else "release"
    build_dir_name = f"{platform}-{mode}"
    base_path = os.path.join(workspace, "build", build_dir_name)
    
    print(f"🔍 Looking for build output in: {base_path}")

    # 準備輸出目錄
    dist_dir = os.path.join(workspace, "dist")
    if not os.path.exists(dist_dir):
        os.makedirs(dist_dir)

    target_file = None

    if platform == "windows":
        # Windows 路徑: proj/(Debug 或 Release)
        # 根據 dev_mode 決定：dev_mode=True -> Debug, dev_mode=False -> Release
        config_type = "Release" if not dev_mode else "Debug"
        win_path = os.path.join(base_path, "proj", config_type)
        
        print(f"🔍 Checking Windows path: {win_path}")
        if os.path.exists(win_path):
            output_zip = os.path.join(dist_dir, f"windows_build.zip")
            zip_directory(win_path, output_zip)
            target_file = output_zip
            print(f"✅ Found Windows build at: {win_path}")
        else:
            # 嘗試查找 proj 目錄下任何存在的資料夾
            proj_path = os.path.join(base_path, "proj")
            if os.path.exists(proj_path):
                subdirs = [d for d in os.listdir(proj_path) if os.path.isdir(os.path.join(proj_path, d))]
                if subdirs:
                    fallback_path = os.path.join(proj_path, subdirs[0])
                    print(f"⚠️ Expected {config_type} not found, using: {fallback_path}")
                    output_zip = os.path.join(dist_dir, f"windows_build.zip")
                    zip_directory(fallback_path, output_zip)
                    target_file = output_zip
                else:
                    print(f"❌ Error: No subdirectories found in {proj_path}")
            else:
                print(f"❌ Error: Windows path not found: {win_path}")
                print(f"   Base path exists: {os.path.exists(base_path)}")
                if os.path.exists(base_path):
                    print(f"   Contents of {base_path}: {os.listdir(base_path)}")

    elif platform in ["android", "ios"]:
        # Android/iOS 路徑: publish/(debug 或 release)/*.apk 或 *.ipa
        # 根據 dev_mode 決定：dev_mode=True -> debug, dev_mode=False -> release
        config_type = "release" if not dev_mode else "debug"
        ext = "*.apk" if platform == "android" else "*.ipa"
        search_path = os.path.join(base_path, "publish", config_type, ext)
        
        print(f"🔍 Searching for {platform} files in: {search_path}")
        files = glob.glob(search_path)
        if files:
            # 取得最新的一個檔案並移至 dist
            latest_file = max(files, key=os.path.getmtime)
            target_name = os.path.basename(latest_file)
            dest_path = os.path.join(dist_dir, target_name)
            shutil.copy2(latest_file, dest_path)
            target_file = dest_path
            print(f"✅ Collected {platform} file: {target_file}")
        else:
            print(f"❌ Error: No {ext} files found in {search_path}")
            # 列出實際存在的目錄結構以便調試
            publish_path = os.path.join(base_path, "publish")
            if os.path.exists(publish_path):
                print(f"   Contents of publish directory: {os.listdir(publish_path)}")

    # 將結果寫入 GitHub Output 供後續步驟使用
    if target_file and "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"collected_path={target_file}\n")
    
    if not target_file:
        sys.exit(1)

if __name__ == "__main__":
    main()