import multer from 'multer';

// Use memory storage so we can convert files to base64 without writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Multer provides file.mimetype like 'image/jpeg', 'image/png', etc.
  // Accept any image/* MIME type. If you want to restrict to specific
  // formats, you can check against a whitelist (e.g. image/jpeg, image/png).
  if (file && file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter,
});

export default upload;
