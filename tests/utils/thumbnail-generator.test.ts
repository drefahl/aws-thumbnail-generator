import sharp from "sharp";
import { generateThumbnail, THUMBNAIL_PRESETS, type ThumbnailConfig } from "../../src/utils/thumbnail-generator";
import { createTestImage } from "../helpers/test-image.helper";

describe("thumbnailGenerator", () => {
	let testImageBuffer: Buffer;

	beforeAll(async () => {
		// Criar uma imagem de teste de 800x600 pixels
		testImageBuffer = await createTestImage(800, 600);
	});

	describe("generateThumbnail", () => {
		it("should generate a thumbnail with correct dimensions", async () => {
			const config: ThumbnailConfig = {
				width: 200,
				height: 200,
				quality: 85,
				format: "jpeg",
			};

			const thumbnailBuffer = await generateThumbnail(testImageBuffer, config);

			// Verificar se o thumbnail foi gerado
			expect(thumbnailBuffer).toBeInstanceOf(Buffer);
			expect(thumbnailBuffer.length).toBeGreaterThan(0);

			// Verificar dimensões usando Sharp
			const metadata = await sharp(thumbnailBuffer).metadata();
			expect(metadata.width).toBeLessThanOrEqual(config.width);
			expect(metadata.height).toBeLessThanOrEqual(config.height);
			expect(metadata.format).toBe("jpeg");
		});

		it("should maintain aspect ratio", async () => {
			const config: ThumbnailConfig = {
				width: 300,
				height: 300,
				quality: 85,
				format: "jpeg",
			};

			const thumbnailBuffer = await generateThumbnail(testImageBuffer, config);
			const metadata = await sharp(thumbnailBuffer).metadata();

			// Como a imagem original é 800x600 (aspect ratio 4:3),
			// o thumbnail deve manter essa proporção
			const aspectRatio = (metadata.width || 0) / (metadata.height || 0);
			const expectedAspectRatio = 800 / 600; // 1.33...

			expect(aspectRatio).toBeCloseTo(expectedAspectRatio, 2);
		});

		it("should generate WebP format", async () => {
			const config: ThumbnailConfig = {
				width: 150,
				height: 150,
				quality: 90,
				format: "webp",
			};

			const thumbnailBuffer = await generateThumbnail(testImageBuffer, config);
			const metadata = await sharp(thumbnailBuffer).metadata();

			expect(metadata.format).toBe("webp");
		});

		it("should generate PNG format", async () => {
			const config: ThumbnailConfig = {
				width: 150,
				height: 150,
				quality: 90,
				format: "png",
			};

			const thumbnailBuffer = await generateThumbnail(testImageBuffer, config);
			const metadata = await sharp(thumbnailBuffer).metadata();

			expect(metadata.format).toBe("png");
		});

		it("should not enlarge smaller images", async () => {
			// Criar uma imagem pequena de 100x100
			const smallImageBuffer = await createTestImage(100, 100);

			const config: ThumbnailConfig = {
				width: 300,
				height: 300,
				quality: 85,
				format: "jpeg",
			};

			const thumbnailBuffer = await generateThumbnail(smallImageBuffer, config);
			const metadata = await sharp(thumbnailBuffer).metadata();

			// A imagem não deve ser ampliada
			expect(metadata.width).toBeLessThanOrEqual(100);
			expect(metadata.height).toBeLessThanOrEqual(100);
		});

		it("should handle different quality settings", async () => {
			const configs = [
				{ ...THUMBNAIL_PRESETS.small, quality: 50 },
				{ ...THUMBNAIL_PRESETS.small, quality: 95 },
			];

			const thumbnails = await Promise.all(configs.map((config) => generateThumbnail(testImageBuffer, config)));

			// Thumbnail com qualidade menor deve ter tamanho menor
			expect(thumbnails[0].length).toBeLessThan(thumbnails[1].length);
		});
	});

	describe("THUMBNAIL_PRESETS", () => {
		it("should have predefined presets", () => {
			expect(THUMBNAIL_PRESETS.small).toBeDefined();
			expect(THUMBNAIL_PRESETS.medium).toBeDefined();
			expect(THUMBNAIL_PRESETS.large).toBeDefined();
			expect(THUMBNAIL_PRESETS.webp_small).toBeDefined();
		});

		it("should generate thumbnails using presets", async () => {
			const thumbnailBuffer = await generateThumbnail(testImageBuffer, THUMBNAIL_PRESETS.medium);
			const metadata = await sharp(thumbnailBuffer).metadata();

			expect(metadata.width).toBeLessThanOrEqual(THUMBNAIL_PRESETS.medium.width);
			expect(metadata.height).toBeLessThanOrEqual(THUMBNAIL_PRESETS.medium.height);
		});
	});
});
