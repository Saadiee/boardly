import express from "express";
const app = express();

// Router Imports
import healthCheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/auth.routes.js";

// Router Use
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1", userRouter);

export default app;
