const express = require("express");
const { createUser, loginUser, checkAuth } = require("../controllers/Auth");
const passport = require("passport");

const router = express.Router();

router.get("/check", passport.authenticate("jwt"), checkAuth);
router.post("/signup", createUser);
router.post(
  "/login",
  passport.authenticate("local"),
  loginUser
);

module.exports = router;
