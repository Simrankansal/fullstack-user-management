const Task = require("../models/Task");
const TaskComment = require("../models/TaskComment");
const TaskActivityLog = require("../models/TaskActivityLog");
const TaskAttachment = require("../models/TaskAttachment");
const TaskWatcher = require("../models/TaskWatcher");
const TaskLabel = require("../models/TaskLabel");
const ProjectMember = require("../models/ProjectMember");
const path = require("path");
const fs = require("fs");
const {
  getProjectMembership,
  getTaskProjectMembership,
} = require("../utils/projectAccess");
const { logTaskActivity } = require("../utils/activityLogger");
const {
  TASK_STATUSES,
  TASK_PRIORITIES,
  canAssignTasks,
  canManageTasks,
  canUpdateTaskStatus,
  canManageTaskWatchers,
  canViewTaskWatchers,
  isAdmin,
} = require("../constants/taskConstants");
const { createNotification } = require("../utils/notificationService");

const uploadDir = path.join(__dirname, "..", "uploads");

const actorLabel = (req) => req.user?.name || "Someone";

const LABEL_COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
];

const colorForLabelName = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
};

const resolveTaskLabels = async (projectId, { labelIds, labelNames }) => {
  const resolvedIds = new Set();

  if (Array.isArray(labelIds) && labelIds.length > 0) {
    const byId = await TaskLabel.find({
      _id: { $in: labelIds },
      project: projectId,
    }).select("_id");
    byId.forEach((label) => resolvedIds.add(String(label._id)));
  }

  if (Array.isArray(labelNames) && labelNames.length > 0) {
    const uniqueNames = [
      ...new Set(
        labelNames
          .map((name) => String(name).trim())
          .filter((name) => name.length > 0)
      ),
    ];

    for (const name of uniqueNames) {
      let label = await TaskLabel.findOne({ project: projectId, name });
      if (!label) {
        try {
          label = await TaskLabel.create({
            project: projectId,
            name,
            color: colorForLabelName(name),
          });
        } catch {
          label = await TaskLabel.findOne({ project: projectId, name });
        }
      }
      if (label) {
        resolvedIds.add(String(label._id));
      }
    }
  }

  return Array.from(resolvedIds);
};

const populateTask = (taskId) =>
  Task.findById(taskId)
    .populate("assignee", "name email")
    .populate("createdBy", "name email")
    .populate("labels");

