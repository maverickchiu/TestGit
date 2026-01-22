# -*- coding: utf-8 -*-
import json
import os
import sys

def update_engine_macro():
    file_path = "./settings/v2/packages/engine.json"
    
    # 從環境變數讀取 IS_DEBUG (GitHub Actions 會傳入)
    is_debug_str = os.getenv("IS_DEBUG", "false").lower()
    debug_val = (is_debug_str == "true")

    try:
        if not os.path.exists(file_path):
            print(f"⚠️ File not found: {file_path} - Skipping Macro setup (Maybe first build?)")
            return

        # 讀取 JSON
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 確保 macroCustom 存在
        if "macroCustom" not in data:
            data["macroCustom"] = []

        # 尋找 CC_DEBUG 是否已存在
        found = False
        for item in data["macroCustom"]:
            if item.get("key") == "CC_DEBUG":
                item["value"] = debug_val
                found = True
                print(f"✅ Updated CC_DEBUG to: {debug_val}")
                break

        # 如果不存在則新增
        if not found:
            data["macroCustom"].append({"key": "CC_DEBUG", "value": debug_val})
            print(f"✅ Added new CC_DEBUG: {debug_val}")

        # 寫回檔案
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    except Exception as e:
        print(f"❌ Failed to update engine.json: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_engine_macro()