import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert ES module URL to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,"../public/uploads"));
    },
    filename: (req, file, cb) => { 
        cb(null, Date.now() + "-" + file.originalname);
    }
})



export default storage;