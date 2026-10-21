/** Daily cron: due-soon + overdue reminders for assignees; admin alerts on long overdue. */
const cron = require("node-cron");
const Task = require("../models/Task");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationService");
const {
  DUE_SOON_REMINDER_DAYS,
  ADMIN_REPEATED_OVERDUE_DAYS,
  DEADLINE_CRON_SCHEDULE,
} = require("../constants/notificationConstants");

const dayKey = (date) => date.toISOString().slice(0, 10);

const daysBetween = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end - start) / (24 * 60 * 60 * 1000));
};

const notifyAdminsRepeatedOverdue = async (task, daysOverdue, now) => {
  if (daysOverdue < ADMIN_REPEATED_OVERDUE_DAYS) {
    return;
  }

  const admins = await User.find({
    role: "admin",
    isActive: { $ne: false },
  }).select("_id");

  for (const admin of admins) {
    await createNotification({
      recipientId: admin._id,
      message: `Task "${task.title}" is overdue for ${daysOverdue} days and needs attention`,
      type: "admin_repeated_overdue",
      projectId: task.project,
      taskId: task._id,
      dedupeKey: `admin-overdue-${task._id}-${dayKey(now)}`,
    });
  }
};

const startDeadlineReminderJob = () => {
  cron.schedule(DEADLINE_CRON_SCHEDULE, async () => {
    try {
      const now = new Date();
      const dueSoonEnd = new Date();
      dueSoonEnd.setDate(dueSoonEnd.getDate() + DUE_SOON_REMINDER_DAYS);

      const upcoming = await Task.find({
        status: { $ne: "completed" },
        dueDate: { $gte: now, $lte: dueSoonEnd },
        assignee: { $ne: null },
      });

      for (const task of upcoming) {
        await createNotification({
          recipientId: task.assignee,
          message: `Task "${task.title}" is due within ${DUE_SOON_REMINDER_DAYS} days`,
          type: "task_deadline",
          projectId: task.project,
          taskId: task._id,
          dedupeKey: `deadline-${task._id}-${dayKey(task.dueDate)}`,
        });
      }

      const overdue = await Task.find({
        status: { $ne: "completed" },
        dueDate: { $lt: now },
        assignee: { $ne: null },
      });

      for (const task of overdue) {
        const daysOverdue = daysBetween(task.dueDate, now);

        await createNotification({
          recipientId: task.assignee,
          message: `Task "${task.title}" is overdue`,
          type: "task_overdue",
          projectId: task.project,
          taskId: task._id,
          dedupeKey: `overdue-${task._id}-${dayKey(now)}`,
        });

        await notifyAdminsRepeatedOverdue(task, daysOverdue, now);
      }
    } catch (error) {
      console.error("Deadline reminder job failed:", error);
    }
  });
};

module.exports = { startDeadlineReminderJob, notifyAdminsRepeatedOverdue, daysBetween };
