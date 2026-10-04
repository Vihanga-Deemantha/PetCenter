import { describe, it, expect, vi } from "vitest";
import { checkEnv, validateEnv } from "../src/config/validateEnv.js";
import { getClientOrigins } from "../src/config/clientOrigins.js";

const goodEnv = () => ({
  NODE_ENV: "production",
  MONGODB_URI: "mongodb+srv://u:p@cluster.mongodb.net/petcenter",
  CLIENT_URL: "https://petcenter.vercel.app",
  JWT_ACCESS_SECRET: "a".repeat(40),
  JWT_REFRESH_SECRET: "b".repeat(40),
  STRIPE_SECRET_KEY: "sk_live_realkey",
  STRIPE_WEBHOOK_SECRET: "whsec_real",
  CLOUDINARY_CLOUD_NAME: "c",
  CLOUDINARY_API_KEY: "k",
  CLOUDINARY_API_SECRET: "s",
  SMTP_USER: "u",
  SMTP_PASS: "p",
});

describe("checkEnv", () => {
  it("accepts a complete production config with no warnings", () => {
    expect(checkEnv(goodEnv())).toEqual({ errors: [], warnings: [] });
  });

  it("reports every missing required variable", () => {
    const { errors } = checkEnv({ NODE_ENV: "production" });
    for (const key of ["MONGODB_URI", "CLIENT_URL", "JWT_ACCESS_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "CLOUDINARY_API_SECRET"]) {
      expect(errors).toContain(`${key} is not set`);
    }
  });

  it("rejects identical, short, or placeholder JWT secrets", () => {
    const same = checkEnv({ ...goodEnv(), JWT_REFRESH_SECRET: "a".repeat(40) });
    expect(same.errors.some((e) => /must be different/.test(e))).toBe(true);

    const short = checkEnv({ ...goodEnv(), JWT_ACCESS_SECRET: "tooshort" });
    expect(short.errors.some((e) => /at least 32/.test(e))).toBe(true);

    const placeholder = checkEnv({ ...goodEnv(), JWT_ACCESS_SECRET: "replace_with_a_long_random_string_xxxxxxxx" });
    expect(placeholder.errors.some((e) => /placeholder/.test(e))).toBe(true);
  });

  it("warns (but does not fail) on a localhost CLIENT_URL, test Stripe key, or missing SMTP", () => {
    const { errors, warnings } = checkEnv({
      ...goodEnv(),
      CLIENT_URL: "http://localhost:5173",
      STRIPE_SECRET_KEY: "sk_test_abc",
      SMTP_USER: undefined,
    });
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(3);
  });
});

describe("validateEnv", () => {
  it("does nothing outside production", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {});
    validateEnv({ NODE_ENV: "development" });
    expect(exit).not.toHaveBeenCalled();
    exit.mockRestore();
  });

  it("exits with a non-zero code when production config is invalid", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    validateEnv({ NODE_ENV: "production" });
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    error.mockRestore();
  });
});

describe("getClientOrigins", () => {
  it("defaults to the local Vite dev server", () => {
    expect(getClientOrigins({})).toEqual(["http://localhost:5173"]);
  });

  it("strips trailing slashes and whitespace, and supports several origins", () => {
    expect(getClientOrigins({ CLIENT_URL: " https://a.vercel.app/ , https://b.com//" })).toEqual([
      "https://a.vercel.app",
      "https://b.com",
    ]);
  });
});
