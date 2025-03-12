import { render } from 'ejs'
import STATUS_CODE from '../../helpers/statusCode.js'
import Admin from '../../models/adminSchema.js'
import bcrypt from 'bcrypt'


const LoadAdminLogin = (req, res) => {
    try {
        if (req.session.admin) {
            return res.status(302).redirect('/admin/dashboard'); // Redirect if admin is already logged in
        }
        res.status(200).render('admin/login', { message: null }); // Render login page
    } catch (error) {
        console.error('Error loading admin login page:', error);
        res.status(500).redirect('/error'); // Internal Server Error
    }
};


const login = async(req,res)=>{
    try {

    const {email,password} = req.body;
    const admin = await Admin.findOne({email});

    if(admin){

        const passwordMatch = await bcrypt.compare(password,admin.password);

        if(passwordMatch){
            req.session.admin = true;
            return res.redirect('/admin/dashboard');    //route
        }
        else{
            console.log('password not correct')
           return res.render('admin/login',{message:'login Credentials not correct'})
        }
    }else{
        return res.redirect('/admin/login')             //route
    }

    } catch (error) {
        console.error('login error',error)
        return res.redirect('/partials/404.ejs')        //route
    }
}

const loadDashboard = (req,res)=>{
    try {
        if(req.session.admin){
            res.render('admin/dashboard.ejs');              //page render
        }
    } catch (error) {
        console.error('error occured',error);
        res.redirect('/error')                          //route
    }
}

const logout = (req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin/login');
    } catch (error) {
        console.error('error occured',error);
        res.res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).redirect('/error')
    }
}

export default {LoadAdminLogin, login, loadDashboard, logout};
