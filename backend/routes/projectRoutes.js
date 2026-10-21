/** Project CRUD, members, labels, archive, tasks list. */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const loadUser = require("../middleware/loadUserMiddleware");
const {
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
} = require("../controllers/projectController");

const router = express.Router();
router.use(authMiddleware, loadUser);

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:id/tasks", getProjectTasks);
router.get("/:id/labels", listProjectLabels);
router.post("/:id/labels", createProjectLabel);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.patch("/:id/archive", archiveProject);
router.patch("/:id/restore", restoreProject);
router.post("/:id/members", addProjectMember);
router.delete("/:id/members/:userId", removeProjectMember);

module.exports = router;
