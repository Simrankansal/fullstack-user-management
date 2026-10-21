/** User profile and admin user management routes. */
const express = require("express");
const {
  listActiveUsers,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const loadUser = require("../middleware/loadUserMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/profile", authMiddleware, loadUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get profile" });
  }
});

router.use(authMiddleware, loadUser);

router.get("/active", listActiveUsers);
router.get("/", getAllUsers);
router.post("/", requireAdmin, createUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
