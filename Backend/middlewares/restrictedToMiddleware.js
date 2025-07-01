module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    //check if user is attached by protect middleware
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in.",
      });
    }

    //check if user's role is in allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }

    //if allowed, proceed
    next();
  };
};
