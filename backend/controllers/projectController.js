const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const User = require("../models/User");
const { getProjectMembership } = require("../utils/projectAccess");
const {
  canEditProject,
  PROJECT_ROLES,
} = require("../constants/taskConstants");

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

    const filter = {
      _id: { $in: projectIds },
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSort = ["name", "createdAt", "startDate", "endDate"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";

    const total = await Project.countDocuments(filter);

    const projects = await Project.find(filter)
      .populate("owner", "name email")
      .sort({ [sortField]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    const roleMap = new Map(
      memberships.map((item) => [String(item.project), item.role])
    );

    const projectsWithRole = projects.map((project) => ({
      ...project.toObject(),
      myRole: roleMap.get(String(project._id)),
    }));

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
    const { name, description, startDate, endDate, memberIds } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
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
      owner: req.userId,
    });

    await ProjectMember.create({
      project: createdProject._id,
      user: req.userId,
      role: "owner",
    });

    const uniqueMemberIds = Array.isArray(memberIds)
      ? [...new Set(memberIds.map(String))]
      : [];

    for (const memberId of uniqueMemberIds) {
      if (memberId === String(req.userId)) {
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
    const { name, description, startDate, endDate, memberIds } = req.body;

    const membership = await getProjectMembership(id, req.userId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    if (!canEditProject(membership.role)) {
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
      updates.description = String(description).trim();
    }

    if (startDate !== undefined) {
      updates.startDate = startDate || null;
    }

    if (endDate !== undefined) {
      updates.endDate = endDate || null;
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
    await project.save();

    if (Array.isArray(memberIds)) {
      const uniqueMemberIds = [...new Set(memberIds.map(String))];
      const ownerId = String(project.owner);

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

const getProjectTasks = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await getProjectMembership(id, req.userId);

    if (!membership) {
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
      .sort({ createdAt: -1 });

    const members = await ProjectMember.find({ project: id })
      .populate("user", "name email")
      .sort({ role: 1 });

    res.status(200).json({
      success: true,
      tasks,
      members,
    });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
};

module.exports = {
  listProjects,
  createProject,
  updateProject,
  getProjectTasks,
};
