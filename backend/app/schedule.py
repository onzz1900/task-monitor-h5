"""调度计算：cron / 固定间隔，统一按 Asia/Shanghai 计算下次流转时间。"""
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from croniter import croniter

SH_TZ = ZoneInfo("Asia/Shanghai")


def compute_next_run(
    schedule_kind: str,
    cron_expr: str | None,
    interval_minutes: int | None,
    base: datetime | None = None,
) -> datetime | None:
    """返回 UTC 时间（存储用），计算过程在 Asia/Shanghai 时区内进行。"""
    base = base or datetime.now(timezone.utc)
    base_sh = base.astimezone(SH_TZ)
    if schedule_kind == "cron" and cron_expr:
        try:
            nxt = croniter(cron_expr, base_sh).get_next(datetime)
        except (ValueError, KeyError):
            return None
        if nxt.tzinfo is None:
            nxt = nxt.replace(tzinfo=SH_TZ)
        return nxt.astimezone(timezone.utc)
    if schedule_kind == "interval" and interval_minutes:
        return base + timedelta(minutes=max(1, interval_minutes))
    return None


def validate_cron(cron_expr: str) -> bool:
    return croniter.is_valid(cron_expr)
