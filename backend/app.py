from contextlib import asynccontextmanager
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import MODEL_PATH 
from routes.routes import router 

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = joblib.load(MODEL_PATH)
    yield

my_app = FastAPI(
    title="Guardroid API",
    version="1.0.0",
    lifespan=lifespan,
)

my_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

my_app.include_router(router)
