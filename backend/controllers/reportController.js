/** Dashboard and project report statistics. */
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const { getProjectMembership } = require("../utils/projectAccess");
const { isAdmin } = require("../constants/taskConstants");

/**
 * Per-member assigned task counts for one project.
 * Admin and project owner see all members; other members see only themselves.
 */
const getMemberTaskStatsForProject = async (
  projectId,
  projectName,
  viewerUserId,
  appRole
) => {
  const membership = await getProjectMembership(projectId, viewerUserId);

  if (!membership && !isAdmin(appRole)) {
    return null;
  }

  const canViewTeam = isAdmin(appRole) || membership?.role === "owner";

  const members = await ProjectMember.find({ project: projectId }).populate(
    "user",
    "name email"
  );

  const activeMembers = members.filter((m) => m.user?._id);

  const visibleMembers = canViewTeam
    ? activeMembers
    : activeMembers.filter(
        (m) => String(m.user._id) === String(viewerUserId)
      );

  const memberRows = await Promise.all(
    visibleMembers.map(async (member) => {
      const uid = member.user._id;
      const [assigned, completed] = await Promise.all([
        Task.countDocuments({ project: projectId, assignee: uid }),
        Task.countDocuments({
          project: projectId,
          assignee: uid,
          status: "completed",
        }),
      ]);
      const pending = Math.max(0, assigned - completed);

      return {
        userId: uid,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        assigned,
        completed,
        pending,
        completionPercent: assigned ? Math.round((completed / assigned) * 100) : 0,
      };
    })
  );

  return {
    projectId,
    projectName,
    canViewTeam,
    members: memberRows,
  };
};

const getDashboardStats = async (req, res) => {
  try {
    const appRole = req.appRole;
    const userId = req.userId;

    let projectFilter = {};

    if (!isAdmin(appRole)) {
      const memberships = await ProjectMember.find({ user: userId }).select(
        "project"
      );
      const projectIds = memberships.map((m) => m.project);

      if (projectIds.length === 0) {
        return res.status(200).json({
          success: true,
          stats: {
            projects: {
              total: 0,
              active: 0,
              archived: 0,
            },
            tasks: {
              todo: 0,
              in_progress: 0,
              in_review: 0,
              completed: 0,
              overdue: 0,
              dueWithinSevenDays: 0,
              assignedToMe: 0,
            },
            memberTaskProgress: { projects: [] },
          },
        });
      }

      projectFilter = { _id: { $in: projectIds } };
    }

    // Treat missing `archived` as active (legacy projects before archive flag).
    const activeProjectQuery = { ...projectFilter, archived: { $ne: true } };
    const archivedProjectQuery = { ...projectFilter, archived: true };

    const [activeProjects, archivedProjects] = await Promise.all([
      Project.countDocuments(activeProjectQuery),
      Project.countDocuments(archivedProjectQuery),
    ]);

    const totalProjects = activeProjects + archivedProjects;

    const activeProjectIds = (
      await Project.find(activeProjectQuery).select("_id")
    ).map((p) => p._id);

    const taskBaseFilter = activeProjectIds.length
      ? { project: { $in: activeProjectIds } }
      : { project: null };

    const now = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [
      todo,
      inProgress,
      inReview,
      completed,
      overdue,
      dueWithinSevenDays,
      assignedToMe,
    ] = await Promise.all([
      Task.countDocuments({ ...taskBaseFilter, status: "todo" }),
      Task.countDocuments({ ...taskBaseFilter, status: "in_progress" }),
      Task.countDocuments({ ...taskBaseFilter, status: "in_review" }),
      Task.countDocuments({ ...taskBaseFilter, status: "completed" }),
      Task.countDocuments({
        ...taskBaseFilter,
        status: { $ne: "completed" },
        dueDate: { $lt: now },
      }),
      Task.countDocuments({
        ...taskBaseFilter,
        status: { $ne: "completed" },
        dueDate: { $gte: now, $lte: inSevenDays },
      }),
      Task.countDocuments({
        ...taskBaseFilter,
        assignee: userId,
        status: { $ne: "completed" },
      }),
    ]);

    const activeProjectsList = await Project.find(activeProjectQuery).select(
      "name"
    );

    const memberProgressProjects = await Promise.all(
      activeProjectsList.map(async (project) => {
        try {
          return await getMemberTaskStatsForProject(
            project._id,
            project.name,
            userId,
            appRole
          );
        } catch (memberProgressError) {
          console.error(
            "Member progress error for project",
            project._id,
            memberProgressError
          );
          return null;
        }
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          archived: archivedProjects,
        },
        tasks: {
          todo,
          in_progress: inProgress,
          in_review: inReview,
          completed,
          overdue,
          dueWithinSevenDays,
          assignedToMe,
        },
        memberTaskProgress: {
          projects: memberProgressProjects.filter(Boolean),
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

const getProjectReport = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await getProjectMembership(id, req.userId);

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const project = await Project.findById(id).populate("owner", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const [totalTasks, completedTasks, statusBreakdown] = await Promise.all([
      Task.countDocuments({ project: id }),
      Task.countDocuments({ project: id, status: "completed" }),
      Task.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      project: id,
      status: { $ne: "completed" },
      dueDate: { $lt: now },
    });

    const memberProgress = await getMemberTaskStatsForProject(
      id,
      project.name,
      req.userId,
      req.appRole
    );

    const memberStats = (memberProgress?.members || []).map((row) => ({
      user: { _id: row.userId, name: row.name, email: row.email },
      role: row.role,
      assigned: row.assigned,
      completed: row.completed,
      pending: row.pending,
      completionPercent: row.completionPercent,
    }));

    const statusMap = Object.fromEntries(
      statusBreakdown.map((row) => [row._id, row.count])
    );

    res.status(200).json({
      success: true,
      report: {
        project,
        summary: {
          totalTasks,
          completedTasks,
          completionPercent: totalTasks
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0,
          overdueTasks,
          byStatus: {
            todo: statusMap.todo || 0,
            in_progress: statusMap.in_progress || 0,
            in_review: statusMap.in_review || 0,
            completed: statusMap.completed || 0,
          },
        },
        memberStats,
      },
    });
  } catch (error) {
    console.error("Project report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project report",
    });
  }
};

module.exports = {
  getDashboardStats,
  getProjectReport,
};
