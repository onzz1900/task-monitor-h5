"""出参序列化：字段名与前端 TypeScript 类型一一对应；时间统一 UTC ISO（带 Z）。"""
from datetime import datetime, timezone

from .models import Role, Task, TaskRun, User


def iso_utc(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def run_to_dict(run: TaskRun) -> dict:
    return {
        "id": run.id,
        "ran_at": iso_utc(run.ran_at),
        "ok": bool(run.ok),
        "result_text": run.result_text,
        "duration_ms": run.duration_ms,
    }


def task_to_dict(task: Task, with_runs: bool = False) -> dict:
    runs = list(task.runs)
    out = {
        "id": task.id,
        "code": task.code,
        "title": task.title,
        "description": task.description,
        "type": task.type,
        "status": task.status,
        "owner_name": task.owner_name,
        "channel": task.channel,
        "points_done": task.points_done,
        "points_total": task.points_total,
        "points_note": task.points_note,
        "schedule_kind": task.schedule_kind,
        "cron_expr": task.cron_expr,
        "interval_minutes": task.interval_minutes,
        "timezone": task.timezone,
        "next_run_at": iso_utc(task.next_run_at),
        "callback_url": task.callback_url,
        "callback_timeout_ms": task.callback_timeout_ms,
        "callback_retries": task.callback_retries,
        "callback_secret_ref": task.callback_secret_ref,
        "keep_runs": task.keep_runs,
        "created_at": iso_utc(task.created_at),
        "updated_at": iso_utc(task.updated_at),
        "last_run": run_to_dict(runs[0]) if runs else None,
    }
    if with_runs:
        out["runs"] = [run_to_dict(r) for r in runs]
    return out


def user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "role_code": user.role.code if user.role else None,
        "role_name": user.role.name if user.role else None,
    }


def role_to_dict(role: Role) -> dict:
    return {
        "id": role.id,
        "code": role.code,
        "name": role.name,
        "description": role.description,
        "permissions": [{"code": p.code, "name": p.name} for p in role.permissions],
    }
