"""数据模型：用户 / 角色 / 权限 / 菜单 / 任务 / 运行记录。
全部使用可平移到 Postgres 的标准 SQLAlchemy 类型。"""
from datetime import datetime, timezone

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)  # admin / duty / readonly
    name: Mapped[str] = mapped_column(String(64))  # 管理员 / 值班 / 只读
    description: Mapped[str] = mapped_column(String(255), default="")

    permissions: Mapped[list["Permission"]] = relationship(
        secondary="role_permissions", lazy="selectin"
    )
    users: Mapped[list["User"]] = relationship(back_populates="role")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)  # task:read, task:create ...
    name: Mapped[str] = mapped_column(String(64))


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[int] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True
    )


class Menu(Base):
    __tablename__ = "menus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(64))
    path: Mapped[str] = mapped_column(String(128))
    sort: Mapped[int] = mapped_column(Integer, default=0)
    permission_code: Mapped[str] = mapped_column(String(64))  # 缺少该权限的角色看不到此菜单


class User(SQLAlchemyBaseUserTableUUID, Base):
    """fastapi-users 基础字段（email / hashed_password / is_active …）+ 业务字段。"""

    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(64), default="")
    role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"), nullable=True)

    role: Mapped[Role | None] = relationship(back_populates="users", lazy="selectin")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(16), unique=True)  # FL-3xxx
    title: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str] = mapped_column(String(16))  # review/chat/draw/conv/monitor/report
    status: Mapped[str] = mapped_column(String(16), default="待流转")  # 运行中/待流转/已阻塞/本轮已完成
    owner_name: Mapped[str] = mapped_column(String(64), default="")
    channel: Mapped[str] = mapped_column(String(128), default="")

    points_done: Mapped[int] = mapped_column(Integer, default=0)
    points_total: Mapped[int] = mapped_column(Integer, default=1)
    points_note: Mapped[str] = mapped_column(String(255), default="")

    # 调度：cron 或固定间隔，时区固定 Asia/Shanghai
    schedule_kind: Mapped[str] = mapped_column(String(16), default="cron")  # cron | interval
    cron_expr: Mapped[str | None] = mapped_column(String(64), nullable=True)
    interval_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Shanghai")
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # 回调：只存 secretRef，绝不落明文密钥
    callback_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    callback_timeout_ms: Mapped[int] = mapped_column(Integer, default=10000)
    callback_retries: Mapped[int] = mapped_column(Integer, default=3)
    callback_secret_ref: Mapped[str | None] = mapped_column(String(64), nullable=True)

    keep_runs: Mapped[int] = mapped_column(Integer, default=10)  # 备份最近 N 次运行

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    runs: Mapped[list["TaskRun"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="TaskRun.ran_at.desc()",
        lazy="selectin",
    )


class TaskRun(Base):
    __tablename__ = "task_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    ran_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ok: Mapped[bool] = mapped_column(Boolean, default=True)
    result_text: Mapped[str] = mapped_column(String(255), default="")
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)

    task: Mapped[Task] = relationship(back_populates="runs")
