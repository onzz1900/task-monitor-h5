/** Map TMS domain records onto official Studio Admin table / kanban shapes. */

import { columnIds } from "@/app/(main)/dashboard/kanban/_components/data";
import type {
  BoardState,
  ColumnId,
  Task as KanbanTask,
  TaskTeam,
} from "@/app/(main)/dashboard/kanban/_components/types";
import type { Role } from "@/app/(main)/dashboard/roles/_components/roles-table/data";
import type { Task as TableTask } from "@/app/(main)/dashboard/tasks/_components/data";
import type { UserRow, UserTeam } from "@/app/(main)/dashboard/users/_components/data";

import type { Task } from "./types";

export const STATUS_TO_COLUMN: Record<string, ColumnId> = {
  待流转: "planned",
  运行中: "building",
  已阻塞: "qa",
  本轮已完成: "shipped",
};

export const COLUMN_TO_STATUS: Record<ColumnId, string> = {
  ideas: "待流转",
  planned: "待流转",
  building: "运行中",
  qa: "已阻塞",
  shipped: "本轮已完成",
};

export function statusToColumn(status: string): ColumnId {
  return STATUS_TO_COLUMN[status] ?? "ideas";
}

const TYPE_TO_TEAM: Record<string, TaskTeam> = {
  review: "Docs",
  chat: "Product",
  draw: "Design",
  conv: "Data",
  monitor: "Platform",
  report: "Finance Ops",
};

const OWNER_TONE =
  "[&_[data-slot=avatar-fallback]]:bg-zinc-100 [&_[data-slot=avatar-fallback]]:text-zinc-700 after:border-zinc-200 dark:[&_[data-slot=avatar-fallback]]:bg-zinc-500/15 dark:[&_[data-slot=avatar-fallback]]:text-zinc-300 dark:after:border-zinc-500/20";

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

function kanbanPriority(status: string): KanbanTask["priority"] {
  if (status === "已阻塞") return "High";
  if (status === "运行中") return "Medium";
  return "Low";
}

export function toKanbanTask(task: Task): KanbanTask {
  const total = task.points_total || 1;
  return {
    id: String(task.id),
    title: task.title,
    description: task.description || task.code,
    priority: kanbanPriority(task.status),
    dueDate: task.code,
    progress: Math.min(100, Math.round((task.points_done / total) * 100)),
    owner: { name: task.owner_name || "—", tone: OWNER_TONE },
    team: TYPE_TO_TEAM[task.type] ?? "Platform",
    insights: [{ label: "Documents", count: task.points_total }],
  };
}

export function toKanbanBoard(tasks: Task[]): BoardState {
  const board = Object.fromEntries(columnIds.map((id) => [id, [] as KanbanTask[]])) as BoardState;
  for (const task of tasks) {
    board[statusToColumn(task.status)].push(toKanbanTask(task));
  }
  return board;
}

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
