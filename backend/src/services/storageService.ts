import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import logger from "../config/logger";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;
const REF = process.env.SUPABASE_REF;
const publicUrl = (key: string) =>
  `https://${REF}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${key}`;

export async function uploadPdf(
  pdfBuffer: Buffer,
  fileName: string,
): Promise<string> {
  const key = `resume/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: "application/octet-stream",
  });

  await s3Client.send(command);

  return publicUrl(key);
}

export async function uploadThumbnail(
  imageBuffer: Buffer,
  fileName: string,
): Promise<string> {
  const key = `thumbnail/${fileName}.png`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: imageBuffer,
    ContentType: "image/png",
  });

  await s3Client.send(command);

  return publicUrl(key);
}

export async function deletePdf(fileName: string): Promise<void> {
  const key = `resume/${fileName}.pdf`;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
export async function deleteThumbnail(fileName: string): Promise<void> {
  const key = `thumbnail/${fileName}.png`;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

function fileNameFromUrl(url: string): string {
  const last = url.split("/").pop() ?? "";
  return last.replace(/\.(pdf|png)$/, ""); // only remove the extensio
}

export async function deleteStoredFiles(
  pdfUrl?: string | null,
  thumbnailUrl?: string | null,
) {
  const tasks: Promise<unknown>[] = [];
  if (pdfUrl) tasks.push(deletePdf(fileNameFromUrl(pdfUrl)));
  if (thumbnailUrl) tasks.push(deleteThumbnail(fileNameFromUrl(thumbnailUrl)));
  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      logger.warn({ error: r.reason }, "failed to delete file from storage");
    }
  }
}
