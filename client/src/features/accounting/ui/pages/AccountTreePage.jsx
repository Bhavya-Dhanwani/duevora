import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiChevronDown, HiChevronRight, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { accountingApi } from "../../api/accountingApi";
import { Button, EmptyState, Modal, PageHeader } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";

const TYPES = ["asset", "liability", "equity", "revenue", "expense"];
const title = (v) => v[0].toUpperCase() + v.slice(1);
const emptyForm = { name: "", code: "", type: "asset", parentId: "", status: "active" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

function TreeNode({ account, allAccounts, depth = 0, expanded, onToggle }) {
  const children = allAccounts.filter((a) => a.parentId === account._id);
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(account._id);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderTop: "1px solid #f1f5f9",
          paddingLeft: 16 + depth * 24,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(account._id)}
            style={{ border: 0, background: "none", cursor: "pointer", color: "#64748b", padding: 2 }}
          >
            {isOpen ? <HiChevronDown size={14} /> : <HiChevronRight size={14} />}
          </button>
        ) : (
          <span style={{ width: 18 }} />
        )}
        <span style={{ fontFamily: "monospace", color: "#64748b", fontSize: 13, minWidth: 70 }}>
          {account.code}
        </span>
        <span style={{ flex: 1, fontWeight: 500, color: "#1e293b" }}>{account.name}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 10,
            background: account.status === "inactive" ? "#fef3c7" : "#dcfce7",
            color: account.status === "inactive" ? "#92400e" : "#166534",
          }}
        >
          {account.status || "active"}
        </span>
      </div>
      {isOpen &&
        children.map((child) => (
          <TreeNode
            key={child._id}
            account={child}
            allAccounts={allAccounts}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

export default function AccountTreePage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedTypes, setExpandedTypes] = useState(new Set(TYPES));
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountingApi.listAccounts(),
  });
  const accounts = data?.data || [];

  const grouped = useMemo(
    () =>
      TYPES.reduce(
        (all, type) => ({
          ...all,
          [type]: accounts.filter((a) => a.type === type && !a.parentId),
        }),
        {}
      ),
    [accounts]
  );

  const create = useMutation({
    mutationFn: accountingApi.createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Account created successfully");
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || "Could not create account");
    },
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({ ...form, parentId: form.parentId || undefined });
  };

  const toggleType = (type) =>
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });

  const toggleNode = (id) =>
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Chart of Accounts" subtitle="Organize the accounts used by your general ledger." />
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create account
        </Button>
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Chart of Accounts", columns: [{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"type",label:"Type"},{key:"status",label:"Status"}], data: accounts, filename: "chart-of-accounts" })}>
          Export PDF
        </Button>
      </div>

      {isError ? (
        <EmptyState title="Could not load accounts" description="Check permissions and try again." />
      ) : !isLoading && !accounts.length ? (
        <EmptyState title="No accounts yet" description="Create your first account to start." />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {TYPES.map((type) => (
            <section
              key={type}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}
            >
              <button
                type="button"
                onClick={() => toggleType(type)}
                style={{
                  cursor: "pointer",
                  border: 0,
                  background: "#f8fafc",
                  display: "flex",
                  width: "100%",
                  padding: "14px 16px",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 750,
                  color: "#334155",
                  textAlign: "left",
                }}
              >
                {expandedTypes.has(type) ? <HiChevronDown /> : <HiChevronRight />}
                {title(type)}
                <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                  ({(grouped[type] || []).length})
                </span>
              </button>
              {expandedTypes.has(type) &&
                (grouped[type] || []).map((account) => (
                  <TreeNode
                    key={account._id}
                    account={account}
                    allAccounts={accounts}
                    expanded={expandedNodes}
                    onToggle={toggleNode}
                  />
                ))}
            </section>
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create account">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Account name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={field} />
          </label>
          <label>
            Account code
            <input required pattern="[a-zA-Z0-9_]+" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={field} />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={field}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{title(t)}</option>
              ))}
            </select>
          </label>
          <label>
            Parent account (optional)
            <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} style={field}>
              <option value="">None — top level</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.code} — {a.name}</option>
              ))}
            </select>
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
