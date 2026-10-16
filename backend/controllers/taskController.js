const Task = require("../models/Task");
const TaskComment = require("../models/TaskComment");
const TaskActivityLog = require("../models/TaskActivityLog");
const ProjectMember = require("../models/ProjectMember");
const {
  getProjectMembership,
  getTaskProjectMembership,
} = require("../utils/projectAccess");
const { logTaskActivity } = require("../utils/activityLogger");
const {
  TASK_STATUSES,
  canAssignTasks,
} = require("../constants/taskConstants");

const createTask = async (req, res) => {
  try {
    const { projectId, title, description, priority, dueDate, assigneeId } =
      req.body;

    if (!projectId || !title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Project id and task title are required",
      });
    }

    const membership = await getProjectMembership(projectId, req.userId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    if (!canAssignTasks(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create tasks in this project",
      });
    }

    const allowedPriorities = ["low", "medium", "high"];
    const taskPriority = priority || "medium";

    if (!allowedPriorities.includes(taskPriority)) {
      return res.status(400).json({
        success: false,
        message: "Priority must be low, medium, or high",
      });
    }

    if (assigneeId) {
      const assigneeMember = await ProjectMember.findOne({
        project: projectId,
        user: assigneeId,
      });

      if (!assigneeMember) {
        return res.status(400).json({
          success: false,
          message: "Assignee must be a member of this project",
        });
      }
    }

    const task = await Task.create({
      project: projectId,
      title: String(title).trim(),
      description: String(description || "").trim(),
      priority: taskPriority,
      dueDate: dueDate || null,
      assignee: assigneeId || null,
      createdBy: req.userId,
      status: "todo",
    });

    await logTaskActivity({
      taskId: task._id,
      userId: req.userId,
      action: "task_created",
      newValue: task.title,
    });

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populated,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${TASK_STATUSES.join(", ")}`,
      });
    }

    const { task, membership } = await getTaskProjectMembership(
      id,
      req.userId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const oldStatus = task.status;

    if (oldStatus === status) {
      const populated = await Task.findById(task._id)
        .populate("assignee", "name email")
        .populate("createdBy", "name email");

      return res.status(200).json({
        success: true,
        message: "Task status unchanged",
        task: populated,
      });
    }

    task.status = status;
    await task.save();

    await logTaskActivity({
      taskId: task._id,
      userId: req.userId,
      action: "status_changed",
      oldValue: oldStatus,
      newValue: status,
    });

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Task status updated",
      task: populated,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
    });
  }
};

const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const { task, membership } = await getTaskProjectMembership(
      id,
      req.userId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    if (!canAssignTasks(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to assign tasks",
      });
    }

    if (assigneeId) {
      const assigneeMember = await ProjectMember.findOne({
        project: task.project,
        user: assigneeId,
      });

      if (!assigneeMember) {
        return res.status(400).json({
          success: false,
          message: "Assignee must be a member of this project",
        });
      }
    }

    const oldAssignee = task.assignee ? String(task.assignee) : "";
    task.assignee = assigneeId || null;
    await task.save();

    await logTaskActivity({
      taskId: task._id,
      userId: req.userId,
      action: "assignee_changed",
      oldValue: oldAssignee,
      newValue: assigneeId ? String(assigneeId) : "unassigned",
    });

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Task assignee updated",
      task: populated,
    });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign task",
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment body is required",
      });
    }

    const { task, membership } = await getTaskProjectMembership(
      id,
      req.userId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const comment = await TaskComment.create({
      task: id,
      user: req.userId,
      body: String(body).trim(),
    });

    await logTaskActivity({
      taskId: id,
      userId: req.userId,
      action: "comment_added",
      newValue: String(body).trim(),
    });

    const populated = await TaskComment.findById(comment._id).populate(
      "user",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "Comment added",
      comment: populated,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};

const getTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const { task, membership } = await getTaskProjectMembership(
      id,
      req.userId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const activity = await TaskActivityLog.find({ task: id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const comments = await TaskComment.find({ task: id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      activity,
      comments,
    });
  } catch (error) {
    console.error("Get task activity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity",
    });
  }
};

module.exports = {
  createTask,
  updateTaskStatus,
  assignTask,
  addComment,
  getTaskActivity,
};
