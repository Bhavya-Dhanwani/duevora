import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import QuotationDao from "../quotation.dao.js";
import CustomerDao from "../customer.dao.js";
import OrganizationDao from "../organization.dao.js";

const quotationDao = new QuotationDao();
const customerDao = new CustomerDao();
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

describe("Quotation DAO Tests", () => {
    let org, customer;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        customer = await customerDao.create({ organizationId: org._id, name: "John Doe" });
    });

    it("should create a quotation successfully", async () => {
        const quotationData = {
            organizationId: org._id,
            customerId: customer._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            expiryDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
            subTotal: 100.00,
            taxTotal: 18.00,
            grandTotal: 118.00,
            status: "draft"
        };
        const quotation = await quotationDao.create(quotationData);
        expect(quotation).toBeDefined();
        expect(quotation.quotationNumber).toBe("QT-2026-001");
        expect(quotation.grandTotal).toBe(118.00);
        expect(quotation.status).toBe("draft");
    });

    it("should fail to create duplicate quotation number in same organization", async () => {
        const qt1 = {
            organizationId: org._id,
            customerId: customer._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        };
        const qt2 = {
            organizationId: org._id,
            customerId: customer._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            subTotal: 200,
            taxTotal: 36,
            grandTotal: 236
        };

        await quotationDao.create(qt1);
        await expect(quotationDao.create(qt2)).rejects.toThrow();
    });

    it("should allow same quotation number in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });
        const customer2 = await customerDao.create({ organizationId: org2._id, name: "Jane Smith" });

        const qt1 = {
            organizationId: org._id,
            customerId: customer._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        };
        const qt2 = {
            organizationId: org2._id,
            customerId: customer2._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        };

        const q1 = await quotationDao.create(qt1);
        const q2 = await quotationDao.create(qt2);
        expect(q1).toBeDefined();
        expect(q2).toBeDefined();
    });

    it("should find quotation by id and populate relationship", async () => {
        const quotation = await quotationDao.create({
            organizationId: org._id,
            customerId: customer._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        });

        const found = await quotationDao.findById(quotation._id);
        expect(found).toBeDefined();
        expect(found.customerId.name).toBe("John Doe");
    });

    it("should update quotation details", async () => {
        const quotation = await quotationDao.create({
            organizationId: org._id,
            customerId: customer._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        });

        const updated = await quotationDao.updateById(quotation._id, { status: "sent" });
        expect(updated.status).toBe("sent");
    });

    it("should delete quotation by id", async () => {
        const quotation = await quotationDao.create({
            organizationId: org._id,
            customerId: customer._id,
            quotationNumber: "QT-2026-001",
            date: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        });

        await quotationDao.deleteById(quotation._id);
        const found = await quotationDao.findById(quotation._id);
        expect(found).toBeNull();
    });
});
