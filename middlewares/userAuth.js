import User from "../models/userSchema.js";
import STATUS_CODE from "../helpers/statusCode.js";

const userAuth = async (req, res, next) => {
  
  try {
    if (!req.session.user) {
      return res.redirect("/user/login");
    }

    const user = await User.findById(req.session.user);
    if (user && !user.isBlocked) {
      return next();
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in userAuth Middleware", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Internal server error");
  }
};


export default userAuth;
