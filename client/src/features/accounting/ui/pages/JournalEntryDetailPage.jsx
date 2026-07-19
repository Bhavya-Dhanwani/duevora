import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HiArrowLeft, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { accountingApi } from "../../api/accountingApi";
import { PageHeader, StatusBadge, Button } from "../../../../app/components/common";

export default function JournalEntryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["journalEntry", id],
    queryFn: () => accountingApi.getJournalEntry(id),
    enabled: !!id,
  });

  const entry = data?.data;
  const lines = entry?.lines || [];
  const totals = lines.reduce(
    (sum, l) => ({ debit: sum.debit + (l.debit || 0), credit: sum.credit + (l.credit || 0) }),
    { debit: 0, credit: 0 }
  );
  const balanced = totals.debit > 0 && totals.debit === totals.credit;

  if (isLoading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: "#64748b", padding: 40 }}>Loading...</p>
      </div>
    );
  }

  if (isError || !entry) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <PageHeader title="Journal Entry" subtitle="Entry not found." />
        <Button variant="secondary" onClick={() => navigate("/dashboard/journal-entries")} icon={HiArrowLeft}>
          Back to Journal Entries
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <PageHeader
          title={`Journal Entry ${entry.entryNumber || ""}`}
          subtitle={entry.narration || "Double-entry posting detail"}
        />
        <Button variant="secondary" onClick={() => navigate("/dashboard/journal-entries")} icon={HiArrowLeft}>
          Back
        </Button>
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: `Journal Entry ${entry.entryNumber || ""}`, columns: [{key:"accountId",label:"Account",render:(v)=>v?.name||"—"},{key:"debit",label:"Debit",render:(v)=>v?`₹${Number(v).toLocaleString("en-IN",{minimumFractionDigits:2})}`:"—"},{key:"credit",label:"Credit",render:(v)=>v?`₹${Number(v).toLocaleString("en-IN",{minimumFractionDigits:2})}`:"—"}], data: lines, filename: `journal-entry-${entry.entryNumber || entry._id}` })}>
          Export PDF
        </Button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Entry Number</div>
            <div style={{ fontWeight: 600, color: "#1e293b" }}>{entry.entryNumber || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Date</div>
            <div style={{ fontWeight: 600, color: "#1e293b" }}>
              {entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Status</div>
            <StatusBadge status={entry.status || "draft"} />
          </div>
        </div>
        {entry.narration && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Narration</div>
            <div style={{ color: "#334155" }}>{entry.narration}</div>
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", padding: "12px 16px", background: "#f8fafc", fontWeight: 700, fontSize: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
          <span>ACCOUNT</span>
          <span style={{ textAlign: "right" }}>DEBIT</span>
          <span style={{ textAlign: "right" }}>CREDIT</span>
        </div>
        {lines.map((line, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px",
              padding: "12px 16px",
              borderTop: "1px solid #f1f5f9",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#334155" }}>{line.accountId?.name || line.accountName || "—"}</span>
            <span style={{ textAlign: "right", fontFamily: "monospace" }}>
              {line.debit ? `₹${Number(line.debit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
            </span>
            <span style={{ textAlign: "right", fontFamily: "monospace" }}>
              {line.credit ? `₹${Number(line.credit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 120px",
            padding: "14px 16px",
            background: "#f8fafc",
            fontWeight: 700,
            borderTop: "2px solid #e2e8f0",
          }}
        >
          <span style={{ color: "#334155" }}>Total</span>
          <span style={{ textAlign: "right", fontFamily: "monospace", color: "#1e293b" }}>
            ₹{totals.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span style={{ textAlign: "right", fontFamily: "monospace", color: "#1e293b" }}>
            ₹{totals.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 12, textAlign: "right" }}>
        <span
          style={{
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: balanced ? "#dcfce7" : "#fee2e2",
            color: balanced ? "#166534" : "#991b1b",
          }}
        >
          {balanced ? "Balanced" : "Unbalanced"}
        </span>
      </div>
    </div>
  );
}
