// Middleware to allow only specific roles (like 'freelancer' for gig creation)
module.exports = (allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied: insufficient role" });
      }
      next();
    };
  };
  