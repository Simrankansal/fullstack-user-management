const express = require("express");

const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// GET logged-in user's profile
router.get(
  "/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.userId
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get profile",
      });
    }
  }
);


// GET all users
router.get(
  "/",
  authMiddleware,
  getAllUsers
);

// CREATE user (logged-in users — e.g. from user list)
router.post(
  "/",
  authMiddleware,
  createUser
);


// GET one user
router.get(
  "/:id",
  authMiddleware,
  getUserById
);


// UPDATE user
router.put(
  "/:id",
  authMiddleware,
  updateUser
);


// DELETE user
router.delete(
  "/:id",
  authMiddleware,
  deleteUser
);


module.exports = router;