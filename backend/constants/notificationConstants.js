/**
 * Notification timing rules (deadline cron runs once per day at 09:00 server time).
 *
 * - task_deadline: assignee gets "due soon" when due date is within DUE_SOON_DAYS
 *   (including today), while task is not completed.
 * - task_overdue: assignee gets "overdue" each day after the due date has passed
 *   (not "days before" — overdue means the deadline is already past).
 * - mention: immediate when someone posts a task comment containing @handle.
 */

const DUE_SOON_REMINDER_DAYS = 2;

/** Admins alerted when a task stays overdue at least this many full days. */
const ADMIN_REPEATED_OVERDUE_DAYS = 2;

/** Daily cron schedule (09:00 every day). */
const DEADLINE_CRON_SCHEDULE = "0 9 * * *";

module.exports = {
  DUE_SOON_REMINDER_DAYS,
  ADMIN_REPEATED_OVERDUE_DAYS,
  DEADLINE_CRON_SCHEDULE,
};
