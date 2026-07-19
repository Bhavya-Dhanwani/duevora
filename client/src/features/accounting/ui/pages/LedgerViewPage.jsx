import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { accountingApi } from "../../api/accountingApi";
import { Button, DataTable, PageHeader, EmptyState } from "../../../../app/components/common";
import { exportToPdf } from "../../../../lib/exportToPdf";

export default function LedgerViewPage() {
  const [accountId, setAccountId] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ledger", accountId],
    queryFn: () => accountingApi.listLedger({ limit: 100, ...(accountId ? { accountId } : {}) }),
  });

  const entries = data?.data?.entries || data?.data || [];
  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => accountingApi.listAccounts() });
  const accounts = accountsQuery.data?.data || [];

  let runningBalance = 0;
  const rows = entries.map((e) => {
    const debit = e.debit || 0;
    const credit = e.credit || 0;
    runningBalance += debit - credit;
    return { ...e, runningBalance };
  });

  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="General Ledger" subtitle="View all ledger transactions" />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "General Ledger", columns: [{key:"date",label:"Date",render:(v)=>v?new Date(v).toLocaleDateString("en-IN"):"—"},{key:"accountId",label:"Account",render:(v)=>v?.name||"—"},{key:"journalEntryId",label:"Journal Entry",render:(v)=>v?.entryNumber||"—"},{key:"debit",label:"Debit",render:(v)=>v?`₹${Number(v).toLocaleString("en-IN",{minimumFractionDigits:2})}`:"—"},{key:"credit",label:"Credit",render:(v)=>v?`₹${Number(v).toLocaleString("en-IN",{minimumFractionDigits:2})}`:"—"}], data: rows, filename: "general-ledger" })}>
            Export PDF
          </Button>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 7, fontSize: 13, minWidth: 180 }}
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isError ? (
        <EmptyState title="Could not load ledger" description="Check permissions and try again." />
      ) : (
        <DataTable
          loading={isLoading}
          data={rows}
          columns={[
            {
              key: "date",
              label: "Date",
              render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—"),
            },
            {
              key: "accountId",
              label: "Account",
              render: (v) => v?.name || v || "—",
            },
            {
              key: "journalEntryId",
              label: "Journal Entry",
              render: (v) => v?.entryNumber || v || "—",
            },
            {
              key: "debit",
              label: "Debit",
              align: "right",
              render: (v) =>
                v
                  ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                  : "—",
            },
            {
              key: "credit",
              label: "Credit",
              align: "right",
              render: (v) =>
                v
                  ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                  : "—",
            },
            {
              key: "runningBalance",
              label: "Balance",
              align: "right",
              render: (v) => (
                <span style={{ fontWeight: 600, color: v >= 0 ? "#166534" : "#991b1b" }}>
                  ₹{Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  {v < 0 ? " Dr" : " Cr"}
                </span>
              ),
            },
          ]}
        />
      )}

      {entries.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 120px 120px 120px",
            padding: "14px 16px",
            background: "#f8fafc",
            fontWeight: 700,
            borderTop: "2px solid #e2e8f0",
            fontSize: 13,
          }}
        >
          <span>Total ({entries.length} entries)</span>
          <span />
          <span />
          <span style={{ textAlign: "right" }}>
            ₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span style={{ textAlign: "right" }}>
            ₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span />
        </div>
      )}
    </div>
  );
}
