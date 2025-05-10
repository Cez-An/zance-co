
const checkStatus = (req, res, next) => {
  if (!req.session.user) {
      console.log("User is blocked.");
      return res.redirect('/user/login');
  } 
  console.log("User is not blocked.");
  next();
};


export default {checkStatus};