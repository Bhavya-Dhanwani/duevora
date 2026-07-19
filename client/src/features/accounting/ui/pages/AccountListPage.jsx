import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiChevronDown, HiChevronRight, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { accountingApi } from "../../api/accountingApi";
import { Button, EmptyState, Modal, PageHeader } from "../../../../app/components/common";

const TYPES = ["asset", "liability", "equity", "revenue", "expense"];
const title = (value) => value[0].toUpperCase() + value.slice(1);
const emptyForm = { name: "", code: "", type: "asset", parentId: "", status: "active" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function AccountListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState(new Set(TYPES));
  const { data, isLoading, isError } = useQuery({ queryKey: ["accounts"], queryFn: () => accountingApi.listAccounts() });
  const accounts = data?.data || [];
  const grouped = useMemo(() => TYPES.reduce((all, type) => ({ ...all, [type]: accounts.filter((a) => a.type === type) }), {}), [accounts]);
  const create = useMutation({ mutationFn: accountingApi.createAccount, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["accounts"] }); setOpen(false); setForm(emptyForm); } });
  const submit = (event) => { event.preventDefault(); create.mutate({ ...form, parentId: form.parentId || undefined }); };
  const toggle = (type) => setExpanded((current) => { const next = new Set(current); next.has(type) ? next.delete(type) : next.add(type); return next; });

  return <div style={{ maxWidth: 1100, margin: "0 auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><PageHeader title="Chart of Accounts" subtitle="Organize the accounts used by your general ledger." /><div style={{ display: "flex", gap: 10 }}><Button variant="secondary" onClick={() => navigate("/dashboard/accounts/tree")}>Tree View</Button><Button variant="secondary" onClick={() => navigate("/dashboard/ledger")}>Ledger</Button><Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>Create account</Button><Button variant="secondary" onClick={() => exportToPdf({ title: "Chart of Accounts", columns: [{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"type",label:"Type"},{key:"status",label:"Status"}], data: accounts, filename: "chart-of-accounts" })} icon={HiOutlineDocumentArrowDown}>Export PDF</Button></div></div>
    {isError ? <EmptyState title="Could not load accounts" description="Check that you have account viewing permission and try again." /> : !isLoading && !accounts.length ? <EmptyState title="No accounts yet" description="Create your first account to start posting transactions." /> : <div style={{ display: "grid", gap: 12 }}>{TYPES.map((type) => <section key={type} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}><button type="button" onClick={() => toggle(type)} style={{ cursor: "pointer", border: 0, background: "#f8fafc", display: "flex", width: "100%", padding: "14px 16px", alignItems: "center", gap: 8, fontWeight: 750, color: "#334155", textAlign: "left" }}>{expanded.has(type) ? <HiChevronDown /> : <HiChevronRight />}{title(type)} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({grouped[type].length})</span></button>{expanded.has(type) && <div>{grouped[type].map((account) => <div key={account._id} style={{ display: "grid", gridTemplateColumns: "110px 1fr 120px", padding: "12px 16px", borderTop: "1px solid #f1f5f9", gap: 12 }}><span style={{ color: "#64748b", fontFamily: "monospace" }}>{account.code}</span><span>{account.name}</span><span style={{ color: account.status === "inactive" ? "#b45309" : "#15803d" }}>{account.status || "active"}</span></div>)}</div>}</section>)}</div>}
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Create account"><form onSubmit={submit} style={{ display: "grid", gap: 14 }}><label>Account name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={field} /></label><label>Account code<input required pattern="[a-zA-Z0-9_]+" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={field} /></label><label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={field}>{TYPES.map((type) => <option key={type} value={type}>{title(type)}</option>)}</select></label><label>Parent account (optional)<select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} style={field}><option value="">None — top level</option>{accounts.map((account) => <option key={account._id} value={account._id}>{account.code} — {account.name}</option>)}</select></label><div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={create.isPending}>Create account</Button></div>{create.isError && <small style={{ color: "#b91c1c" }}>{create.error?.response?.data?.message || "Could not create the account."}</small>}</form></Modal>
  </div>;
}