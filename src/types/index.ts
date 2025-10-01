export interface UploadResponse {
	success: boolean;
	message: string;
	data?: {
		originalImage: {
			key: string;
			url: string;
			size: number;
		};
		thumbnailImage?: {
			key: string;
			url: string;
			size: number;
		};
	};
	error?: string;
}

export interface S3UploadResult {
	key: string;
	location: string;
	etag: string;
	bucket: string;
}

export interface ImageInfo {
	buffer: Buffer;
	mimetype: string;
	originalname: string;
	size: number;
}

// Re-export ThumbnailConfig from schemas
export type { ThumbnailConfig } from "../schemas/thumbnail.schema";
