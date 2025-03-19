import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import path from "path";
import { pathToFileURL } from "url"; // This import is not used in your code, can be removed
import { fileURLToPath } from "url";
import userRouter from "./routes/userRouter.js";
import STATUS_CODE from "./helpers/statusCode.js";
import session from "express-session";
import passport from "./config/passport.js";
import googleRouter from "./routes/googleRouter.js";
import adminRouter from "./routes/adminRouter.js";

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

//passport initialize
app.use(passport.initialize());
app.use(passport.session());

//cashe control
app.use((req, res, next) => {
  res.set("cache-control", "no-store");
  next();
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Serving static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// app.get("/", (req, res) => {
//   res.render("user/home");
// });

app.use(['/user','/'], userRouter);
app.use("/auth", googleRouter);
app.use("/admin", adminRouter);

app.use("/error-admin", (req, res) => {
  res.render("partials/admin/404");
});

app.use("/error", (req, res) => {
  res.render("partials/404");
});

app.use((req, res, next) => {
  res.status(STATUS_CODE.NOT_FOUND).render("partials/404");
});

app.listen(PORT, () => {
  console.log(`Server is running at:`);
  console.log(`http://localhost:${PORT}/user`); // User routes
  console.log(`http://localhost:${PORT}`); // home routes
  console.log(`http://localhost:${PORT}/admin/login`); // Admin routes (not yet defined in the code)
  console.log(`http://localhost:${PORT}/user/login`); // Admin routes (not yet defined in the code)
  console.log(`http://localhost:${PORT}/user/signup`); // User signin route (ensure it exists in userRouter)
});
