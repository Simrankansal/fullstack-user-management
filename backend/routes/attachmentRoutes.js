/** Standalone attachment delete (spec: DELETE /api/attachments/:id). */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const loadUser = require("../middleware/loadUserMiddleware");
const { deleteAttachment } = require("../controllers/attachmentController");

const router = express.Router();
router.use(authMiddleware, loadUser);

router.delete("/:id", deleteAttachment);

module.exports = router;
