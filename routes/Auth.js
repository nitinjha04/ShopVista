const express = require("express");
const {
  createUser,
  loginUser,
  checkAuth,
  resetPasswordRequest,
  resetPassword,
  logout
} = require("../controllers/Auth");
const passport = require("passport");

const router = express.Router();

router.post("/signup", createUser);
router.get("/check", passport.authenticate("jwt"), checkAuth);
router.post("/login", passport.authenticate("local"), loginUser);
router.post("/reset-password-request", resetPasswordRequest);
router.post("/reset-password", resetPassword);
router.get("/logout", logout);

module.exports = router;
