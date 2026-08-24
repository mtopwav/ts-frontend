const { createProxyMiddleware } = require("http-proxy-middleware");

const API_TARGET = process.env.REACT_APP_PROXY_TARGET || "http://localhost:5000";

module.exports = function setupProxy(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true,
      secure: false,
      logLevel: "debug",
      onProxyReq(proxyReq, req) {
        console.log(`[proxy] ${req.method} ${req.url} → ${API_TARGET}${req.url}`);
      },
      onError(err, req, res) {
        console.error("[proxy] error:", err.message);
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "Backend unavailable. Run: cd backend && npm start"
          })
        );
      }
    })
  );
};
