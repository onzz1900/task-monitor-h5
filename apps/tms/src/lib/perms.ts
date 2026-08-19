/** RuoYi 权限判定：超管 role_key=admin 展开为 *；兼容旧 task/user/role 码。 */

export const PERM_ALIASES: Record<string, string[]> = {
  "user:read": ["system:user:list", "system:user:query"],
  "user:manage": ["system:user:add", "system:user:edit", "system:user:remove"],
  "role:read": ["system:role:list", "system:role:query"],
};

export function hasPerm(permissions: string[], code: string): boolean {
  if (permissions.includes("*") || permissions.includes(code)) return true;
  const aliases = PERM_ALIASES[code] ?? [];
  if (aliases.some((item) => permissions.includes(item))) return true;
  for (const [legacy, ruoyi] of Object.entries(PERM_ALIASES)) {
    if (ruoyi.includes(code) && permissions.includes(legacy)) return true;
  }
  return false;
}
