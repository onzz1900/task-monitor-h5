"""RBAC：按角色权限做接口级校验。"""
from fastapi import Depends, HTTPException

from .auth import current_active_user
from .models import User


def user_permission_codes(user: User) -> set[str]:
    if user.role is None:
        return set()
    return {p.code for p in user.role.permissions}


def require(permission_code: str):
    async def dependency(user: User = Depends(current_active_user)) -> User:
        if permission_code not in user_permission_codes(user):
            raise HTTPException(status_code=403, detail=f"缺少权限：{permission_code}")
        return user

    return dependency
