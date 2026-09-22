import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const generateContentMock = vi.fn();
let mockClient = null; // null = "no API key configured", matching real behavior

vi.mock("../src/config/gemini.js", () => ({
  getGeminiClient: () => mockClient,
}));

const { default: app } = await import("../app.js");

// The narration cache is keyed on petType + item names/prices — each test
// uses a distinct product name so tests never collide on the same cache
// entry (the cache is module-level and persists across tests in this file).
const makeItems = (marker) => [
  { category: "Tank / Aquarium", name: `AquaMaster Pro Tank (${marker})`, price: 14999 },
  { category: "Filter", name: "Cascade Internal Power Filter", price: 2499 },
  { category: "Heater", name: "ThermoGuard 100W Submersible Heater", price: 1999 },
];

// The real @google/genai response is a class with a `text` getter — a plain
// object with a `text` property behaves identically for `response.text`.
const geminiResponse = (text) => ({ text });

describe("POST /api/v1/ecosystem/narrate", () => {
  beforeEach(() => {
    generateContentMock.mockReset();
    mockClient = null;
  });

  it("rejects an unsupported pet type", async () => {
    const res = await request(app).post("/api/v1/ecosystem/narrate").send({ petType: "dragon", items: makeItems("a") });
    expect(res.status).toBe(400);
  });

  it("rejects an empty or missing items array", async () => {
    const res = await request(app).post("/api/v1/ecosystem/narrate").send({ petType: "fish", items: [] });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed item", async () => {
    const res = await request(app)
      .post("/api/v1/ecosystem/narrate")
      .send({ petType: "fish", items: [{ category: "Tank" }] }); // missing name/price
    expect(res.status).toBe(400);
  });

  it("falls back to a plain sentence when no API key is configured", async () => {
    mockClient = null;
    const items = makeItems("no-key");
    const res = await request(app).post("/api/v1/ecosystem/narrate").send({ petType: "fish", items });

    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe("fallback");
    expect(res.body.data.narration).toContain(items[0].name);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("uses the AI response when a client is configured", async () => {
    mockClient = { models: { generateContent: (...args) => generateContentMock(...args) } };
    generateContentMock.mockResolvedValue(geminiResponse("A lovely little aquatic setup."));
    const items = makeItems("ai-path");

    const res = await request(app)
      .post("/api/v1/ecosystem/narrate")
      .send({ petType: "fish", budget: 15000, totalPrice: 19497, overBudget: true, notes: ["went over"], items });

    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe("ai");
    expect(res.body.data.narration).toBe("A lovely little aquatic setup.");
    expect(generateContentMock).toHaveBeenCalledTimes(1);

    // The prompt must only ever reference the given real items — never invent.
    const [callArgs] = generateContentMock.mock.calls[0];
    expect(callArgs.model).toBe("gemini-flash-latest");
    for (const item of items) {
      expect(callArgs.contents).toContain(item.name);
    }
  });

  it("caches identical requests instead of calling the AI again", async () => {
    mockClient = { models: { generateContent: (...args) => generateContentMock(...args) } };
    generateContentMock.mockResolvedValue(geminiResponse("Cached-worthy explanation."));
    const items = makeItems("cache-test");

    const payload = { petType: "fish", items };
    const res1 = await request(app).post("/api/v1/ecosystem/narrate").send(payload);
    const res2 = await request(app).post("/api/v1/ecosystem/narrate").send(payload);

    expect(res1.body.data.narration).toBe("Cached-worthy explanation.");
    expect(res2.body.data.narration).toBe("Cached-worthy explanation.");
    expect(generateContentMock).toHaveBeenCalledTimes(1); // second call served from cache
  });

  it("falls back gracefully if the AI call throws", async () => {
    mockClient = { models: { generateContent: (...args) => generateContentMock(...args) } };
    generateContentMock.mockRejectedValue(new Error("upstream timeout"));
    const items = makeItems("throws");

    const res = await request(app)
      .post("/api/v1/ecosystem/narrate")
      .send({ petType: "fish", items });

    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe("fallback");
    expect(res.body.data.narration).toBeTruthy();
  });

  it("falls back gracefully if the response has no usable text", async () => {
    mockClient = { models: { generateContent: (...args) => generateContentMock(...args) } };
    generateContentMock.mockResolvedValue(geminiResponse(undefined));
    const items = makeItems("empty-response");

    const res = await request(app)
      .post("/api/v1/ecosystem/narrate")
      .send({ petType: "fish", items });

    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe("fallback");
    expect(res.body.data.narration).toContain(items[0].name);
  });
});
