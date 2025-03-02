import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db.js'

// const env = dotenv.config();
connectDB();



const app = express();

app.get('/',(req,res)=>{
    res.send('start')
})

app.listen(8000,()=>{
    console.log(`http://localhost:8000`);
})