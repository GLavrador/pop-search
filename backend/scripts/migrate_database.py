import os
import sys
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate():
    logger.info("Starting database migration to remove 'tags_busca'...")

    try:
        response = supabase.table("videos").select("id, metadados_estruturados").execute()
        videos = response.data
        
        logger.info(f"Found {len(videos)} videos to verify.")
        
        updated_count = 0
        for video in videos:
            metadata = video.get("metadados_estruturados")
            if metadata and "tags_busca" in metadata:
                del metadata["tags_busca"]
                
                logger.info(f"Updating video {video['id']}")
                supabase.table("videos").update({"metadados_estruturados": metadata}).eq("id", video['id']).execute()
                updated_count += 1
                
        logger.info(f"Migration completed. Updated {updated_count} videos.")

    except Exception as e:
        logger.error(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
