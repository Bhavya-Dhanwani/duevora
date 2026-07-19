import Groq from "groq-sdk";
import fs from "node:fs";
import ProductDao from "../../../shared/dao/product.dao.js";
import CustomerDao from "../../../shared/dao/customer.dao.js";
import VendorDao from "../../../shared/dao/vendor.dao.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const productDao = new ProductDao();
const customerDao = new CustomerDao();
const vendorDao = new VendorDao();

export async function transcribeAudio(filePath) {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-large-v3",
    language: "en",
    response_format: "json",
  });
  return transcription.text;
}

const SYSTEM_PROMPT = `You are an AI assistant for an ERP system called DUEVORA. You help users create invoices (sales) and purchases using voice commands.

When the user speaks a command, extract the relevant information and call the appropriate tool.

RULES:
1. SEQUENTIAL TOOL CALLING (CRITICAL):
   - You can only call ONE tool at a time in a single turn.
   - If the user wants to create an invoice or purchase, but you do not know the product price/cost, you MUST call ONLY the lookup tool 'get_product_price_and_cost' first. Do NOT call 'create_invoice' or 'create_purchase' at all in this turn!
   - Once the system runs 'get_product_price_and_cost' and returns the result in the next turn, you can then call 'create_invoice' or 'create_purchase' using that retrieved price.
   - Under no circumstances should you ever nest one function call inside another or set any parameter to a function call.
2. ONLY handle INVOICE (sale) and PURCHASE creation. If the user talks about anything else, respond with a message explaining you can only help with invoices and purchases.
3. CRITICAL - MISSING FIELDS:
   - For 'create_invoice', the following fields are REQUIRED: 'customerName', 'productName' (inside items).
   - For 'create_purchase', the following fields are REQUIRED: 'vendorName', 'productName' (inside items).
   - If the user explicitly provided a customer or vendor name (e.g. "to Rohit"), USE that name! Do NOT ask the user for the customer/vendor name even if your database search tool returns "not found". The backend will automatically create them.
   - For 'unitPrice':
     a) If the user explicitly stated the price in their command (e.g., "for 500 dollars" or "at 500"), use that price.
     b) If the user did not state the price, do NOT pass 'unitPrice' in the tool arguments (omit the key entirely). The backend will automatically look up the product and use the correct database price (for invoice) or cost (for purchase).
     c) Never set 'unitPrice' to 'null' or empty values. Omit the key entirely if not specified.
   - Do NOT ask the user for any information they already provided in the conversation.
4. DO NOT GUESS OR INVENT FIELDS:
   - Never set any parameter to 'null', empty strings, or other placeholder values to bypass validation.
   - Do NOT pass empty strings "" for productName, and do NOT pass 0 or null for quantity or unitPrice. If they are missing and cannot be found in the database, you must ask the user for them.
   - Never guess or use a product name as a vendor/customer name.
   - Never guess the price. If you cannot find the price from either the user's command or the database lookup, ask the user for it.
5. invoiceNumber/purchaseNumber: Do NOT generate or guess invoice/purchase numbers. Leave them completely out of the arguments (omit them) unless the user explicitly specifies a number (e.g., "invoice number 102") in the command.
6. If the user mentions "sell", "sold", "invoice", "bill to", "customer" → use create_invoice.
7. If the user mentions "buy", "bought", "purchase", "order from", "vendor" → use create_purchase.
8. Use today's date if no date is specified.
9. If the user didn't specify a quantity for an item but did specify the price, assume 1.
10. If the user tries to do BOTH a purchase and a sale in a single command, do not call any tools. Respond to the user and ask them to perform one transaction at a time.
11. Do NOT output any conversational text or confirmation alongside a tool call. When calling a tool, output ONLY the tool call itself. The system will handle confirmation.
12. KEEP REPLIES EXTREMELY SHORT AND CONCISE: Respond like a voice assistant (e.g. Siri or Alexa). Do not write multiple sentences, paragraphs, or polite explanations. Ask for missing details or confirm creations in a single short sentence (e.g. "Who is the customer and what is the unit price?" or "Invoice created for Rogit").
13. NO NESTED TOOL CALLS: You cannot nest one tool call inside another. For example, do NOT set 'unitPrice' to a nested function call block like '<function=get_product_price_and_cost>...'. If you need to look up a product price or customer/vendor name first, call the lookup tool (e.g. 'get_product_price_and_cost') as a separate, single tool call first. Once you get the result in the next turn, you can then call 'create_invoice' or 'create_purchase' with the retrieved price.
14. OMIT OPTIONAL FIELDS: If any optional parameter (such as 'dueDate', 'invoiceNumber', 'purchaseNumber', 'invoiceDate', 'purchaseDate', 'unitPrice') is not specified by the user, you MUST completely omit the key from the tool arguments object. Under no circumstances should you set these parameters to 'null' or empty values, as this violates the JSON schema and crashes the tool call validator.
15. STRICT SCHEMA PROPERTIES: Pass ONLY the arguments defined in the properties of the tool. Never add extra parameters like 'type: "sale"' or 'type: "purchase"' which are not in the tool schema.
16. UNIT PRICE VS TOTAL PRICE MATH (CRITICAL):
    - If the user specifies a price for multiple items combined (e.g. "Sell 2 pieces for 100 dollars", "Buy 5 items for 1000"), the specified price is the TOTAL price for all items, not the unit price!
    - In this case, you MUST calculate the unit price by dividing the total price by the quantity (e.g., 100 / 2 = 50 unitPrice, or 1000 / 5 = 200 unitPrice) before calling the function.
    - If the user specifies a unit price explicitly (e.g. "at 50 dollars each", "50 rupees per piece"), use that amount directly as the 'unitPrice'.`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_invoice",
      description: "Create a sales invoice for a customer. Use when the user wants to sell something, create an invoice, or bill a customer.",
      parameters: {
        type: "object",
        properties: {
          customerName: {
            type: "string",
            description: "Name of the customer (buyer)",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productName: {
                  type: "string",
                  description: "Name or description of the product being sold",
                },
                quantity: {
                  type: "number",
                  description: "Quantity of the product",
                  minimum: 1,
                },
                unitPrice: {
                  type: "number",
                  description: "Price per unit of the product",
                  minimum: 0,
                },
              },
              required: ["productName", "quantity"],
            },
            description: "List of items in the invoice",
          },
          invoiceDate: {
            type: "string",
            description: "Date of the invoice in YYYY-MM-DD format. Default to today.",
          },
          dueDate: {
            type: "string",
            description: "Due date in YYYY-MM-DD format. Optional.",
          },
          invoiceNumber: {
            type: "string",
            description: "Invoice number. ONLY populate this if the user explicitly specifies a number (e.g., 'invoice number 123'). Do NOT generate or guess one.",
          },
        },
        required: ["customerName", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_purchase",
      description: "Create a purchase order from a vendor. Use when the user wants to buy something, create a purchase, or order from a vendor.",
      parameters: {
        type: "object",
        properties: {
          vendorName: {
            type: "string",
            description: "Name of the vendor (supplier/seller)",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productName: {
                  type: "string",
                  description: "Name or description of the product being purchased",
                },
                quantity: {
                  type: "number",
                  description: "Quantity of the product",
                  minimum: 1,
                },
                unitPrice: {
                  type: "number",
                  description: "Price per unit of the product",
                  minimum: 0,
                },
              },
              required: ["productName", "quantity"],
            },
            description: "List of items in the purchase",
          },
          purchaseDate: {
            type: "string",
            description: "Date of the purchase in YYYY-MM-DD format. Default to today.",
          },
          purchaseNumber: {
            type: "string",
            description: "Purchase order number. ONLY populate this if the user explicitly specifies a number (e.g., 'purchase number 555'). Do NOT generate or guess one.",
          },
        },
        required: ["vendorName", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_price_and_cost",
      description: "Look up a product's price, cost, and SKU in the system by name.",
      parameters: {
        type: "object",
        properties: {
          productName: {
            type: "string",
            description: "The name of the product to look up.",
          },
        },
        required: ["productName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_customer",
      description: "Verify if a customer exists in the system and retrieve their name.",
      parameters: {
        type: "object",
        properties: {
          customerName: {
            type: "string",
            description: "The customer name to search.",
          },
        },
        required: ["customerName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_vendor",
      description: "Verify if a vendor exists in the system and retrieve their name.",
      parameters: {
        type: "object",
        properties: {
          vendorName: {
            type: "string",
            description: "The vendor name to search.",
          },
        },
        required: ["vendorName"],
      },
    },
  },
];

async function executeGetProductPriceAndCost(organizationId, productName) {
  const words = productName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w && w !== "product" && w !== "item" && w !== "the" && w !== "a" && w !== "of" && w !== "pieces" && w !== "piece");

  if (words.length === 0) {
    return { found: false, message: `Product "${productName}" not found.` };
  }

  const query = {
    organizationId,
    $or: words.map(w => ({
      name: { $regex: new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
    }))
  };

  const products = await productDao.find(query);
  if (!products || products.length === 0) {
    return { found: false, message: `Product "${productName}" not found.` };
  }

  const product = products[0];
  return {
    found: true,
    productName: product.name,
    price: product.price,
    cost: product.cost,
    sku: product.sku,
    allMatches: products.map(p => p.name)
  };
}

async function executeSearchCustomer(organizationId, customerName) {
  const words = customerName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w && w !== "the" && w !== "a" && w !== "of" && w !== "corp" && w !== "ltd" && w !== "inc" && w !== "limited" && w !== "company");

  if (words.length === 0) {
    return { found: false, message: `Customer "${customerName}" not found.` };
  }

  const query = {
    organizationId,
    $or: words.map(w => ({
      name: { $regex: new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
    }))
  };

  const customers = await customerDao.find(query);
  if (!customers || customers.length === 0) {
    return { found: false, message: `Customer "${customerName}" not found.` };
  }

  return {
    found: true,
    customerName: customers[0].name,
    email: customers[0].email,
    allMatches: customers.map(c => c.name)
  };
}

async function executeSearchVendor(organizationId, vendorName) {
  const words = vendorName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w && w !== "the" && w !== "a" && w !== "of" && w !== "corp" && w !== "ltd" && w !== "inc" && w !== "limited" && w !== "company");

  if (words.length === 0) {
    return { found: false, message: `Vendor "${vendorName}" not found.` };
  }

  const query = {
    organizationId,
    $or: words.map(w => ({
      name: { $regex: new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
    }))
  };

  const vendors = await vendorDao.find(query);
  if (!vendors || vendors.length === 0) {
    return { found: false, message: `Vendor "${vendorName}" not found.` };
  }

  return {
    found: true,
    vendorName: vendors[0].name,
    email: vendors[0].email,
    allMatches: vendors.map(v => v.name)
  };
}

export async function processVoiceCommand(input, organizationId) {
  // Support both a single string transcript (for compatibility/tests) and a full messages history array
  let messages = [];
  if (Array.isArray(input)) {
    messages = [...input];
  } else if (typeof input === "string") {
    messages = [{ role: "user", content: input }];
  } else {
    messages = [];
  }

  const apiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  let loopCount = 0;
  const maxLoops = 5;

  while (loopCount < maxLoops) {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: apiMessages,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const message = response.choices[0]?.message;

    if (!message) {
      return { type: "error", message: "No response from AI model" };
    }

    apiMessages.push(message);

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (toolName === "create_invoice" || toolName === "create_purchase") {
        return {
          type: "tool_call",
          tool: toolName,
          args,
          confirmation: message.content || `I'll create a ${toolName === "create_invoice" ? "invoice" : "purchase"} for you.`,
        };
      }

      let toolResult;
      try {
        if (toolName === "get_product_price_and_cost") {
          toolResult = await executeGetProductPriceAndCost(organizationId, args.productName);
        } else if (toolName === "search_customer") {
          toolResult = await executeSearchCustomer(organizationId, args.customerName);
        } else if (toolName === "search_vendor") {
          toolResult = await executeSearchVendor(organizationId, args.vendorName);
        }
      } catch (err) {
        toolResult = { error: err.message };
      }

      apiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(toolResult),
      });

      loopCount++;
    } else {
      return {
        type: "message",
        message: message.content || "I couldn't understand your request. Please try again.",
      };
    }
  }

  return { type: "error", message: "Agent loop execution limit reached" };
}
