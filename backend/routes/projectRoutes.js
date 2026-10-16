const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listProjects,
  createProject,
  updateProject,
  getProjectTasks,
} = require("../controllers/projectController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listProjects);
router.post("/", createProject);
router.put("/:id", updateProject);
router.get("/:id/tasks", getProjectTasks);

module.exports = router;
