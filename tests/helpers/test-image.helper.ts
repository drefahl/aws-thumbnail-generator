import sharp from "sharp";

export interface TestImageConfig {
	width: number;
	height: number;
	color: { r: number; g: number; b: number };
	format?: "jpeg" | "png" | "webp";
}

export async function createTestImage(width: number = 100, height: number = 100): Promise<Buffer> {
	return sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 100, g: 150, b: 200 },
		},
	})
		.jpeg()
		.toBuffer();
}

export class TestImageHelper {
	static async createTestImage(config: TestImageConfig): Promise<Buffer> {
		const { width, height, color, format = "jpeg" } = config;

		const image = sharp({
			create: {
				width,
				height,
				channels: 3,
				background: color,
			},
		});

		switch (format) {
			case "png":
				return image.png().toBuffer();
			case "webp":
				return image.webp().toBuffer();
			default:
				return image.jpeg({ quality: 90 }).toBuffer();
		}
	}

	static async createTestImageWithMetadata(config: TestImageConfig): Promise<{ buffer: Buffer; contentType: string }> {
		const buffer = await TestImageHelper.createTestImage(config);
		const contentType = config.format === "png" ? "image/png" : config.format === "webp" ? "image/webp" : "image/jpeg";

		return { buffer, contentType };
	}

	static async createGradientImage(width: number, height: number): Promise<Buffer> {
		const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ff0000;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#00ff00;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0000ff;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `;

		return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
	}

	static async createTestImages(count: number = 5): Promise<Buffer[]> {
		const colors = [
			{ r: 255, g: 0, b: 0 },
			{ r: 0, g: 255, b: 0 },
			{ r: 0, g: 0, b: 255 },
			{ r: 255, g: 255, b: 0 },
			{ r: 255, g: 0, b: 255 },
			{ r: 0, g: 255, b: 255 },
			{ r: 255, g: 128, b: 0 },
			{ r: 128, g: 0, b: 128 },
		];

		const images: Buffer[] = [];
		for (let i = 0; i < count; i++) {
			const color = colors[i % colors.length];
			const image = await TestImageHelper.createTestImage({
				width: 800,
				height: 600,
				color,
			});
			images.push(image);
		}

		return images;
	}

	static async validateImage(buffer: Buffer): Promise<boolean> {
		try {
			const metadata = await sharp(buffer).metadata();
			return !!(metadata.width && metadata.height);
		} catch {
			return false;
		}
	}

	static async getImageMetadata(buffer: Buffer) {
		return sharp(buffer).metadata();
	}

	static async saveImageToFile(buffer: Buffer, filePath: string): Promise<void> {
		await sharp(buffer).toFile(filePath);
	}
}
