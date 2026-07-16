import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import InvoiceDao from "../invoice.dao.js";
import CustomerDao from "../customer.dao.js";
import OrganizationDao from "../organization.dao.js";

const invoiceDao = new InvoiceDao();
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

describe("Invoice DAO Tests", () => {
    let org, customer;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        customer = await customerDao.create({ organizationId: org._id, name: "John Doe" });
    });

    it("should create an invoice successfully", async () => {
        const invoiceData = {
            organizationId: org._id,
            customerId: customer._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
            subTotal: 100.00,
            taxTotal: 18.00,
            discountTotal: 5.00,
            grandTotal: 113.00,
            status: "draft"
        };
        const invoice = await invoiceDao.create(invoiceData);
        expect(invoice).toBeDefined();
        expect(invoice.invoiceNumber).toBe("INV-2026-001");
        expect(invoice.grandTotal).toBe(113.00);
        expect(invoice.status).toBe("draft");
    });

    it("should fail to create duplicate invoice number in same organization", async () => {
        const inv1 = {
            organizationId: org._id,
            customerId: customer._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        };
        const inv2 = {
            organizationId: org._id,
            customerId: customer._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            subTotal: 200,
            taxTotal: 36,
            grandTotal: 236
        };

        await invoiceDao.create(inv1);
        await expect(invoiceDao.create(inv2)).rejects.toThrow();
    });

    it("should allow same invoice number in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });
        const customer2 = await customerDao.create({ organizationId: org2._id, name: "Jane Smith" });

        const inv1 = {
            organizationId: org._id,
            customerId: customer._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        };
        const inv2 = {
            organizationId: org2._id,
            customerId: customer2._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        };

        const i1 = await invoiceDao.create(inv1);
        const i2 = await invoiceDao.create(inv2);
        expect(i1).toBeDefined();
        expect(i2).toBeDefined();
    });

    it("should find invoice by id and populate relationship", async () => {
        const invoice = await invoiceDao.create({
            organizationId: org._id,
            customerId: customer._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        });

        const found = await invoiceDao.findById(invoice._id);
        expect(found).toBeDefined();
        expect(found.customerId.name).toBe("John Doe");
    });

    it("should update invoice details", async () => {
        const invoice = await invoiceDao.create({
            organizationId: org._id,
            customerId: customer._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        });

        const updated = await invoiceDao.updateById(invoice._id, { status: "sent" });
        expect(updated.status).toBe("sent");
    });

    it("should delete invoice by id", async () => {
        const invoice = await invoiceDao.create({
            organizationId: org._id,
            customerId: customer._id,
            invoiceNumber: "INV-2026-001",
            invoiceDate: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        });

        await invoiceDao.deleteById(invoice._id);
        const found = await invoiceDao.findById(invoice._id);
        expect(found).toBeNull();
    });
});
