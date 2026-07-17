import { jest } from "@jest/globals";
jest.setTimeout(20000);
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// Mock sendMail so no real emails go out during tests
const mockSendMail = jest.fn();
jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({
    __esModule: true,
    default: mockSendMail,
}));

const { default: createApp } = await import("../../../app.js");

let mongoServer, app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(() => {
    mockSendMail.mockClear();
});

describe("Contact Form Integration Tests", () => {
    describe("POST /api/contact", () => {

        const validPayload = {
            name: "John Doe",
            email: "john@example.com",
            phone: "+919876543210",
            subject: "Partnership Inquiry",
            message: "Hello, I am interested in learning more about your services.",
        };

        it("should return 200 and send two emails on valid submission", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send(validPayload);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/sent successfully/i);

            // should send 2 emails: confirmation to user + notification to admin
            expect(mockSendMail).toHaveBeenCalledTimes(2);

            // first call — confirmation to submitter
            const [toUser] = mockSendMail.mock.calls[0];
            expect(toUser).toBe(validPayload.email);

            // second call — notification to admin
            const [toAdmin] = mockSendMail.mock.calls[1];
            expect(typeof toAdmin).toBe("string");
        });

        it("should return 400 if name is missing", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send({ ...validPayload, name: "" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 if email is invalid", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send({ ...validPayload, email: "not-an-email" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 if phone is invalid", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send({ ...validPayload, phone: "abc123" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 if subject is missing", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send({ ...validPayload, subject: "" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 if message is too short", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send({ ...validPayload, message: "Hi" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 if message is too long", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send({ ...validPayload, message: "a".repeat(2001) });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 if required fields are completely missing", async () => {
            const res = await request(app)
                .post("/api/contact")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should not send any emails if validation fails", async () => {
            await request(app)
                .post("/api/contact")
                .send({ ...validPayload, email: "bad-email" });

            expect(mockSendMail).not.toHaveBeenCalled();
        });

    });
});
