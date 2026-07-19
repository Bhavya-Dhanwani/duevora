import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { auditLogsApi } from "../../../../features/auditLogs/api/auditLogsApi";
import { PageHeader, Button, StatusBadge } from "../../common";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function AuditLogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: resp, isLoading } = useQuery({
    queryKey: ["auditLog", id],
    queryFn: () => auditLogsApi.getById(id),
  });

  const log = resp?.data || {};

  const actionColors = {
    create: "#16a34a",
    update: "#2563eb",
    delete: "#dc2626",
    login: "#9333ea",
    logout: "#64748b",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <PageHeader
        title="Audit Log Detail"
        subtitle={`Action: ${log.action || "—"}`}
        action={
          <Button variant="secondary" onClick={() => navigate("/dashboard/audit-logs")} icon={HiOutlineArrowLeft}>
            Back
          </Button>
        }
      />

      {isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["Action", log.action, actionColors[log.action] || "#0f172a"],
              ["Resource", log.resourceType || "—"],
              ["Resource ID", log.resourceId || "—"],
              ["User", log.userName || log.userId?.name || "—"],
              ["IP Address", log.ipAddress || "—"],
              ["User Agent", log.userAgent || "—"],
              ["Timestamp", log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : "—"],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontWeight: 600, color: "#64748b", fontSize: 13, minWidth: 120 }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: color ? 700 : 400, color: color || "#0f172a", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
              </div>
            ))}
          </div>

          {log.changes && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>Changes</h4>
              <pre style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, fontSize: 12, overflow: "auto", margin: 0 }}>
                {typeof log.changes === "string" ? log.changes : JSON.stringify(log.changes, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
