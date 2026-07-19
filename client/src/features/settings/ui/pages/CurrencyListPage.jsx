import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { settingsApi } from "../../api/settingsApi";
import { Button, DataTable, Modal, PageHeader } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";

const emptyForm = { code: "", name: "", symbol: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function CurrencyListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({ queryKey: ["currencies"], queryFn: () => settingsApi.listCurrencies() });
  const items = data?.data || [];

  const create = useMutation({
    mutationFn: settingsApi.createCurrency,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currencies"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Currency created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate(form);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Currencies" subtitle="Manage supported currencies." />
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Currencies", filename: "currencies", columns: [{ key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "symbol", label: "Symbol" }, { key: "status", label: "Status" }], data: items })}>
          Export PDF
        </Button>
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Add currency
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "code", label: "Code", render: (v) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span> },
          { key: "name", label: "Name" },
          { key: "symbol", label: "Symbol", render: (v) => <span style={{ fontSize: 16 }}>{v || "—"}</span> },
          { key: "status", label: "Status", render: (v) => v || "active" },
        ]}
        emptyTitle="No currencies"
        emptyDescription="Add your first currency."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add currency">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Code (e.g. INR)
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} style={field} maxLength={3} />
          </label>
          <label>
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={field} />
          </label>
          <label>
            Symbol
            <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} style={field} placeholder="₹" />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={create.isPending}>Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
