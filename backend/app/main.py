from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models
from .routers.auth import router as auth_router
from .routers.products import router as products_router
from .routers.cart import router as cart_router
from .routers.orders import router as orders_router
from .routers.payments import router as payments_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="StyleHub - Fashion Mini Store",
    description="Fashion mini store API built with FastAPI",
    version="1.0.0"
)


# -----------------------------
# CORS Configuration
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Register API Routers
# -----------------------------

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(payments_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to StyleHub API",
        "status": "running"
    }