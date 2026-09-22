import { describe, it, expect } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Ownership Test User",
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

async function makeBuild(token, overrides = {}) {
  const tank = await makeTank();
  const res = await request(app)
    .post("/api/v1/ecosystem/builds")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "My Build", petType: "fish", selections: [{ productId: tank._id, categoryKey: "tank" }], ...overrides });
  return res.body.data;
}

// Fish builds require tank + filter + heater to be publish-eligible.
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

describe("Ecosystem build ownership", () => {
  it("forbids a different user from updating someone else's build", async () => {
    const owner = await registerAndLogin("ecoowner1@test.com");
    const intruder = await registerAndLogin("ecointruder1@test.com");
    const build = await makeBuild(owner.token);

    const res = await request(app)
      .put(`/api/v1/ecosystem/builds/${build._id}`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ name: "Hijacked name" });

    expect(res.status).toBe(403);
  });

  it("forbids a different user from deleting someone else's build", async () => {
    const owner = await registerAndLogin("ecoowner2@test.com");
    const intruder = await registerAndLogin("ecointruder2@test.com");
    const build = await makeBuild(owner.token);

    const res = await request(app)
      .delete(`/api/v1/ecosystem/builds/${build._id}`)
      .set("Authorization", `Bearer ${intruder.token}`);

    expect(res.status).toBe(403);
  });

  it("forbids a different user from publishing someone else's build", async () => {
    const owner = await registerAndLogin("ecoowner3@test.com");
    const intruder = await registerAndLogin("ecointruder3@test.com");
    const build = await makeBuild(owner.token);

    const res = await request(app)
      .patch(`/api/v1/ecosystem/builds/${build._id}/publish`)
      .set("Authorization", `Bearer ${intruder.token}`);

    expect(res.status).toBe(403);
  });
});

describe("Ecosystem gallery scoping", () => {
  it("does not expose an unpublished build via the gallery detail endpoint", async () => {
    const owner = await registerAndLogin("ecoowner4@test.com");
    const build = await makeBuild(owner.token);

    const res = await request(app).get(`/api/v1/ecosystem/gallery/${build._id}`);
    expect(res.status).toBe(404);
  });

  it("excludes unpublished builds from the gallery list", async () => {
    const owner = await registerAndLogin("ecoowner5@test.com");
    const build = await makeBuild(owner.token); // stays unpublished

    const res = await request(app).get("/api/v1/ecosystem/gallery");
    expect(res.status).toBe(200);
    const ids = res.body.data.map((b) => b._id);
    expect(ids).not.toContain(String(build._id));
  });

  it("includes a build once it's published", async () => {
    const owner = await registerAndLogin("ecoowner6@test.com");
    const build = await makePublishableBuild(owner.token);

    const publishRes = await request(app)
      .patch(`/api/v1/ecosystem/builds/${build._id}/publish`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(publishRes.status).toBe(200);

    const res = await request(app).get("/api/v1/ecosystem/gallery");
    const ids = res.body.data.map((b) => b._id);
    expect(ids).toContain(String(build._id));
  });
});

describe("Publish integrity — a published build can't be edited into an incomplete one", () => {
  it("rejects an update that would drop a required category while the build stays published", async () => {
    const owner = await registerAndLogin("ecopublishedit@test.com");
    const build = await makePublishableBuild(owner.token);

    const publishRes = await request(app)
      .patch(`/api/v1/ecosystem/builds/${build._id}/publish`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.isPublished).toBe(true);

    const tankSelection = build.selections.find((s) => s.categoryKey === "tank");
    const res = await request(app)
      .put(`/api/v1/ecosystem/builds/${build._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ selections: [{ productId: tankSelection.productId, categoryKey: "tank" }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/published/i);

    // The gallery must still be serving the original, complete build.
    const galleryRes = await request(app).get(`/api/v1/ecosystem/gallery/${build._id}`);
    expect(galleryRes.status).toBe(200);
    expect(galleryRes.body.data.selections).toHaveLength(3);
  });

  it("still allows editing a published build as long as required categories stay filled", async () => {
    const owner = await registerAndLogin("ecopublisheditok@test.com");
    const build = await makePublishableBuild(owner.token);
    await request(app)
      .patch(`/api/v1/ecosystem/builds/${build._id}/publish`)
      .set("Authorization", `Bearer ${owner.token}`);

    const newTank = await makeTank();
    const otherSelections = build.selections
      .filter((s) => s.categoryKey !== "tank")
      .map((s) => ({ productId: s.productId, categoryKey: s.categoryKey }));

    const res = await request(app)
      .put(`/api/v1/ecosystem/builds/${build._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ selections: [...otherSelections, { productId: newTank._id, categoryKey: "tank" }] });

    expect(res.status).toBe(200);
    expect(res.body.data.isPublished).toBe(true);
    expect(res.body.data.selections).toHaveLength(3);
  });
});
