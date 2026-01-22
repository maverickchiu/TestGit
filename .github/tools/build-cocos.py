# -*- coding: utf-8 -*-
import os, subprocess, sys

def main():
    # 從環境變數獲取 Action 傳進來的參數
    cocos_path = os.getenv("COCOS_PATH")
    project_path = os.getenv("GITHUB_WORKSPACE")
    platform = os.getenv("PLATFORM")
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
    
    # 自動組合檔名: android-dev.json 或 android-release.json
    mode = "dev" if dev_mode else "release"
    config_name = f"{platform}-{mode}.json"
    config_path = os.path.join(project_path, "build-configs", config_name)

    print(f"🚀 Building for {platform} ({mode})...")
    
    if not os.path.exists(config_path):
        print(f"❌ Config not found: {config_path}")
        sys.exit(1)

    # 執行 Cocos 命令
    build_cmd = [
        cocos_path,
        "--project", project_path,
        "--build", f"platform={platform};configPath={config_path}"
    ]
    
    result = subprocess.run(build_cmd, check=False)
    
    # 允許 Exit Code 0 或 36
    if result.returncode in [0, 36]:
        print("✅ Build Successful")
        sys.exit(0)
    else:
        print(f"❌ Build Failed with code: {result.returncode}")
        sys.exit(result.returncode)

if __name__ == "__main__":
    main()