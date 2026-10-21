/** Admin user management and active user list for project membership. */
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { isValidEmail, isValidName } = require("../utils/validators");
const { isAdmin, APP_ROLES } = require("../constants/taskConstants");

const listActiveUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: { $ne: false } })
      .select("name email role")
      .sort({ name: 1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!isValidName(name)) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email (e.g. name@gmail.com)",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};


const getAllUsers = async (req, res) => {
  try {
    if (!isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

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
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};


const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const targetId = req.params.id;
    const admin = isAdmin(req.appRole);
    const editingSelf = String(targetId) === String(req.userId);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    if (!isValidName(name)) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email (e.g. name@gmail.com)",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: req.params.id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already belongs to another user",
      });
    }

    const updates = { name: name.trim(), email: cleanEmail };

    if (admin) {
      if (role !== undefined) {
        if (!APP_ROLES.includes(role)) {
          return res.status(400).json({
            success: false,
            message: "Invalid role",
          });
        }
        if (editingSelf && role !== "admin") {
          return res.status(400).json({
            success: false,
            message: "Cannot remove your own admin role",
          });
        }
        updates.role = role;
      }
      if (isActive !== undefined) {
        if (editingSelf && isActive === false) {
          return res.status(400).json({
            success: false,
            message: "Cannot deactivate yourself",
          });
        }
        updates.isActive = Boolean(isActive);
      }
    }

    const user = await User.findByIdAndUpdate(targetId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    if (!isAdmin(req.appRole)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (String(req.params.id) === String(req.userId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};


module.exports = {
  listActiveUsers,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};