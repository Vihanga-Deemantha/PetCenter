import { describe, it, expect } from "vitest";
import request from "supertest";
import { createNotification } from "../src/controllers/notification.controller.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Notification Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

describe("GET /api/v1/notifications", () => {
  it("returns only the current user's notifications with an unread count", async () => {
    const a = await registerAndLogin("notif1@test.com");
    const b = await registerAndLogin("notif2@test.com");
    await createNotification({ userId: a.userId, type: "order_status_changed", title: "A's notif", message: "msg" });
    await createNotification({ userId: b.userId, type: "order_status_changed", title: "B's notif", message: "msg" });

    const res = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("A's notif");
    expect(res.body.unreadCount).toBe(1);
  });
});

describe("GET /api/v1/notifications/unread-count", () => {
  it("counts only unread notifications for this user", async () => {
    const { userId, token } = await registerAndLogin("notif3@test.com");
    await createNotification({ userId, type: "order_status_changed", title: "One", message: "m" });
    await createNotification({ userId, type: "order_status_changed", title: "Two", message: "m" });

    const res = await request(app).get("/api/v1/notifications/unread-count").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
  });
});

describe("PATCH /api/v1/notifications/:id/read", () => {
  it("marks the caller's own notification as read", async () => {
    const { userId, token } = await registerAndLogin("notif4@test.com");
    const n = await createNotification({ userId, type: "order_status_changed", title: "x", message: "m" });
    const list = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${token}`);
    const id = list.body.data[0]._id;

    const res = await request(app).patch(`/api/v1/notifications/${id}/read`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });

  it("refuses to mark another user's notification as read (IDOR)", async () => {
    const owner = await registerAndLogin("notif5@test.com");
    const intruder = await registerAndLogin("notif6@test.com");
    await createNotification({ userId: owner.userId, type: "order_status_changed", title: "x", message: "m" });
    const list = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${owner.token}`);
    const id = list.body.data[0]._id;

    const res = await request(app).patch(`/api/v1/notifications/${id}/read`).set("Authorization", `Bearer ${intruder.token}`);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/notifications/read-all", () => {
  it("marks every unread notification for this user as read", async () => {
    const { userId, token } = await registerAndLogin("notif7@test.com");
    await createNotification({ userId, type: "order_status_changed", title: "One", message: "m" });
    await createNotification({ userId, type: "order_status_changed", title: "Two", message: "m" });

    const res = await request(app).patch("/api/v1/notifications/read-all").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const countRes = await request(app).get("/api/v1/notifications/unread-count").set("Authorization", `Bearer ${token}`);
    expect(countRes.body.data.count).toBe(0);
  });
});

describe("DELETE /api/v1/notifications/:id", () => {
  it("deletes the caller's own notification", async () => {
    const { userId, token } = await registerAndLogin("notif8@test.com");
    await createNotification({ userId, type: "order_status_changed", title: "x", message: "m" });
    const list = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${token}`);
    const id = list.body.data[0]._id;

    const res = await request(app).delete(`/api/v1/notifications/${id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const after = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${token}`);
    expect(after.body.data).toHaveLength(0);
  });

  it("refuses to delete another user's notification (IDOR)", async () => {
    const owner = await registerAndLogin("notif9@test.com");
    const intruder = await registerAndLogin("notif10@test.com");
    await createNotification({ userId: owner.userId, type: "order_status_changed", title: "x", message: "m" });
    const list = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${owner.token}`);
    const id = list.body.data[0]._id;

    const res = await request(app).delete(`/api/v1/notifications/${id}`).set("Authorization", `Bearer ${intruder.token}`);
    expect(res.status).toBe(404);

    const stillThere = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${owner.token}`);
    expect(stillThere.body.data).toHaveLength(1);
  });
});
