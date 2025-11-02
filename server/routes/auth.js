import { Router } from "express";
import passport from "passport";

const router = Router();

// Google
router.get("/google", passport.authenticate("google", { scope: ["profile"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: process.env.CLIENT_URL }),
  (req, res) => res.redirect(process.env.CLIENT_URL)
);


// Logout
router.post("/logout", (req, res) => {
  req.logout?.(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

export default router;
