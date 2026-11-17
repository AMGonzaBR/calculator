"use strict";

const { startHttpServer } = require("../shared/http");
const { handler } = require("./handler");

const port = Number(process.env.PORT || 3002);
startHttpServer(port, handler, "subtract");
