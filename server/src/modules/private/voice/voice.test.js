import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// Mock the processor to prevent making actual Groq API calls during tests
jest.unstable_mockModule("./voice.processor.js", () => ({
  __esModule: true,
  processVoiceCommand: jest.fn(),
  transcribeAudio: jest.fn(),
}));

const { default: createApp } = await import("../../../app.js");
const { processVoiceCommand, transcribeAudio } = await import("./voice.processor.js");
const { default: User } = await import("../../../shared/models/user.model.js");
const { default: Organization } = await import("../../../shared/models/organization.model.js");

let mongoServer;
let app;
let testUser;
let testAccessToken;
let testOrg;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();

  // Seed organization & user
  testOrg = await Organization.create({
    name: "Voice Test Org",
    code: "VTST",
    email: "voice@example.com",
    taxRegistrationNumber: "TAX-123",
  });

  testUser = await User.create({
    name: "Voice Tester",
    email: "tester@example.com",
    password: "password123",
    organizationId: testOrg._id,
    isVerified: true,
    status: "active",
    providers: ["local"],
  });

  // Log in to get token
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "tester@example.com",
      password: "password123",
    });
  testAccessToken = loginRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Voice API Endpoints", () => {
  describe("POST /api/voice/command", () => {
    it("should process transcript and return message response", async () => {
      processVoiceCommand.mockResolvedValue({
        type: "message",
        message: "Hello world!",
      });

      const res = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({ transcript: "Hello" });

      expect(res.status).toBe(200);
      expect(res.body.data.action).toBe("message");
      expect(res.body.data.message).toBe("Hello world!");
    });

    it("should throw BadRequest if transcript is empty", async () => {
      const res = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({ transcript: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/voice/audio", () => {
    it("should fail if no file is uploaded", async () => {
      const res = await request(app)
        .post("/api/voice/audio")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("No audio file uploaded.");
    });
  });
});
