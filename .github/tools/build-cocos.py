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

def run_cocos_stage(cocos_path, project_path, stage, config_path, startup_info):
    """執行 Cocos 指定階段的構建任務"""
    print(f"🎬 Running Cocos Stage: {stage}...", flush=True)
    
    # 核心修正：將 stage 放入 params，並加上 verbosity 讓 Log 稍微清楚一點
    params = f"configPath={config_path};stage={stage};force=true;verbosity=minimal"
    
    cmd = [
        cocos_path,
        "--batch",              # 強制進入無介面模式
        "--project", project_path,
        "--build", params,
    ]
    
    result = subprocess.run(
        cmd, 
        stdout=sys.stdout, 
        stderr=sys.stderr, 
        startupinfo=startup_info
    )
    return result.returncode

def main():
    # 獲取環境變數
    cocos_path = os.getenv("COCOS_PATH")
    project_path = os.getenv("GITHUB_WORKSPACE", os.getcwd()) # 增加預設值
    platform = os.getenv("PLATFORM")
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
    auto_compile = os.getenv("AUTO_COMPILE", "false").lower() == "true"
    environment = os.getenv("ENVIRONMENT")
    
    # 自動組合設定檔路徑
    mode = "dev" if dev_mode else "release"
    config_name = f"{platform}-{mode}.json"
    config_path = os.path.join(project_path, "build-configs", config_name)

    print(f"🚀 Initializing build process for {platform} ({mode})...")
    
    if not os.path.exists(config_path):
        print(f"❌ Config not found: {config_path}")
        sys.exit(1)

    startup_info = get_startup_info()

    # --- Step 1: Build Stage (產生原生工程) ---
    print("🛠 Step 1: Generating Native Project...")
    # 明確指定只跑 build 階段
    exit_code = run_cocos_stage(cocos_path, project_path, "build", config_path, startup_info)
    
    if exit_code not in [0, 36]:
        print(f"❌ Build stage failed with exit code: {exit_code}")
        sys.exit(exit_code)

    # --- Step 2: Make Stage (編譯產出物) ---
    if auto_compile:
        # 給檔案系統一點時間釋放鎖定，避免 "Unable to move cache" 錯誤
        print("⏳ Waiting for file system to sync...")
        time.sleep(5) 

        print("🚀 Step 2: Compiling Executable (Make Stage)...")
        # 修正：改用 --build 搭配 stage=make，而非原本的 --make
        exit_code_make = run_cocos_stage(cocos_path, project_path, "make", config_path, startup_info)
        
        if exit_code_make not in [0, 36]:
            print(f"❌ Make stage failed with exit code: {exit_code_make}")
            sys.exit(exit_code_make)

    print(f"✅ {platform.upper()} build process finished successfully.")

if __name__ == "__main__":
    main()