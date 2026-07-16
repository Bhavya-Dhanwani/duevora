import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import mongoose from "mongoose";
import PaymentDao from "../payment.dao.js";
import VendorDao from "../vendor.dao.js";
import PurchaseDao from "../purchase.dao.js";
import OrganizationDao from "../organization.dao.js";

const paymentDao = new PaymentDao();
const vendorDao = new VendorDao();
const purchaseDao = new PurchaseDao();
const organizationDao = new OrganizationDao();

beforeAll(async () => {
    await connectTestDB();
    // Dynamically register dummy Account schema so populate("accountId") works in isolation
    if (!mongoose.models.Account) {
        mongoose.model("Account", new mongoose.Schema({ name: String }));
    }
});

afterAll(async () => {
    await disconnectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});

describe("Payment DAO Tests", () => {
    let org, vendor, purchase, mockAccountId;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        vendor = await vendorDao.create({ organizationId: org._id, name: "Supplier Inc" });
        purchase = await purchaseDao.create({
            organizationId: org._id,
            vendorId: vendor._id,
            purchaseNumber: "BILL-2026-001",
            purchaseDate: new Date(),
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118
        });
        // Create an account in the registered dummy model
        const AccountModel = mongoose.model("Account");
        const account = await new AccountModel({ name: "Cash Account" }).save();
        mockAccountId = account._id;
    });

    it("should create a payment record successfully", async () => {
        const paymentData = {
            organizationId: org._id,
            vendorId: vendor._id,
            purchaseId: purchase._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 500.00,
            paymentMethod: "Bank Transfer",
            accountId: mockAccountId
        };
        const payment = await paymentDao.create(paymentData);
        expect(payment).toBeDefined();
        expect(payment.paymentNumber).toBe("PAY-2026-001");
        expect(payment.amount).toBe(500.00);
        expect(payment.paymentMethod).toBe("Bank Transfer");
    });

    it("should fail to create duplicate payment number in same organization", async () => {
        const p1 = {
            organizationId: org._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 100,
            paymentMethod: "Cash",
            accountId: mockAccountId
        };
        const p2 = {
            organizationId: org._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 200,
            paymentMethod: "Cash",
            accountId: mockAccountId
        };

        await paymentDao.create(p1);
        await expect(paymentDao.create(p2)).rejects.toThrow();
    });

    it("should allow same payment number in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });

        const p1 = {
            organizationId: org._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 100,
            paymentMethod: "Cash",
            accountId: mockAccountId
        };
        const p2 = {
            organizationId: org2._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 100,
            paymentMethod: "Cash",
            accountId: mockAccountId
        };

        const pay1 = await paymentDao.create(p1);
        const pay2 = await paymentDao.create(p2);
        expect(pay1).toBeDefined();
        expect(pay2).toBeDefined();
    });

    it("should find payment by id and populate relationships", async () => {
        const payment = await paymentDao.create({
            organizationId: org._id,
            vendorId: vendor._id,
            purchaseId: purchase._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 100,
            paymentMethod: "Cash",
            accountId: mockAccountId
        });

        const found = await paymentDao.findById(payment._id);
        expect(found).toBeDefined();
        expect(found.vendorId.name).toBe("Supplier Inc");
        expect(found.purchaseId.purchaseNumber).toBe("BILL-2026-001");
        expect(found.accountId.name).toBe("Cash Account");
    });

    it("should update payment details", async () => {
        const payment = await paymentDao.create({
            organizationId: org._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 100,
            paymentMethod: "Cash",
            accountId: mockAccountId
        });

        const updated = await paymentDao.updateById(payment._id, { amount: 150 });
        expect(updated.amount).toBe(150);
    });

    it("should delete payment by id", async () => {
        const payment = await paymentDao.create({
            organizationId: org._id,
            paymentNumber: "PAY-2026-001",
            paymentDate: new Date(),
            amount: 100,
            paymentMethod: "Cash",
            accountId: mockAccountId
        });

        await paymentDao.deleteById(payment._id);
        const found = await paymentDao.findById(payment._id);
        expect(found).toBeNull();
    });
});
