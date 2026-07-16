import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import DocumentDao from "../document.dao.js";
import UserDao from "../user.dao.js";
import OrganizationDao from "../organization.dao.js";

const documentDao = new DocumentDao();
const userDao = new UserDao();
const organizationDao = new OrganizationDao();

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await disconnectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});

describe("Document DAO Tests", () => {
    let org, user;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        user = await userDao.createUser({ name: "Document User", email: "user@acme.com", password: "password123" });
    });

    it("should create a document successfully", async () => {
        const doc = await documentDao.create({
            organizationId: org._id,
            name: "Invoice PDF",
            documentType: "invoice",
            fileUrl: "https://bucket.s3/invoice.pdf",
            fileSize: 1024,
            generatedBy: user._id
        });
        expect(doc).toBeDefined();
        expect(doc.name).toBe("Invoice PDF");
        expect(doc.documentType).toBe("invoice");
        expect(doc.fileSize).toBe(1024);
    });

    it("should fail to create document without documentType or fileUrl", async () => {
        await expect(documentDao.create({
            organizationId: org._id,
            name: "Invoice PDF",
            fileUrl: "https://bucket.s3/invoice.pdf",
            generatedBy: user._id
        })).rejects.toThrow();

        await expect(documentDao.create({
            organizationId: org._id,
            name: "Invoice PDF",
            documentType: "invoice",
            generatedBy: user._id
        })).rejects.toThrow();
    });

    it("should find and populate document details", async () => {
        const doc = await documentDao.create({
            organizationId: org._id,
            name: "Invoice PDF",
            documentType: "invoice",
            fileUrl: "https://bucket.s3/invoice.pdf",
            generatedBy: user._id
        });

        const found = await documentDao.findById(doc._id);
        expect(found).toBeDefined();
        expect(found.generatedBy.email).toBe("user@acme.com");
    });

    it("should update document details", async () => {
        const doc = await documentDao.create({
            organizationId: org._id,
            name: "Invoice PDF",
            documentType: "invoice",
            fileUrl: "https://bucket.s3/invoice.pdf",
            generatedBy: user._id
        });

        const updated = await documentDao.updateById(doc._id, { name: "INV-2026-001.pdf" });
        expect(updated.name).toBe("INV-2026-001.pdf");
    });

    it("should delete document by id", async () => {
        const doc = await documentDao.create({
            organizationId: org._id,
            name: "Invoice PDF",
            documentType: "invoice",
            fileUrl: "https://bucket.s3/invoice.pdf",
            generatedBy: user._id
        });

        await documentDao.deleteById(doc._id);
        const found = await documentDao.findById(doc._id);
        expect(found).toBeNull();
    });
});
