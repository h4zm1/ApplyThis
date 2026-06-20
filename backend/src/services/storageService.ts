import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;
const REF = process.env.SUPABASE_REF;

export async function uploadPdf(
  pdfBuffer: Buffer,
  fileName: string,
): Promise<string> {
  const key = `resume/${fileName}.pdf`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  });

  await s3Client.send(command);

  // supabase public format
  const url = `https://${REF}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${key}`;

  return url;
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

  const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

  return url;
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
  const key = `resume/${fileName}.png`;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
