import User from '../models/userSchema.js'; 

const checkStatus = async (req, res, next) => {
  try {
    if (!req.session.user) {
      console.log("No session found. Redirecting to login.");
      return res.redirect('/user/login');
    }

    const user = await User.findById(req.session.user._id);

    if (!user) {
      console.log("User not found. Destroying session.");
      req.session.destroy(() => {
        return res.redirect('/user/login');
      });
      return;
    }

    if (user.isBlocked) {
      console.log("User is blocked. Destroying session.");
      req.session.destroy(() => {
        return res.redirect('/login?error=blocked');
      });
      return;
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email
    };

    next();
  } catch (error) {
    console.error("checkStatus error:", error);
    res.redirect('/login?error=server_error');
  }
};

export default { checkStatus };
