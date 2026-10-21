/** Blocks non-admin portal users from admin-only routes. */
const { isAdmin } = require("../constants/taskConstants");

const requireAdmin = (req, res, next) => {
  if (!isAdmin(req.appRole)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

module.exports = requireAdmin;
