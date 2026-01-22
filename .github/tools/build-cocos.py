# -*- coding: utf-8 -*-
import os, subprocess, sys

def main():
    # 從環境變數獲取 Action 傳進來的參數
    cocos_path = os.getenv("COCOS_PATH")
    project_path = os.getenv("GITHUB_WORKSPACE")
    platform = os.getenv("PLATFORM")
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
    auto_compile = os.getenv("AUTO_COMPILE", "false").lower() == "true"
    
    # 自動組合檔名: android-dev.json 或 android-release.json
    mode = "dev" if dev_mode else "release"
    config_name = f"{platform}-{mode}.json"
    config_path = os.path.join(project_path, "build-configs", config_name)

    print(f"🚀 Building for {platform} ({mode})...")
    
    if not os.path.exists(config_path):
        print(f"❌ Config not found: {config_path}")
        sys.exit(1)

    # 基礎參數
    params = f"platform={platform};configPath={config_path}"

    # 第一步：執行 Build (生成工程)
    print("🛠 Step 1: Generating Project...")
    build_cmd = [
        cocos_path,
        "--project", project_path,
        "--build", params
    ]
    
    # 這裡執行第一次 subprocess.run
    result = subprocess.run(build_cmd, stdout=sys.stdout, stderr=sys.stderr)
    if result.returncode not in [0, 36]:
        sys.exit(result.returncode)

    # 第二步：執行 Compile (編譯)
    if auto_compile:
        print("🚀 Step 2: Compiling / Making Package...")
        # 注意：這裡使用 --make
        make_cmd = [
            cocos_path,
            "--project", project_path,
            "--make", params
        ]
        result_make = subprocess.run(make_cmd, stdout=sys.stdout, stderr=sys.stderr)
        if result_make.returncode not in [0, 36]:
            sys.exit(result_make.returncode)

if __name__ == "__main__":
    main()