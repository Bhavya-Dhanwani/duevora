import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import UserDao from "../user.dao.js";

const userDao = new UserDao();

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await disconnectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});

describe("User DAO Tests", () => {
    it("should create a user successfully", async () => {
        const userData = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
        };
        const user = await userDao.createUser(userData);
        expect(user).toBeDefined();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.isVerified).toBe(false);
    });

    it("should find user by email", async () => {
        const userData = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
        };
        await userDao.createUser(userData);
        const found = await userDao.findUserByEmail("john@example.com");
        expect(found).toBeDefined();
        expect(found.name).toBe("John Doe");
    });

    it("should find user by id", async () => {
        const user = await userDao.createUser({
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
        });
        const found = await userDao.findUserById(user._id);
        expect(found).toBeDefined();
        expect(found.email).toBe("john@example.com");
    });

    it("should update user by id", async () => {
        const user = await userDao.createUser({
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
        });
        const updated = await userDao.updateUserById(user._id, { name: "John Updated" });
        expect(updated.name).toBe("John Updated");
    });

    it("should delete user by id", async () => {
        const user = await userDao.createUser({
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
        });
        await userDao.deleteUserById(user._id);
        const found = await userDao.findUserById(user._id);
        expect(found).toBeNull();
    });
});
