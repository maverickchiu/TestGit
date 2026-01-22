# -*- coding: utf-8 -*-
import os, subprocess, sys
import time

def get_startup_info():
    """在 Windows 環境下隱藏彈出的 GUI 視窗"""
    if os.name == 'nt':
        info = subprocess.STARTUPINFO()
        info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        info.wShowWindow = 0  # SW_HIDE: 隱藏視窗
        return info
    return None

def main():
    # 獲取參數
    cocos_path = os.getenv("COCOS_PATH")
    project_path = os.getenv("GITHUB_WORKSPACE")
    platform = os.getenv("PLATFORM")
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
    auto_compile = os.getenv("AUTO_COMPILE", "false").lower() == "true"
    
    # 自動組合設定檔路徑
    mode = "dev" if dev_mode else "release"
    config_name = f"{platform}-{mode}.json"
    config_path = os.path.join(project_path, "build-configs", config_name)

    print(f"🚀 Initializing build for {platform} ({mode})...")
    
    if not os.path.exists(config_path):
        print(f"❌ Config not found: {config_path}")
        sys.exit(1)

    # 基礎參數：加入 force=true 嘗試跳過某些插件報錯
    params = f"platform={platform};configPath={config_path};force=true"
    startup_info = get_startup_info()

    # --- Step 1: Build (產生原生工程) ---
    print("🛠 Step 1: Generating Project (Headless Mode)...")
    build_cmd = [
        cocos_path,
        "--batch",              # 強制進入無介面批次模式
        "--project", project_path,
        "--build", params
    ]
    
    # 執行並同步輸出 Log
    result = subprocess.run(
        build_cmd, 
        stdout=sys.stdout, 
        stderr=sys.stderr, 
        startupinfo=startup_info
    )
    
    if result.returncode not in [0, 36]:
        print(f"❌ Build failed with exit code: {result.returncode}")
        sys.exit(result.returncode)

    # --- Step 2: Make (編譯專案) ---
    if auto_compile:
        print("⏳ Waiting for file system to sync...")
        time.sleep(5) # 給系統 5 秒鐘釋放檔案鎖定

        print("🚀 Step 2: Compiling / Making Package...")
        make_cmd = [
            cocos_path,
            "--project", project_path,
            "--make", params,
            "--force"
        ]
        
        result_make = subprocess.run(
            make_cmd, 
            stdout=sys.stdout, 
            stderr=sys.stderr, 
            startupinfo=startup_info
        )
        
        if result_make.returncode not in [0, 36]:
            print(f"❌ Compilation failed with exit code: {result_make.returncode}")
            sys.exit(result_make.returncode)

    print(f"✅ {platform.upper()} build process finished successfully.")

if __name__ == "__main__":
    main()