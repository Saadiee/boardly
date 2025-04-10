import express from "express";
const app = express();

// Router Imports
import healthCheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthCheckRouter);
export default app;
