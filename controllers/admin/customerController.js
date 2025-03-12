import { renderFile } from 'ejs';
import User from '../../models/userSchema.js'

const customerInfo = async(req,res)=>{
    try {
        let search = '';

        if(req.query.search){
            console.log(search);
            
            search = req.query.search;
        }

        let page = 1;

        if(req.query.page){
            page = req.query.page;
        }
        const limit = 10;
        const userData = await User.find({
            $or:[
                {name:{$regex:'.*'+search+".*",$options:'i'}},
                {email:{$regex:'.*'+search+".*",$options:'i'}},
            ],
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();

        const count = await User.find({
            $or:[
                {name:{$regex:'.*'+search+".*",$options:'i'}},
                {email:{$regex:'.*'+search+".*",$options:'i'}},
            ],
        }).countDocuments();

        let pageNumber = Math.ceil(count/10);


        res.render('admin/customers',{user:userData,pageNumber,currentPage:page})

    } catch (error) {
        console.error(error);
        
    }
}

const customerBlocked = async (req,res)=>{
    try {
        
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/customers')
    } catch (error) {
        res.redirect('/error')
    }
}

const customerUnBlocked = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect('/admin/customers')
    } catch (error) {
        res.redirect('/error')

    }
}

export default {customerInfo, customerBlocked, customerUnBlocked}