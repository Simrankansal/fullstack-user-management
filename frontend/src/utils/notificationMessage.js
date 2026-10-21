/** Human-readable notification text with sender name. */



export const getActorName = (item) => {

  if (item?.actor?.name) {

    return item.actor.name;

  }

  const message = item?.message || "";

  const match = message.match(/^(.+?)\s+(assigned|added|changed|commented|mentioned)/i);

  if (match?.[1] && match[1].length < 40) {

    return match[1];

  }

  return null;

};



export const formatNotificationMessage = (item) => {

  const taskTitle = item.task?.title?.trim();

  const actor = getActorName(item);

  const from = actor || "Someone";

  let message = item.message || "";



  if (taskTitle && message.includes("undefined")) {

    message = message.replace(/undefined/g, taskTitle);

  }



  switch (item.type) {

    case "task_assigned":

      return taskTitle

        ? `${from} assigned you to task "${taskTitle}"`

        : `${from} assigned you a task`;

    case "task_status_changed":

      return message || `${from} updated a task status`;

    case "task_due_changed":

      return taskTitle

        ? `${from} updated the due date on "${taskTitle}"`

        : `${from} updated a task due date`;

    case "task_comment":

      return taskTitle

        ? `${from} commented on "${taskTitle}"`

        : `${from} commented on a task`;

    case "task_mention":

    case "mention":

      if (message.includes("mentioned you in a comment")) {
        return taskTitle
          ? `${from} mentioned you in a comment on "${taskTitle}"`
          : `${from} mentioned you in a task comment`;
      }

      return taskTitle

        ? `${from} mentioned you on "${taskTitle}"`

        : `${from} mentioned you on a task`;

    case "task_deadline":

      return taskTitle

        ? `Reminder: "${taskTitle}" is due soon`

        : "A task is due soon";

    case "task_overdue":

      return taskTitle

        ? `Reminder: "${taskTitle}" is overdue`

        : "A task is overdue";

    case "project_owner_assigned":

      return message || `${from} assigned you as project owner`;

    case "project_member_added":

    case "project_added":

      return message || `${from} added you to a project`;

    case "admin_repeated_overdue":

      return message || `Repeated overdue task needs admin attention`;

    default:

      if (message && actor && !message.startsWith(actor)) {

        return `${from}: ${message}`;

      }

      return message || "New notification";

  }

};



export const formatNotificationSubtitle = (item) => {

  const parts = [];

  if (item.project?.name) {

    parts.push(item.project.name);

  }

  if (item.task?.title && !formatNotificationMessage(item).includes(item.task.title)) {

    parts.push(item.task.title);

  }

  return parts.join(" · ");

};



export const notificationDeliveryStatus = (item) => {

  if (item.isRead) {

    return {

      label: "Read by recipient",

      variant: "success",

      detail: item.readAt

        ? new Date(item.readAt).toLocaleString()

        : "Opened in app",

    };

  }

  return {

    label: "Delivered (unread)",

    variant: "warning",

    detail: item.deliveredAt

      ? new Date(item.deliveredAt).toLocaleString()

      : new Date(item.createdAt).toLocaleString(),

  };

};



export const notificationIcon = (type) => {

  if (type === "task_assigned") {

    return "📋";

  }

  if (type === "task_comment" || type === "task_mention" || type === "mention") {

    return "💬";

  }

  if (type === "task_deadline" || type === "task_overdue") {

    return "⏰";

  }

  if (type === "admin_repeated_overdue") {

    return "🚨";

  }

  if (type === "project_added" || type === "project_owner_assigned" || type === "project_member_added") {

    return "📁";

  }

  return "🔔";

};


