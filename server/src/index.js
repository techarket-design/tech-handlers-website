import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import auth from "./routes/auth.js";
import table from "./routes/table.js";
import rpc from "./routes/rpc.js";
import team from "./routes/team.js";
import storage from "./routes/storage.js";
import leads from "./routes/leads.js";

const app = express();
const origins = (process.env.CORS_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: origins.length ? origins : true,
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", auth);
app.use("/table", table);
app.use("/rpc", rpc);
app.use("/team", team);
app.use("/storage", storage);
app.use("/leads", leads);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal error" });
});

const port = +(process.env.PORT || 3000);
app.listen(port, () => console.log(`th-api listening on :${port}`));