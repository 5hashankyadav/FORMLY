from pathlib import Path

from flask import Flask, jsonify, render_template, send_from_directory


BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "dist"


def create_app():
    app = Flask(
        __name__,
        static_folder=str(BASE_DIR / "static"),
        template_folder=str(BASE_DIR / "templates"),
    )

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "dynamic-question-form"})

    @app.get("/")
    def index():
        index_file = DIST_DIR / "index.html"

        if not index_file.exists():
            return render_template("index.html")

        return send_from_directory(DIST_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def frontend_assets(asset_path):
        asset_file = DIST_DIR / asset_path

        if asset_file.exists() and asset_file.is_file():
            return send_from_directory(DIST_DIR, asset_path)

        if not (DIST_DIR / "index.html").exists():
            return render_template("index.html")

        return send_from_directory(DIST_DIR, "index.html")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
