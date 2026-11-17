"use strict";

const { createLambdaHandler } = require("../shared/http");

function divide(a, b) {
  if (b === 0) {
    const error = new Error("Division by zero is not allowed.");
    error.statusCode = 400;
    throw error;
  }
  return a / b;
}

exports.handler = createLambdaHandler(divide);
exports.divide = divide;
