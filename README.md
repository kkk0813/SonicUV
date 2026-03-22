# 🎵 SonicUV

A lightweight, local music streaming server built to serve my personal `osu!` music library using a blazing-fast, modern Python stack.

## 🚀 The Project Concept
SonicUV acts as a "Local Spotify." Instead of relying on a complex frontend framework or external databases, it uses an in-memory dictionary database to index local audio files and streams them directly to a vanilla HTML/JS frontend. 

The primary goal of this project is to practice building clean client-server architecture using modern backend development tools, separating the heavy lifting of API routing from client-side search logic.

## 🛠️ Tech Stack
* **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (RESTful routing and file streaming)
* **Package Management:** [uv](https://github.com/astral-sh/uv) (Blazing fast Python dependency management written in Rust)
* **Frontend:** Vanilla HTML, CSS, and JavaScript
* **Future Infrastructure:** Docker & Docker Compose

## ✨ Current & Planned Features
- [x] **Phase 1: API Core.** Recursively scans local directories to build an in-memory database of `.mp3` and `.ogg` files.
- [x] **Phase 1: Audio Streaming.** Serves playable audio streams via dynamic endpoints (`/api/play/{id}`).
- [ ] **Phase 2: The Interface.** A decoupled frontend that fetches the full library menu and implements lightning-fast client-side search.
- [ ] **Phase 3: Containerization.** Packaging the application using Docker Compose with volume mounts for the audio library.

## 💻 How to Run (Local Development)
1. Clone the repository.
2. Install dependencies using `uv sync`.
3. Start the server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```
4. Open `http://127.0.0.1:8000` in your browser.
