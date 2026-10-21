/** Project CRUD, members, labels, archive/restore. */
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const TaskLabel = require("../models/TaskLabel");
const User = require("../models/User");
const { getProjectMembership } = require("../utils/projectAccess");
const {
  canEditProject,
  canManageMembers,
  canCreateProject,
  isAdmin,
  PROJECT_ROLES,
} = require("../constants/taskConstants");
const { createNotification } = require("../utils/notificationService");

const applyProjectListFilters = async (filter, query) => {
  const ownerName = (query.ownerName || "").trim();
  const startFrom = query.startFrom;
  const startTo = query.startTo;
  const endFrom = query.endFrom;
  const endTo = query.endTo;

  if (ownerName) {
    const owners = await User.find({
      name: { $regex: ownerName, $options: "i" },
    }).select("_id");
    const ownerIds = owners.map((user) => user._id);
    filter.owner = ownerIds.length ? { $in: ownerIds } : null;
    if (!ownerIds.length) {
      filter._id = { $in: [] };
    }
  }

  if (startFrom || startTo) {
    filter.startDate = {};
    if (startFrom) {
      filter.startDate.$gte = new Date(startFrom);
    }
    if (startTo) {
      filter.startDate.$lte = new Date(startTo);
    }
  }

  if (endFrom || endTo) {
    filter.endDate = {};
    if (endFrom) {
      filter.endDate.$gte = new Date(endFrom);
    }
    if (endTo) {
      filter.endDate.$lte = new Date(endTo);
    }
  }
};

const transferProjectOwner = async ({
  project,
  newOwnerId,
  actorId,
  actorName,
}) => {
  const projectId = project._id;
  const oldOwnerId = String(project.owner);
  const nextOwnerId = String(newOwnerId);

  if (oldOwnerId === nextOwnerId) {
    return;
  }

  const ownerExists = await User.exists({
    _id: newOwnerId,
    isActive: { $ne: false },
  });

  if (!ownerExists) {
    throw new Error("OWNER_NOT_FOUND");
  }

  project.owner = newOwnerId;
  await project.save();

  await ProjectMember.findOneAndUpdate(
    { project: projectId, user: oldOwnerId },
    { role: "member" }
  );

  await ProjectMember.findOneAndUpdate(
    { project: projectId, user: newOwnerId },
    { project: projectId, user: newOwnerId, role: "owner" },
    { upsert: true, new: true }
  );

  await createNotification({
    recipientId: newOwnerId,
    message: `${actorName} assigned you as owner of project "${project.name}"`,
    type: "project_owner_assigned",
    projectId,
    actorId,
  });
};

const attachMyRole = async (projects, userId) => {
  const ids = projects.map((p) => p._id);
  const memberships = await ProjectMember.find({
    project: { $in: ids },
    user: userId,
  }).select("project role");

  const roleMap = new Map(
    memberships.map((item) => [String(item.project), item.role])
  );

  return projects.map((project) => ({
    ...project.toObject(),
    myRole: roleMap.get(String(project._id)) || null,
  }));
};

