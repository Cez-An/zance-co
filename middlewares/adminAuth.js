import STATUS_CODE from "../helpers/statusCode.js";


const checkSession = async(req,res,next)=>{
  if(req.session.admin){
    next();
  }else{
    res.redirect('/admin/login')
  }
}

const islogin = async(req,res,next)=>{
  if(req.session.admin){
    res.redirect('/admin/dashboard')
  }else{
    next();
  }
}

export default {islogin,checkSession};
