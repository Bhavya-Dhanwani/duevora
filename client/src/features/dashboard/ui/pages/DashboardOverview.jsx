import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "../../../../app/store/hooks";
import { reportsApi } from "../../../reports/api/reportsApi";
import { accountingApi } from "../../../accounting/api/accountingApi";
import { salesApi } from "../../../sales/api/salesApi";
import { paymentsApi, receiptsApi } from "../../../purchases/api/purchasesApi";
import { StatCard, Tabs, Button } from "../../../../app/components/common";
import { HiOutlinePrinter } from "react-icons/hi2";
import toast from "react-hot-toast";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompactCurrency = (amount) => {
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lac`;
  }
  return formatCurrency(amount);
};

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const orgId = user?.organizationId;
  const [tab, setTab] = useState("trading-pl");
  const [printData, setPrintData] = useState(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  // 1. Profit & Loss Report (Revenue, Expenses, Net Profit)
  const { data: plData } = useQuery({
    queryKey: ["profitLoss", orgId],
    queryFn: () => reportsApi.profitLoss(),
    enabled: !!orgId,
    retry: false,
  });

  // 2. Balance Sheet (Assets, Liabilities)
  const { data: bsData } = useQuery({
    queryKey: ["balanceSheet", orgId],
    queryFn: () => reportsApi.balanceSheet(),
    enabled: !!orgId,
    retry: false,
  });

  // 3. Business Ratios
  const { data: ratiosData } = useQuery({
    queryKey: ["businessRatios", orgId],
    queryFn: () => reportsApi.ratios(),
    enabled: !!orgId,
    retry: false,
  });

  const pl = plData?.data || {};
  const bs = bsData?.data || {};
  const ratios = ratiosData?.data || {};

  const revenue = pl.revenue || 0;
  const expenses = pl.expenses || 0;
  const netProfit = pl.netProfit || 0;
  const outstanding = bs.liabilities || 0;

  const sales = revenue;
  const directCosts = ratios.directCosts || 0;
  const grossProfit = sales - directCosts;
  const operatingExpenses = expenses - directCosts;

  const handleExportPdf = async () => {
    setIsPreparingPrint(true);
    const loadingToast = toast.loading("Compiling financial statements, invoices, and ledger accounts...");
    try {
      const [invoicesRes, paymentsRes, receiptsRes, accountsRes] = await Promise.all([
        salesApi.listInvoices(),
        paymentsApi.list(),
        receiptsApi.list(),
        accountingApi.listAccounts(),
      ]);
      setPrintData({
        invoices: invoicesRes.data || [],
        payments: paymentsRes.data || [],
        receipts: receiptsRes.data || [],
        accounts: accountsRes.data || [],
      });
      toast.dismiss(loadingToast);
      toast.success("Ready! Opening print dialog...");
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to load PDF package data.");
    } finally {
      setIsPreparingPrint(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "24px 0 40px", boxSizing: "border-box" }}>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: #ffffff !important;
            color: #000 !important;
            font-size: 12px !important;
          }
          .print-page {
            page-break-after: always;
            padding: 40px;
          }
          .print-header {
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 24px;
            text-align: center;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .print-table th, .print-table td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
          }
          .print-table th {
            background-color: #f1f5f9;
          }
          .print-total {
            font-weight: bold;
            background-color: #f8fafc;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      {/* Header with Print Action */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Financial Dashboard</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Live financial reports and ratios computed from journal ledgers.</p>
        </div>
        <Button variant="primary" icon={HiOutlinePrinter} onClick={handleExportPdf} loading={isPreparingPrint}>
          Export Financial Pack (PDF)
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
        <StatCard
          label="Total Revenue"
          trend="up"
          trendLabel="Active period"
          value={formatCompactCurrency(revenue)}
        />
        <StatCard
          label="Total Expenses"
          trend="down"
          trendLabel="Active period"
          value={formatCompactCurrency(expenses)}
        />
        <StatCard
          label="Net Profit"
          trend="up"
          trendLabel="Active period"
          value={formatCompactCurrency(netProfit)}
        />
        <StatCard
          label="Outstanding"
          value={formatCompactCurrency(outstanding)}
        />
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ marginBottom: 24 }}>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "trading-pl", label: "Trading & Profit/Loss" },
            { key: "balance-sheet", label: "Balance Sheet" },
            { key: "ratios", label: "Business Ratios" },
          ]}
        />
      </div>

      {/* Tab Panels */}
      <div className="no-print" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
        {tab === "trading-pl" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Trading Account */}
            <div>
              <h4 style={{ margin: "0 0 10px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: 6, color: "#1e293b", fontSize: 14 }}>Trading Account</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Sales Revenue</span>
                  <span style={{ fontWeight: 600 }}>₹{sales.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#b91c1c" }}>
                  <span>Less: Cost of Goods Sold (Direct Costs/Purchases)</span>
                  <span style={{ fontWeight: 600 }}>-₹{directCosts.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #cbd5e1", borderBottom: "2px double #cbd5e1", fontWeight: 700 }}>
                  <span>Gross Profit</span>
                  <span style={{ color: grossProfit >= 0 ? "#16a34a" : "#dc2626" }}>₹{grossProfit.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Profit & Loss Account */}
            <div>
              <h4 style={{ margin: "0 0 10px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: 6, color: "#1e293b", fontSize: 14 }}>Profit & Loss Account</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Gross Profit (brought down)</span>
                  <span style={{ fontWeight: 600 }}>₹{grossProfit.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#b91c1c" }}>
                  <span>Less: Operating & Indirect Expenses</span>
                  <span style={{ fontWeight: 600 }}>-₹{operatingExpenses.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #cbd5e1", borderBottom: "2px double #cbd5e1", fontWeight: 700 }}>
                  <span>Net Profit / Net Income</span>
                  <span style={{ color: netProfit >= 0 ? "#16a34a" : "#dc2626" }}>₹{netProfit.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "balance-sheet" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {/* Liabilities & Equity - Swapped to Left */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", borderBottom: "2px solid #0f172a", paddingBottom: 6, color: "#0f172a", fontSize: 14 }}>LIABILITIES & EQUITY</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h5 style={{ margin: "8px 0 4px 0", fontWeight: 600, color: "#475569" }}>Liabilities</h5>
                {(bs.rows || []).filter(r => r.type === "liability").map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span>{r.name} ({r.code})</span>
                    <span style={{ fontWeight: 600 }}>₹{Math.abs(r.balance).toLocaleString("en-IN")}</span>
                  </div>
                ))}

                <h5 style={{ margin: "16px 0 4px 0", fontWeight: 600, color: "#475569" }}>Equity</h5>
                {(bs.rows || []).filter(r => r.type === "equity").map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span>{r.name} ({r.code})</span>
                    <span style={{ fontWeight: 600 }}>₹{Math.abs(r.balance).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span>Retained Earnings (Net Income)</span>
                  <span style={{ fontWeight: 600 }}>₹{(bs.netProfit || 0).toLocaleString("en-IN")}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 12, borderTop: "2px solid #0f172a", fontWeight: 700, background: "#f8fafc" }}>
                  <span style={{ paddingLeft: 8 }}>Total Liabilities & Equity</span>
                  <span style={{ paddingRight: 8 }}>₹{((bs.liabilities || 0) + (bs.equity || 0)).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Assets - Swapped to Right */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", borderBottom: "2px solid #2563eb", paddingBottom: 6, color: "#2563eb", fontSize: 14 }}>ASSETS</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(bs.rows || []).filter(r => r.type === "asset").map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span>{r.name} ({r.code})</span>
                    <span style={{ fontWeight: 600 }}>₹{r.balance.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 12, borderTop: "2px solid #2563eb", fontWeight: 700, background: "#eff6ff" }}>
                  <span style={{ paddingLeft: 8 }}>Total Assets</span>
                  <span style={{ paddingRight: 8 }}>₹{(bs.assets || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "ratios" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { label: "Current Ratio", value: `${ratios.currentRatio || "0.00"}:1`, desc: "Optimal: >= 1.5" },
              { label: "Quick Ratio", value: `${ratios.quickRatio || "0.00"}:1`, desc: "Optimal: >= 1.0" },
              { label: "Debt to Equity", value: `${ratios.debtToEquity || "0.00"}:1`, desc: "Optimal: <= 1.0" },
              { label: "Gross Profit Margin", value: `${ratios.grossProfitMargin || "0.00"}%`, desc: "Margin on sales" },
              { label: "Net Profit Margin", value: `${ratios.netProfitMargin || "0.00"}%`, desc: "Bottom line efficiency" }
            ].map((ratio, i) => (
              <div key={i} style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{ratio.label}</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{ratio.value}</div>
                <small style={{ color: "#475569" }}>{ratio.desc}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Package Layout */}
      {printData && (
        <div className="print-only">
          {/* Page 1: Coversheet */}
          <div className="print-page">
            <div style={{ textAlign: "center", marginTop: "150px" }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>DUEVORA FINANCIAL PACKAGE</h1>
              <h2 style={{ fontSize: 18, color: "#475569", marginTop: 10 }}>Complete Business Statements & Ledger</h2>
              <div style={{ borderBottom: "2px solid #cbd5e1", width: "200px", margin: "30px auto" }}></div>
              <p style={{ fontSize: 14 }}>Compiled Financial Period Report</p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 150 }}>Generated natively via browser print engine.</p>
            </div>
          </div>

          {/* Page 2: Trading and P/L */}
          <div className="print-page">
            <div className="print-header">
              <h2>TRADING & PROFIT & LOSS STATEMENT</h2>
            </div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th style={{ textAlign: "right" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sales Revenue</td>
                  <td style={{ textAlign: "right" }}>₹{sales.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ color: "#dc2626" }}>
                  <td>Less: Cost of Sales / Purchases</td>
                  <td style={{ textAlign: "right" }}>-₹{directCosts.toLocaleString("en-IN")}</td>
                </tr>
                <tr className="print-total">
                  <td>Gross Profit</td>
                  <td style={{ textAlign: "right" }}>₹{grossProfit.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td>Gross Profit (brought down)</td>
                  <td style={{ textAlign: "right" }}>₹{grossProfit.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ color: "#dc2626" }}>
                  <td>Less: Operating Expenses</td>
                  <td style={{ textAlign: "right" }}>-₹{operatingExpenses.toLocaleString("en-IN")}</td>
                </tr>
                <tr className="print-total" style={{ fontSize: 14 }}>
                  <td>Net Profit</td>
                  <td style={{ textAlign: "right" }}>₹{netProfit.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 3: Balance Sheet (Swapped format) */}
          <div className="print-page">
            <div className="print-header">
              <h2>BALANCE SHEET</h2>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              {/* Liabilities & Equity - Swapped to Left */}
              <div style={{ flex: 1 }}>
                <h3>Liabilities & Equity</h3>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th style={{ textAlign: "right" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ fontWeight: "bold" }}>Liabilities</td>
                    </tr>
                    {(bs.rows || []).filter(r => r.type === "liability").map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td style={{ textAlign: "right" }}>₹{Math.abs(r.balance).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} style={{ fontWeight: "bold", paddingTop: 10 }}>Equity</td>
                    </tr>
                    {(bs.rows || []).filter(r => r.type === "equity").map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td style={{ textAlign: "right" }}>₹{Math.abs(r.balance).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>Retained Earnings (Current Net Profit)</td>
                      <td style={{ textAlign: "right" }}>₹{(bs.netProfit || 0).toLocaleString("en-IN")}</td>
                    </tr>
                    <tr className="print-total">
                      <td>Total Liabilities & Equity</td>
                      <td style={{ textAlign: "right" }}>₹{((bs.liabilities || 0) + (bs.equity || 0)).toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Assets - Swapped to Right */}
              <div style={{ flex: 1 }}>
                <h3>Assets</h3>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th style={{ textAlign: "right" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bs.rows || []).filter(r => r.type === "asset").map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td style={{ textAlign: "right" }}>₹{r.balance.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    <tr className="print-total">
                      <td>Total Assets</td>
                      <td style={{ textAlign: "right" }}>₹{(bs.assets || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Page 4: Invoices Register */}
          <div className="print-page">
            <div className="print-header">
              <h2>INVOICES REGISTER</h2>
            </div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {printData.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>No invoices recorded.</td>
                  </tr>
                ) : (
                  printData.invoices.map((inv, i) => (
                    <tr key={i}>
                      <td>{inv.invoiceNumber}</td>
                      <td>{inv.customerId?.name || "Customer"}</td>
                      <td>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "—"}</td>
                      <td style={{ textTransform: "uppercase", fontSize: 10 }}>{inv.status}</td>
                      <td style={{ textAlign: "right" }}>₹{inv.grandTotal?.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Page 5: Transaction Log (Payments & Receipts) */}
          <div className="print-page">
            <div className="print-header">
              <h2>TRANSACTION LOG (PAYMENTS & RECEIPTS)</h2>
            </div>
            <h3>Vendor Payments</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {printData.payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>No vendor payments recorded.</td>
                  </tr>
                ) : (
                  printData.payments.map((p, i) => (
                    <tr key={i}>
                      <td>{p.paymentNumber}</td>
                      <td>{p.vendorId?.name || "Vendor"}</td>
                      <td>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—"}</td>
                      <td>{p.paymentMethod}</td>
                      <td style={{ textAlign: "right" }}>₹{p.amount?.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h3 style={{ marginTop: 20 }}>Customer Receipts</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {printData.receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>No customer receipts recorded.</td>
                  </tr>
                ) : (
                  printData.receipts.map((r, i) => (
                    <tr key={i}>
                      <td>{r.receiptNumber}</td>
                      <td>{r.customerId?.name || "Customer"}</td>
                      <td>{r.receiptDate ? new Date(r.receiptDate).toLocaleDateString() : "—"}</td>
                      <td>{r.paymentMethod}</td>
                      <td style={{ textAlign: "right" }}>₹{r.amount?.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Page 6: Chart of Accounts */}
          <div className="print-page">
            <div className="print-header">
              <h2>CHART OF ACCOUNTS</h2>
            </div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {printData.accounts.map((acc, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "monospace" }}>{acc.code}</td>
                    <td>{acc.name}</td>
                    <td style={{ textTransform: "capitalize" }}>{acc.type}</td>
                    <td style={{ textTransform: "uppercase", fontSize: 10 }}>{acc.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
