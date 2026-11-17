"use strict";

const http = require("http");
const { URL } = require("url");

const port = Number(process.env.PORT || 3000);

const routes = {
  "/add": process.env.ADD_SERVICE_URL || "http://localhost:3001",
  "/subtract": process.env.SUBTRACT_SERVICE_URL || "http://localhost:3002",
  "/multiply": process.env.MULTIPLY_SERVICE_URL || "http://localhost:3003",
  "/divide": process.env.DIVIDE_SERVICE_URL || "http://localhost:3004",
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

async function proxyPost(targetBase, rawBody) {
  const target = new URL("/", targetBase);
  const payload = Buffer.from(rawBody || "{}", "utf8");

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: target.hostname,
        port: target.port,
        path: "/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": payload.length,
        },
      },
      (upstream) => {
        const chunks = [];
        upstream.on("data", (chunk) => chunks.push(chunk));
        upstream.on("end", () => {
          resolve({
            statusCode: upstream.statusCode || 502,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname.replace(/\/$/, "") || "/";

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && (pathname === "/" || pathname === "/health")) {
    sendJson(res, 200, {
      status: "ok",
      service: "calculator-gateway",
      routes: Object.keys(routes),
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const target = routes[pathname];
  if (!target) {
    sendJson(res, 404, {
      error: `Unknown route ${pathname}. Use one of: ${Object.keys(routes).join(", ")}`,
    });
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString("utf8") || "{}";
    const upstream = await proxyPost(target, rawBody);

    res.writeHead(upstream.statusCode, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(upstream.body);
  } catch (error) {
    sendJson(res, 502, {
      error: `Gateway failed to reach ${pathname} service`,
      detail: error.message,
    });
  }
});

server.listen(port, () => {
  console.log(`[gateway] listening on http://localhost:${port}`);
  console.log("[gateway] routes:", routes);
});
