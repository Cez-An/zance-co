import passport from "passport";
import express from "express";
const router = express.Router();


router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));


router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error("Google Auth Error:", err);
      return res.redirect('/login?error=server_error');
    }

    if (!user) {
      if (info && info.message === "User is blocked by admin") {
        return res.redirect('/login?error=blocked');
      }
      return res.redirect('/login?error=google_auth_failed');
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.redirect('/user');
  })(req, res, next);
});

export default router;
