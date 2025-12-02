from fastapi import FastAPI

app = FastAPI(
    title="Pop Search API",
    description="Backend para indexação e busca de vídeos com IA",
    version="0.1.0"
)

@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "message": "Pop Search API is running and welcoming the world!",
        "version": "0.1.0"
    }