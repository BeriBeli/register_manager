import os
import shutil
import urllib.request
from pathlib import Path
import sys

# Configuration
PYODIDE_VERSION = "0.26.0"
PYODIDE_BASE_URL = f"https://cdn.jsdelivr.net/pyodide/v{PYODIDE_VERSION}/full/"
FILES_TO_DOWNLOAD = [
    "pyodide.mjs",
    "pyodide.asm.wasm",
    "pyodide.asm.js",
    "pyodide-lock.json" 
]
DIST_DIR = Path(__file__).parent / "dist"
SRC_DIR = Path(__file__).parent / "src" / "parser_plugin_python"

def build():
    # 1. Create dist directory
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)
    print(f"Created {DIST_DIR}")

    # 2. Download Pyodide files
    print("Downloading Pyodide runtime...")
    for filename in FILES_TO_DOWNLOAD:
        url = PYODIDE_BASE_URL + filename
        dest = DIST_DIR / filename
        print(f"  Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, dest)
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            sys.exit(1)

    # 3. Copy parser.py
    if (SRC_DIR / "parser.py").exists():
        shutil.copy(SRC_DIR / "parser.py", DIST_DIR / "parser.py")
        print("Copied parser.py")
    else:
        print(f"Warning: {SRC_DIR / 'parser.py'} not found!")

    # 4. Process wrapper.js
    wrapper_path = Path(__file__).parent / "wrapper.js"
    if wrapper_path.exists():
        with open(wrapper_path, "r") as f:
            content = f.read()

        # Replace CDN import with local import
        content = content.replace(
            f"https://cdn.jsdelivr.net/pyodide/v{PYODIDE_VERSION}/full/pyodide.mjs",
            "./pyodide.mjs"
        )
        # Update loadPyodide config to look for artifacts updates locally
        content = content.replace(
            f"indexURL: 'https://cdn.jsdelivr.net/pyodide/v{PYODIDE_VERSION}/full/'",
            "indexURL: './'"
        )

        with open(DIST_DIR / "parser_plugin_python.js", "w") as f:
            f.write(content)
        print("Created parser_plugin_python.js")
    else:
        print("Warning: wrapper.js not found!")

    print(f"\nBuild complete! Files in {DIST_DIR}:")
    for f in DIST_DIR.iterdir():
        print(f"  - {f.name}")
    print("\nNote: Dependencies like 'openpyxl' will still need to be downloaded or cached in 'dist/' if fully offline execution is required.")
    print("To support full offline mode, you would need to download the wheels listed in repodata.json for your packages.")

if __name__ == "__main__":
    build()
