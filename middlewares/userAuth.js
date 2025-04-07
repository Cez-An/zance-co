import User from "../models/userSchema.js";
import STATUS_CODE from "../helpers/statusCode.js";


const checkSession = (req, res, next) => {
  if (!req.session.user) {
      console.log("User is not found Redirecting to login...");
      return res.render('user/login');
  } 
  console.log("User is not blocked. Proceeding...");
  next();
};

export default {checkSession};