// // const passport = require("passport");

// // exports.isAuth = (req, res, done) => {
// //   return passport.authenticate("jwt");
// // };

// // exports.sanitizeUser = (user) => {
// //   return { id: user.id, role: user.role };
// // };

// // exports.cookieExtractor = function (req, res, next) {
// //   let token = null;
// //   if (req && req.cookies) {
// //     token = req.cookies["jwt"];
// //   }
// //   return token;
// // };

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
  // token =
  // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ODFlNTBlNmM1ZGNhMjI1NWViODNiYSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzAzMDExNTk4fQ.AyzGq_Nn0fXDgNoIuSGqU0hEHWQTrA3w7N5MzulUNjM"

  return token;
};

module.exports = { isAuth, sanitizeUser, cookieExtractor };

// const passport = require("passport");

// exports.isAuth = (req, res, done) => {
//   return passport.authenticate("jwt");
// };

// exports.sanitizeUser = (user) => {
//   return { id: user.id, role: user.role };
// };

// exports.cookieExtractor = function (req, res, next) {
//   let token = null;
//   if (req && req.cookies) {
//     token = req.cookies["jwt"];
//   }
  
//   token =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ODFlNTBlNmM1ZGNhMjI1NWViODNiYSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzAzMDExNTk4fQ.AyzGq_Nn0fXDgNoIuSGqU0hEHWQTrA3w7N5MzulUNjM"
//   return token;
// };
