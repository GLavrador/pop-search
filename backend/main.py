from fastapi import FastAPI
from db import supabase

app = FastAPI(
    title="Pop Search API",
    description="Backend para indexação e busca de vídeos com IA",
    version="0.1.0"
)

@app.get("/")
async def health_check():

    try:
        response = supabase.table("videos").select("count", count="exact").execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "database": db_status,
        "version": "0.1.0"
    }