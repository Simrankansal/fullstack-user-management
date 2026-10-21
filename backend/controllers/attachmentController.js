/** Delete task attachments (metadata + file on disk). */
const path = require("path");
const fs = require("fs");
const TaskAttachment = require("../models/TaskAttachment");
const { getTaskProjectMembership } = require("../utils/projectAccess");
const { canManageTasks, isAdmin } = require("../constants/taskConstants");

const uploadDir = path.join(__dirname, "..", "uploads");

const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await TaskAttachment.findById(id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }

    const { task, membership } = await getTaskProjectMembership(
      attachment.task,
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

    const isUploader = String(attachment.uploadedBy) === String(req.userId);
    const canDelete =
      isAdmin(req.appRole) ||
      (membership && canManageTasks(membership.role, req.appRole)) ||
      isUploader;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this attachment",
      });
    }

    const filePath = path.join(uploadDir, attachment.fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await attachment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attachment deleted",
    });
  } catch (error) {
    console.error("Delete attachment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attachment",
    });
  }
};

module.exports = {
  deleteAttachment,
};
