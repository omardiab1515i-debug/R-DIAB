const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Only exact authorized hostnames are allowed. This is not an open proxy.
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || "example.com")
  .split(",").map(host => host.trim().toLowerCase()).filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static("public"));

app.get("/api/allowed", (_req, res) => res.json({ hosts: ALLOWED_HOSTS }));

app.use("/proxy/:host", (req, res, next) => {
  const host = String(req.params.host || "").toLowerCase();
  if (!ALLOWED_HOSTS.includes(host)) {
    return res.status(403).send("This domain is not on the authorized allowlist.");
  }
  const proxy = createProxyMiddleware({
    target: `https://${host}`,
    changeOrigin: true,
    secure: true,
    ws: false,
    pathRewrite: path => path.replace(/^\/proxy\/[^/]+/, "") || "/",
    on: {
      error(_err, _req, proxyRes) {
        if (proxyRes && !proxyRes.headersSent) proxyRes.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
        if (proxyRes) proxyRes.end("The destination could not be reached.");
      }
    }
  });
  return proxy(req, res, next);
});

app.listen(PORT, () => console.log(`R-DIAB running on port ${PORT}; allowed: ${ALLOWED_HOSTS.join(", ")}`));