const listProjects = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const search = (req.query.search || "").trim();
    const sortBy = req.query.sort || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const roleFilter = req.query.role;
    const showArchived = req.query.archived === "true";
    const appRole = req.appRole;

    const filter = showArchived
      ? { archived: true }
      : { archived: { $ne: true } };

    let roleMap = new Map();

    if (isAdmin(appRole)) {
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      await applyProjectListFilters(filter, req.query);
    } else {
      const memberships = await ProjectMember.find({
        user: req.userId,
        ...(roleFilter && PROJECT_ROLES.includes(roleFilter)
          ? { role: roleFilter }
          : {}),
      }).select("project role");

      const projectIds = memberships.map((item) => item.project);

      if (projectIds.length === 0) {
        return res.status(200).json({
          success: true,
          projects: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      filter._id = { $in: projectIds };
      roleMap = new Map(
        memberships.map((item) => [String(item.project), item.role])
      );

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      await applyProjectListFilters(filter, req.query);
    }

    const allowedSort = ["name", "createdAt", "startDate", "endDate"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";

    const total = await Project.countDocuments(filter);

    const projects = await Project.find(filter)
      .populate("owner", "name email")
      .sort({ [sortField]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    let projectsWithRole;

    if (isAdmin(appRole)) {
      projectsWithRole = await attachMyRole(projects, req.userId);
    } else {
      projectsWithRole = projects.map((project) => ({
        ...project.toObject(),
        myRole: roleMap.get(String(project._id)),
      }));
    }

    res.status(200).json({
      success: true,
      projects: projectsWithRole,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

const createProject = async (req, res) => {
  try {
    if (!canCreateProject(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can create projects",
      });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      memberIds,
      ownerId,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Project owner is required",
      });
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({
        success: false,
        message: "Project description is required",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const ownerExists = await User.exists({ _id: ownerId, isActive: { $ne: false } });

    if (!ownerExists) {
      return res.status(400).json({
        success: false,
        message: "Owner user not found",
      });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    const createdProject = await Project.create({
      name: String(name).trim(),
      description: String(description || "").trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      owner: ownerId,
    });

    await ProjectMember.create({
      project: createdProject._id,
      user: ownerId,
      role: "owner",
    });

    const uniqueMemberIds = Array.isArray(memberIds)
      ? [...new Set(memberIds.map(String))]
      : [];

    const actor = req.user?.name || "An admin";

    await createNotification({
      recipientId: ownerId,
      message: `${actor} assigned you as owner of project "${createdProject.name}"`,
      type: "project_owner_assigned",
      projectId: createdProject._id,
      actorId: req.userId,
    });

    for (const memberId of uniqueMemberIds) {
      if (memberId === String(ownerId)) {
        continue;
      }

      const userExists = await User.exists({ _id: memberId });

      if (!userExists) {
        await Project.findByIdAndDelete(createdProject._id);
        await ProjectMember.deleteMany({ project: createdProject._id });
        return res.status(400).json({
          success: false,
          message: `User ${memberId} not found`,
        });
      }

      await ProjectMember.create({
        project: createdProject._id,
        user: memberId,
        role: "member",
      });

      await createNotification({
        recipientId: memberId,
        message: `${actor} added you to project "${createdProject.name}"`,
        type: "project_member_added",
        projectId: createdProject._id,
        actorId: req.userId,
      });
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: createdProject,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, memberIds, ownerId } =
      req.body;

    const membership = await getProjectMembership(id, req.userId);

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const projectRole = membership?.role || null;

    if (!canEditProject(projectRole, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this project",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Project name cannot be empty",
        });
      }
      updates.name = String(name).trim();
    }

    if (description !== undefined) {
      if (!String(description).trim()) {
        return res.status(400).json({
          success: false,
          message: "Project description is required",
        });
      }
      updates.description = String(description).trim();
    }

    if (startDate !== undefined) {
      if (!startDate) {
        return res.status(400).json({
          success: false,
          message: "Start date is required",
        });
      }
      updates.startDate = startDate;
    }

    if (endDate !== undefined) {
      if (!endDate) {
        return res.status(400).json({
          success: false,
          message: "End date is required",
        });
      }
      updates.endDate = endDate;
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const nextStart = updates.startDate ?? project.startDate;
    const nextEnd = updates.endDate ?? project.endDate;

    if (nextStart && nextEnd && new Date(nextStart) > new Date(nextEnd)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    Object.assign(project, updates);

    if (ownerId !== undefined && String(ownerId) !== String(project.owner)) {
      if (!isAdmin(req.appRole)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can change the project owner",
        });
      }

      try {
        await transferProjectOwner({
          project,
          newOwnerId: ownerId,
          actorId: req.userId,
          actorName: req.user?.name || "An admin",
        });
      } catch (transferError) {
        if (transferError.message === "OWNER_NOT_FOUND") {
          return res.status(400).json({
            success: false,
            message: "New owner user not found",
          });
        }
        throw transferError;
      }
    } else {
      await project.save();
    }

    if (Array.isArray(memberIds)) {
      if (!canManageMembers(projectRole, req.appRole)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to manage project members",
        });
      }

      const uniqueMemberIds = [...new Set(memberIds.map(String))];
      const ownerId = String(project.owner);

      const existingMembers = await ProjectMember.find({
        project: id,
        role: { $ne: "owner" },
      }).select("user");

      const existingIds = new Set(existingMembers.map((m) => String(m.user)));

      await ProjectMember.deleteMany({
        project: id,
        role: { $ne: "owner" },
      });

      for (const memberId of uniqueMemberIds) {
        if (memberId === ownerId) {
          continue;
        }

        const userExists = await User.exists({ _id: memberId });

        if (!userExists) {
          return res.status(400).json({
            success: false,
            message: `User ${memberId} not found`,
          });
        }

        await ProjectMember.findOneAndUpdate(
          { project: id, user: memberId },
          { project: id, user: memberId, role: "member" },
          { upsert: true, new: true }
        );

        if (!existingIds.has(memberId)) {
          const actor = req.user?.name || "Someone";
          await createNotification({
            recipientId: memberId,
            message: `${actor} added you to project "${project.name}"`,
            type: "project_member_added",
            projectId: project._id,
            actorId: req.userId,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

const getProjectById = async (req, res) => {
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

    const members = await ProjectMember.find({ project: id })
      .populate("user", "name email")
      .sort({ role: 1 });

    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ project: id }),
      Task.countDocuments({ project: id, status: "completed" }),
    ]);

    res.status(200).json({
      success: true,
      project,
      members,
      myRole: membership?.role || null,
      completionPercent: totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await getProjectMembership(id, req.userId);

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasks = await Task.find({ project: id })
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .populate("labels")
      .sort({ createdAt: -1 });

    const members = await ProjectMember.find({ project: id })
      .populate("user", "name email")
      .sort({ role: 1 });

    res.status(200).json({
      success: true,
      tasks,
      members,
      myRole: membership?.role || null,
    });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
};

const archiveProject = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await getProjectMembership(id, req.userId);
    const projectRole = membership?.role || null;

    if (!canEditProject(projectRole, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to archive this project",
      });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { archived: true, archivedAt: new Date() },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project archived",
      project,
    });
  } catch (error) {
    console.error("Archive project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to archive project",
    });
  }
};

const restoreProject = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await getProjectMembership(id, req.userId);
    const projectRole = membership?.role || null;

    if (!canEditProject(projectRole, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to restore this project",
      });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { archived: false, archivedAt: null },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project restored",
      project,
    });
  } catch (error) {
    console.error("Restore project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore project",
    });
  }
};

const addProjectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = "member" } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is required",
      });
    }

    const membership = await getProjectMembership(id, req.userId);
    const projectRole = membership?.role || null;

    if (!canManageMembers(projectRole, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage project members",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const memberRole = role === "owner" ? "member" : role;

    const member = await ProjectMember.findOneAndUpdate(
      { project: id, user: userId },
      { project: id, user: userId, role: memberRole },
      { upsert: true, new: true }
    ).populate("user", "name email");

    const actor = req.user?.name || "Someone";
    await createNotification({
      recipientId: userId,
      message: `${actor} added you to project "${project.name}"`,
      type: "project_member_added",
      projectId: project._id,
      actorId: req.userId,
    });

    res.status(201).json({
      success: true,
      message: "Member added",
      member,
    });
  } catch (error) {
    console.error("Add project member error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add project member",
    });
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const membership = await getProjectMembership(id, req.userId);
    const projectRole = membership?.role || null;

    if (!canManageMembers(projectRole, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage project members",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (String(project.owner) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the project owner",
      });
    }

    const removed = await ProjectMember.findOneAndDelete({
      project: id,
      user: userId,
    });

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Member not found on this project",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member removed",
    });
  } catch (error) {
    console.error("Remove project member error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove project member",
    });
  }
};

const listProjectLabels = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await getProjectMembership(id, req.userId);

    if (!membership && !isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const labels = await TaskLabel.find({ project: id }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      labels,
    });
  } catch (error) {
    console.error("List project labels error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch labels",
    });
  }
};

const createProjectLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Label name is required",
      });
    }

    const membership = await getProjectMembership(id, req.userId);
    const projectRole = membership?.role || null;

    if (!canManageMembers(projectRole, req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage project labels",
      });
    }

    const label = await TaskLabel.create({
      project: id,
      name: String(name).trim(),
      color: color || "#6c757d",
    });

    res.status(201).json({
      success: true,
      message: "Label created",
      label,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A label with this name already exists",
      });
    }
    console.error("Create project label error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create label",
    });
  }
};

module.exports = {
  listProjects,
  createProject,
  updateProject,
  getProjectById,
  getProjectTasks,
  archiveProject,
  restoreProject,
  addProjectMember,
  removeProjectMember,
  listProjectLabels,
  createProjectLabel,
};
