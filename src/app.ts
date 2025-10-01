import cors from "cors";
import express, { type Application } from "express";
import { uploadController } from "./controllers/upload.controller";

export function createApp(): Application {
	const app: Application = express();

	// Middlewares
	app.use(cors());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// Health check
	app.get("/health", (_req, res) => {
		res.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || "1.0.0",
		});
	});

	// Rotas
	app.use("/api/upload", uploadController);

	// Middleware de erro global
	app.use((err: any, _req: express.Request, res: express.Response, _nextt: express.NextFunction) => {
		console.error("Error:", err);
		res.status(500).json({
			error: "Internal Server Error",
			message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
		});
	});

	// 404 handler
	app.use("*", (_req, res) => {
		res.status(404).json({
			error: "Not Found",
			message: "Route not found",
		});
	});

	return app;
}
