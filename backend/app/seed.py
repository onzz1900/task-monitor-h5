"""首次启动时建表并写入演示数据：角色 / 权限 / 菜单 / 用户 / 任务。"""
from datetime import datetime, timedelta, timezone

from fastapi_users.password import PasswordHelper
from sqlalchemy import select

from .db import Base, async_session_maker, engine
from .models import Menu, Permission, Role, Task, TaskRun, User
from .schedule import compute_next_run

PERMISSIONS = [
    ("task:read", "查看任务"),
    ("task:create", "登记任务"),
    ("task:update", "修改任务"),
    ("task:run", "运行任务"),
    ("user:read", "查看用户"),
    ("user:manage", "管理用户"),
    ("role:read", "查看角色权限"),
]

ROLES = [
    ("admin", "管理员", "全部权限", [p[0] for p in PERMISSIONS]),
    ("duty", "值班", "任务的登记、修改与运行", ["task:read", "task:create", "task:update", "task:run"]),
    ("readonly", "只读", "仅可查看任务", ["task:read"]),
]

MENUS = [
    ("任务管理", "/tasks", 1, "task:read"),
    ("用户管理", "/users", 2, "user:read"),
    ("角色权限", "/roles", 3, "role:read"),
]

USERS = [
    ("admin@tms.local", "admin123", "周琪", "admin"),
    ("duty@tms.local", "duty123", "韩澄", "duty"),
    ("readonly@tms.local", "read123", "苏晚", "readonly"),
]

TASKS = [
    {
        "code": "FL-3017",
        "title": "聊天记录采集",
        "description": "拉取天猫 / 京东旗舰店客服会话并入库。",
        "type": "chat",
        "status": "运行中",
        "owner_name": "韩澄",
        "channel": "天猫 + 京东",
        "points_done": 12,
        "points_total": 20,
        "points_note": "20 个店铺点位：华东 12 店已完成，华南 8 店排队中。",
        "schedule_kind": "cron",
        "cron_expr": "30 8-20/2 * * *",
        "callback_url": "https://hooks.example.com/tms/chat",
        "callback_secret_ref": "ops-callback-key",
        "run": (True, "成功 · 采集 1,368 条会话", 42_000, 25),
    },
    {
        "code": "FL-3021",
        "title": "旗舰店评价采集",
        "description": "回写近 24 小时新增评价。",
        "type": "review",
        "status": "运行中",
        "owner_name": "林晓禾",
        "channel": "天猫旗舰",
        "points_done": 9,
        "points_total": 14,
        "points_note": "14 个旗舰店点位，已采 9 店。",
        "schedule_kind": "interval",
        "interval_minutes": 180,
        "run": (True, "成功 · 入库 1,052 条评价", 55_000, 48),
    },
    {
        "code": "FL-3025",
        "title": "店铺转化率监控",
        "description": "核对主搜与购物车漏斗数据。",
        "type": "conv",
        "status": "运行中",
        "owner_name": "王倩",
        "channel": "全渠道漏斗",
        "points_done": 16,
        "points_total": 18,
        "points_note": "18 个漏斗监控点位，剩 2 个直播间未出数。",
        "schedule_kind": "cron",
        "cron_expr": "*/40 9-22 * * *",
        "run": (True, "成功 · 全站转化率 3.4%", 21_000, 15),
    },
    {
        "code": "FL-3008",
        "title": "商详绘图记录采集",
        "description": "采集主图与商详设计稿回传记录。",
        "type": "draw",
        "status": "待流转",
        "owner_name": "沈见远",
        "channel": "主图 / 商详",
        "points_done": 7,
        "points_total": 10,
        "points_note": "10 个商详绘图点位，7 店已回传。",
        "schedule_kind": "cron",
        "cron_expr": "0 14 * * *",
        "run": (True, "成功 · 回传 7 店设计稿", 63_000, 115),
    },
    {
        "code": "FL-2996",
        "title": "实时成交数据监控",
        "description": "成交看板数据核对与告警。",
        "type": "monitor",
        "status": "已阻塞",
        "owner_name": "赵启明",
        "channel": "成交看板",
        "points_done": 5,
        "points_total": 16,
        "points_note": "16 个成交监控点位，京东侧全部超时。",
        "schedule_kind": "interval",
        "interval_minutes": 30,
        "callback_url": "https://hooks.example.com/tms/monitor",
        "callback_secret_ref": "jd-open-api",
        "run": (False, "失败 · 京东订单接口超时（11 个点位无数据）", 30_000, 33),
    },
    {
        "code": "FL-3030",
        "title": "日报报表任务",
        "description": "华东 / 华南 / 全国三张日报。",
        "type": "report",
        "status": "待流转",
        "owner_name": "苏晚",
        "channel": "华东 / 华南 / 全国",
        "points_done": 1,
        "points_total": 3,
        "points_note": "华东已出，华南与全国待流转。",
        "schedule_kind": "cron",
        "cron_expr": "0 16 * * *",
        "run": (True, "成功 · 已出华东日报", 18_000, 95),
    },
]


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        if (await session.execute(select(Role.id))).first() is not None:
            return

        perms = {code: Permission(code=code, name=name) for code, name in PERMISSIONS}
        session.add_all(perms.values())

        roles: dict[str, Role] = {}
        for code, name, desc, perm_codes in ROLES:
            role = Role(code=code, name=name, description=desc)
            role.permissions = [perms[c] for c in perm_codes]
            roles[code] = role
            session.add(role)

        for title, path, sort, perm in MENUS:
            session.add(Menu(title=title, path=path, sort=sort, permission_code=perm))

        await session.flush()

        # 密码哈希交给 fastapi-users 的 PasswordHelper（argon2/bcrypt 由库选择）
        helper = PasswordHelper()
        for email, password, name, role_code in USERS:
            session.add(
                User(
                    email=email,
                    hashed_password=helper.hash(password),
                    is_active=True,
                    is_superuser=role_code == "admin",
                    is_verified=True,
                    name=name,
                    role_id=roles[role_code].id,
                )
            )

        now = datetime.now(timezone.utc)
        for spec in TASKS:
            ok, text, duration, minutes_ago = spec.pop("run")
            task = Task(**spec)
            task.next_run_at = compute_next_run(
                task.schedule_kind, task.cron_expr, task.interval_minutes
            )
            session.add(task)
            await session.flush()
            session.add(
                TaskRun(
                    task_id=task.id,
                    ran_at=now - timedelta(minutes=minutes_ago),
                    ok=ok,
                    result_text=text,
                    duration_ms=duration,
                )
            )

        await session.commit()
