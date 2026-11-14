import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configures Cloudinary SDK using environment variables.
 * If credentials are not set yet in .env, uploadToCloudinary falls back
 * to returning a base64 data URI so local development still works out-of-the-box.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = async (fileBuffer, mimetype, folder = 'shopease/products') => {
  const base64Data = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;

  // Fallback for local testing when Cloudinary keys are not yet configured
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name'
  ) {
    return base64Data;
  }

  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: 'image',
  });

  return result.secure_url;
};

export default cloudinary;
