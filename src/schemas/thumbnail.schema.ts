import { z } from "zod";

export const ThumbnailConfigSchema = z.object({
	width: z.number().int().min(50, "Width must be at least 50px").max(2000, "Width must not exceed 2000px").default(300),

	height: z
		.number()
		.int()
		.min(50, "Height must be at least 50px")
		.max(2000, "Height must not exceed 2000px")
		.default(300),

	quality: z.number().int().min(1, "Quality must be at least 1").max(100, "Quality must not exceed 100").default(85),

	format: z
		.enum(["jpeg", "png", "webp"], {
			message: "Format must be one of: jpeg, png, webp",
		})
		.default("jpeg"),
});

const StringToNumberSchema = z
	.string()
	.optional()
	.transform((val) => (val ? parseInt(val, 10) : undefined))
	.refine((val) => val === undefined || !Number.isNaN(val), {
		message: "Must be a valid number",
	});

export const ThumbnailConfigFromBodySchema = z.object({
	width: StringToNumberSchema,
	height: StringToNumberSchema,
	quality: StringToNumberSchema,
	format: z.enum(["jpeg", "png", "webp"]).optional(),
});

export type ThumbnailConfig = z.infer<typeof ThumbnailConfigSchema>;

export function parseThumbnailConfig(body: any): ThumbnailConfig {
	const parsed = ThumbnailConfigFromBodySchema.parse(body);

	return ThumbnailConfigSchema.parse({
		width: parsed.width,
		height: parsed.height,
		quality: parsed.quality,
		format: parsed.format,
	});
}
