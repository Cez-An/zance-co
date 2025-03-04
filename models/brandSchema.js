import mongoose from "mongoose";

const {Schema} = mongoose;

const brandSchema = new Schema({
    
    brandName:{
        type : String,
        required : true,
    },
    brandImage :{
        type:String,
        required :true,
    },
    isBlocked:{
        type:String,
        required:true,
    },

},{timestamps:true})

const Brand = mongoose.model("Brand",brandSchema);

export default brandSchema;