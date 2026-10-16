const TASK_STATUSES = ["todo", "in_progress", "in_review", "completed"];

const PROJECT_ROLES = ["owner", "member", "viewer"];

const canEditProject = (role) => role === "owner" || role === "member";

const canAssignTasks = (role) => role === "owner" || role === "member";

module.exports = {
  TASK_STATUSES,
  PROJECT_ROLES,
  canEditProject,
  canAssignTasks,
};
