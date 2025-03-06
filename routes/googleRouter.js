// import express from 'express'
// import passport from 'passport';

// const router = express.Router();

//google authentification paths

// router.get('/google',passport.authenticate('google',{scope:['profile','email']}));

// router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/user/signup'}),(req,res)=>{
//     res.render('/')
// })

// router.get('/google/callback',(req,res)=>{
//     const {user} = req.body
//     res.json(user)
// })


// export default router;

import passport from "passport";
import express from "express";
const router = express.Router();


router.get('/google', passport.authenticate('google',{scope:['profile', 'email']}));
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=>{
    req.session.user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
    };
    res.redirect("/")
})

export default router;