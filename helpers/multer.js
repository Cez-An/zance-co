import multer from 'multer';
import {CloudinaryStorage} from "multer-storage-cloudinary"
import path, { format } from 'path';
import cloudinary from '../helpers/cloudinary.js';


const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'uploads',
        format: async () => 'png',
        public_id: (req, file) => Date.now() + '-' + file.originalname,
    },
});

const upload = multer({ storage });

export default upload;
