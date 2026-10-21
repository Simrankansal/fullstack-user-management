/** Dashboard and project report routes. */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const loadUser = require("../middleware/loadUserMiddleware");
const {
  getDashboardStats,
  getProjectReport,
} = require("../controllers/reportController");

const router = express.Router();
router.use(authMiddleware, loadUser);

router.get("/dashboard", getDashboardStats);
router.get("/projects/:id", getProjectReport);

module.exports = router;
