const jwt = require("jsonwebtoken");
const db = require("../models");
const unprotectedRoutes = require("../utils/unprotectedRoutes");

const protect = async (req, res, next) => {
  const url = req.url.split("?")[0];

  const isUnprotected = unprotectedRoutes.some((route) => {
    if (route === "/") return url === "/";
    return url === route || url.startsWith(route + "/");
  });

  if (isUnprotected) {
    return next();
  }

  if (!req.headers || !req.headers.authorization) {
    return res.status(401).json({
      success: false,
      error: { code: 401, message: "Authentication required." },
    });
  }

  try {
    const parts = req.headers.authorization.split(" ");
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: "Invalid token format" },
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.users.findById(decoded.id)
      .select("isDeleted status email fullName phone profileImage")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: "User not found" },
      });
    }

    if (user.isDeleted || user.status === "deactive") {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: "Account is no longer active." },
      });
    }

    const roleName = decoded.roleName || "";
    const isAdmin = /^(admin|super_admin)$/i.test(roleName);

    req.identity = {
      ...user,
      _id: user._id,
      id: user._id,
      userType: isAdmin ? "admin" : "user",
      isAdmin,
      role: { _id: decoded.role, name: roleName },
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: "Session expired. Please login again.",
        error: err.message,
      },
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.identity || !req.identity.isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: "Access denied. Admin only." },
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
