/** Map TMS domain records onto official Studio Admin table row shapes. */
import type { UserRow, UserTeam } from "@/app/(main)/dashboard/users/_components/data";
import type { Role } from "@/app/(main)/dashboard/roles/_components/roles-table/data";
import type { Task as TableTask } from "@/app/(main)/dashboard/tasks/_components/data";
import type { Task } from "./types";

const TYPE_TO_LABEL: Record<string, string> = {
  review: "documentation",
  chat: "documentation",
  draw: "feature",
  conv: "feature",
  monitor: "bug",
  report: "bug",
};

const STATUS_TO_TABLE: Record<string, TableTask["status"]> = {
  运行中: "in progress",
  待流转: "todo",
  已阻塞: "backlog",
  本轮已完成: "done",
};

const PRIORITY_TO_TABLE: Record<string, TableTask["priority"]> = {
  运行中: "medium",
  待流转: "medium",
  已阻塞: "high",
  本轮已完成: "low",
};

const ROLE_TO_TABLE: Record<string, string> = {
  admin: "Admin",
  duty: "Contributor",
  readonly: "Read-only",
};

const ROLE_TEAM: Record<string, UserTeam> = {
  admin: "Platform",
  duty: "Customer Ops",
  readonly: "Compliance",
};

export function toTableTask(task: Task): TableTask {
  return {
    id: task.code,
    title: task.title,
    status: STATUS_TO_TABLE[task.status] ?? "todo",
    label: TYPE_TO_LABEL[task.type] ?? "feature",
    priority: PRIORITY_TO_TABLE[task.status] ?? "medium",
    numericId: task.id,
  };
}

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role_code: string;
  role_name: string;
};

export function toTableUser(user: ApiUser): UserRow {
  return {
    name: user.name,
    email: user.email,
    role: ROLE_TO_TABLE[user.role_code] ?? user.role_name,
    status: "Active",
    team: ROLE_TEAM[user.role_code] ?? "Platform",
    workspace: ["Weblabs Studio"],
    joinedDate: "19 Aug 2026, 12:00 PM",
    lastActive: 0,
    userId: user.id,
    roleCode: user.role_code,
  };
}

export type ApiRole = {
  id: number;
  code: string;
  name: string;
  description: string;
  permissions: { code: string; name: string }[];
};

const ROLE_ACCESS: Record<string, string> = {
  admin: "Full",
  duty: "Scoped",
  readonly: "Read only",
};

export function toTableRole(role: ApiRole, userCount: number): Role {
  return {
    role: role.name,
    group: "System roles",
    accessLevel: ROLE_ACCESS[role.code] ?? "Scoped",
    users: userCount,
    permissionSets: role.permissions.map((p) => p.name),
    lastReview: "Aug 19, 2026",
    owner: "System",
    status: "Active",
  };
}
