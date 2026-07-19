import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { accountingApi } from "../../api/accountingApi";
import { Button, DataTable, Modal, PageHeader, EmptyState } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";

const emptyForm = { name: "", code: "", description: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function VoucherTypeListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["voucherTypes"],
    queryFn: () => accountingApi.listVoucherTypes(),
  });
  const items = data?.data || [];

  const create = useMutation({
    mutationFn: accountingApi.createVoucherType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voucherTypes"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Voucher type created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed to create voucher type"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate(form);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Voucher Types" subtitle="Manage voucher types for journal entries." />
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create voucher type
        </Button>
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Voucher Types", columns: [{key:"name",label:"Name"},{key:"code",label:"Code"},{key:"description",label:"Description"},{key:"status",label:"Status"}], data: items, filename: "voucher-types" })}>
          Export PDF
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "name", label: "Name" },
          { key: "code", label: "Code", render: (v) => <span style={{ fontFamily: "monospace" }}>{v || "—"}</span> },
          { key: "description", label: "Description", render: (v) => v || "—" },
          {
            key: "status",
            label: "Status",
            render: (v) => (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: v === "inactive" ? "#fef3c7" : "#dcfce7", color: v === "inactive" ? "#92400e" : "#166534" }}>
                {v || "active"}
              </span>
            ),
          },
        ]}
        emptyTitle="No voucher types"
        emptyDescription="Create your first voucher type."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create voucher type">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={field} />
          </label>
          <label>
            Code
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={field} />
          </label>
          <label>
            Description
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={field} />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