const notifyWatchers = async ({
  task,
  message,
  type,
  actorId,
  excludeUserIds = [],
}) => {
  const watchers = await TaskWatcher.find({ task: task._id }).select("user");
  const excluded = new Set(excludeUserIds.map(String));

  for (const watcher of watchers) {
    const watcherId = String(watcher.user);
    if (excluded.has(watcherId)) {
      continue;
    }
    await createNotification({
      recipientId: watcher.user,
      message,
      type,
      projectId: task.project,
      taskId: task._id,
      actorId,
    });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      priority,
      dueDate,
      assigneeId,
      labelIds,
      labelNames,
    } = req.body;

    if (!projectId || !title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Project id and task title are required",
      });
    }

    const membership = await getProjectMembership(projectId, req.userId);

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    if (!canManageTasks(membership?.role, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create tasks in this project",
      });
    }

    const taskPriority = priority || "medium";

    if (!TASK_PRIORITIES.includes(taskPriority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`,
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

    const labelIdList = await resolveTaskLabels(projectId, {
      labelIds,
      labelNames,
    });

    const task = await Task.create({
      project: projectId,
      title: String(title).trim(),
      description: String(description || "").trim(),
      priority: taskPriority,
      dueDate: dueDate || null,
      assignee: assigneeId || null,
      createdBy: req.userId,
      status: "todo",
      labels: labelIdList,
    });

    await logTaskActivity({
      taskId: task._id,
      userId: req.userId,
      action: "task_created",
      newValue: task.title,
    });

    if (assigneeId) {
      const by = actorLabel(req);
      await createNotification({
        recipientId: assigneeId,
        message: `${by} assigned you to task "${task.title}"`,
        type: "task_assigned",
        projectId: task.project,
        taskId: task._id,
        actorId: req.userId,
      });
    }

    const populated = await populateTask(task._id);

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

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, labelIds, labelNames } =
      req.body;

    const { task, membership } = await getTaskProjectMembership(id, req.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    if (!canManageTasks(membership?.role, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this task",
      });
    }

    const oldDueDate = task.dueDate ? task.dueDate.toISOString() : "";

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty",
        });
      }
      task.title = String(title).trim();
    }

    if (description !== undefined) {
      task.description = String(description).trim();
    }

    if (priority !== undefined) {
      if (!TASK_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`,
        });
      }
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }

    if (labelIds !== undefined || labelNames !== undefined) {
      task.labels = await resolveTaskLabels(task.project, {
        labelIds: labelIds ?? [],
        labelNames: labelNames ?? [],
      });
    }

    await task.save();

    const newDueDate = task.dueDate ? task.dueDate.toISOString() : "";

    if (dueDate !== undefined && oldDueDate !== newDueDate) {
      await logTaskActivity({
        taskId: task._id,
        userId: req.userId,
        action: "due_date_changed",
        oldValue: oldDueDate,
        newValue: newDueDate,
      });

      if (task.assignee) {
        await createNotification({
          recipientId: task.assignee,
          message: `Due date updated on task "${task.title}"`,
          type: "task_due_changed",
          projectId: task.project,
          taskId: task._id,
          actorId: req.userId,
        });
      }

      await notifyWatchers({
        task,
        message: `Due date updated on task "${task.title}"`,
        type: "task_due_changed",
        actorId: req.userId,
        excludeUserIds: [req.userId, task.assignee],
      });
    }

    const populated = await populateTask(task._id);

    res.status(200).json({
      success: true,
      message: "Task updated",
      task: populated,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
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

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    if (!canUpdateTaskStatus(task, req.userId, membership?.role, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this task status",
      });
    }

    const oldStatus = task.status;

    if (oldStatus === status) {
      const populated = await populateTask(task._id);

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

    const actorName = req.user?.name || "Someone";

    if (task.assignee) {
      await createNotification({
        recipientId: task.assignee,
        message: `${actorName} changed status of "${task.title}" to ${status}`,
        type: "task_status_changed",
        projectId: task.project,
        taskId: task._id,
        actorId: req.userId,
      });
    }

    await notifyWatchers({
      task,
      message: `${actorName} changed status of "${task.title}" to ${status}`,
      type: "task_status_changed",
      actorId: req.userId,
      excludeUserIds: [req.userId, task.assignee],
    });

    const populated = await populateTask(task._id);

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

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    if (!canAssignTasks(membership?.role, req.appRole)) {
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
    const newAssignee = assigneeId ? String(assigneeId) : "";

    task.assignee = assigneeId || null;
    await task.save();

    await logTaskActivity({
      taskId: task._id,
      userId: req.userId,
      action: "assignee_changed",
      oldValue: oldAssignee,
      newValue: newAssignee || "unassigned",
    });

    if (assigneeId && newAssignee !== oldAssignee) {
      const by = actorLabel(req);
      await createNotification({
        recipientId: assigneeId,
        message: `${by} assigned you to task "${task.title}"`,
        type: "task_assigned",
        projectId: task.project,
        taskId: task._id,
        actorId: req.userId,
      });
    }

    const populated = await populateTask(task._id);

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

const resolveMentionedUsers = async (projectId, body) => {
  const mentionRegex = /@(\w+)/g;
  const handles = new Set();
  let match = mentionRegex.exec(body);

  while (match) {
    handles.add(match[1].toLowerCase());
    match = mentionRegex.exec(body);
  }

  if (handles.size === 0) {
    return [];
  }

  const members = await ProjectMember.find({ project: projectId }).populate(
    "user",
    "name email"
  );

  const mentioned = [];

  for (const member of members) {
    const name = member.user?.name || "";
    const email = member.user?.email || "";
    const slug = name.replace(/\s+/g, "").toLowerCase();
    const first = name.split(/\s+/)[0]?.toLowerCase();
    const emailLocal = email.split("@")[0]?.toLowerCase();

    for (const handle of handles) {
      if (
        handle === slug ||
        handle === first ||
        (emailLocal && handle === emailLocal)
      ) {
        mentioned.push(member.user);
        break;
      }
    }
  }

  return mentioned;
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

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const trimmedBody = String(body).trim();

    const comment = await TaskComment.create({
      task: id,
      user: req.userId,
      body: trimmedBody,
    });

    await logTaskActivity({
      taskId: id,
      userId: req.userId,
      action: "comment_added",
      newValue: trimmedBody,
    });

    const actorName = req.user?.name || "Someone";
    const mentionedUsers = await resolveMentionedUsers(task.project, trimmedBody);
    const mentionedIds = new Set(
      mentionedUsers.map((user) => String(user._id))
    );

    if (
      task.assignee &&
      String(task.assignee) !== String(req.userId) &&
      !mentionedIds.has(String(task.assignee))
    ) {
      await createNotification({
        recipientId: task.assignee,
        message: `${actorName} commented on "${task.title}"`,
        type: "task_comment",
        projectId: task.project,
        taskId: task._id,
        actorId: req.userId,
        dedupeKey: `comment-${comment._id}-${task.assignee}`,
      });
    }

    for (const user of mentionedUsers) {
      if (String(user._id) === String(req.userId)) {
        continue;
      }
      await createNotification({
        recipientId: user._id,
        message: `${actorName} mentioned you in a comment on "${task.title}"`,
        type: "mention",
        projectId: task.project,
        taskId: task._id,
        actorId: req.userId,
        dedupeKey: `mention-${comment._id}-${user._id}`,
      });
    }

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

    if (!membership && !isAdmin(req.appRole)) {
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

const uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const { task, membership } = await getTaskProjectMembership(id, req.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const attachment = await TaskAttachment.create({
      task: id,
      uploadedBy: req.userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    await logTaskActivity({
      taskId: id,
      userId: req.userId,
      action: "attachment_added",
      newValue: req.file.originalname,
    });

    const populated = await TaskAttachment.findById(attachment._id).populate(
      "uploadedBy",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "Attachment uploaded",
      attachment: populated,
    });
  } catch (error) {
    console.error("Upload attachment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload attachment",
    });
  }
};

const listAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    const { task, membership } = await getTaskProjectMembership(id, req.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const attachments = await TaskAttachment.find({ task: id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      attachments,
    });
  } catch (error) {
    console.error("List attachments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attachments",
    });
  }
};

const addWatcher = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUserId = req.body.userId || req.userId;

    const { task, membership } = await getTaskProjectMembership(id, req.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canViewTaskWatchers(membership?.role, req.appRole, membership)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view or manage watchers on this task",
      });
    }

    const isSelf = String(targetUserId) === String(req.userId);

    if (
      !isSelf &&
      !canManageTaskWatchers(
        task,
        req.userId,
        membership?.role,
        req.appRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add watchers for other users",
      });
    }

    const member = await ProjectMember.findOne({
      project: task.project,
      user: targetUserId,
    });

    if (!member) {
      return res.status(400).json({
        success: false,
        message: "Watcher must be a project member",
      });
    }

    const watcher = await TaskWatcher.findOneAndUpdate(
      { task: id, user: targetUserId },
      { task: id, user: targetUserId },
      { upsert: true, new: true }
    ).populate("user", "name email");

    res.status(201).json({
      success: true,
      message: "Watcher added",
      watcher,
    });
  } catch (error) {
    console.error("Add watcher error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add watcher",
    });
  }
};

const listWatchers = async (req, res) => {
  try {
    const { id } = req.params;

    const { task, membership } = await getTaskProjectMembership(id, req.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canViewTaskWatchers(membership?.role, req.appRole, membership)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view watchers on this task",
      });
    }

    const watchers = await TaskWatcher.find({ task: id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      watchers,
    });
  } catch (error) {
    console.error("List watchers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch watchers",
    });
  }
};

const removeWatcher = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const { task, membership } = await getTaskProjectMembership(id, req.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canViewTaskWatchers(membership?.role, req.appRole, membership)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage watchers on this task",
      });
    }

    const isSelf = String(userId) === String(req.userId);

    if (
      !isSelf &&
      !canManageTaskWatchers(
        task,
        req.userId,
        membership?.role,
        req.appRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to remove other users as watchers",
      });
    }

    const removed = await TaskWatcher.findOneAndDelete({
      task: id,
      user: userId,
    });

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Watcher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Watcher removed",
    });
  } catch (error) {
    console.error("Remove watcher error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove watcher",
    });
  }
};

module.exports = {
  createTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  addComment,
  getTaskActivity,
  uploadAttachment,
  listAttachments,
  addWatcher,
  listWatchers,
  removeWatcher,
};
