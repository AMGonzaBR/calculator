"use strict";

const { createLambdaHandler } = require("../shared/http");

function subtract(a, b) {
  return a - b;
}

exports.handler = createLambdaHandler(subtract);
exports.subtract = subtract;
