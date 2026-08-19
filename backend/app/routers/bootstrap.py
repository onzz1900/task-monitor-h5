"""登录后一次性拉取：当前用户 + 权限 + 可见菜单。"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import current_active_user
from ..db import get_session
from ..models import Menu, User
from ..permissions import user_permission_codes

router = APIRouter(prefix="/api", tags=["bootstrap"])


@router.get("/bootstrap")
async def bootstrap(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
):
    codes = user_permission_codes(user)
    menus = (await session.execute(select(Menu).order_by(Menu.sort))).scalars().all()
    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role.code if user.role else None,
            "role_name": user.role.name if user.role else None,
        },
        "permissions": sorted(codes),
        "menus": [
            {"title": m.title, "path": m.path, "sort": m.sort, "permission_code": m.permission_code}
            for m in menus
            if m.permission_code in codes
        ],
    }
