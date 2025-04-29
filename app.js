import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/userRouter.js";
import STATUS_CODE from "./helpers/statusCode.js";
import session from "express-session";
import passport from "./config/passport.js";
import googleRouter from "./routes/googleRouter.js";
import adminRouter from "./routes/adminRouter.js";
// import multer from "multer";
import paymentRoutes from "./routes/paymentRouter.js"
import fileUpload from 'express-fileupload';

dotenv.config(); 

connectDB(); 

const app = express();

// Convert ES module URL to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 7000;

// Middleware to parse incoming requests
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

//session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.set("cache-control", "no-store");
  next();
});

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));


app.use(['/user','/'], userRouter);
app.use("/auth", googleRouter);
app.use("/admin", adminRouter);
app.use('/payments', paymentRoutes);

// app.use((req, res, next) => {
//   res.status(STATUS_CODE.NOT_FOUND).render("partials/404");
// });

app.listen(PORT, () => {
  console.log(`Server is running at:`);
  console.log(`http://localhost:${PORT}`);
  console.log(`http://localhost:${PORT}/admin/login`);
  console.log(`http://localhost:${PORT}/user/testing`);
  console.log(`http://localhost:${PORT}/user/userProfile`);
});
