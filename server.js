const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static("public"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`R-DIAB site launcher running on port ${PORT}`));
