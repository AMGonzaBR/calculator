"use strict";

const { createLambdaHandler } = require("../shared/http");

function multiply(a, b) {
  return a * b;
}

exports.handler = createLambdaHandler(multiply);
exports.multiply = multiply;
