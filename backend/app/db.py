"""数据库连接。SQLite 文件存储，模型均为标准 SQLAlchemy 2.0 声明式，
后续可平移到 Postgres（把 TMS_DATABASE_URL 换成 postgresql+asyncpg 即可）。"""
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

DATABASE_URL = os.environ.get("TMS_DATABASE_URL", f"sqlite+aiosqlite:///{DATA_DIR}/tms.db")

engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session():
    async with async_session_maker() as session:
        yield session
