import multer from 'multer';

// Store uploaded files in memory buffer before uploading to Cloudinary
const storage = multer.memoryStorage();

// Security Check: Allow only safe image MIME types (JPEG, PNG, WebP)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'),
      false
    );
  }
};

/**
 * Multer Upload Middleware:
 * Enforces max 5MB per image file and up to 5 images per request.
 */
export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
});

export default uploadImages;
