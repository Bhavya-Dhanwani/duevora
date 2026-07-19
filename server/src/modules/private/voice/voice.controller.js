import { processVoiceCommand, transcribeAudio } from "./voice.processor.js";
import fs from "node:fs";
import mongoose from "mongoose";

import CustomerDao from "../../../shared/dao/customer.dao.js";
import VendorDao from "../../../shared/dao/vendor.dao.js";
import ProductDao from "../../../shared/dao/product.dao.js";
import InvoiceDao from "../../../shared/dao/invoice.dao.js";
import PurchaseDao from "../../../shared/dao/purchase.dao.js";
import InvoiceItemDao from "../../../shared/dao/invoiceItem.dao.js";
import PurchaseItemDao from "../../../shared/dao/purchaseItem.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";
import TaxDao from "../../../shared/dao/tax.dao.js";
import WarehouseDao from "../../../shared/dao/warehouse.dao.js";
import InventoryDao from "../../../shared/dao/inventory.dao.js";
import StockMovementDao from "../../../shared/dao/stockMovement.dao.js";
import JournalEntryDao from "../../../shared/dao/journalEntry.dao.js";
import JournalEntryLineDao from "../../../shared/dao/journalEntryLine.dao.js";
import LedgerEntryDao from "../../../shared/dao/ledgerEntry.dao.js";

import Ok from "../../../shared/responses/Ok.response.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";

class VoiceController {
  constructor() {
    this.customerDao = new CustomerDao();
    this.vendorDao = new VendorDao();
    this.productDao = new ProductDao();
    this.invoiceDao = new InvoiceDao();
    this.purchaseDao = new PurchaseDao();
    this.invoiceItemDao = new InvoiceItemDao();
    this.purchaseItemDao = new PurchaseItemDao();
    this.accountDao = new AccountDao();
    this.taxDao = new TaxDao();
    this.warehouseDao = new WarehouseDao();
    this.inventoryDao = new InventoryDao();
    this.stockMovementDao = new StockMovementDao();
    this.journalEntryDao = new JournalEntryDao();
    this.journalEntryLineDao = new JournalEntryLineDao();
    this.ledgerEntryDao = new LedgerEntryDao();
  }

  processCommand = async (req, res) => {
    const { transcript, messages } = req.body;
    const organizationId = req.user.organizationId;

    const parsedMessages = this._parseMessages(messages, transcript);

    if (parsedMessages.length === 0) {
      throw new BadRequest("No speech detected. Please try again.");
    }

    const result = await processVoiceCommand(parsedMessages, organizationId);

    if (result.type === "message") {
      return Ok(res, "Command processed", { action: "message", message: result.message });
    }

    if (result.type === "error") {
      throw new BadRequest(result.message);
    }

    if (result.type === "tool_call") {
      if (result.tool === "create_invoice") {
        const invoice = await this._createInvoice(organizationId, result.args);
        return Ok(res, "Invoice created successfully via voice", {
          action: "invoice_created",
          data: invoice,
          confirmation: result.confirmation,
        });
      }

      if (result.tool === "create_purchase") {
        const purchase = await this._createPurchase(organizationId, result.args);
        return Ok(res, "Purchase created successfully via voice", {
          action: "purchase_created",
          data: purchase,
          confirmation: result.confirmation,
        });
      }
    }

    throw new BadRequest("Could not process the voice command.");
  };

  processAudioCommand = async (req, res) => {
    const organizationId = req.user.organizationId;
    const { messages: rawMessages } = req.body || {};

    if (!req.file) {
      throw new BadRequest("No audio file uploaded.");
    }

    let transcript;
    try {
      transcript = await transcribeAudio(req.file.path);
    } catch (err) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      throw new BadRequest(`Transcription failed: ${err.message}`);
    }

    try {
      fs.unlinkSync(req.file.path);
    } catch {}

    const parsedMessages = this._parseMessages(rawMessages, transcript);

    if (parsedMessages.length === 0) {
      throw new BadRequest("No speech detected. Please try again.");
    }

    const result = await processVoiceCommand(parsedMessages, organizationId);

