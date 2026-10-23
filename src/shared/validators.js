import { ApiResponseError } from "./errors/ApiError.js";

/** Shared Pi-hole payload validators. They never coerce or default. */
export function invalidResponse() {
  return new ApiResponseError();
}

export function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

export function requireCount(value) {
  if (!isCount(value)) throw invalidResponse();
  return value;
}

export function requirePercentage(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw invalidResponse();
  }
  return value;
}

export function requireString(value) {
  if (typeof value !== "string" || value === "") throw invalidResponse();
  return value;
}

export function requireArray(value) {
  if (!Array.isArray(value)) throw invalidResponse();
  return value;
}

export function requireOneOf(values, value) {
  if (!values.has(value)) throw invalidResponse();
  return value;
}

export function requireTimestamp(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw invalidResponse();
  return value;
}

export function requireBoolean(value) {
  if (typeof value !== "boolean") throw invalidResponse();
  return value;
}

export function requireGroupIds(value) {
  const ids = requireArray(value);
  if (!ids.every(isCount)) throw invalidResponse();
  return ids;
}
