import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userSchema.js";
import dotenv from "dotenv";
import { generateUserId } from "../helpers/customerId.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user && user.isBlocked) {
          return done(null, false, { message: "User is blocked by admin" });
        }

        if (!user) {
          const userId = await generateUserId();
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            userId,
            googleId: profile.id,
          });

          await user.save();
        }

        if (user.isBlocked) {
          return done(null, false, { message: "User is blocked by admin" });
        }

        req.session.user = user;
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
