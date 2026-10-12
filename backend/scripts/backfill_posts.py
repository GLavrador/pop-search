"""Fills in the picture of the videos saved before posts were kept.

    python -m scripts.backfill_posts                   shows what it would write
    python -m scripts.backfill_posts --write           writes the pictures
    python -m scripts.backfill_posts --write --text    and the text of each post

Run from the backend folder, with the same .env the server uses. Only videos
without a post are touched, so it is safe to run again, but a video filled in
once is not visited a second time: decide about --text before writing.

The text is left out unless asked for. In the app it only stays with a video
when whoever adds it leaves it in the form. With --text the word search reads
it at once; the embedding of a video only changes when the video is edited.
"""
import argparse
import sys
import time

from core.exceptions import validate_video_url
from db import supabase
from dtos import PostInfo
from services.downloader import fetch_post

PAUSE_SECONDS = 0.5


def backfill(write: bool, with_text: bool = False) -> int:
    rows = (
        supabase.table("videos")
        .select("id, url_original")
        .is_("post", "null")
        .order("created_at")
        .execute()
        .data
    ) or []
    print(f"{len(rows)} video(s) without a post")

    found = 0
    for row in rows:
        url = row["url_original"].strip()
        # Only X is asked: a link typed by hand can point anywhere.
        post = fetch_post(url) if validate_video_url(url) else None
        if post and not with_text:
            post = PostInfo(miniatura=post.miniatura)

        stored = post.to_store() if post else None
        if stored is None:
            print(f"  nothing to read      {url}")
            continue

        found += 1
        print(f"  {'text and picture' if stored['texto'] else 'picture':<18}   {url}")
        if write:
            supabase.table("videos").update({"post": stored}).eq("id", row["id"]).execute()

        time.sleep(PAUSE_SECONDS)

    print(f"{found} post(s) written" if write else f"{found} post(s) found. Run again with --write to keep them.")
    return found


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--write", action="store_true", help="write instead of only listing")
    parser.add_argument("--text", action="store_true", help="keep the text of each post too, not only its picture")
    args = parser.parse_args()

    try:
        backfill(args.write, args.text)
    except Exception as e:
        sys.exit(f"Could not read the videos: {e}\nIf the column is missing, apply the SQL that adds videos.post first.")
