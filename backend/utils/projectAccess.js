const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");

const getProjectMembership = async (projectId, userId) => {
  return ProjectMember.findOne({
    project: projectId,
    user: userId,
  });
};

const getTaskProjectMembership = async (taskId, userId) => {
  const task = await Task.findById(taskId).select("project");

  if (!task) {
    return { task: null, membership: null };
  }

  const membership = await getProjectMembership(task.project, userId);

  return { task, membership };
};

module.exports = {
  getProjectMembership,
  getTaskProjectMembership,
};
