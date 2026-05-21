import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const uploadResponse = await cloudinary.uploader.upload(image, { folder: 'mipage_uploads' });
    res.json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

export default router;
