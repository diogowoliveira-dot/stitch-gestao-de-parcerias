from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.campaigns import router as campaigns_router
from routes.executivos import router as executivos_router

app = FastAPI(title="DWV Campaign Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrinja em produção para o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns_router)
app.include_router(executivos_router)


@app.get("/health")
def health():
    return {"status": "ok"}
