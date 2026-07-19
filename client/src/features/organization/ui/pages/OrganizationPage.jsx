import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "../../api/organizationApi";
import { PageHeader, Button } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

const input = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 5, padding: 9, border: "1px solid #cbd5e1", borderRadius: 7 };

export default function OrganizationPage() {
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: () => organizationApi.get(),
  });

  const org = data?.data || {};
  const [form, setForm] = useState({});

  const update = useMutation({
    mutationFn: (payload) => organizationApi.update(org._id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["organization"]);
      setEditing(false);
      success("Organization updated");
    },
    onError: (err) => notifyError(err.response?.data?.message || "Update failed"),
  });

  const startEdit = () => {
    setForm({ name: org.name || "", address: org.address || "", phone: org.phone || "", industry: org.industry || "", businessType: org.businessType || "" });
    setEditing(true);
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <PageHeader
        title="Organization"
        subtitle="View and update your organization details."
        action={!editing ? <div style={{ display: "flex", gap: 10 }}><Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Organization Details", filename: "organization", columns: [{ key: "label", label: "Field" }, { key: "value", label: "Value" }], data: [["Name", org.name], ["Code", org.code], ["Phone", org.phone], ["Industry", org.industry], ["Business Type", org.businessType], ["Address", org.address], ["Status", org.status]].map(([label, val]) => ({ label, value: val || "—" })) })}>Export PDF</Button><Button variant="primary" onClick={startEdit}>Edit</Button></div> : undefined}
      />

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); update.mutate(form); }} style={{ display: "grid", gap: 14 }}>
            <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={input} /></label>
              <label>Industry<input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} style={input} /></label>
            </div>
            <label>Business Type<input value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} style={input} /></label>
            <label>Address<textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={input} /></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={update.isPending}>Save</Button>
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {[
              ["Name", org.name],
              ["Code", org.code],
              ["Phone", org.phone],
              ["Industry", org.industry],
              ["Business Type", org.businessType],
              ["Address", org.address],
              ["Status", org.status],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontWeight: 600, color: "#64748b", fontSize: 13 }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{val || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
