import dotenv from "dotenv";

dotenv.config();

import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`📤 Upload API: http://localhost:${PORT}/api/upload`);
});

export default app;
