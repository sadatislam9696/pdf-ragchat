import os
from dotenv import load_dotenv

load_dotenv()

for key_name in ["VOYAGE_API_KEY", "ANTHROPIC_API_KEY"]:
    key = os.environ.get(key_name)
    if key is None:
        print(f"{key_name}: পাওয়া যায়নি")
    else:
        print(f"{key_name}: length={len(key)}, starts={key[:8]}, ends={key[-4:]}, extra space={key != key.strip()}")
