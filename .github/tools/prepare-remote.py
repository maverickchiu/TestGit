# -*- coding: utf-8 -*-
import os
import shutil
import sys

def prepare_remote():
    project_path = os.getenv("GITHUB_WORKSPACE")
    platform = os.getenv("PLATFORM", "android")
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"

    mode = "dev" if dev_mode else "release"
    folder_name = f"{platform}-{mode}"
    # Cocos 預設 remote 產出路徑
    remote_src = os.path.join(project_path, "build", folder_name, "data", "remote")
    # 準備發布到 GitHub Pages 的暫存目錄
    pages_dest = os.path.join(project_path, "public_pages", folder_name)

    print(f"DEBUG: Source: {remote_src}")
    print(f"DEBUG: Destination: {pages_dest}")

    if os.path.exists(remote_src):
        if os.path.exists(pages_dest):
            shutil.rmtree(pages_dest)
        # 直接用 copytree 複製整個資料夾
        shutil.copytree(remote_src, pages_dest)
        print("✅ Assets copied successfully.")
    else:
        # 如果沒產出 remote 資料夾，建立一個空的 public_pages 避免 Action 噴錯
        os.makedirs(pages_dest, exist_ok=True)
        with open(os.path.join(pages_dest, ".keep"), "w") as f: f.write("")
        print("⚠️ Warning: remote folder not found, created empty folder.")

if __name__ == "__main__":
    prepare_remote()