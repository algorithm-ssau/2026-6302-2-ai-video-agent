import { readFile } from "node:fs/promises";

import { supabaseAdmin } from "@/lib/supabase/admin";

async function ensureBucketExists(bucket: string) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (!error && data) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
  });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Unable to create storage bucket "${bucket}": ${createError.message}`);
  }
}

function isBucketMissingError(errorMessage: string) {
  const msg = errorMessage.toLowerCase();
  return msg.includes("bucket not found") || msg.includes("does not exist");
}

function isFileTooLargeError(errorMessage: string) {
  const msg = errorMessage.toLowerCase();
  return msg.includes("maximum allowed size") || msg.includes("file too large");
}

export async function uploadRenderedVideo(seriesId: string, localMp4Path: string): Promise<string> {
  const supabase = supabaseAdmin();
  const buffer = await readFile(localMp4Path);
  const bucket = "videos";
  const storagePath = `series/${seriesId}/final/${Date.now()}.mp4`;

  let { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType: "video/mp4", upsert: true });

  if (uploadError && isBucketMissingError(uploadError.message)) {
    await ensureBucketExists(bucket);
    const retry = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, { contentType: "video/mp4", upsert: true });
    uploadError = retry.error;
  }

  if (uploadError) {
    if (isFileTooLargeError(uploadError.message)) {
      throw new Error(
        `Video upload failed for bucket "${bucket}": ${uploadError.message}. The rendered MP4 likely exceeds your Supabase storage object-size policy. Reduce video resolution/duration or increase file size limits in Supabase Storage settings.`,
      );
    }
    throw new Error(`Video upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  if (!data?.publicUrl) {
    throw new Error("Could not build public URL for rendered video");
  }

  return data.publicUrl;
}

