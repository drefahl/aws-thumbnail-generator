import sharp from "sharp";

export interface ThumbnailConfig {
	width: number;
	height: number;
	quality: number; // 1-100 (JPEG quality)
	format: "jpeg" | "png" | "webp";
}

/**
 * Generates a thumbnail from the image with the specified configuration
 * @param imageBuffer Original image buffer
 * @param config Thumbnail configuration (width, height, quality, format)
 * @returns Generated thumbnail buffer
 */
export async function generateThumbnail(imageBuffer: Buffer, config: ThumbnailConfig): Promise<Buffer> {
	try {
		let sharpInstance = sharp(imageBuffer).resize(config.width, config.height, {
			fit: "inside", // Maintain aspect ratio
			withoutEnlargement: true, // Don't enlarge smaller images
		});

		// Apply format and quality according to configuration
		switch (config.format) {
			case "jpeg":
				sharpInstance = sharpInstance.jpeg({ quality: config.quality });
				break;
			case "png":
				sharpInstance = sharpInstance.png({
					quality: config.quality,
					compressionLevel: Math.floor((100 - config.quality) / 10),
				});
				break;
			case "webp":
				sharpInstance = sharpInstance.webp({ quality: config.quality });
				break;
			default:
				throw new Error(`Unsupported format: ${config.format}`);
		}

		const thumbnailBuffer = await sharpInstance.toBuffer();

		return thumbnailBuffer;
	} catch (error) {
		console.error("Error generating thumbnail:", error);
		throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

/**
 * Generates multiple thumbnails with different sizes
 * @param imageBuffer Original image buffer
 * @param configs Array of thumbnail configurations
 * @returns Array of generated thumbnail buffers
 */
export async function generateMultipleThumbnails(imageBuffer: Buffer, configs: ThumbnailConfig[]): Promise<Buffer[]> {
	try {
		const thumbnailPromises = configs.map((config) => generateThumbnail(imageBuffer, config));
		return await Promise.all(thumbnailPromises);
	} catch (error) {
		console.error("Error generating multiple thumbnails:", error);
		throw new Error(
			`Failed to generate multiple thumbnails: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export const THUMBNAIL_PRESETS: Record<string, ThumbnailConfig> = {
	small: {
		width: 150,
		height: 150,
		quality: 80,
		format: "jpeg",
	},
	medium: {
		width: 300,
		height: 300,
		quality: 85,
		format: "jpeg",
	},
	large: {
		width: 600,
		height: 600,
		quality: 90,
		format: "jpeg",
	},
	webp_small: {
		width: 150,
		height: 150,
		quality: 80,
		format: "webp",
	},
};
