import { describe, it, expect } from "vitest";
import request from "supertest";
import Shelter from "../src/models/Shelter.js";

const { default: app } = await import("../app.js");

describe("GET /api/v1/admin/stats/public — shelter count", () => {
  it("counts active shelters instead of a non-existent 'approved' status field", async () => {
    await Shelter.create({
      name: "Test Shelter",
      type: "shelter",
      description: "A place for pets",
      location: { city: "Colombo", country: "Sri Lanka" },
      isActive: true,
    });
    await Shelter.create({
      name: "Inactive Shelter",
      type: "shelter",
      description: "Closed down",
      location: { city: "Kandy", country: "Sri Lanka" },
      isActive: false,
    });

    const res = await request(app).get("/api/v1/admin/stats/public");

    expect(res.status).toBe(200);
    expect(res.body.data.globalPartners).toBe(1);
  });
});
