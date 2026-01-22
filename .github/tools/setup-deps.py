# -*- coding: utf-8 -*-
import os
import subprocess
import sys

def run_command(command, cwd=None):
    """執行命令並處理錯誤"""
    try:
        # shell=True 在 Windows 是必須的，用來執行 npm 這種 shell 封裝指令
        result = subprocess.run(
            command, 
            cwd=cwd, 
            shell=True, 
            check=True, 
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing in {cwd if cwd else 'root'}: {e}")
        return False

def main():
    # 1. 檢查根目錄 package.json
    if os.path.isfile("package.json"):
        print("📦 Found package.json in root, installing dependencies...")
        run_command("npm install")
    else:
        print("⚠️ No package.json in root, skipping.")

    # 2. 檢查 extensions 目錄
    extensions_dir = "extensions"
    if os.path.isdir(extensions_dir):
        print("🔍 Checking extensions directory...")
        # 遍歷 extensions 下的所有子目錄
        for item in os.listdir(extensions_dir):
            target_path = os.path.join(extensions_dir, item)
            
            if os.path.isdir(target_path):
                pkg_json = os.path.join(target_path, "package.json")
                if os.path.isfile(pkg_json):
                    print(f"📦 Installing dependencies for {target_path}...")
                    run_command("npm install", cwd=target_path)
                else:
                    print(f"⏭️ Skipping {target_path} (No package.json found)")
    else:
        print("⚠️ No 'extensions' directory found. Skipping.")

if __name__ == "__main__":
    main()