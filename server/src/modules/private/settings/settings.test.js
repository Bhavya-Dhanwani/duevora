import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({ __esModule: true, default: jest.fn() }));

const { default: createApp } = await import("../../../app.js");
const { default: User } = await import("../../../shared/models/user.model.js");
const { default: Permission } = await import("../../../shared/models/permission.model.js");

let mongoServer, app, orgId, adminUserToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    for (const key in mongoose.connection.collections) { await mongoose.connection.collections[key].deleteMany({}); }
    await Permission.create({ name: "Update Settings", code: "SETTINGS.UPDATE", module: "settings" });
    await User.create({ name: "Admin User", email: "admin@example.com", password: "password123", isVerified: true });
    const loginRes = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "password123" });
    const onboardRes = await request(app).post("/api/organization").set("Authorization", `Bearer ${loginRes.body.data.accessToken}`)
        .send({ name: "Test Corp", code: "TCORP", firstName: "Admin", lastName: "User" });
    adminUserToken = onboardRes.body.data.accessToken;
    orgId = onboardRes.body.data.organization._id;
});

describe("Settings Integration Tests", () => {
    describe("PUT /api/settings", () => {
        it("should create or update a setting", async () => {
            const res = await request(app)
                .put("/api/settings")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({ key: "currency", value: "INR" });
            expect(res.status).toBe(200);
            expect(res.body.data.key).toBe("currency");
            expect(res.body.data.value).toBe("INR");
        });

        it("should update an existing setting (upsert)", async () => {
            await request(app).put("/api/settings").set("Authorization", `Bearer ${adminUserToken}`).send({ key: "currency", value: "USD" });
            const res = await request(app).put("/api/settings").set("Authorization", `Bearer ${adminUserToken}`).send({ key: "currency", value: "INR" });
            expect(res.status).toBe(200);
            expect(res.body.data.value).toBe("INR");
        });

        it("should return 400 if key or value missing", async () => {
            const res = await request(app).put("/api/settings").set("Authorization", `Bearer ${adminUserToken}`).send({ key: "" });
            expect(res.status).toBe(400);
        });
    });
});
