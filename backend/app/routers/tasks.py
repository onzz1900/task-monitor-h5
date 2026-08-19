"""任务：列表 / 登记 / 修改 / 详情 / 运行（模拟一次结果并入库）。"""
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Task, TaskRun, User
from ..permissions import require
from ..schedule import compute_next_run, validate_cron
from ..schemas import TaskCreate, TaskUpdate
from ..serializers import task_to_dict

router = APIRouter(prefix="/api", tags=["tasks"])

TASK_TYPES = {
    "review": "评价采集",
    "chat": "聊天采集",
    "draw": "绘图采集",
    "conv": "转化率监控",
    "monitor": "数据监控",
    "report": "报表任务",
}

# 只暴露引用名，密钥本体由服务端环境/密管持有
SECRET_REFS = [
    {"ref": "ops-callback-key", "description": "回调网关签名密钥"},
    {"ref": "tmall-open-api", "description": "天猫开放平台凭证"},
    {"ref": "jd-open-api", "description": "京东开放平台凭证"},
]

STATUSES = ["运行中", "待流转", "已阻塞", "本轮已完成"]


def _validate(body: TaskCreate | TaskUpdate) -> None:
    if body.schedule_kind == "cron":
        if not body.cron_expr or not validate_cron(body.cron_expr):
            raise HTTPException(status_code=400, detail="cron 表达式无效")
    elif body.schedule_kind == "interval":
        if not body.interval_minutes:
            raise HTTPException(status_code=400, detail="请填写间隔分钟数")
    else:
        raise HTTPException(status_code=400, detail="调度方式只能是 cron 或 interval")
    if body.type not in TASK_TYPES:
        raise HTTPException(status_code=400, detail="任务类型无效")
    if body.callback_url and not body.callback_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="回调地址必须是 http(s) URL")
    if body.callback_secret_ref and body.callback_secret_ref not in {s["ref"] for s in SECRET_REFS}:
        raise HTTPException(status_code=400, detail="secretRef 不存在")
    if body.points_done > body.points_total:
        raise HTTPException(status_code=400, detail="已完成点位不能超过总点位")
    if isinstance(body, TaskUpdate) and body.status is not None and body.status not in STATUSES:
        raise HTTPException(status_code=400, detail="状态无效")


@router.get("/meta", dependencies=[Depends(require("task:read"))])
async def meta():
    return {"task_types": TASK_TYPES, "statuses": STATUSES, "secret_refs": SECRET_REFS}


@router.get("/tasks", dependencies=[Depends(require("task:read"))])
async def list_tasks(session: AsyncSession = Depends(get_session)):
    tasks = (
        (await session.execute(select(Task).order_by(Task.next_run_at.is_(None), Task.next_run_at)))
        .scalars()
        .all()
    )
    return [task_to_dict(t) for t in tasks]


@router.get("/tasks/{task_id}", dependencies=[Depends(require("task:read"))])
async def get_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await session.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task_to_dict(task, with_runs=True)


async def _next_code(session: AsyncSession) -> str:
    n = (await session.execute(select(func.count(Task.id)))).scalar_one()
    return f"FL-{3100 + n}"


@router.post("/tasks", status_code=201)
async def create_task(
    body: TaskCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require("task:create")),
):
    _validate(body)
    task = Task(**body.model_dump(), code=await _next_code(session))
    task.next_run_at = compute_next_run(task.schedule_kind, task.cron_expr, task.interval_minutes)
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task_to_dict(task, with_runs=True)


@router.put("/tasks/{task_id}")
async def update_task(
    task_id: int,
    body: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require("task:update")),
):
    task = await session.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在")
    _validate(body)
    for key, value in body.model_dump(exclude={"status"}).items():
        setattr(task, key, value)
    if body.status is not None:
        task.status = body.status
    task.next_run_at = compute_next_run(task.schedule_kind, task.cron_expr, task.interval_minutes)
    await session.commit()
    await session.refresh(task)
    return task_to_dict(task, with_runs=True)


def _mock_result(task: Task) -> tuple[bool, str]:
    if random.random() < 0.2:
        fails = [
            f"失败 · 接口超时（{random.randint(2, max(2, task.points_total))} 个点位无数据）",
            "失败 · 回调网关返回 502",
            "失败 · 触发反爬限流，等待冷却窗口",
        ]
        return False, random.choice(fails)
    n = random.randint(300, 2000)
    texts = {
        "review": f"成功 · 入库 {n:,} 条评价",
        "chat": f"成功 · 采集 {n:,} 条会话",
        "draw": f"成功 · 回传 {random.randint(1, task.points_total)} 店设计稿",
        "conv": f"成功 · 全站转化率 {random.uniform(2.8, 4.2):.1f}%",
        "monitor": f"成功 · 巡查 {task.points_total} 个点位，无告警",
        "report": f"成功 · 已出 {random.randint(1, task.points_total)} 份报表",
    }
    return True, texts.get(task.type, f"成功 · 处理 {n:,} 条记录")


@router.post("/tasks/{task_id}/run")
async def run_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require("task:run")),
):
    task = await session.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在")

    now = datetime.now(timezone.utc)
    ok, text = _mock_result(task)
    session.add(
        TaskRun(
            task_id=task.id,
            ran_at=now,
            ok=ok,
            result_text=text,
            duration_ms=random.randint(5_000, 90_000),
        )
    )

    if ok:
        if task.points_done < task.points_total:
            task.points_done = min(task.points_total, task.points_done + random.randint(1, 3))
        task.status = "本轮已完成" if task.points_done >= task.points_total else "运行中"
    else:
        task.status = "已阻塞"
    task.next_run_at = compute_next_run(
        task.schedule_kind, task.cron_expr, task.interval_minutes, base=now
    )

    # 备份保留最近 keep_runs 次运行
    await session.flush()
    keep_ids = (
        (
            await session.execute(
                select(TaskRun.id)
                .where(TaskRun.task_id == task.id)
                .order_by(TaskRun.ran_at.desc())
                .limit(task.keep_runs)
            )
        )
        .scalars()
        .all()
    )
    await session.execute(
        delete(TaskRun).where(TaskRun.task_id == task.id, TaskRun.id.not_in(keep_ids))
    )

    await session.commit()
    await session.refresh(task)
    return task_to_dict(task, with_runs=True)
