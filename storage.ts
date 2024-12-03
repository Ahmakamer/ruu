import { supabase } from '../db';
import { randomUUID } from 'crypto';
import logger from './logger';

export async function uploadFile(file: Express.Multer.File, folder: string = 'listings') {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${randomUUID()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('ahmuko-uploads')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ahmuko-uploads')
      .getPublicUrl(filePath);

    logger.info('File uploaded successfully:', { filePath, publicUrl });
    return publicUrl;

  } catch (error) {
    logger.error('File upload failed:', error);
    throw error;
  }
}

export async function deleteFile(filePath: string) {
  try {
    const { error } = await supabase.storage
      .from('ahmuko-uploads')
      .remove([filePath]);

    if (error) throw error;
    logger.info('File deleted successfully:', { filePath });

  } catch (error) {
    logger.error('File deletion failed:', error);
    throw error;
  }
}
