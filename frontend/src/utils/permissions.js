/** App-wide and project-scoped permission checks for the UI. */

export const getStoredUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAppAdmin = (user) => user?.role === "admin";

export const canCreateProject = (user) => isAppAdmin(user);

export const canManageProject = (user, myRole) =>
  isAppAdmin(user) || myRole === "owner";

export const canAssignTask = (user, myRole) =>
  isAppAdmin(user) || myRole === "owner";

export const isTaskAssignee = (task, user) => {
  if (!task?.assignee || !user?._id) {
    return false;
  }
  const assigneeId = task.assignee._id || task.assignee;
  return String(assigneeId) === String(user._id);
};

/** View watcher list and watch/unwatch yourself. */
export const canViewTaskWatchers = (user, myRole) =>
  isAppAdmin(user) || myRole === "owner" || myRole === "member";

/**
 * Add/remove watchers for other users.
 * Portal admin, project owner, or the user assigned to this task.
 */
export const canManageTaskWatchers = (user, myRole, task) => {
  if (isAppAdmin(user)) {
    return true;
  }
  if (myRole === "owner") {
    return true;
  }
  if (myRole && isTaskAssignee(task, user)) {
    return true;
  }
  return false;
};
