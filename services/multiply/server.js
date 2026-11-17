"use strict";

const { startHttpServer } = require("../shared/http");
const { handler } = require("./handler");

const port = Number(process.env.PORT || 3003);
startHttpServer(port, handler, "multiply");
