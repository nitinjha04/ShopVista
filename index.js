require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const cors = require("cors");
const JwtStrategy = require("passport-jwt").Strategy;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");

// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SERVER_KEY);

app.use(express.static("public"));

// Add necessary routes and services
const productRouter = require("./routes/Products");
const categoriesRouter = require("./routes/Category");
const brandsRouter = require("./routes/Brand");
const userRouter = require("./routes/User");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const orderRouter = require("./routes/Order");
const userModel = require("./models/User");
const orderModel = require("./models/Order");
const {
  isAuth,
  sanitizeUser,
  cookieExtractor,
  invoiceTemplate,
} = require("./services/common");

// Stripe intent

const endpointSecret = process.env.ENDPOINT_SECRET;

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;

        const order = await orderModel.findById(
          paymentIntentSucceeded.metadata.orderId
        );
        order.paymentStatus = "received";
        await order.save();
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.error("MongoDB Connection Error:", error));

// Middleware setup
app.use(express.static(path.resolve(__dirname, "build")));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.json()); // To parse req.body as JSON

// CORS setup
app.use(cors({ exposedHeaders: ["X-Total-Count"] }));

// JWT Configuration
const opts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET_KEY,
};

// Passport session setup
app.use(passport.authenticate("session"));

// Passport Local Strategy for authentication
passport.use(
  "local",
  new LocalStrategy({ usernameField: "email" }, async function (
    email,
    password,
    done
  ) {
    try {
      const user = await userModel.findOne({ email: email }).exec();
      if (!user) {
        console.log("Authentication failed: No User Found");
        return done(null, false, { message: "No User Found" });
      }

      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async function (err, hashedPassword) {
          if (err) {
            console.error("Error during password hashing:", err);
            return done(err);
          }
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            console.log("Authentication failed: Wrong Password");
            return done(null, false, { message: "Wrong Password" });
          }
          const token = jwt.sign(
            sanitizeUser(user),
            process.env.JWT_SECRET_KEY
          );
          return done(null, { id: user.id, role: user.role, token });
        }
      );
    } catch (err) {
      console.error("Unexpected error during authentication:", err);
      return done(err);
    }
  })
);

// Passport JWT Strategy
passport.use(
  "jwt",
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await userModel.findById(jwt_payload.id);
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

// Route setup with authentication
app.use("/products", isAuth(), productRouter);
app.use("/categories", isAuth(), categoriesRouter);
app.use("/brands", isAuth(), brandsRouter);
app.use("/user", isAuth(), userRouter);
app.use("/auth", authRouter);
app.use("/cart", isAuth(), cartRouter);
app.use("/orders", isAuth(), orderRouter);

// for frontend build
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Passport serialization and deserialization
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// STRIPE JSON

app.post("/create-payment-intent", async (req, res) => {
  const { totalAmount, orderId } = req.body;

  // temp customer info
  const customer = await stripe.customers.create({
    name: "Jenny Rosen",
    address: {
      line1: "510 Townsend St",
      postal_code: "98140",
      city: "San Francisco",
      state: "CA",
      country: "US",
    },
  });
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    currency: "inr",
    description: "Software development services",
    customer: customer.id,
    metadata: {
      orderId,
    },
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});



// Start the server
app.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);
