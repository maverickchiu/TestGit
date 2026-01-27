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
    workspace = os.getenv('GITHUB_WORKSPACE', os.getcwd())

    # Cocos 輸出的 build 目錄
    # 假設目錄名稱邏輯: windows-dev, android-production 等
    build_dir_name = f"{platform}-{env}"
    base_path = os.path.join(workspace, "build", build_dir_name)

    # 準備輸出目錄
    dist_dir = os.path.join(workspace, "dist")
    if not os.path.exists(dist_dir):
        os.makedirs(dist_dir)

    target_file = None

    if platform == "windows":
        # Windows 路徑: proj/(Debug 或 Release)
        # 我們抓取該目錄下第一個存在的資料夾
        config_type = "Release" if env == "production" else "Debug"
        win_path = os.path.join(base_path, "proj", config_type)
        
        if os.path.exists(win_path):
            output_zip = os.path.join(dist_dir, f"windows_build.zip")
            zip_directory(win_path, output_zip)
            target_file = output_zip
        else:
            print(f"Error: Windows path not found: {win_path}")

    elif platform in ["android", "ios"]:
        # Android/iOS 路徑: publish/(debug 或 release)/*.apk 或 *.ipa
        config_type = "release" if env == "production" else "debug"
        ext = "*.apk" if platform == "android" else "*.ipa"
        search_path = os.path.join(base_path, "publish", config_type, ext)
        
        files = glob.glob(search_path)
        if files:
            # 取得最新的一個檔案並移至 dist
            latest_file = max(files, key=os.path.getmtime)
            target_name = os.path.basename(latest_file)
            dest_path = os.path.join(dist_dir, target_name)
            shutil.copy2(latest_file, dest_path)
            target_file = dest_path
            print(f"Collected {platform} file: {target_file}")
        else:
            print(f"Error: No {ext} files found in {search_path}")

    # 將結果寫入 GitHub Output 供後續步驟使用
    if target_file and "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"collected_path={target_file}\n")
    
    if not target_file:
        sys.exit(1)

if __name__ == "__main__":
    main()