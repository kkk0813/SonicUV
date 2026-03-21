from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

app = FastAPI()

song_db = {}
MUSIC_DIR = Path(r"C:/Users/khong/AppData/Local/osu!/Songs/")

def build_database():
    global song_db

    print("Getting songs, please wait...")
    raw_song_folders = [
        f.parent.name for f in MUSIC_DIR.rglob("*")
        if f.suffix.lower() in [".mp3", ".ogg"] # check for mp3 and ogg extensions
        and f.stat().st_size > 1024 * 1024       # file files with > 1MB to filter out hitsounds
    ]

    unique_songs = sorted(list(set(raw_song_folders)))

    for index, folder_name in enumerate(unique_songs, start=1):
        song_db[index] = folder_name

    print(f"Success! Loaded {len(song_db)} songs into memory.")

build_database() # run the setup immediately when the file loads

# song menu endpoint
@app.get("/api/songs")
def get_songs():
    formatted_list = []

    for song_id, folder_name in song_db.items():
        # create dictionary shape: {"id": 1, "title": "Folder Name"}
        formatted_list.append({"id": song_id, "title": folder_name})

    return {"songs": formatted_list}

# song playback endpoint
@app.get("/api/play/{song_id}")
def play_song(song_id: int):
    # stream a specific song file by its ID
    folder_name = song_db.get(song_id)

    if folder_name is None:
        return {"error": "Song not found"}, 404

    # create a path object for the specific song
    folder_path = MUSIC_DIR / folder_name

    if folder_path.is_dir():
        # use generator to find the first file that matches condition
        audio_file = next(
            (f for f in folder_path.glob("*")
            if f.suffix.lower() in [".mp3", ".ogg"]
            and f.stat().st_size > 1024 * 1024),
            None
        )

        if audio_file:
            return FileResponse(audio_file)
            
    return {"error": f"No song found in folder: {folder_name}"}
    
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")