import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { accountingApi } from "../../api/accountingApi";
import { Button, DataTable, Modal, PageHeader } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";

const emptyForm = { name: "", code: "", description: "", startDate: "", endDate: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function ProjectListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => accountingApi.listProjects() });
  const items = data?.data || [];

  const create = useMutation({
    mutationFn: accountingApi.createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Project created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      name: form.name,
      code: form.code,
      description: form.description,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Projects" subtitle="Track projects and their associated costs." />
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create project
        </Button>
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Projects", columns: [{key:"name",label:"Name"},{key:"code",label:"Code"},{key:"description",label:"Description"},{key:"startDate",label:"Start Date",render:(v)=>v?new Date(v).toLocaleDateString("en-IN"):"—"},{key:"endDate",label:"End Date",render:(v)=>v?new Date(v).toLocaleDateString("en-IN"):"—"}], data: items, filename: "projects" })}>
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
          { key: "startDate", label: "Start Date", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          { key: "endDate", label: "End Date", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          { key: "status", label: "Status", render: (v) => v || "active" },
        ]}
        emptyTitle="No projects"
        emptyDescription="Create your first project."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create project">
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Start Date
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={field} />
            </label>
            <label>
              End Date
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={field} />
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
