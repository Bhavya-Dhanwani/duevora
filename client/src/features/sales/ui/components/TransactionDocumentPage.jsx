import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiTrash, HiArrowPath, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { customersApi } from "../../../customers/api/customersApi";
import { vendorsApi } from "../../../vendors/api/vendorsApi";
import { productsApi } from "../../../products/api/productsApi";
import { salesApi } from "../../api/salesApi";
import { purchasesApi } from "../../../purchases/api/purchasesApi";
import { Button, PageHeader, DataTable, StatusBadge } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";

const inputStyle = { boxSizing: "border-box", width: "100%", padding: 9, marginTop: 5, border: "1px solid #cbd5e1", borderRadius: 7 };
const today = () => new Date().toISOString().slice(0, 10);
const productLine = () => ({ productId: "", quantity: 1, unitPrice: 0 });

export default function TransactionDocumentPage({ title, subtitle, party = "customer", kind, create, exportConfig }) {
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();
  const [viewMode, setViewMode] = useState("list"); // "list" or "create"
  const hasLines = kind === "invoice" || kind === "purchase";
  const [form, setForm] = useState({ number: "", date: today(), dueDate: "", partyId: "", total: "", lines: [productLine()] });
  
  // Queries for selectors
  const parties = useQuery({ queryKey: [party === "customer" ? "customers" : "vendors"], queryFn: party === "customer" ? () => customersApi.list() : () => vendorsApi.list() });
  const products = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list(), enabled: hasLines });
  
  const partyRows = parties.data?.data || []; 
  const productRows = products.data?.data || [];

  // Documents Listing Query
  const listFnMap = {
    invoice: () => salesApi.listInvoices(),
    quotation: () => salesApi.listQuotations(),
    order: () => salesApi.listSalesOrders(),
    challan: () => salesApi.listDeliveryChallans(),
    po: () => purchasesApi.listPurchaseOrders(),
    purchase: () => purchasesApi.list(),
  };
  const listFn = listFnMap[kind] || null;

  const documentsQuery = useQuery({
    queryKey: [`${kind}sList`],
    queryFn: listFn ? () => listFn() : () => Promise.resolve({ data: [] }),
    enabled: !!listFn,
  });

  const documents = documentsQuery.data?.data || [];

  // Create Mutation
  const mutation = useMutation({ 
    mutationFn: create, 
    onSuccess: () => {
      setForm({ number: "", date: today(), dueDate: "", partyId: "", total: "", lines: [productLine()] });
      queryClient.invalidateQueries([`${kind}sList`]);
      setViewMode("list");
    } 
  });

  // Approve/Post handler
  const handleApprove = async (id) => {
    try {
      const approveMap = {
        invoice: () => salesApi.approveInvoice(id),
        quotation: () => salesApi.approveQuotation(id),
        order: () => salesApi.approveSalesOrder(id),
        purchase: () => purchasesApi.approve(id),
      };
      const fn = approveMap[kind];
      if (fn) {
        await fn();
        success("Document approved and posted to the general ledger.");
        documentsQuery.refetch();
      } else {
        success("Document saved (approval not available for this type).");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to approve document");
    }
  };

  const calculatedTotal = useMemo(() => form.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0), [form.lines]);
  const updateLine = (i, key, value) => setForm({ ...form, lines: form.lines.map((line, index) => index === i ? { ...line, [key]: value } : line) });
  
  const submit = (event) => { 
    event.preventDefault(); 
    const date = new Date(form.date).toISOString(); 
    const total = hasLines ? calculatedTotal : Number(form.total || 0); 
    const base = party === "customer" ? { customerId: form.partyId } : { vendorId: form.partyId };
    
    const payloads = {
      quotation: { ...base, quotationNumber: form.number, date, subTotal: total, taxTotal: 0, grandTotal: total, status: "draft" },
      order: { ...base, orderNumber: form.number, orderDate: date, grandTotal: total, status: "draft" },
      challan: { ...base, challanNumber: form.number, challanDate: date, status: "draft" },
      invoice: { ...base, invoiceNumber: form.number, invoiceDate: date, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined, items: form.lines.map((line) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })) },
      po: { ...base, poNumber: form.number, poDate: date, grandTotal: total, status: "draft" },
      purchase: { ...base, purchaseNumber: form.number, purchaseDate: date, items: form.lines.map((line) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })) },
    }; 
    mutation.mutate(payloads[kind]); 
  };

  const partyName = party === "customer" ? "Customer" : "Vendor";
  const generateNumber = () => {
    const prefix = { invoice: "INV", quotation: "QTN", order: "SO", challan: "DC", po: "PO", purchase: "BILL" }[kind] || "DOC";
    setForm({ ...form, number: `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}` });
  };

  // DataTable columns configuration
  const columns = [
    { 
      key: "number", 
      label: "Number", 
      render: (_, row) => row.invoiceNumber || row.quotationNumber || row.purchaseNumber || row.orderNumber || row.challanNumber || "â€”" 
    },
    { 
      key: "date", 
      label: "Date", 
      render: (val, row) => new Date(val || row.invoiceDate || row.quotationDate || row.purchaseDate || row.orderDate || row.challanDate).toLocaleDateString("en-IN") 
    },
    { 
      key: "party", 
      label: partyName, 
      render: (_, row) => row.partyName || "â€”" 
    },
    { 
      key: "total", 
      label: "Grand Total", 
      render: (_, row) => {
        const amt = row.grandTotal || row.subTotal || 0;
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);
      } 
    },
    { 
      key: "status", 
      label: "Status", 
      render: (val) => {
        const status = val || "draft";
        return <StatusBadge status={status === "draft" ? "pending" : "active"}>{status.toUpperCase()}</StatusBadge>;
      }
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isDraft = row.status === "draft" || !row.status;
        if (!isDraft) return <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}>Posted</span>;
        return (
          <Button
            onClick={() => handleApprove(row._id)}
            variant="secondary"
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            Post to Ledger
          </Button>
        );
      }
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <PageHeader title={title} subtitle={subtitle} />
        {viewMode === "list" && (
          <div style={{ display: "flex", gap: 10 }}>
            {exportConfig && (
              <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ ...exportConfig, data: documents })}>
                Export PDF
              </Button>
            )}
            <Button onClick={() => setViewMode("create")} variant="primary" icon={HiPlus}>
              New {title.slice(0, -1)}
            </Button>
          </div>
        )}
      </div>

      {viewMode === "list" ? (
        <DataTable
          columns={columns}
          data={documents}
          loading={documentsQuery.isLoading}
          emptyTitle={`No ${title.toLowerCase()} found`}
          emptyDescription={`Click the button above to record your first ${title.slice(0, -1).toLowerCase()}.`}
        />
      ) : (
        <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 22, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <label>{title.slice(0, -1)} number<div style={{ display: "flex", gap: 6 }}><input required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} style={inputStyle}/><Button type="button" variant="secondary" onClick={generateNumber} style={{ marginTop: 5, whiteSpace: "nowrap" }}><HiArrowPath /> Generate</Button></div></label>
            <label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle}/></label>
            <label>{partyName}<select required value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })} style={inputStyle}><option value="">Select {partyName.toLowerCase()}</option>{partyRows.map((row) => <option key={row._id} value={row._id}>{row.displayName || row.name || row.companyName || row.email}</option>)}</select></label>
          </div>
          
          {kind === "invoice" && (
            <label style={{ maxWidth: 320 }}>Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle}/></label>
          )}

          {hasLines ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 35px", gap: 9, fontWeight: 700, fontSize: 12 }}>
                <span>Product</span><span>Quantity</span><span>Unit price</span><span />
              </div>
              {form.lines.map((line, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 35px", gap: 9 }}>
                  <select required value={line.productId} onChange={(e) => updateLine(i, "productId", e.target.value)} style={inputStyle}>
                    <option value="">Select product</option>
                    {productRows.map((p) => <option key={p._id} value={p._id}>{p.name || p.productName || p.sku}</option>)}
                  </select>
                  <input required type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} style={inputStyle}/>
                  <input required type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(i, "unitPrice", e.target.value)} style={inputStyle}/>
                  <button type="button" disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, index) => index !== i) })} style={{ border: 0, background: "none", color: "#dc2626", cursor: "pointer" }}><HiTrash /></button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => setForm({ ...form, lines: [...form.lines, productLine()] })} icon={HiPlus}>
                Add item
              </Button>
              <div style={{ textAlign: "right", fontWeight: 800 }}>Total: {calculatedTotal.toFixed(2)}</div>
            </>
          ) : (
            kind !== "challan" && <label style={{ maxWidth: 320 }}>Grand total<input required type="number" min="0" step="0.01" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} style={inputStyle}/></label>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setViewMode("list")}>Cancel</Button>
            <Button type="submit" variant="primary" loading={mutation.isPending}>Save draft</Button>
          </div>
          
          {mutation.isSuccess && <small style={{ color: "#15803d" }}>Draft saved successfully.</small>}
          {mutation.isError && <small style={{ color: "#b91c1c" }}>{mutation.error?.response?.data?.message || "Could not save this document."}</small>}
        </form>
      )}
    </div>
  );
}