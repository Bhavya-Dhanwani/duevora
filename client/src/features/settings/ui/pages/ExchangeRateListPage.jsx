import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { settingsApi } from "../../api/settingsApi";
import { Button, DataTable, Modal, PageHeader } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";

const emptyForm = { fromCurrency: "", toCurrency: "", rate: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function ExchangeRateListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({ queryKey: ["exchangeRates"], queryFn: () => settingsApi.listExchangeRates() });
  const items = data?.data || [];

  const currenciesQuery = useQuery({ queryKey: ["currencies"], queryFn: () => settingsApi.listCurrencies(), enabled: open });
  const currencies = currenciesQuery.data?.data || [];

  const create = useMutation({
    mutationFn: settingsApi.createExchangeRate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchangeRates"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Exchange rate created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      fromCurrency: form.fromCurrency,
      toCurrency: form.toCurrency,
      rate: Number(form.rate),
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Exchange Rates" subtitle="Manage currency exchange rates." />
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Exchange Rates", filename: "exchange_rates", columns: [{ key: "fromCurrency", label: "From", render: (v) => typeof v === "object" ? v?.code : v || "—" }, { key: "toCurrency", label: "To", render: (v) => typeof v === "object" ? v?.code : v || "—" }, { key: "rate", label: "Rate" }, { key: "date", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }], data: items })}>
          Export PDF
        </Button>
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Add exchange rate
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "fromCurrency", label: "From", render: (v) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{typeof v === "object" ? v?.code : v || "—"}</span> },
          { key: "toCurrency", label: "To", render: (v) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{typeof v === "object" ? v?.code : v || "—"}</span> },
          { key: "rate", label: "Rate", align: "right", render: (v) => <span style={{ fontFamily: "monospace" }}>{v || "—"}</span> },
          { key: "date", label: "Date", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          { key: "status", label: "Status", render: (v) => v || "active" },
        ]}
        emptyTitle="No exchange rates"
        emptyDescription="Add your first exchange rate."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add exchange rate">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              From Currency
              <select required value={form.fromCurrency} onChange={(e) => setForm({ ...form, fromCurrency: e.target.value })} style={field}>
                <option value="">Select</option>
                {currencies.map((c) => (
                  <option key={c._id} value={c.code || c._id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </label>
            <label>
              To Currency
              <select required value={form.toCurrency} onChange={(e) => setForm({ ...form, toCurrency: e.target.value })} style={field}>
                <option value="">Select</option>
                {currencies.map((c) => (
                  <option key={c._id} value={c.code || c._id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Rate
            <input required type="number" min="0" step="0.0001" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} style={field} />
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
