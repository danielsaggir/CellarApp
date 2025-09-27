import multer from "multer";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

export const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION || "us-east-1",
});

export async function uploadImageToS3(file: Express.Multer.File): Promise<string> {
  const key = `wines/${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };
  await s3.upload(params).promise();
  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
