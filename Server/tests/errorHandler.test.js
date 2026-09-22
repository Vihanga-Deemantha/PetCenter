import { describe, it, expect, vi, afterEach } from "vitest";
import errorHandler from "../src/middleware/errorHandler.js";

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const originalEnv = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

describe("errorHandler — production message safety", () => {
  it("replaces a raw/unexpected error message with a generic one outside development", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("connect ECONNREFUSED 127.0.0.1:27017 at /internal/path/db.js");
    const res = makeRes();

    errorHandler(err, { method: "GET", originalUrl: "/api/v1/whatever" }, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.message).not.toContain("ECONNREFUSED");
    expect(body.message).not.toContain("/internal/path");
    expect(body.stack).toBeUndefined();
  });

  it("still exposes the real message and stack in development, for debugging", () => {
    process.env.NODE_ENV = "development";
    const err = new Error("connect ECONNREFUSED 127.0.0.1:27017");
    const res = makeRes();

    errorHandler(err, { method: "GET", originalUrl: "/api/v1/whatever" }, res, () => {});

    const body = res.json.mock.calls[0][0];
    expect(body.message).toContain("ECONNREFUSED");
    expect(body.stack).toBeTruthy();
  });

  it("keeps the hand-crafted, already-safe message for known error shapes (e.g. CastError)", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Cast to ObjectId failed for value \"bad-id\"");
    err.name = "CastError";
    const res = makeRes();

    errorHandler(err, { method: "GET", originalUrl: "/api/v1/whatever" }, res, () => {});

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe("Resource not found");
  });
});
