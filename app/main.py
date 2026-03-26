from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

app = FastAPI()

song_db = {}
MUSIC_DIR = Path("/music") # uncomment it when running docker compose up --build
# MUSIC_DIR = Path(r"C:/Users/khong/AppData/Local/osu!/Songs/") # for local development

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
        folder_path = MUSIC_DIR / folder_name # create a path object for the specific song(folder_name is a string)
        osu_file = next(folder_path.glob("*.osu"), None)
        metadata = {
            "folder": folder_name,
            "title": folder_name,
            "artist": "Unknown",
            "tags": "",
            "image_file": ""
        }
        if(osu_file): # fix nonetype error if no .osu file is found
            with osu_file.open(mode="r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip() # clean up newline characters

                    if line.startswith("Title:"):
                        metadata["title"] = line.split(":", 1)[1]
                    elif line.startswith("TitleUnicode:") and line.split(":", 1)[1]:
                        metadata["title"] = line.split(":", 1)[1] # Prefer original Japanese
                    elif line.startswith("Artist:"):
                        metadata["artist"] = line.split(":", 1)[1]
                    elif line.startswith("ArtistUnicode:") and line.split(":", 1)[1]:
                        metadata["artist"] = line.split(":", 1)[1] # Prefer original Japanese
                    elif line.startswith("Tags:"):
                        metadata["tags"] = line.split(":", 1)[1]
                    elif line.startswith("0,0,\""):
                        # This splits the string at the quote marks and grabs the text inside them
                        metadata["image_file"] = line.split(",")[2].strip('"')
                                        
                    # Optimization: .osu files have thousands of lines of map coordinates at the bottom.
                    # Once we hit the [Difficulty], [Events] or [TimingPoints] section, we have all the metadata we need.
                    if line == "[TimingPoints]":
                        break

        song_db[index] = metadata

    print(f"Success! Loaded {len(song_db)} songs into memory.")

build_database() # run the setup immediately when the file loads

# song menu endpoint
@app.get("/api/songs")
def get_songs():
    formatted_list = []

    for song_id, folder_name in song_db.items():
        # create dictionary shape: {"id": 1, "title": "Folder Name", "artist": "Unknown", "tags": "tag1 tag2 tag3"}
        formatted_list.append({
            "id": song_id,
            "title": folder_name["title"],
            "artist": folder_name["artist"],
            "tags": folder_name["tags"],
        })

    return {"songs": formatted_list}

# song playback endpoint
@app.get("/api/play/{song_id}")
def play_song(song_id: int):
    # stream a specific song file by its ID
    metadata = song_db.get(song_id)

    if metadata is None:
        return {"error": "Song not found"}, 404

    # create a path object for the specific song
    folder_path = MUSIC_DIR / metadata["folder"]

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
            
    return {"error": f"No song found in folder: {metadata['folder']}"}

@app.get("/api/image/{song_id}")
def get_background_image(song_id: int):
    metadata = song_db.get(song_id)
    # if fake ID
    if metadata is None:
        return {"error": "Song not found"}, 404
    # if image file is empty string
    if not metadata["image_file"]:
        return {"error": "No background image found for this song"}
    
    folder_path = MUSIC_DIR / metadata["folder"]
    if folder_path.is_dir():
        image_path = folder_path / metadata["image_file"]
        if image_path.is_file():
            return FileResponse(image_path)
   
    return {"error": "Image file missing from disk"}
    
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")