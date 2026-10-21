/** Creates notifications with dedupe and skips self-notify. */
const Notification = require("../models/Notification");

const createNotification = async ({
  recipientId,
  message,
  type,
  projectId = null,
  taskId = null,
  dedupeKey = null,
  actorId = null,
}) => {
  if (!recipientId) {
    return null;
  }

  if (actorId && String(recipientId) === String(actorId)) {
    return null;
  }

  if (dedupeKey) {
    const existing = await Notification.findOne({
      recipient: recipientId,
      dedupeKey,
      isRead: false,
    });
    if (existing) {
      return existing;
    }
  }

  return Notification.create({
    recipient: recipientId,
    message,
    type,
    project: projectId,
    task: taskId,
    actor: actorId || null,
    deliveredAt: new Date(),
    dedupeKey,
  });
};

module.exports = { createNotification };
