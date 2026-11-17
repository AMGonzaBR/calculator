"use strict";

const { createLambdaHandler } = require("../shared/http");

function add(a, b) {
  return a + b;
}

exports.handler = createLambdaHandler(add);
exports.add = add;
