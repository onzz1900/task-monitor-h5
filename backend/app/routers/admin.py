"""用户与角色管理接口。"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Role, User
from ..permissions import require
from ..schemas import UserPatch
from ..serializers import role_to_dict, user_to_dict

router = APIRouter(prefix="/api", tags=["admin"])


@router.get("/users", dependencies=[Depends(require("user:read"))])
async def list_users(session: AsyncSession = Depends(get_session)):
    users = (await session.execute(select(User).order_by(User.email))).scalars().all()
    return [user_to_dict(u) for u in users]


@router.patch("/users/{user_id}")
async def patch_user(
    user_id: uuid.UUID,
    body: UserPatch,
    session: AsyncSession = Depends(get_session),
    actor: User = Depends(require("user:manage")),
):
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    if body.role is not None:
        role = (
            await session.execute(select(Role).where(Role.code == body.role))
        ).scalar_one_or_none()
        if role is None:
            raise HTTPException(status_code=400, detail="角色不存在")
        if user.id == actor.id and role.code != "admin":
            raise HTTPException(status_code=400, detail="不能移除自己的管理员角色")
        user.role_id = role.id
    if body.is_active is not None:
        if user.id == actor.id and not body.is_active:
            raise HTTPException(status_code=400, detail="不能停用自己")
        user.is_active = body.is_active
    await session.commit()
    await session.refresh(user)
    return user_to_dict(user)


@router.get("/roles", dependencies=[Depends(require("role:read"))])
async def list_roles(session: AsyncSession = Depends(get_session)):
    roles = (await session.execute(select(Role).order_by(Role.id))).scalars().all()
    return [role_to_dict(r) for r in roles]
