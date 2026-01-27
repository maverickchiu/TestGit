import os
import shutil
import datetime
import sys
import glob

def main():
    # --- 1. 取得環境變數與參數 ---
    # 這裡抓取上一棒 collect_assets.py 傳過來的路徑，如果沒有就去 dist 找
    input_path = os.getenv('COLLECTED_PATH')
    version_name = os.getenv('IN_VERSION_NAME', '1.0.0')
    environment = os.getenv('IN_ENVIRONMENT', 'development').lower()
    signing_type = os.getenv('IN_SIGNING_TYPE', 'debug').lower()
    bundle_code = os.getenv('IN_BUNDLE_CODE', '-1')
    run_number = os.getenv('GITHUB_RUN_NUMBER', '0')
    platform = os.getenv('PLATFORM', 'android').lower()

    # --- 2. 如果沒傳入路徑，自動去 dist 找最新產出物 ---
    if not input_path or not os.path.exists(input_path):
        dist_dir = os.path.join(os.getenv('GITHUB_WORKSPACE', os.getcwd()), "dist")
        search_pattern = os.path.join(dist_dir, "*.*")
        files = glob.glob(search_pattern)
        if not files:
            print(f"❌ Error: No files found in '{dist_dir}' directory to rename!")
            sys.exit(1)
        input_path = max(files, key=os.path.getmtime)
        print(f"📦 Found file in dist: {input_path}")

    # --- 3. 計算日期與 Build No ---
    date_str = datetime.datetime.now().strftime('%y%m%d')
    # 如果 bundle_code 有值且不是 "-1"，使用 bundle_code；否則使用 run_number
    if bundle_code and bundle_code.strip() and bundle_code != "-1":
        build_no = bundle_code.strip()
    else:
        build_no = run_number if run_number else "0"

    # --- 4. 計算 Sign 前綴 ---
    # Release 模式加上 Store_ 前綴，否則為空
    sign_prefix = "Store_" if signing_type == "release" else ""

    # --- 5. 計算 Env 前綴 ---
    env_map = {
        "production": "",
        "test": "t",
        "development": "d"
    }
    env_prefix = env_map.get(environment, "d")

    # --- 6. 組合最終檔名 ---
    # 取得原始附檔名 (.apk, .ipa, .zip)
    ext = os.path.splitext(input_path)[1]
    
    # 格式: Sign_Env_Ver(Build)_Date.ext
    final_name = f"{sign_prefix}{env_prefix}{version_name}({build_no})_{date_str}{ext}"
    
    # 使用 dist 目錄保持一致性
    workspace = os.getenv('GITHUB_WORKSPACE', os.getcwd())
    output_dir = os.path.join(workspace, "dist")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    final_path = os.path.join(output_dir, final_name)

    # --- 7. 執行移動與重新命名 ---
    try:
        shutil.move(input_path, final_path)
        print(f"✅ Renamed and moved to: {final_path}")
    except Exception as e:
        print(f"❌ Failed to move file: {e}")
        sys.exit(1)

    # --- 8. 生成符合 Git tag 規範的 tag_name ---
    # Git tag 不能包含括號、空格等特殊字符，需要清理
    # 將 d1.2.12(20)_260127.zip -> d1.2.12-20-260127
    tag_name = final_name.replace(ext, "")  # 去掉擴展名
    tag_name = tag_name.replace("(", "-")    # 將 ( 替換為 -
    tag_name = tag_name.replace(")", "-")    # 將 ) 替換為 -
    tag_name = tag_name.replace("_", "-")    # 將 _ 替換為 -
    # 清理多個連續的連字符
    while "--" in tag_name:
        tag_name = tag_name.replace("--", "-")
    # 去掉開頭和結尾的連字符
    tag_name = tag_name.strip("-")
    
    # --- 9. 寫入 GitHub Output 與 Env ---
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"artifact_path={final_path}\n")
            f.write(f"artifact_name={final_name}\n")
            f.write(f"tag_name={tag_name}\n")
            
    if "GITHUB_ENV" in os.environ:
        with open(os.environ["GITHUB_ENV"], "a") as f:
            f.write(f"ARTIFACT_PATH={final_path}\n")
            f.write(f"ARTIFACT_NAME={final_name}\n")
            f.write(f"TAG_NAME={tag_name}\n")

if __name__ == "__main__":
    main()