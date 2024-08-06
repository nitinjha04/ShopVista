require("dotenv").config();
const userModel = require("../models/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const ejs = require("ejs");
const fs = require("fs/promises");
const {
  sanitizeUser,
  sendMail,
  ResetSuccess,
  ResetReq,
} = require("../services/common");

const createUser = async (req, res) => {
  try {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        const user = new userModel({
          ...req.body,
          password: hashedPassword,
          salt,
        });
        const doc = await user.save();

        req.login(sanitizeUser(doc), () => {
          if (err) {
            res.status(400).json(err);
          } else {
            const token = jwt.sign(
              sanitizeUser(doc),
              process.env.JWT_SECRET_KEY
            );
            res
              .cookie("jwt", token, {
                expires: new Date(Date.now() + 3600000),
                httpOnly: true,
              })
              .status(200)
              .json({ id: doc.id, role: doc.role });
            // .json(token);
          }
        });
      }
    );
  } catch (error) {
    res.status(400).json(error);
  }
};
const loginUser = async (req, res) => {
  const user = req.user;
  res
    .cookie("jwt", user.token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    })
    .status(201)
    .json({ id: user.id, role: user.role });
};
const checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401);
  }
};
const resetPasswordRequest = async (req, res) => {
  const email = req.body.email;
  const user = await userModel.findOne({ email: email });
  if (user) {
    const token = crypto.randomBytes(48).toString("hex");
    user.resetPasswordToken = token;
    await user.save();

    // set token to url and email
    const resetPageLink =
      "https://shop-vista-mern.vercel.app/reset-password?token=" + token + "&email=" + email;
    const subject = "reset password for ShopVista";

    const html = ResetReq(resetPageLink);

    // email send and token in the mail body
    if (req.body.email) {
      const response = await sendMail({ to: req.body.email, subject, html });
      res.send(response);
    } else {
      res.status(400);
    }
  } else {
    res.status(400);
  }
};
const resetPassword = async (req, res) => {
  const { email, password, token } = req.body;
  const user = await userModel.findOne({
    email: email,
    resetPasswordToken: token,
  });
  if (user) {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        user.password = hashedPassword;
        user.salt = salt;
        await user.save();

        // set token to url and email
        const subject = "Password successfully changed for ShopVista";

        const html = ResetSuccess(email);
        // const html = `<p>Successfully able to Reset Password</p>`;

        // email send and token in the mail body
        if (email) {
          const response = await sendMail({
            to: email,
            subject,
            html,
          });
          res.send(response);
        } else {
          res.status(400);
        }
      }
    );
  } else {
    res.status(400);
  }
};
const logout = async (req, res) => {
  res
    .cookie("jwt", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .sendStatus(200);
};

module.exports = {
  createUser,
  loginUser,
  checkAuth,
  resetPasswordRequest,
  resetPassword,
  logout,
};
