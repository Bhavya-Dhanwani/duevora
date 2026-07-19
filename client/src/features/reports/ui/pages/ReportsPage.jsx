import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineScale,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineArrowDownOnSquare,
  HiOutlineChartBar,
  HiOutlinePrinter,
} from "react-icons/hi2";
import { reportsApi } from "../../api/reportsApi";
import { salesApi } from "../../../sales/api/salesApi";
import { paymentsApi, receiptsApi } from "../../../purchases/api/purchasesApi";
import { accountingApi } from "../../../accounting/api/accountingApi";
import { PageHeader, StatCard, Button, Tabs } from "../../../../app/components/common";
import toast from "react-hot-toast";

const today = () => new Date().toISOString().slice(0, 10);
const sixMonthsAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
};

const inputStyle = {
  boxSizing: "border-box",
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  fontSize: 13,
};

const reportCardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 24,
  marginTop: 20,
};

const ratioCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(sixMonthsAgo);
  const [endDate, setEndDate] = useState(today);
  const [tab, setTab] = useState("trading-pl");
  const [printData, setPrintData] = useState(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const params = { startDate, endDate };

  // Queries
  const { data: tbData, isLoading: tbLoading } = useQuery({
    queryKey: ["trialBalance", startDate, endDate],
    queryFn: () => reportsApi.trialBalance(params),
  });

  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ["profitLoss", startDate, endDate],
    queryFn: () => reportsApi.profitLoss(params),
  });

  const { data: bsData, isLoading: bsLoading } = useQuery({
    queryKey: ["balanceSheet", startDate, endDate],
    queryFn: () => reportsApi.balanceSheet(params),
  });

  const { data: cfData, isLoading: cfLoading } = useQuery({
    queryKey: ["cashFlow", startDate, endDate],
    queryFn: () => reportsApi.cashFlow(params),
  });

  const { data: ratioData, isLoading: ratiosLoading } = useQuery({
    queryKey: ["businessRatios", startDate, endDate],
    queryFn: () => reportsApi.ratios(params),
  });

  const pl = plData?.data || {};
  const bs = bsData?.data || {};
  const cf = cfData?.data || {};
  const tb = tbData?.data?.rows || [];
  const ratios = ratioData?.data || {};

  const isBalanced = tb.length > 0
    ? Math.abs(tb.reduce((s, r) => s + (r.totalDebit || 0), 0) - tb.reduce((s, r) => s + (r.totalCredit || 0), 0)) < 0.01
    : null;

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
      toast.success("Ready! Opening print dialog (select Save as PDF)");
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

  const sales = pl.revenue || 0;
  const directCosts = ratios.directCosts || 0;
  const grossProfit = sales - directCosts;
  const operatingExpenses = (pl.expenses || 0) - directCosts;
  const netProfit = pl.netProfit || 0;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }} className="no-print">
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <PageHeader
          title="Reports"
          subtitle="Financial statements and business ratios compiled via MongoDB aggregation."
        />
        <Button variant="primary" icon={HiOutlinePrinter} onClick={handleExportPdf} loading={isPreparingPrint}>
          Export Financial Pack (PDF)
        </Button>
      </div>

      {/* Date Range Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={inputStyle}
        />
        <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard
          label="Revenue"
          value={pl.revenue != null ? `₹${Number(pl.revenue).toLocaleString("en-IN")}` : "—"}
        />
        <StatCard
          label="Expenses"
          value={pl.expenses != null ? `₹${Number(pl.expenses).toLocaleString("en-IN")}` : "—"}
        />
        <StatCard
          label="Net Profit"
          value={pl.netProfit != null ? `₹${Number(pl.netProfit).toLocaleString("en-IN")}` : "—"}
          trend={pl.netProfit > 0 ? "up" : pl.netProfit < 0 ? "down" : undefined}
        />
        <StatCard
          label="Net Cash Flow"
          value={cf.netCashFlow != null ? `₹${Number(cf.netCashFlow).toLocaleString("en-IN")}` : "—"}
          trend={cf.netCashFlow > 0 ? "up" : cf.netCashFlow < 0 ? "down" : undefined}
        />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "trading-pl", label: "Trading & Profit/Loss" },
          { key: "balance-sheet", label: "Balance Sheet" },
          { key: "trial-balance", label: "Trial Balance" },
          { key: "cash-flow", label: "Cash Flow" },
          { key: "ratios", label: "Business Ratios" },
        ]}
      />

      {/* 1. Trading & P/L Tab */}
      {tab === "trading-pl" && (
        <div style={reportCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <HiOutlineArrowTrendingUp size={22} color="#9333ea" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Trading & Profit & Loss Statement</h3>
          </div>
          {plLoading ? (
            <p>Loading P/L statement...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Trading Account */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: 6, color: "#1e293b" }}>Trading Account</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Sales Revenue (Direct Sales)</span>
                    <span style={{ fontWeight: 600 }}>₹{sales.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#b91c1c" }}>
                    <span>Less: Cost of Goods Sold (Direct Costs/Purchases)</span>
                    <span style={{ fontWeight: 600 }}>-₹{directCosts.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #cbd5e1", borderBottom: "2px double #cbd5e1", fontWeight: 700, fontSize: 15 }}>
                    <span>Gross Profit</span>
                    <span style={{ color: grossProfit >= 0 ? "#16a34a" : "#dc2626" }}>₹{grossProfit.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Profit & Loss Account */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: 6, color: "#1e293b" }}>Profit & Loss Account</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Gross Profit (brought down)</span>
                    <span style={{ fontWeight: 600 }}>₹{grossProfit.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#b91c1c" }}>
                    <span>Less: Operating & Indirect Expenses</span>
                    <span style={{ fontWeight: 600 }}>-₹{operatingExpenses.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #cbd5e1", borderBottom: "2px double #cbd5e1", fontWeight: 700, fontSize: 16 }}>
                    <span>Net Profit / Net Income</span>
                    <span style={{ color: netProfit >= 0 ? "#16a34a" : "#dc2626" }}>₹{netProfit.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Balance Sheet Tab */}
      {tab === "balance-sheet" && (
        <div style={reportCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <HiOutlineBanknotes size={22} color="#16a34a" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Balance Sheet</h3>
          </div>
          {bsLoading ? (
            <p>Loading balance sheet...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
              {/* Assets Column */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", borderBottom: "2px solid #2563eb", paddingBottom: 6, color: "#2563eb" }}>ASSETS</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(bs.rows || []).filter(r => r.type === "asset").map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span>{r.name} ({r.code})</span>
                      <span style={{ fontWeight: 600 }}>₹{r.balance.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 12, borderTop: "2px solid #2563eb", fontWeight: 700, fontSize: 15, background: "#eff6ff" }}>
                    <span style={{ paddingLeft: 8 }}>Total Assets</span>
                    <span style={{ paddingRight: 8 }}>₹{(bs.assets || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", borderBottom: "2px solid #0f172a", paddingBottom: 6, color: "#0f172a" }}>LIABILITIES & EQUITY</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Liabilities */}
                  <h5 style={{ margin: "8px 0 4px 0", fontWeight: 600, color: "#475569" }}>Liabilities</h5>
                  {(bs.rows || []).filter(r => r.type === "liability").map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span>{r.name} ({r.code})</span>
                      <span style={{ fontWeight: 600 }}>₹{Math.abs(r.balance).toLocaleString("en-IN")}</span>
                    </div>
                  ))}

                  {/* Equity */}
                  <h5 style={{ margin: "16px 0 4px 0", fontWeight: 600, color: "#475569" }}>Equity</h5>
                  {(bs.rows || []).filter(r => r.type === "equity").map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span>{r.name} ({r.code})</span>
                      <span style={{ fontWeight: 600 }}>₹{Math.abs(r.balance).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {/* Current period retained earnings */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span>Retained Earnings (Net Income)</span>
                    <span style={{ fontWeight: 600 }}>₹{(bs.netProfit || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 12, borderTop: "2px solid #0f172a", fontWeight: 700, fontSize: 15, background: "#f8fafc" }}>
                    <span style={{ paddingLeft: 8 }}>Total Liabilities & Equity</span>
                    <span style={{ paddingRight: 8 }}>₹{((bs.liabilities || 0) + (bs.equity || 0)).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Trial Balance Tab */}
      {tab === "trial-balance" && (
        <div style={reportCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <HiOutlineScale size={22} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Trial Balance</h3>
          </div>
          {tbLoading ? (
            <p>Loading trial balance...</p>
          ) : tb.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No ledger data found for this period.</p>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #cbd5e1", color: "#475569", fontWeight: 600 }}>
                    <th style={{ textAlign: "left", padding: "10px 0" }}>Account</th>
                    <th style={{ textAlign: "left", padding: "10px 0" }}>Code</th>
                    <th style={{ textAlign: "left", padding: "10px 0" }}>Type</th>
                    <th style={{ textAlign: "right", padding: "10px 0" }}>Debit</th>
                    <th style={{ textAlign: "right", padding: "10px 0" }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {tb.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px 0" }}>{row.accountName}</td>
                      <td style={{ padding: "10px 0", fontFamily: "monospace" }}>{row.accountCode}</td>
                      <td style={{ padding: "10px 0", textTransform: "capitalize" }}>{row.accountType}</td>
                      <td style={{ padding: "10px 0", textAlign: "right" }}>
                        {row.totalDebit ? `₹${row.totalDebit.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ padding: "10px 0", textAlign: "right" }}>
                        {row.totalCredit ? `₹${row.totalCredit.toLocaleString("en-IN")}` : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid #94a3b8", fontWeight: 700, fontSize: 15 }}>
                    <td colSpan={3} style={{ padding: "12px 0" }}>Grand Total</td>
                    <td style={{ padding: "12px 0", textAlign: "right" }}>₹{tbData?.data?.grandTotalDebit.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 0", textAlign: "right" }}>₹{tbData?.data?.grandTotalCredit.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 12, fontWeight: 600 }}>
                Status:{" "}
                {isBalanced === true ? (
                  <span style={{ color: "#16a34a" }}>Balanced ✓</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>Unbalanced ✗</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. Cash Flow Tab */}
      {tab === "cash-flow" && (
        <div style={reportCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <HiOutlineArrowDownOnSquare size={22} color="#ea580c" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Cash Flow Statement</h3>
          </div>
          {cfLoading ? (
            <p>Loading cash flow...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontWeight: 600 }}>Operating Cash Inflows (Collections / Income)</span>
                <span style={{ fontWeight: 700, color: "#16a34a" }}>₹{cf.totalInflow?.toLocaleString("en-IN") || "0"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontWeight: 600 }}>Operating Cash Outflows (Payments / Purchases)</span>
                <span style={{ fontWeight: 700, color: "#dc2626" }}>-₹{cf.totalOutflow?.toLocaleString("en-IN") || "0"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", marginTop: 8, borderTop: "2px solid #cbd5e1", borderBottom: "2px double #cbd5e1", fontWeight: 700, fontSize: 16 }}>
                <span>Net Increase/(Decrease) in Cash & Equivalents</span>
                <span style={{ color: cf.netCashFlow >= 0 ? "#16a34a" : "#dc2626" }}>₹{cf.netCashFlow?.toLocaleString("en-IN") || "0"}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Business Ratios Tab */}
      {tab === "ratios" && (
        <div style={reportCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <HiOutlineChartBar size={22} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Business Financial Ratios</h3>
          </div>
          {ratiosLoading ? (
            <p>Loading business ratios...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              <div style={ratioCardStyle}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Current Ratio (Liquidity)</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{ratios.currentRatio || "0.00"}:1</span>
                <small style={{ color: ratios.currentRatio >= 1.5 ? "#16a34a" : "#ea580c" }}>
                  {ratios.currentRatio >= 1.5 ? "Optimal liquidity position" : "Potential short-term crunch risk"}
                </small>
              </div>

              <div style={ratioCardStyle}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Quick Ratio (Acid Test)</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{ratios.quickRatio || "0.00"}:1</span>
                <small style={{ color: ratios.quickRatio >= 1.0 ? "#16a34a" : "#ea580c" }}>
                  {ratios.quickRatio >= 1.0 ? "Healthy quick liquidity" : "High reliance on stock liquidation"}
                </small>
              </div>

              <div style={ratioCardStyle}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Debt to Equity Ratio</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{ratios.debtToEquity || "0.00"}:1</span>
                <small style={{ color: ratios.debtToEquity <= 1.0 ? "#16a34a" : "#dc2626" }}>
                  {ratios.debtToEquity <= 1.0 ? "Low leverage risk" : "High leverage financing"}
                </small>
              </div>

              <div style={ratioCardStyle}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Gross Profit Margin</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#16a34a" }}>{ratios.grossProfitMargin || "0.00"}%</span>
                <small style={{ color: "#475569" }}>Margin on core trading activity</small>
              </div>

              <div style={ratioCardStyle}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Net Profit Margin</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#9333ea" }}>{ratios.netProfitMargin || "0.00"}%</span>
                <small style={{ color: "#475569" }}>Bottom line efficiency percentage</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Package Layout */}
      {printData && (
        <div className="print-only">
          {/* Page 1: Coversheet */}
          <div className="print-page">
            <div style={{ textAlign: "center", marginTop: "150px" }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>DUEVORA FINANCIAL PACKAGE</h1>
              <h2 style={{ fontSize: 18, color: "#475569", marginTop: 10 }}>Complete Business Statements & Ledger</h2>
              <div style={{ borderBottom: "2px solid #cbd5e1", width: "200px", margin: "30px auto" }}></div>
              <p style={{ fontSize: 14 }}>Compiled Period: <strong>{startDate}</strong> to <strong>{endDate}</strong></p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 150 }}>Generated natively via browser print engine.</p>
            </div>
          </div>

          {/* Page 2: Trading and P/L */}
          <div className="print-page">
            <div className="print-header">
              <h2>TRADING & PROFIT & LOSS STATEMENT</h2>
              <p>Period: {startDate} to {endDate}</p>
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

          {/* Page 3: Balance Sheet */}
          <div className="print-page">
            <div className="print-header">
              <h2>BALANCE SHEET</h2>
              <p>As of {endDate}</p>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
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
            </div>
          </div>

          {/* Page 4: Trial Balance */}
          <div className="print-page">
            <div className="print-header">
              <h2>TRIAL BALANCE</h2>
              <p>Period: {startDate} to {endDate}</p>
            </div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Debit</th>
                  <th style={{ textAlign: "right" }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {tb.map((row, i) => (
                  <tr key={i}>
                    <td>{row.accountName}</td>
                    <td>{row.accountCode}</td>
                    <td style={{ textTransform: "capitalize" }}>{row.accountType}</td>
                    <td style={{ textAlign: "right" }}>{row.totalDebit ? `₹${row.totalDebit.toLocaleString("en-IN")}` : "—"}</td>
                    <td style={{ textAlign: "right" }}>{row.totalCredit ? `₹${row.totalCredit.toLocaleString("en-IN")}` : "—"}</td>
                  </tr>
                ))}
                <tr className="print-total">
                  <td colSpan={3}>Grand Total</td>
                  <td style={{ textAlign: "right" }}>₹{tbData?.data?.grandTotalDebit.toLocaleString("en-IN")}</td>
                  <td style={{ textAlign: "right" }}>₹{tbData?.data?.grandTotalCredit.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 5: All Invoices */}
          <div className="print-page">
            <div className="print-header">
              <h2>INVOICES REGISTER</h2>
              <p>All recorded invoices</p>
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

          {/* Page 6: All Payments & Receipts */}
          <div className="print-page">
            <div className="print-header">
              <h2>TRANSACTION LOG (PAYMENTS & RECEIPTS)</h2>
              <p>Direct cash and bank updates</p>
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

          {/* Page 7: Chart of Accounts */}
          <div className="print-page">
            <div className="print-header">
              <h2>CHART OF ACCOUNTS</h2>
              <p>Complete business accounts list</p>
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
