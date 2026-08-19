/** 调度计算：cron / 固定间隔，统一按 Asia/Shanghai 计算下次流转时间。 */
import { CronExpressionParser } from "cron-parser";

export const TMS_TZ = "Asia/Shanghai";

export function computeNextRun(
  scheduleKind: string,
  cronExpr: string | null,
  intervalMinutes: number | null,
  base?: Date
): string | null {
  const from = base ?? new Date();
  if (scheduleKind === "cron" && cronExpr) {
    try {
      const it = CronExpressionParser.parse(cronExpr, { tz: TMS_TZ, currentDate: from });
      return it.next().toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (scheduleKind === "interval" && intervalMinutes && intervalMinutes >= 1) {
    return new Date(from.getTime() + intervalMinutes * 60_000).toISOString();
  }
  return null;
}

export function isValidCron(cronExpr: string): boolean {
  try {
    CronExpressionParser.parse(cronExpr, { tz: TMS_TZ });
    return true;
  } catch {
    return false;
  }
}
