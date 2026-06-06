"""
Compass Minerals dashboard — Flask backend.

Serves the built React app (static/) and provides a tiny server-side store so
ALL dashboard data lives on the server (shared by everyone, nothing in the
browser). Mirrors the flex-dashboard Flask + Render pattern.

  GET    /api/state  -> { "value": "<persisted JSON string>" | null }
  PUT    /api/state  -> body { "value": "<json string>" }  (saves)
  DELETE /api/state  -> clears

State is stored in SQLite. Set DATA_DIR (e.g. a Render persistent disk) so the
data survives redeploys; defaults to the app folder for local runs.
"""
import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder="static")

DATA_DIR = os.environ.get("DATA_DIR", os.path.dirname(__file__))
DB_PATH = os.path.join(DATA_DIR, "compass.db")
STATE_KEY = "compass-dashboard"

# NOTE: No app-level login. Access is gated upstream by the company's Microsoft
# sign-in (the dashboard is only reachable to authenticated M365 users), so this
# app does not implement usernames/passwords. The HOSTING must enforce that gate
# (e.g. Azure App Service Easy Auth / Entra ID, or an identity-aware proxy) —
# otherwise the data API below is reachable by anyone who can hit the URL.


def get_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_state ("
        "k TEXT PRIMARY KEY, v TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))"
    )
    return conn


# ── Data API ──────────────────────────────────────────────────────────────────
@app.route("/api/state", methods=["GET"])
def get_state():
    conn = get_db()
    row = conn.execute("SELECT v FROM app_state WHERE k = ?", (STATE_KEY,)).fetchone()
    conn.close()
    return jsonify({"value": row[0] if row else None})


@app.route("/api/state", methods=["PUT"])
def put_state():
    body = request.get_json(silent=True) or {}
    value = body.get("value")
    if not isinstance(value, str):
        return jsonify({"error": "expected a string 'value'"}), 400
    conn = get_db()
    conn.execute(
        "INSERT INTO app_state (k, v, updated_at) VALUES (?, ?, datetime('now')) "
        "ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at",
        (STATE_KEY, value),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/state", methods=["DELETE"])
def delete_state():
    conn = get_db()
    conn.execute("DELETE FROM app_state WHERE k = ?", (STATE_KEY,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/health")
def health():
    return jsonify({"ok": True})


# ── Serve the SPA ───────────────────────────────────────────────────────────--
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    full = os.path.join(app.static_folder, path)
    if path and os.path.isfile(full):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
