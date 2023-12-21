const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");

const cors = require("cors");
app.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);

mongoose
  .connect(
    "mongodb+srv://nitinjha890:jhanitin890@cluster0.oaqwxx4.mongodb.net/Shopsy?retryWrites=true&w=majority"
  )
  .then((res) => console.log("mongo Connected"))
  .catch((error) => console.log(error));

const productRouter = require("./routes/Products");
const categoriesRouter = require("./routes/Category");
const brandsRouter = require("./routes/Brand");
const userRouter = require("./routes/User");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const orderRouter = require("./routes/Order");
const userModel = require("./models/User");
const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");

// JWT
const SECRET_KEY = "SECRET_KEY";

const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = SECRET_KEY;

// Passport session

app.use(express.static("build"));
app.use(cookieParser());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

// passport strategy

app.use(passport.authenticate("session"));

app.use(express.json()); //! To parse req.body as JSON

passport.use(
  "local",
  new LocalStrategy({ usernameField: "email" }, async function (
    email,
    password,
    done
  ) {
    try {
      const user = await userModel.findOne({ email: email }).exec();
      // console.log(email, password, user);
      if (!user) {
        done(null, false, { message: "No User Found" });
      }

      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async function (err, hashedPassword) {
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            done(null, false, { message: "Wrong Password" });
          }
          const token = jwt.sign(sanitizeUser(user), SECRET_KEY);
          done(null, { token });
        }
      );
    } catch (err) {
      done(err);
    }
  })
);

passport.use(
  "jwt",
  new JwtStrategy(opts, async function (jwt_payload, done) {
    // console.log({ jwt_payload: jwt_payload });

    try {
      const user = await userModel.findOne({ id: jwt_payload.sub });
      if (user) {
        return done(null, sanitizeUser(user));
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

app.use("/products", isAuth(), productRouter);
app.use("/categories", isAuth(), categoriesRouter);
app.use("/brands", isAuth(), brandsRouter);
app.use("/user", isAuth(), userRouter);
app.use("/auth", authRouter);
app.use("/cart", isAuth(), cartRouter);
app.use("/orders", isAuth(), orderRouter);

passport.serializeUser(function (user, cb) {
  // console.log("serializeUser", user);
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

passport.deserializeUser(function (user, cb) {
  // console.log("de-serializing", user);
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.listen(8080, () => console.log("server started"));