import express from "express";
import cookieParser from "cookie-parser";

const app = express();
// import roues
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/project", projectRouter);

export default app;
