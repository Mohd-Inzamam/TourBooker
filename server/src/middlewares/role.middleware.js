exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user should be populated by the protect middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `User role '${req.user?.role || 'Guest'}' is not authorized to access this route`
      });
    }
    next();
  };
};
