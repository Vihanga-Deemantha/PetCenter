import { describe, it, expect } from "vitest";
import Campaign from "../src/models/Campaign.js";
import User from "../src/models/User.js";

async function makeAdmin() {
  return User.create({
    name: "Admin",
    email: `admin_${Date.now()}_${Math.random()}@test.com`,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
    role: "admin",
  });
}

// Campaign descriptions are admin-authored rich text rendered on the public
// detail page via dangerouslySetInnerHTML — this only stays safe because the
// model's pre-save hook sanitizes against an explicit allow-list. This is a
// direct regression test for that specific guarantee.
describe("Campaign model — description/title/shortDescription are sanitized on save", () => {
  it("strips a <script> tag and event-handler attributes from the description", async () => {
    const admin = await makeAdmin();
    const campaign = await Campaign.create({
      title: "Help the shelter",
      shortDescription: "short",
      description: '<p>Please help</p><script>alert(document.cookie)</script><img src=x onerror="alert(1)">',
      goalAmount: 10000,
      category: "medical",
      createdBy: admin._id,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
    });

    expect(campaign.description).not.toContain("<script>");
    expect(campaign.description).not.toContain("onerror");
    expect(campaign.description).not.toContain("<img");
    expect(campaign.description).toContain("<p>Please help</p>");
  });

  it("blocks a javascript: URI in a link href", async () => {
    const admin = await makeAdmin();
    const campaign = await Campaign.create({
      title: "Help the shelter",
      shortDescription: "short",
      description: '<a href="javascript:alert(1)">click me</a>',
      goalAmount: 10000,
      category: "medical",
      createdBy: admin._id,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
    });

    expect(campaign.description).not.toContain("javascript:");
  });

  it("strips all HTML from title and shortDescription (plain text only)", async () => {
    const admin = await makeAdmin();
    const campaign = await Campaign.create({
      title: '<b>Bold title</b><script>alert(1)</script>',
      shortDescription: '<i>short</i>',
      description: "desc",
      goalAmount: 10000,
      category: "medical",
      createdBy: admin._id,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
    });

    expect(campaign.title).not.toMatch(/[<>]/);
    expect(campaign.shortDescription).not.toMatch(/[<>]/);
  });
});
