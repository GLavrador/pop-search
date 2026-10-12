import os
import httpx
from supabase import create_client, Client
from supabase.lib.client_options import SyncClientOptions
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials not found in .env file")

# HTTP/1.1 on purpose. Over HTTP/2 every request shares one socket, and the
# threads that answer requests here trip over each other reading from it.
http = httpx.Client(http2=False, timeout=120)

supabase: Client = create_client(url, key, options=SyncClientOptions(httpx_client=http))