/** Loads full user (role, active) after JWT auth for permission checks. */
const User = require("../models/User");

const loadUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select(
      "role isActive name email"
    );

    if (!user || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account inactive or not found",
      });
    }

    req.user = user;
    req.appRole = user.role;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};

module.exports = loadUser;
