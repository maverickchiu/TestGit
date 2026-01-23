# -*- coding: utf-8 -*-
import os
import shutil
import sys

def prepare_remote():
    project_path = os.getenv("GITHUB_WORKSPACE")
    platform = os.getenv("PLATFORM", "android")
    # Cocos 預設 remote 產出路徑
    remote_src = os.path.join(project_path, "build", platform, "remote")
    # 準備發布到 GitHub Pages 的暫存目錄
    pages_dest = os.path.join(project_path, "public_pages")

    print(f"🔍 Checking remote folder at: {remote_src}")

    if not os.path.exists(remote_src):
        print(f"⚠️ Remote folder not found. Skipping pages preparation.")
        return

    # 清理並建立目標目錄
    if os.path.exists(pages_dest):
        shutil.rmtree(pages_dest)
    os.makedirs(pages_dest)

    # 搬運所有內容
    # 如果你想把不同版本的 bundle 放在不同子目錄，可以在這裡改路徑
    try:
        # 將 remote 內的所有內容複製到 pages_dest
        # 例如: public_pages/main/, public_pages/resources/ ...
        for item in os.listdir(remote_src):
            s = os.path.join(remote_src, item)
            d = os.path.join(pages_dest, item)
            if os.path.isdir(s):
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)
        
        print(f"✅ Remote assets prepared in: {pages_dest}")
    except Exception as e:
        print(f"❌ Failed to copy remote assets: {e}")
        sys.exit(1)

if __name__ == "__main__":
    prepare_remote()