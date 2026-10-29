import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
const app = express();
app.use(helmet());
app.use(cors({ origin: [env.clientUrl, env.adminUrl], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));
app.use(rateLimit({ windowMs: 900000, limit: 300 }));
app.get("/", (req, res) =>
  res.redirect(302, `${env.adminUrl.replace(/\/+$/, "")}/admin`),
);
app.use("/api/v1", routes);
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: "Route not found", errors: [] }),
);
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON body", errors: [] });
  }
  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map(({ message }) => message),
    });
  }
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists",
      errors: [],
    });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid identifier or field value",
      errors: [],
    });
  }
  console.error(err);
  return res
    .status(500)
    .json({ success: false, message: "Internal server error", errors: [] });
});
export default app;
