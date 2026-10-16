const TaskActivityLog = require("../models/TaskActivityLog");

const logTaskActivity = async ({
  taskId,
  userId,
  action,
  oldValue = "",
  newValue = "",
}) => {
  await TaskActivityLog.create({
    task: taskId,
    user: userId,
    action,
    oldValue: String(oldValue),
    newValue: String(newValue),
  });
};

module.exports = {
  logTaskActivity,
};
