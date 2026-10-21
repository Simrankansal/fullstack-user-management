/** Task CRUD, comments, attachments, watchers. */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const loadUser = require("../middleware/loadUserMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
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
} = require("../controllers/taskController");

const router = express.Router();
router.use(authMiddleware, loadUser);

router.post("/", createTask);
router.patch("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.patch("/:id/assign", assignTask);
router.post("/:id/comments", addComment);
router.get("/:id/activity", getTaskActivity);
router.post("/:id/attachments", upload.single("file"), uploadAttachment);
router.get("/:id/attachments", listAttachments);
router.post("/:id/watchers", addWatcher);
router.get("/:id/watchers", listWatchers);
router.delete("/:id/watchers/:userId", removeWatcher);

module.exports = router;
