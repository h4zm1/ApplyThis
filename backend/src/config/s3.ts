import { S3Client } from "@aws-sdk/client-s3";

// creating connection to s3
const s3Client = new S3Client({
  forcePathStyle: true,
  region: process.env.AWS_REGION!, // ! they exist for sure
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRETE_ACCESS_KEY!,
  },
});

export default s3Client;
