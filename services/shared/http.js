"use strict";

function parseBody(raw) {
  if (raw == null || raw === "") {
    return {};
  }
  if (typeof raw === "object") {
    return raw;
  }
  return JSON.parse(raw);
}

function parseOperands(input) {
  const a = Number(input.a);
  const b = Number(input.b);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    const error = new Error('Both "a" and "b" must be finite numbers.');
    error.statusCode = 400;
    throw error;
  }

  return { a, b };
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}

function createLambdaHandler(compute) {
  return async function handler(event = {}) {
    try {
      if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
        return jsonResponse(204, {});
      }

      const rawBody = event.body !== undefined ? event.body : event;
      const body = parseBody(typeof rawBody === "string" && event.isBase64Encoded
        ? Buffer.from(rawBody, "base64").toString("utf8")
        : rawBody);
      const { a, b } = parseOperands(body);
      const result = compute(a, b);
      return jsonResponse(200, { result, operation: compute.name || "compute", a, b });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return jsonResponse(statusCode, { error: error.message || "Internal server error" });
    }
  };
}

function startHttpServer(port, lambdaHandler, serviceName) {
  const http = require("http");

  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      });
      res.end();
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
      return;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf8");

    const result = await lambdaHandler({
      body: raw,
      httpMethod: "POST",
      headers: req.headers,
    });

    res.writeHead(result.statusCode, result.headers);
    res.end(result.body || "");
  });

  server.listen(port, () => {
    console.log(`[${serviceName}] listening on http://localhost:${port}`);
  });

  return server;
}

module.exports = {
  createLambdaHandler,
  startHttpServer,
  parseOperands,
  jsonResponse,
};
