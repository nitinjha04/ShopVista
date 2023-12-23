const passport = require("passport");

const isAuth = (req, res, done) => {
  return passport.authenticate("jwt");
};

const sanitizeUser = (user) => {
  return { id: user.id, role: user.role };
};

const cookieExtractor = function (req, res, next) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"];
  }

  return token;
};

module.exports = { isAuth, sanitizeUser, cookieExtractor };