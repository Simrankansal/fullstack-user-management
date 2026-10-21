/** User notification inbox APIs (list, unread count, mark read). */
const Notification = require("../models/Notification");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { isAdmin } = require("../constants/taskConstants");

const notificationPopulate = [
  { path: "project", select: "name" },
  { path: "task", select: "title" },
  { path: "actor", select: "name email" },
  { path: "recipient", select: "name email" },
];

const listNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );
    const readFilter = req.query.read;

    const filter = { recipient: req.userId };

    if (readFilter === "true" || readFilter === "read") {
      filter.isRead = true;
    } else if (readFilter === "false" || readFilter === "unread") {
      filter.isRead = false;
    }

    const total = await Notification.countDocuments(filter);

    const notifications = await Notification.find(filter)
      .populate(notificationPopulate.filter((p) => p.path !== "recipient"))
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true, readAt: now }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
};

const adminDeliveryLog = async (req, res) => {
  try {
    if (!isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 25)
    );
    const typeFilter = req.query.type;

    const filter = {};
    if (typeFilter) {
      filter.type = typeFilter;
    }

    const total = await Notification.countDocuments(filter);

    const notifications = await Notification.find(filter)
      .populate(notificationPopulate)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin delivery log error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery log",
    });
  }
};

const adminInsights = async (req, res) => {
  try {
    if (!isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const projects = await Project.find()
      .populate("owner", "name email")
      .sort({ updatedAt: -1 })
      .limit(50);

    const projectSummaries = [];

    for (const project of projects) {
      const tasks = await Task.find({ project: project._id }).select(
        "status dueDate"
      );
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "completed").length;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const overdue = tasks.filter((t) => {
        if (!t.dueDate || t.status === "completed") {
          return false;
        }
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < now;
      }).length;

      projectSummaries.push({
        _id: project._id,
        name: project.name,
        archived: Boolean(project.archived),
        owner: project.owner,
        startDate: project.startDate,
        endDate: project.endDate,
        taskTotal: total,
        taskCompleted: completed,
        taskOverdue: overdue,
        completionPercent: total ? Math.round((completed / total) * 100) : 0,
        statusLabel: project.archived ? "Archived" : "Active",
      });
    }

    const now = new Date();
    const overdueTasks = await Task.find({
      status: { $ne: "completed" },
      dueDate: { $lt: now },
    })
      .populate("project", "name")
      .populate("assignee", "name email")
      .sort({ dueDate: 1 })
      .limit(100);

    const repeatedOverdue = overdueTasks
      .map((task) => {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor(
          (today - due) / (24 * 60 * 60 * 1000)
        );
        return {
          task: {
            _id: task._id,
            title: task.title,
            dueDate: task.dueDate,
            status: task.status,
            priority: task.priority,
          },
          project: task.project,
          assignee: task.assignee,
          daysOverdue,
        };
      })
      .filter((row) => row.daysOverdue >= 2);

    const adminAlerts = await Notification.find({
      type: "admin_repeated_overdue",
    })
      .populate(notificationPopulate)
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      projects: projectSummaries,
      repeatedOverdue,
      adminAlerts,
    });
  } catch (error) {
    console.error("Admin insights error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin insights",
    });
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  adminDeliveryLog,
  adminInsights,
};
