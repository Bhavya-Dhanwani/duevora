import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiArchiveBox, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { settingsApi } from "../../api/settingsApi";
import { Button, DataTable, Modal, PageHeader } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";

const emptyForm = { name: "", startDate: "", endDate: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function FinancialYearListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({ queryKey: ["financialYears"], queryFn: () => settingsApi.listFinancialYears() });
  const items = data?.data || [];

  const create = useMutation({
    mutationFn: settingsApi.createFinancialYear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financialYears"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Financial year created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const archive = useMutation({
    mutationFn: (id) => settingsApi.archiveFinancialYear(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financialYears"] });
      notify.success("Financial year archived");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed to archive"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      name: form.name,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Financial Years" subtitle="Manage financial year periods." />
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Financial Years", filename: "financial_years", columns: [{ key: "name", label: "Year Name" }, { key: "startDate", label: "Start Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "endDate", label: "End Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "status", label: "Status" }], data: items })}>
          Export PDF
        </Button>
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create financial year
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "name", label: "Year Name" },
          { key: "startDate", label: "Start Date", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          { key: "endDate", label: "End Date", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          {
            key: "status",
            label: "Status",
            render: (v) => (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: v === "archived" ? "#e2e8f0" : "#dcfce7", color: v === "archived" ? "#475569" : "#166534" }}>
                {v || "active"}
              </span>
            ),
          },
          {
            key: "_id",
            label: "Action",
            render: (v, row) =>
              (row.status || "active") === "active" ? (
                <button
                  onClick={(e) => { e.stopPropagation(); archive.mutate(v); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <HiArchiveBox size={14} />Archive
                </button>
              ) : null,
          },
        ]}
        emptyTitle="No financial years"
        emptyDescription="Create a financial year to start."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create financial year">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Year Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={field} placeholder="e.g. FY 2026-27" />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Start Date
              <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={field} />
            </label>
            <label>
              End Date
              <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={field} />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
