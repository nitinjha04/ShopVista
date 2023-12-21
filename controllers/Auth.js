require("dotenv").config();
const userModel = require("../models/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { sanitizeUser } = require("../services/common");

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
            const token = jwt.sign(sanitizeUser(doc), process.env.JWT_SECRET_KEY);
            res.cookie("jwt", token, {
              expires: new Date(Date.now() + 3600000),
              httpOnly: true,
            })
            .status(200)
            .json({id: doc.id, role: doc.role});
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
  const user = req.user
  res
    .cookie("jwt",user.token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    })
    .status(201)
    .json({id:user.id,role:user.role});
};
const checkAuth = async (req, res) => {
  if(req.user){
    res.json(req.user)
  }
  else{
    res.status(401)
  }
};

module.exports = { createUser, loginUser, checkAuth };
