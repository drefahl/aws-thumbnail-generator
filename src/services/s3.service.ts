import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import type { ImageInfo, S3UploadResult, ThumbnailConfig } from "../types";

export class S3Service {
	private s3Client: S3Client;
	private bucketName: string;

	constructor() {
		this.s3Client = new S3Client({
			region: process.env.AWS_REGION,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
			},
		});
		this.bucketName = process.env.BUCKET_NAME!;
	}

	async uploadImage(imageInfo: ImageInfo, thumbnailConfig?: ThumbnailConfig): Promise<S3UploadResult> {
		const key = `uploads/${uuidv4()}-${imageInfo.originalname}`;

		// Prepare metadata for thumbnail configuration
		const metadata: Record<string, string> = {
			originalName: imageInfo.originalname,
			uploadedAt: new Date().toISOString(),
		};

		// Add thumbnail configuration to metadata if provided
		if (thumbnailConfig) {
			metadata.thumbnailWidth = thumbnailConfig.width.toString();
			metadata.thumbnailHeight = thumbnailConfig.height.toString();
			metadata.thumbnailQuality = thumbnailConfig.quality.toString();
			metadata.thumbnailFormat = thumbnailConfig.format;
		}

		try {
			const upload = new Upload({
				client: this.s3Client,
				params: {
					Bucket: this.bucketName,
					Key: key,
					Body: imageInfo.buffer,
					ContentType: imageInfo.mimetype,
					Metadata: metadata,
				},
			});

			const result = await upload.done();

			return {
				key,
				location: result.Location || `https://${this.bucketName}.s3.amazonaws.com/${key}`,
				etag: result.ETag || "",
				bucket: this.bucketName,
			};
		} catch (error) {
			console.error("Error uploading to S3:", error);
			throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
}
