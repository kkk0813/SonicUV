@echo off
cd /d D:\side_projects\SonicUV
set MUSIC_DIR=%LOCALAPPDATA%\osu!\Songs\
cmd /k "uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"