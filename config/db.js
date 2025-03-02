import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();


const connectDB = async()=> {
    try{

       await mongoose.connect((process.env.MONGODB_URI));
       console.log(`database Connected`);

    }
    catch(err){
        console.error(err.msg);
        process.exit(1);
    }
}

export default connectDB;
