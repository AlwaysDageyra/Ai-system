# Backend entry point
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Loading application (ML models may take a moment)...", flush=True)

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Backend ready — http://127.0.0.1:{port}", flush=True)
    app.run(
        host="0.0.0.0",
        port=port,
        debug=True,
        use_reloader=False,
    )
