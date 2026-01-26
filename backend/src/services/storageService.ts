import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

export async function uploadPdf(
  pdfBuffer: Buffer,
  fileName: string,
): Promise<string> {
  // create the s3 key path
  // like resume/abc.pdf
  const key = `resume/${fileName}.pdf`;

  // the upload command
  // we create the command and then send it
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  });

  // send the command (aploading the file)
  await s3Client.send(command);

  // construct the public url
  // it should be like this: https://[bucket].s3.[region].amazonaws.com/[key]
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
