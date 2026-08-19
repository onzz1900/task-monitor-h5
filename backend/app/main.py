"""任务流转中心 · 任务管理系统主 API（系统记录源）。"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import auth_backend, fastapi_users
from .routers import admin, bootstrap, tasks
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed()
    yield


app = FastAPI(title="任务流转中心 TMS API", lifespan=lifespan)

# 常规访问经 Next.js BFF 代理（同源）；CORS 仅为直连调试保留
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"])
app.include_router(bootstrap.router)
app.include_router(admin.router)
app.include_router(tasks.router)


@app.get("/healthz")
async def healthz():
    return {"ok": True}
