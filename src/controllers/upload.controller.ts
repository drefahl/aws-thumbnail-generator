import { type Request, type Response, Router } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { parseThumbnailConfig } from "../schemas/thumbnail.schema";
import { S3Service } from "../services/s3.service";
import type { ImageInfo, ThumbnailConfig, UploadResponse } from "../types";

const router: Router = Router();
const s3Service = new S3Service();

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (_req, file, cb) => {
		const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP)"));
		}
	},
});

router.post("/single", upload.single("image"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "No image file provided",
				error: "IMAGE_REQUIRED",
			} as UploadResponse);
		}

		// Validate and parse thumbnail configuration using Zod
		let thumbnailConfig: ThumbnailConfig;
		try {
			thumbnailConfig = parseThumbnailConfig(req.body);
		} catch (error) {
			if (error instanceof ZodError) {
				return res.status(400).json({
					success: false,
					message: "Invalid thumbnail configuration",
					error: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", "),
				} as UploadResponse);
			}
			throw error;
		}

		const imageInfo: ImageInfo = {
			buffer: req.file.buffer,
			mimetype: req.file.mimetype,
			originalname: req.file.originalname,
			size: req.file.size,
		};

		const uploadResult = await s3Service.uploadImage(imageInfo, thumbnailConfig);

		const response: UploadResponse = {
			success: true,
			message: "Image uploaded successfully. Lambda function will process it shortly.",
			data: {
				originalImage: {
					key: uploadResult.key,
					url: uploadResult.location,
					size: imageInfo.size,
				},
			},
		};

		res.json(response);
	} catch (error) {
		console.error("❌ Upload error:", error);

		const response: UploadResponse = {
			success: false,
			message: "Failed to upload image",
			error: error instanceof Error ? error.message : "Unknown error",
		};

		res.status(500).json(response);
	}
});

router.post("/multiple", upload.array("images", 9), async (req: Request, res: Response) => {
	try {
		const files = req.files as Express.Multer.File[];

		if (!files || files.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No image files provided",
				error: "IMAGES_REQUIRED",
			} as UploadResponse);
		}

		if (files.length > 9) {
			return res.status(400).json({
				success: false,
				message: "Maximum 9 images allowed",
				error: "TOO_MANY_IMAGES",
			} as UploadResponse);
		}

		// Validate and parse thumbnail configuration using Zod
		let thumbnailConfig: ThumbnailConfig;
		try {
			thumbnailConfig = parseThumbnailConfig(req.body);
		} catch (error) {
			if (error instanceof ZodError) {
				return res.status(400).json({
					success: false,
					message: "Invalid thumbnail configuration",
					error: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", "),
				} as UploadResponse);
			}
			throw error;
		}

		const uploadPromises = files.map((file) => {
			const imageInfo: ImageInfo = {
				buffer: file.buffer,
				mimetype: file.mimetype,
				originalname: file.originalname,
				size: file.size,
			};
			return s3Service.uploadImage(imageInfo, thumbnailConfig);
		});

		await Promise.all(uploadPromises);

		const response: UploadResponse = {
			success: true,
			message: `${files.length} images uploaded successfully. Lambda function will process them into thumbnails.`,
			data: {
				originalImage: {
					key: `batch-${Date.now()}`, // Batch identifier
					url: "Multiple images uploaded",
					size: files.reduce((total, file) => total + file.size, 0),
				},
			},
		};

		res.json(response);
	} catch (error) {
		console.error("❌ Multiple upload error:", error);

		const response: UploadResponse = {
			success: false,
			message: "Failed to upload images",
			error: error instanceof Error ? error.message : "Unknown error",
		};

		res.status(500).json(response);
	}
});

router.get("/status", (_req: Request, res: Response) => {
	res.json({
		status: "ok",
		service: "thumbnail-upload-service",
		timestamp: new Date().toISOString(),
		maxFileSize: "10MB",
		allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
		thumbnailConfig: {
			defaultWidth: 300,
			defaultHeight: 300,
			defaultQuality: 85,
			defaultFormat: "jpeg",
			supportedFormats: ["jpeg", "png", "webp"],
		},
		endpoints: {
			single: "POST /api/upload/single (with optional width, height, quality, format in body)",
			multiple: "POST /api/upload/multiple (max 9 images, with optional thumbnail config)",
		},
	});
});

export { router as uploadController };
