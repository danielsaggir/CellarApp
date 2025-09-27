import AWS from "aws-sdk";
import multer from "multer";
import { Request } from "express";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!
});

// Multer storage (in memory)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload file buffer to S3
export async function uploadImageToS3(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname);
  const key = `wines/${uuidv4()}${ext}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read" // 🔹 מאפשר גישה ציבורית ל־URL
  };

  const result = await s3.upload(params).promise();
  return result.Location; // זה ה־URL הציבורי
}
