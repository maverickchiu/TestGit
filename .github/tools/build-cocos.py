# -*- coding: utf-8 -*-
import os, subprocess, sys
import time

def get_startup_info():
    if os.name == 'nt':
        info = subprocess.STARTUPINFO()
        info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        info.wShowWindow = 0 
        return info
    return None

def run_cocos_stage(cocos_path, project_path, stage, config_path, startup_info):
    print(f"🎬 Running Cocos Stage: {stage}...", flush=True)
    
    params = f"configPath={config_path};stage={stage};force=true;verbosity=minimal"
    
    cmd = [
        cocos_path,
        "--batch",
        "--project", project_path,
        "--build", params,
    ]

    print(f"Executing: {cmd}")
    result = subprocess.run(
        cmd, 
        stdout=None, 
        stderr=None, 
        text=True,
        shell=True,
        check=False
    )
    return result.returncode

def main():
    cocos_path = os.getenv("COCOS_PATH")
    project_path = os.getenv("GITHUB_WORKSPACE", os.getcwd())
    platform = os.getenv("PLATFORM")
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
    auto_compile = os.getenv("AUTO_COMPILE", "false").lower() == "true"
    
    # 獲取命名相關變數
    environment = os.getenv("ENVIRONMENT", "dev").lower()  # test, dev, production
    version_name = os.getenv("VERSION_NAME", "1.0.0")
    build_no = os.getenv("GITHUB_RUN_NUMBER", "0") # GitHub Actions 自動提供的編號
    
    # ------------------

    mode = "dev" if dev_mode else "release"
    config_name = f"{platform}-{mode}.json"
    config_path = os.path.join(project_path, "build-configs", config_name)

    print(f"🚀 Initializing build process...")
    
    if not os.path.exists(config_path):
        print(f"❌ Config not found: {config_path}")
        sys.exit(1)

    startup_info = get_startup_info()

    # --- Step 1: Build Stage ---
    exit_code = run_cocos_stage(cocos_path, project_path, "build", config_path, startup_info)
    if exit_code not in [0, 36]:
        sys.exit(exit_code)

    # --- Step 2: Make Stage ---
    if auto_compile:
        print("⏳ Waiting for file system to sync...")
        time.sleep(5) 
        exit_code_make = run_cocos_stage(cocos_path, project_path, "make", config_path, startup_info)
        if exit_code_make not in [0, 36]:
            sys.exit(exit_code_make)

    print(f"✅ {platform.upper()} build process finished")

if __name__ == "__main__":
    main()