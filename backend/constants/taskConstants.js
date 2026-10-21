/**
 * Shared task/project enums and permission helpers (checked on backend).
 * Roles: portal admin | project owner | project member (on ProjectMember).
 */

const TASK_STATUSES = ["todo", "in_progress", "in_review", "completed"];
const TASK_PRIORITIES = ["low", "medium", "high", "critical"];
const APP_ROLES = ["admin", "member"];
const PROJECT_ROLES = ["owner", "member"];

const isAdmin = (appRole) => appRole === "admin";

const canCreateProject = (appRole) => isAdmin(appRole);

const canEditProject = (projectRole, appRole) =>
  isAdmin(appRole) || projectRole === "owner";

const canManageMembers = (projectRole, appRole) =>
  isAdmin(appRole) || projectRole === "owner";

const canManageTasks = (projectRole, appRole) =>
  isAdmin(appRole) || projectRole === "owner";

/** Owners and admins assign; members cannot (per permission rules). */
const canAssignTasks = (projectRole, appRole) =>
  isAdmin(appRole) || projectRole === "owner";

const canUpdateTaskStatus = (task, userId, projectRole, appRole) => {
  if (isAdmin(appRole) || projectRole === "owner") {
    return true;
  }
  if (projectRole === "member" && task.assignee) {
    return String(task.assignee) === String(userId);
  }
  return false;
};

const getTaskAssigneeId = (task) => {
  if (!task?.assignee) {
    return null;
  }
  const assignee = task.assignee;
  return String(assignee._id || assignee);
};

const isTaskAssignee = (task, userId) => {
  const assigneeId = getTaskAssigneeId(task);
  return assigneeId && assigneeId === String(userId);
};

/** Add/remove watchers for other users (not self unwatch). */
const canManageTaskWatchers = (task, userId, projectRole, appRole) => {
  if (isAdmin(appRole)) {
    return true;
  }
  if (projectRole === "owner") {
    return true;
  }
  if (projectRole && isTaskAssignee(task, userId)) {
    return true;
  }
  return false;
};

/** View watcher list on a task. */
const canViewTaskWatchers = (projectRole, appRole, membership) =>
  isAdmin(appRole) || Boolean(membership);

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  APP_ROLES,
  PROJECT_ROLES,
  isAdmin,
  canCreateProject,
  canEditProject,
  canManageMembers,
  canManageTasks,
  canAssignTasks,
  canUpdateTaskStatus,
  isTaskAssignee,
  canManageTaskWatchers,
  canViewTaskWatchers,
};
