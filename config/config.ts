export const MONGODB_URI = process.env.MONGODB_URI as string;
export const GEOCODER_API_KEY = process.env.GEOCODER_API_KEY as string;
export const JWT_EXPIRE = process.env.JWT_EXPIRE as string;
export const JWT_COOKIE_EXPIRE = process.env
  .JWT_COOKIE_EXPIRE as unknown as number;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const NODE_ENV = process.env.NODE_ENV as string;
export const SMTP_HOST = process.env.SMTP_HOST as string;
export const SMTP_PORT = process.env.SMTP_PORT as unknown as number;
export const SMTP_EMAIL = process.env.SMTP_EMAIL as string;
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD as string;
export const FROM_EMAIL = process.env.FROM_EMAIL as string;
export const FROM_NAME = process.env.FROM_NAME as string;
export const S3_ENDPOINT = process.env.S3_ENDPOINT;
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY as string;
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY as string;
export const S3_BUCKET = process.env.S3_BUCKET as string;
export const S3_REGION = process.env.S3_REGION || "us-east-1";

if (!MONGODB_URI) {
  console.log("No client secret. Set MONGODB_URI environment variable.");
  process.exit(1);
}

if (!GEOCODER_API_KEY) {
  console.log("No client secret. Set GEOCODER_API_KEY environment variable.");
  process.exit(1);
}

if (!JWT_EXPIRE) {
  console.log("No client secret. Set JWT_EXPIRE environment variable.");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.log("No client secret. Set JWT_SECRET environment variable.");
  process.exit(1);
}

if (!NODE_ENV) {
  console.log("No client secret. Set NODE_ENV environment variable.");
  process.exit(1);
}
if (!SMTP_HOST) {
  console.log("No client secret. Set SMTP_HOST environment variable.");
  process.exit(1);
}
if (!SMTP_PORT) {
  console.log("No client secret. Set SMTP_PORT environment variable.");
  process.exit(1);
}
if (!SMTP_PASSWORD) {
  console.log("No client secret. Set SMTP_PASSWORD environment variable.");
  process.exit(1);
}
if (!SMTP_EMAIL) {
  console.log("No client secret. Set SMTP_EMAIL environment variable.");
  process.exit(1);
}
if (!FROM_EMAIL) {
  console.log("No client secret. Set FROM_EMAIL environment variable.");
  process.exit(1);
}
if (!FROM_NAME) {
  console.log("No client secret. Set FROM_NAME environment variable.");
  process.exit(1);
}
if (!S3_ACCESS_KEY) {
  console.log("No client secret. Set S3_ACCESS_KEY environment variable.");
  process.exit(1);
}
if (!S3_SECRET_KEY) {
  console.log("No client secret. Set S3_SECRET_KEY environment variable.");
  process.exit(1);
}
if (!S3_BUCKET) {
  console.log("No client secret. Set S3_BUCKET environment variable.");
  process.exit(1);
}
