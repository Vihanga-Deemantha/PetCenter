import { describe, it, expect } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";
import EcosystemBuild from "../src/models/EcosystemBuild.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Ecosystem Misc Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function makeTank() {
  return Product.create({
    name: "Fish Tank",
    description: "A tank",
    price: 5000,
    category: "habitat",
    stock: 5,
    isActive: true,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    compatiblePets: ["fish"],
    tags: ["tank"],
  });
}

async function makePublishableBuild(token) {
  const [tank, filter, heater] = await Promise.all([
    makeTank(),
    Product.create({ name: "Filter", description: "d", price: 2000, category: "habitat", stock: 5, isActive: true, images: [{ url: "http://example.com/a.png", publicId: "a" }], compatiblePets: ["fish"], tags: ["filter"] }),
    Product.create({ name: "Heater", description: "d", price: 2500, category: "habitat", stock: 5, isActive: true, images: [{ url: "http://example.com/a.png", publicId: "a" }], compatiblePets: ["fish"], tags: ["heater"] }),
  ]);
  const res = await request(app)
    .post("/api/v1/ecosystem/builds")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Full Build",
      petType: "fish",
      selections: [
        { productId: tank._id, categoryKey: "tank" },
        { productId: filter._id, categoryKey: "filter" },
        { productId: heater._id, categoryKey: "heater" },
      ],
    });
  return res.body.data;
}

describe("GET /api/v1/ecosystem/pets", () => {
  it("returns the list of supported pet types", async () => {
    const res = await request(app).get("/api/v1/ecosystem/pets");
    expect(res.status).toBe(200);
    expect(res.body.data.some((p) => p.key === "fish")).toBe(true);
  });
});

describe("GET /api/v1/ecosystem/pets/:petType/config", () => {
  it("returns the habitat profile for a valid pet type", async () => {
    const res = await request(app).get("/api/v1/ecosystem/pets/fish/config");
    expect(res.status).toBe(200);
    expect(res.body.data.categories.some((c) => c.key === "tank")).toBe(true);
  });

  it("rejects an unsupported pet type", async () => {
    const res = await request(app).get("/api/v1/ecosystem/pets/dragon/config");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/ecosystem/my-builds", () => {
  it("only returns the caller's own builds", async () => {
    const a = await registerAndLogin("ecomisc1@test.com");
    const b = await registerAndLogin("ecomisc2@test.com");
    await makePublishableBuild(a.token);

    const aRes = await request(app).get("/api/v1/ecosystem/my-builds").set("Authorization", `Bearer ${a.token}`);
    expect(aRes.status).toBe(200);
    expect(aRes.body.data).toHaveLength(1);

    const bRes = await request(app).get("/api/v1/ecosystem/my-builds").set("Authorization", `Bearer ${b.token}`);
    expect(bRes.body.data).toHaveLength(0);
  });
});

describe("POST /api/v1/ecosystem/gallery/:id/clone", () => {
  it("deep-copies a published build into the cloner's own builds and increments cloneCount once", async () => {
    const owner = await registerAndLogin("ecomisc3@test.com");
    const cloner = await registerAndLogin("ecomisc4@test.com");
    const build = await makePublishableBuild(owner.token);
    await request(app).patch(`/api/v1/ecosystem/builds/${build._id}/publish`).set("Authorization", `Bearer ${owner.token}`);

    const res = await request(app).post(`/api/v1/ecosystem/gallery/${build._id}/clone`).set("Authorization", `Bearer ${cloner.token}`);
    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe(String(cloner.userId));
    expect(res.body.data.isPublished).toBe(false);
    expect(res.body.data.selections).toHaveLength(3);
    expect(res.body.data.clonedFrom).toBe(String(build._id));

    const original = await EcosystemBuild.findById(build._id);
    expect(original.cloneCount).toBe(1);

    // Editing the clone must not affect the original (no shared references)
    const cloneId = res.body.data._id;
    const newTank = await makeTank();
    const remainingSelections = res.body.data.selections
      .filter((s) => s.categoryKey !== "tank")
      .map((s) => ({ productId: s.productId, categoryKey: s.categoryKey }));
    await request(app)
      .put(`/api/v1/ecosystem/builds/${cloneId}`)
      .set("Authorization", `Bearer ${cloner.token}`)
      .send({ selections: [...remainingSelections, { productId: newTank._id, categoryKey: "tank" }] });

    const originalAfter = await EcosystemBuild.findById(build._id);
    expect(originalAfter.selections.find((s) => s.categoryKey === "tank").productId.toString()).not.toBe(newTank._id.toString());
  });

  it("refuses to clone an unpublished build", async () => {
    const owner = await registerAndLogin("ecomisc5@test.com");
    const cloner = await registerAndLogin("ecomisc6@test.com");
    const build = await makePublishableBuild(owner.token); // stays unpublished

    const res = await request(app).post(`/api/v1/ecosystem/gallery/${build._id}/clone`).set("Authorization", `Bearer ${cloner.token}`);
    expect(res.status).toBe(404);
  });
});
