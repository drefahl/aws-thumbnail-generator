import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event, S3Handler } from "aws-lambda";
import { generateThumbnail, ThumbnailConfig } from "./utils/thumbnail-generator.js";

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
});

export { ThumbnailConfig };

// Bucket configuration (single bucket with prefixes to avoid infinite loops)
const BUCKET_NAME = process.env.BUCKET_NAME;

// Default thumbnail configuration (fallback)
const defaultThumbnailConfig: ThumbnailConfig = {
	width: 300,
	height: 300,
	quality: 85,
	format: "jpeg",
};

export const handler: S3Handler = async (event: S3Event) => {
	console.log("📸 Lambda triggered by S3 event:", JSON.stringify(event, null, 2));

	// Validate bucket configuration
	if (!BUCKET_NAME) {
		throw new Error("BUCKET_NAME environment variable is required");
	}

	for (const record of event.Records) {
		try {
			const inputBucketName = record.s3.bucket.name;
			const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

			console.log(`🔄 Processing image: ${objectKey} from bucket: ${inputBucketName}`);

			// Skip if it's not in the uploads/ prefix (avoid processing thumbnails)
			if (!objectKey.startsWith("uploads/")) {
				console.log("⏭️ Skipping file not in uploads/ prefix:", objectKey);
				continue;
			}

			// Skip temporary or processed files
			if (objectKey.endsWith(".tmp") || objectKey.includes("thumb-")) {
				console.log("⏭️ Skipping temporary or processed file:", objectKey);
				continue;
			}

			// Download image from input bucket
			const imageBuffer = await downloadImageFromS3(inputBucketName, objectKey);

			// Get thumbnail configuration from S3 object metadata or use defaults
			const thumbnailConfig = await getThumbnailConfigFromMetadata(inputBucketName, objectKey);

			// Generate thumbnail from image
			const thumbnailBuffer = await generateThumbnail(imageBuffer, thumbnailConfig);

			// Upload thumbnail to same bucket (thumbnails/ prefix)
			const thumbnailKey = await uploadThumbnailToS3(BUCKET_NAME!, thumbnailBuffer, objectKey, thumbnailConfig.format);
			console.log(`✅ Thumbnail generated and uploaded to output bucket: ${thumbnailKey}`);
		} catch (error) {
			console.error("❌ Error processing image:", error);
			// Continue processing other images even if one fails
		}
	}
};

async function getThumbnailConfigFromMetadata(bucketName: string, objectKey: string): Promise<ThumbnailConfig> {
	try {
		// Get object metadata to check for thumbnail configuration
		const headCommand = new GetObjectCommand({
			Bucket: bucketName,
			Key: objectKey,
		});

		const headResponse = await s3Client.send(headCommand);

		// Extract thumbnail configuration from metadata
		const metadata = headResponse.Metadata || {};

		return {
			width: parseInt(metadata.thumbnailWidth || "300", 10),
			height: parseInt(metadata.thumbnailHeight || "300", 10),
			quality: parseInt(metadata.thumbnailQuality || "85", 10),
			format: (metadata.thumbnailFormat as "jpeg" | "png" | "webp") || "jpeg",
		};
	} catch (error) {
		console.log("Could not get metadata, using default config:", error);
		return defaultThumbnailConfig;
	}
}

async function downloadImageFromS3(bucketName: string, objectKey: string): Promise<Buffer> {
	try {
		console.log(`⬇️ Downloading ${objectKey} from S3...`);

		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: objectKey,
		});

		const response = await s3Client.send(command);

		if (!response.Body) {
			throw new Error("No body in S3 response");
		}

		// Convert stream to buffer
		const chunks: Uint8Array[] = [];

		// @ts-expect-error - response.Body is a stream
		for await (const chunk of response.Body) {
			chunks.push(chunk);
		}

		const buffer = Buffer.concat(chunks);
		console.log(`📦 Downloaded ${buffer.length} bytes`);

		return buffer;
	} catch (error) {
		console.error("Error downloading from S3:", error);
		throw error;
	}
}

async function uploadThumbnailToS3(
	bucketName: string,
	thumbnailBuffer: Buffer,
	originalKey: string,
	format: string,
): Promise<string> {
	try {
		// Generate key for thumbnail based on original image
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const originalFileName =
			originalKey
				.split("/")
				.pop()
				?.replace(/\.[^/.]+$/, "") || "unknown";
		const extension = format === "jpeg" ? "jpg" : format;
		const thumbnailKey = `thumbnails/${originalFileName}-thumb-${timestamp}.${extension}`;

		console.log(`⬆️ Uploading thumbnail to bucket: ${bucketName}/${thumbnailKey}`);

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: thumbnailKey,
			Body: thumbnailBuffer,
			ContentType: `image/${format}`,
			Metadata: {
				originalImageKey: originalKey,
				processedAt: new Date().toISOString(),
				processedBy: "lambda-thumbnail-generator",
				thumbnailSize: `${defaultThumbnailConfig.width}x${defaultThumbnailConfig.height}`,
				quality: defaultThumbnailConfig.quality.toString(),
			},
		});

		await s3Client.send(command);

		console.log(`✅ Thumbnail uploaded successfully: ${thumbnailKey}`);
		return thumbnailKey;
	} catch (error) {
		console.error("Error uploading thumbnail to S3:", error);
		throw error;
	}
}