    if (result.type === "message") {
      return Ok(res, "Command processed", { action: "message", message: result.message, transcript });
    }

    if (result.type === "error") {
      throw new BadRequest(result.message);
    }

    if (result.type === "tool_call") {
      if (result.tool === "create_invoice") {
        const invoice = await this._createInvoice(organizationId, result.args);
        return Ok(res, "Invoice created successfully via voice", {
          action: "invoice_created",
          data: invoice,
          confirmation: result.confirmation,
          transcript,
        });
      }

      if (result.tool === "create_purchase") {
        const purchase = await this._createPurchase(organizationId, result.args);
        return Ok(res, "Purchase created successfully via voice", {
          action: "purchase_created",
          data: purchase,
          confirmation: result.confirmation,
          transcript,
        });
      }
    }

    throw new BadRequest("Could not process the voice command.");
  };

  _parseMessages = (rawMessages, transcript) => {
    let parsed = [];
    if (rawMessages) {
      try {
        parsed = typeof rawMessages === "string" ? JSON.parse(rawMessages) : rawMessages;
      } catch (err) {
        parsed = [];
      }
    }
    if (parsed.length === 0 && transcript) {
      parsed.push({ role: "user", content: transcript });
    } else if (transcript) {
      const lastMsg = parsed[parsed.length - 1];
      if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== transcript) {
        parsed.push({ role: "user", content: transcript });
      }
    }
    return parsed;
  };

  _findOrCreateCustomer = async (organizationId, customerName, session) => {
    let customer = await this.customerDao.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    }, session);

    if (!customer) {
      customer = await this.customerDao.create({
        organizationId,
        name: customerName,
        email: "",
        status: "active",
      }, session);
    }

    return customer;
  };

  _findOrCreateVendor = async (organizationId, vendorName, session) => {
    let vendor = await this.vendorDao.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${vendorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    }, session);

    if (!vendor) {
      vendor = await this.vendorDao.create({
        organizationId,
        name: vendorName,
        email: "",
        status: "active",
      }, session);
    }

    return vendor;
  };

  _findProduct = async (organizationId, productName, session) => {
    let product = await this.productDao.findOne({
      organizationId,
      name: { $regex: new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    }, session);

    if (!product) {
      product = await this.productDao.create({
        organizationId,
        name: productName,
        sku: `VOI-${Date.now().toString(36).toUpperCase()}`,
        description: "Created via voice command",
        price: 0,
        cost: 0,
        status: "active",
      }, session);
    }

    return product;
  };

  _generateNumber = async (organizationId, prefix, dao, field, session) => {
    let index = await dao.Model.countDocuments({ organizationId }).session(session) + 1;
    let number = `${prefix}-${String(index).padStart(4, "0")}`;

    let exists = await dao.findOne({ organizationId, [field]: number }, session);
    while (exists) {
      index++;
      number = `${prefix}-${String(index).padStart(4, "0")}`;
      exists = await dao.findOne({ organizationId, [field]: number }, session);
    }

    return number;
  };

  getOrCreateAccount = async (organizationId, name, code, type, session) => {
    let account = await this.accountDao.Model.findOne({
      organizationId,
      code
    }).session(session);

    if (!account) {
      account = new this.accountDao.Model({
        organizationId,
        name,
        code,
        type,
        status: "active"
      });
      await account.save({ session });
    }

    return account;
  };

  _createInvoice = async (organizationId, args) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await this._findOrCreateCustomer(organizationId, args.customerName, session);

      let invoiceNumber = args.invoiceNumber;
      if (invoiceNumber) {
        const exists = await this.invoiceDao.findOne({
          organizationId,
          invoiceNumber: { $regex: new RegExp(`^${invoiceNumber.trim()}$`, "i") },
        }, session);
        if (exists) {
          throw new BadRequest(`Invoice number "${invoiceNumber}" already exists in your organization.`);
        }
      } else {
        invoiceNumber = await this._generateNumber(organizationId, "INV", this.invoiceDao, "invoiceNumber", session);
      }

      const invoiceDate = args.invoiceDate ? new Date(args.invoiceDate) : new Date();
      const dueDate = args.dueDate ? new Date(args.dueDate) : undefined;

      let subTotal = 0;
      const itemDocs = [];

      for (const item of args.items) {
        const product = await this._findProduct(organizationId, item.productName, session);
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || product.price || 0;
        subTotal += quantity * unitPrice;

        itemDocs.push({
          productId: product._id,
          quantity,
          unitPrice,
          discountAmount: 0,
          taxAmount: 0,
        });
      }

      const invoice = await this.invoiceDao.create({
        organizationId,
        customerId: customer._id,
        invoiceNumber,
        invoiceDate,
        dueDate,
        subTotal,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: subTotal,
        status: "draft",
      }, session);

      for (const item of itemDocs) {
        await this.invoiceItemDao.create({
          invoiceId: invoice._id,
          ...item,
        }, session);
      }

      // === LEDGER AND INVENTORY POSTING (APPROVE IMMEDIATELY) ===
      const warehouse = await this.warehouseDao.findOne({ organizationId }, session);
      if (!warehouse) {
        throw new BadRequest("No warehouse found in your organization to fulfill this invoice.");
      }

      for (const item of itemDocs) {
        let inventory = await this.inventoryDao.Model.findOne({
          organizationId,
          productId: item.productId,
          warehouseId: warehouse._id
        }).session(session);

        if (!inventory) {
          inventory = new this.inventoryDao.Model({
            organizationId,
            productId: item.productId,
            warehouseId: warehouse._id,
            quantity: 0
          });
        }

        inventory.quantity -= item.quantity;
        await inventory.save({ session });

        await this.stockMovementDao.create({
          organizationId,
          productId: item.productId,
          warehouseId: warehouse._id,
          quantity: item.quantity,
          type: "out",
          referenceType: "Invoice",
          referenceId: invoice._id,
          date: new Date()
        }, session);
      }

      const arAccount = await this.getOrCreateAccount(
        organizationId,
        "Accounts Receivable",
        "ACCOUNTS_RECEIVABLE",
        "asset",
        session
      );

      const revenueAccount = await this.getOrCreateAccount(
        organizationId,
        "Sales Revenue",
        "SALES_REVENUE",
        "revenue",
        session
      );

      const journalEntry = await this.journalEntryDao.create({
        organizationId,
        entryNumber: `JE-INV-${invoice.invoiceNumber}-${Date.now()}`,
        date: invoice.invoiceDate,
        narration: `Invoice approval for ${invoice.invoiceNumber} via Voice`,
        status: "posted"
      }, session);

      await this.journalEntryLineDao.create({
        journalEntryId: journalEntry._id,
        accountId: arAccount._id,
        debit: invoice.grandTotal,
        credit: 0
      }, session);

      await this.ledgerEntryDao.create({
        organizationId,
        accountId: arAccount._id,
        journalEntryId: journalEntry._id,
        date: invoice.invoiceDate,
        debit: invoice.grandTotal,
        credit: 0
      }, session);

      await this.journalEntryLineDao.create({
        journalEntryId: journalEntry._id,
        accountId: revenueAccount._id,
        debit: 0,
        credit: invoice.subTotal
      }, session);

      await this.ledgerEntryDao.create({
        organizationId,
        accountId: revenueAccount._id,
        journalEntryId: journalEntry._id,
        date: invoice.invoiceDate,
        debit: 0,
        credit: invoice.subTotal
      }, session);

      invoice.status = "sent";
      await invoice.save({ session });

      await session.commitTransaction();

      return {
        _id: invoice._id,
        invoiceNumber,
        customer: customer.name,
        items: args.items,
        grandTotal: subTotal,
        status: "sent",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

  _createPurchase = async (organizationId, args) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const vendor = await this._findOrCreateVendor(organizationId, args.vendorName, session);

      let purchaseNumber = args.purchaseNumber;
      if (purchaseNumber) {
        const exists = await this.purchaseDao.findOne({
          organizationId,
          purchaseNumber: { $regex: new RegExp(`^${purchaseNumber.trim()}$`, "i") },
        }, session);
        if (exists) {
          throw new BadRequest(`Purchase number "${purchaseNumber}" already exists in your organization.`);
        }
      } else {
        purchaseNumber = await this._generateNumber(organizationId, "PUR", this.purchaseDao, "purchaseNumber", session);
      }

      const purchaseDate = args.purchaseDate ? new Date(args.purchaseDate) : new Date();

      let subTotal = 0;
      const itemDocs = [];

      for (const item of args.items) {
        const product = await this._findProduct(organizationId, item.productName, session);
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || product.cost || 0;
        subTotal += quantity * unitPrice;

        itemDocs.push({
          productId: product._id,
          quantity,
          unitPrice,
          taxAmount: 0,
        });
      }

      const purchase = await this.purchaseDao.create({
        organizationId,
        vendorId: vendor._id,
        purchaseNumber,
        purchaseDate,
        subTotal,
        taxTotal: 0,
        grandTotal: subTotal,
        status: "billed",
      }, session);

      for (const item of itemDocs) {
        await this.purchaseItemDao.create({
          organizationId,
          purchaseId: purchase._id,
          ...item,
        }, session);
      }

      // === LEDGER AND INVENTORY POSTING (APPROVE IMMEDIATELY) ===
      const warehouse = await this.warehouseDao.findOne({ organizationId }, session);
      if (!warehouse) {
        throw new BadRequest("No warehouse found in your organization to receive this purchase.");
      }

      for (const item of itemDocs) {
        let inventory = await this.inventoryDao.Model.findOne({
          organizationId,
          productId: item.productId,
          warehouseId: warehouse._id
        }).session(session);

        if (!inventory) {
          inventory = new this.inventoryDao.Model({
            organizationId,
            productId: item.productId,
            warehouseId: warehouse._id,
            quantity: 0
          });
        }

        inventory.quantity += item.quantity;
        await inventory.save({ session });

        await this.stockMovementDao.create({
          organizationId,
          productId: item.productId,
          warehouseId: warehouse._id,
          quantity: item.quantity,
          type: "in",
          referenceType: "Purchase",
          referenceId: purchase._id,
          date: new Date()
        }, session);
      }

      const apAccount = await this.getOrCreateAccount(
        organizationId,
        "Accounts Payable",
        "ACCOUNTS_PAYABLE",
        "liability",
        session
      );

      const inventoryAccount = await this.getOrCreateAccount(
        organizationId,
        "Inventory Asset",
        "INVENTORY_ASSET",
        "asset",
        session
      );

      const journalEntry = await this.journalEntryDao.create({
        organizationId,
        entryNumber: `JE-PUR-${purchase.purchaseNumber}-${Date.now()}`,
        date: purchase.purchaseDate,
        narration: `Purchase approval for ${purchase.purchaseNumber} via Voice`,
        status: "posted"
      }, session);

      await this.journalEntryLineDao.create({
        journalEntryId: journalEntry._id,
        accountId: inventoryAccount._id,
        debit: purchase.subTotal,
        credit: 0
      }, session);

      await this.ledgerEntryDao.create({
        organizationId,
        accountId: inventoryAccount._id,
        journalEntryId: journalEntry._id,
        date: purchase.purchaseDate,
        debit: purchase.subTotal,
        credit: 0
      }, session);

      await this.journalEntryLineDao.create({
        journalEntryId: journalEntry._id,
        accountId: apAccount._id,
        debit: 0,
        credit: purchase.grandTotal
      }, session);

      await this.ledgerEntryDao.create({
        organizationId,
        accountId: apAccount._id,
        journalEntryId: journalEntry._id,
        date: purchase.purchaseDate,
        debit: 0,
        credit: purchase.grandTotal
      }, session);

      purchase.status = "received";
      await purchase.save({ session });

      await session.commitTransaction();

      return {
        _id: purchase._id,
        purchaseNumber,
        vendor: vendor.name,
        items: args.items,
        grandTotal: subTotal,
        status: "received",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };
}

export default new VoiceController();
