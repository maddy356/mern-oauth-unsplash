import MongoStore from "connect-mongo";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import passport from "passport";
import "./config/passport.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS to allow client cookie session
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true if behind HTTPS in production
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((e) => console.error("Mongo error:", e));

// Routes
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// Current user
app.get("/api/me", (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: { id: req.user._id, name: req.user.name, provider: req.user.provider } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
