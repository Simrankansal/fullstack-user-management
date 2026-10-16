const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createTask,
  updateTaskStatus,
  assignTask,
  addComment,
  getTaskActivity,
} = require("../controllers/taskController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTask);
router.patch("/:id/status", updateTaskStatus);
router.patch("/:id/assign", assignTask);
router.post("/:id/comments", addComment);
router.get("/:id/activity", getTaskActivity);

module.exports = router;
