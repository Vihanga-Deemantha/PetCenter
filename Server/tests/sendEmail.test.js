import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMailMock = vi.fn().mockResolvedValue({});
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
vi.mock("nodemailer", () => ({ default: { createTransport: (...a) => createTransportMock(...a) } }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", (...a) => fetchMock(...a));

const { default: sendEmail, extractAddress } = await import("../src/utils/sendEmail.js");

const ENV_KEYS = ["BREVO_API_KEY", "EMAIL_FROM", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "NODE_ENV"];
let saved;
beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) if (k !== "NODE_ENV") delete process.env[k];
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 201, json: async () => ({ messageId: "x" }) });
  createTransportMock.mockClear();
  sendMailMock.mockClear();
});
afterEach(() => {
  for (const k of ENV_KEYS) saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]);
});

const MAIL = { to: "user@example.com", subject: "Reset", html: "<p>hi</p>" };

describe("extractAddress", () => {
  it("accepts a bare address", () => {
    expect(extractAddress("no-reply@example.com")).toBe("no-reply@example.com");
  });
  it("pulls the address out of 'Name <address>', with or without quotes", () => {
    expect(extractAddress("PetCenter <no-reply@example.com>")).toBe("no-reply@example.com");
    expect(extractAddress('"PetCenter <no-reply@example.com>"')).toBe("no-reply@example.com");
  });
});

describe("sendEmail — Brevo HTTP API", () => {
  beforeEach(() => {
    process.env.BREVO_API_KEY = "xkeysib-test";
    process.env.EMAIL_FROM = "PetCenter <no-reply@example.com>";
  });

  it("POSTs to Brevo's transactional endpoint with the api-key header and correct payload", async () => {
    await sendEmail(MAIL);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init.method).toBe("POST");
    expect(init.headers["api-key"]).toBe("xkeysib-test");
    expect(JSON.parse(init.body)).toEqual({
      sender: { name: "PetCenter", email: "no-reply@example.com" },
      to: [{ email: "user@example.com" }],
      subject: "Reset",
      htmlContent: "<p>hi</p>",
    });
  });

  it("does not touch SMTP when the API key is set, even if SMTP creds also exist", async () => {
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    await sendEmail(MAIL);
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("falls back to SMTP_FROM when EMAIL_FROM isn't set", async () => {
    delete process.env.EMAIL_FROM;
    process.env.SMTP_FROM = "legacy@example.com";
    await sendEmail(MAIL);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).sender.email).toBe("legacy@example.com");
  });

  it("throws a clear error, without leaking the key, when Brevo rejects the request", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: "Key not found" }) });
    const err = await sendEmail(MAIL).catch((e) => e);
    expect(err.message).toBe("Brevo API 401: Key not found");
    expect(err.message).not.toContain("xkeysib-test");
  });

  it("still throws a status-only error when Brevo's error body isn't JSON", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error("not json"); } });
    await expect(sendEmail(MAIL)).rejects.toThrow("Brevo API 502");
  });

  it("refuses to send without a sender address", async () => {
    delete process.env.EMAIL_FROM;
    await expect(sendEmail(MAIL)).rejects.toThrow(/EMAIL_FROM/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sendEmail — SMTP fallback", () => {
  beforeEach(() => {
    Object.assign(process.env, {
      SMTP_HOST: "smtp-relay.brevo.com",
      SMTP_PORT: "587",
      SMTP_USER: "abc123@smtp-brevo.com",
      SMTP_PASS: "xsmtpsib-test",
      SMTP_FROM: "PetCenter <no-reply@example.com>",
    });
  });

  it("is used when there's no Brevo API key, with a well-formed From header", async () => {
    await sendEmail(MAIL);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendMailMock.mock.calls[0][0].from).toBe('"PetCenter" <no-reply@example.com>');
  });

  it("uses STARTTLS on 587/2525 and implicit TLS on 465", async () => {
    for (const [port, secure] of [["587", false], ["2525", false], ["465", true]]) {
      process.env.SMTP_PORT = port;
      await sendEmail(MAIL);
      const cfg = createTransportMock.mock.calls.at(-1)[0];
      expect(cfg.port).toBe(Number(port));
      expect(cfg.secure).toBe(secure);
    }
  });

  it("sets short connection timeouts so a blocked port fails fast", async () => {
    await sendEmail(MAIL);
    const cfg = createTransportMock.mock.calls[0][0];
    expect(cfg.connectionTimeout).toBeLessThanOrEqual(15000);
  });
});

describe("sendEmail — no provider configured", () => {
  it("throws in production rather than pretending the email was sent", async () => {
    process.env.NODE_ENV = "production";
    await expect(sendEmail(MAIL)).rejects.toThrow(/No email provider configured/);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("logs to the console outside production", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendEmail(MAIL);
    expect(log).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
