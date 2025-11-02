import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

dotenv.config();

passport.serializeUser((user, done) => {
  done(null, user.id); // Mongo _id
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (e) {
    done(e, null);
  }
});

// Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const providerId = profile.id;
        let user = await User.findOne({ provider: "google", providerId });
        if (!user) {
          user = await User.create({
            provider: "google",
            providerId,
            name: profile.displayName || "Google User"
          });
        }
        return done(null, user);
      } catch (e) {
        return done(e, null);
      }
    }
  )
);
