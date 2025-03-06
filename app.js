import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import path from 'path';
import { pathToFileURL } from 'url'; // This import is not used in your code, can be removed
import { fileURLToPath } from 'url';
import userRouter from './routes/userRouter.js';
import STATUS_CODE from './helpers/statusCode.js';
import session from 'express-session';
import passport from './config/passport.js';
import googleRouter from './routes/googleRouter.js'


dotenv.config(); // Load environment variables from .env file

connectDB(); // Connect to the database

const app = express();

// Convert ES module URL to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 7000; // Set the port number (default to 8000 if not set in .env)

// Middleware to parse incoming requests
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

//session handling 
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))

//passport initialize

app.use(passport.initialize());
app.use(passport.session());


//cashe control
app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next();
})

// Setting up EJS as the view engine
app.set('view engine', 'ejs');

// Setting the views directory for rendering templates
app.set('views', path.join(__dirname, '/views'));

// Serving static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get("/",(req,res)=>{
    res.render('user/home')
})

// app.use('/user', userRouter);
app.use('/user',userRouter)
app.use('/auth',googleRouter)


// app.use((req, res, next) => {
//     res.status(STATUS_CODE.SUCCESS).render('partials/404'); // Ensure you have a `404.ejs` file in your `views` folder
// });


// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running at:`);
    console.log(`http://localhost:${PORT}/user`); // User routes
    console.log(`http://localhost:${PORT}`); // User routes
    console.log(`http://localhost:${PORT}/admin`); // Admin routes (not yet defined in the code)
    console.log(`http://localhost:${PORT}/user/login`); // User login route (ensure it exists in userRouter)
    console.log(`http://localhost:${PORT}/user/signup`); // User signin route (ensure it exists in userRouter)
    console.log(`http://localhost:${PORT}/404error`); // Custom 404 error page
    console.log(`http://localhost:${PORT}/user/verifyOtp`); // Custom 404 error page
});
