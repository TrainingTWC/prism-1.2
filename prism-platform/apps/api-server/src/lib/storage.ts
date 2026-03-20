import { supabase } from './supabase.js';

export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Buffer | Blob | File,
  contentType?: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

export async function uploadSubmissionImage(fileName: string, file: Buffer | Blob | File) {
  return uploadToStorage('audit-images', `submission/${fileName}`, file);
}
