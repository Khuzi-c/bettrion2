const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../data/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

exports.uploadMiddleware = upload.single('image');

exports.handleUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const fileSizeKb = Math.round(req.file.size / 1024);

        // Save to database
        const { data, error } = await supabase
            .from('uploaded_images')
            .insert([{
                filename: req.file.filename,
                original_name: req.file.originalname,
                file_url: fileUrl,
                file_size_kb: fileSizeKb,
                uploaded_by: req.body.user_id || null
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: {
                id: data.id,
                url: fileUrl,
                filename: req.file.filename,
                size: fileSizeKb
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllImages = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('uploaded_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const { id } = req.params;

        // Get image info
        const { data: image, error: fetchError } = await supabase
            .from('uploaded_images')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Delete file from disk
        const filePath = path.join(uploadsDir, image.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('uploaded_images')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.json({ success: true, message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
