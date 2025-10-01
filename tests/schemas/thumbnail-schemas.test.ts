import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";
import {
	parseThumbnailConfig,
	ThumbnailConfigFromBodySchema,
	ThumbnailConfigSchema,
} from "../../src/schemas/thumbnail.schema";

describe("ThumbnailSchemas", () => {
	describe("ThumbnailConfigSchema", () => {
		it("should validate correct thumbnail config", () => {
			const validConfig = {
				width: 300,
				height: 300,
				quality: 85,
				format: "jpeg" as const,
			};

			const result = ThumbnailConfigSchema.parse(validConfig);
			expect(result).toEqual(validConfig);
		});

		it("should apply default values", () => {
			const result = ThumbnailConfigSchema.parse({});
			expect(result).toEqual({
				width: 300,
				height: 300,
				quality: 85,
				format: "jpeg",
			});
		});

		it("should reject invalid format", () => {
			const invalidConfig = {
				width: 300,
				height: 300,
				quality: 85,
				format: "bmp",
			};

			expect(() => ThumbnailConfigSchema.parse(invalidConfig)).toThrow(ZodError);
		});

		it("should reject width out of bounds", () => {
			const invalidConfig = {
				width: 30, // Too small
				height: 300,
				quality: 85,
				format: "jpeg",
			};

			expect(() => ThumbnailConfigSchema.parse(invalidConfig)).toThrow(ZodError);

			const invalidConfig2 = {
				width: 3000, // Too large
				height: 300,
				quality: 85,
				format: "jpeg",
			};

			expect(() => ThumbnailConfigSchema.parse(invalidConfig2)).toThrow(ZodError);
		});

		it("should reject quality out of bounds", () => {
			const invalidConfig = {
				width: 300,
				height: 300,
				quality: 0, // Too low
				format: "jpeg",
			};

			expect(() => ThumbnailConfigSchema.parse(invalidConfig)).toThrow(ZodError);

			const invalidConfig2 = {
				width: 300,
				height: 300,
				quality: 101, // Too high
				format: "jpeg",
			};

			expect(() => ThumbnailConfigSchema.parse(invalidConfig2)).toThrow(ZodError);
		});
	});

	describe("ThumbnailConfigFromBodySchema", () => {
		it("should parse string numbers correctly", () => {
			const bodyData = {
				width: "500",
				height: "400",
				quality: "90",
				format: "png" as const,
			};

			const result = ThumbnailConfigFromBodySchema.parse(bodyData);
			expect(result).toEqual({
				width: 500,
				height: 400,
				quality: 90,
				format: "png",
			});
		});

		it("should handle undefined values", () => {
			const bodyData = {};

			const result = ThumbnailConfigFromBodySchema.parse(bodyData);
			expect(result).toEqual({
				width: undefined,
				height: undefined,
				quality: undefined,
				format: undefined,
			});
		});

		it("should reject invalid string numbers", () => {
			const bodyData = {
				width: "not-a-number",
			};

			expect(() => ThumbnailConfigFromBodySchema.parse(bodyData)).toThrow(ZodError);
		});
	});

	describe("parseThumbnailConfig", () => {
		it("should parse and apply defaults from body data", () => {
			const bodyData = {
				width: "500",
				quality: "90",
			};

			const result = parseThumbnailConfig(bodyData);
			expect(result).toEqual({
				width: 500,
				height: 300, // default
				quality: 90,
				format: "jpeg", // default
			});
		});

		it("should handle empty body", () => {
			const result = parseThumbnailConfig({});
			expect(result).toEqual({
				width: 300,
				height: 300,
				quality: 85,
				format: "jpeg",
			});
		});

		it("should throw ZodError for invalid data", () => {
			const bodyData = {
				width: "30", // Too small
			};

			expect(() => parseThumbnailConfig(bodyData)).toThrow(ZodError);
		});
	});
});
