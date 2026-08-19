"""接口入参模型（校验）。出参统一走 serializers，保证与前端字段形状一致。"""
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=128)
    description: str = ""
    type: str = "review"
    owner_name: str = ""
    channel: str = ""
    points_done: int = Field(default=0, ge=0)
    points_total: int = Field(default=1, ge=1)
    points_note: str = ""
    schedule_kind: str = "cron"  # cron | interval
    cron_expr: str | None = None
    interval_minutes: int | None = Field(default=None, ge=1)
    callback_url: str | None = None
    callback_timeout_ms: int = Field(default=10000, ge=100, le=120000)
    callback_retries: int = Field(default=3, ge=0, le=10)
    callback_secret_ref: str | None = None
    keep_runs: int = Field(default=10, ge=1, le=100)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    status: str | None = None


class UserPatch(BaseModel):
    role: str | None = None
    is_active: bool | None = None
