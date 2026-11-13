import "dotenv/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configure S3Client using environment variables or defaults
const s3Config = {
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  region: process.env.AWS_REGION || process.env.S3_REGION || "us-east-2"
};

if (process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3) {
  s3Config.endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3;
}

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
  };
}

const s3 = new S3Client(s3Config);
const bucket = process.env.S3_BUCKET || "assets";
const key = "uploads/file.txt";

console.log("=================================================");
console.log(" 📦 S3 Storage Bucket Test");
console.log("=================================================");
console.log(` Target Bucket : ${bucket}`);
console.log(` Target Region : ${s3Config.region}`);
console.log(` Target Key    : ${key}`);
console.log("-------------------------------------------------");

try {
  console.log("Uploading test payload to S3 bucket...");
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: "Hello World!",
    ContentType: "text/plain"
  }));
  console.log("✔ Upload successful!");

  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
  console.log(`[view] ${url}`);
  console.log("=================================================");
} catch (err) {
  console.error("❌ S3 Operation Error:", err.message);
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log("\n💡 Note: AWS credentials are not yet configured in your .env file.");
    console.log("   Open .env and set:");
    console.log("   AWS_ACCESS_KEY_ID=your-key");
    console.log("   AWS_SECRET_ACCESS_KEY=your-secret");
    console.log("   S3_BUCKET=your-bucket-name");
    console.log("   AWS_REGION=your-region (e.g. us-east-2)\n");
  }
}
