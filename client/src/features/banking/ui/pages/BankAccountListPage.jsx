import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { bankingApi } from "../../api/bankingApi";
import { accountingApi } from "../../../accounting/api/accountingApi";
import { Button, DataTable, Modal, PageHeader, Tabs } from "../../../../app/components/common";
import { exportToPdf } from "../../../../lib/exportToPdf";

const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 5, padding: 9, border: "1px solid #cbd5e1", borderRadius: 7 };

export default function BankAccountListPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("accounts");
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState({ bankName: "", accountNumber: "", ifscCode: "", branch: "", accountId: "" });
  const [tx, setTx] = useState({ bankAccountId: "", transactionDate: new Date().toISOString().slice(0, 10), amount: "", type: "deposit", reference: "" });

  const accounts = useQuery({ queryKey: ["bankAccounts"], queryFn: () => bankingApi.listBankAccounts() });
  const transactions = useQuery({ queryKey: ["bankTransactions"], queryFn: () => bankingApi.listBankTransactions() });
  const coa = useQuery({ queryKey: ["accounts"], queryFn: () => accountingApi.listAccounts() });

  const createAccount = useMutation({ mutationFn: bankingApi.createBankAccount, onSuccess: () => { qc.invalidateQueries({ queryKey: ["bankAccounts"] }); setOpen(false); } });
  const createTx = useMutation({ mutationFn: bankingApi.createBankTransaction, onSuccess: () => { qc.invalidateQueries({ queryKey: ["bankTransactions"] }); setOpen(false); } });

  const submit = (e) => {
    e.preventDefault();
    if (tab === "accounts") createAccount.mutate(account);
    else createTx.mutate({ ...tx, amount: Number(tx.amount), transactionDate: new Date(tx.transactionDate).toISOString() });
  };

  const banks = accounts.data?.data || [];
  const ledger = coa.data?.data || [];
  const mut = tab === "accounts" ? createAccount : createTx;

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Banking & Cash" subtitle="Maintain bank accounts and reconcile statement activity." />
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: tab === "accounts" ? "Bank Accounts" : "Bank Transactions", filename: tab === "accounts" ? "bank-accounts" : "bank-transactions", columns: tab === "accounts" ? [{ key: "bankName", label: "Bank" }, { key: "accountNumber", label: "Account #" }, { key: "ifscCode", label: "IFSC" }, { key: "branch", label: "Branch" }] : [{ key: "transactionDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "type", label: "Type", render: (v) => (v || "—").toUpperCase() }, { key: "amount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` }, { key: "reference", label: "Reference" }], data: tab === "accounts" ? banks : (transactions.data?.data || []) })}>
            Export PDF
          </Button>
          <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
            {tab === "accounts" ? "Add bank account" : "Record transaction"}
          </Button>
        </div>
      </div>
      <Tabs active={tab} onChange={setTab} tabs={[{ key: "accounts", label: "Bank accounts" }, { key: "transactions", label: "Statement log" }]} />
      {tab === "accounts" ? (
        <DataTable loading={accounts.isLoading} data={banks} columns={[{ key: "bankName", label: "Bank" }, { key: "accountNumber", label: "Account #" }, { key: "ifscCode", label: "IFSC" }, { key: "branch", label: "Branch" }]} emptyTitle="No bank accounts" emptyDescription="Add your first bank account to get started." />
      ) : (
        <DataTable loading={transactions.isLoading} data={transactions.data?.data || []} columns={[{ key: "transactionDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "type", label: "Type", render: (v) => (v || "—").toUpperCase() }, { key: "amount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` }, { key: "reference", label: "Reference" }]} emptyTitle="No transactions" emptyDescription="Record your first transaction to get started." />
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title={tab === "accounts" ? "Add Bank Account" : "Record Transaction"}>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          {tab === "accounts" ? (
            <>
              <label>Bank Name<input required value={account.bankName} onChange={(e) => setAccount({ ...account, bankName: e.target.value })} style={field} /></label>
              <label>Account Number<input required value={account.accountNumber} onChange={(e) => setAccount({ ...account, accountNumber: e.target.value })} style={field} /></label>
              <label>IFSC Code<input value={account.ifscCode} onChange={(e) => setAccount({ ...account, ifscCode: e.target.value })} style={field} /></label>
              <label>Branch<input value={account.branch} onChange={(e) => setAccount({ ...account, branch: e.target.value })} style={field} /></label>
            </>
          ) : (
            <>
              <label>Bank Account<select required value={tx.bankAccountId} onChange={(e) => setTx({ ...tx, bankAccountId: e.target.value })} style={field}><option value="">Select account</option>{banks.map((b) => <option key={b._id} value={b._id}>{b.bankName} — {b.accountNumber}</option>)}</select></label>
              <label>Date<input required type="date" value={tx.transactionDate} onChange={(e) => setTx({ ...tx, transactionDate: e.target.value })} style={field} /></label>
              <label>Type<select value={tx.type} onChange={(e) => setTx({ ...tx, type: e.target.value })} style={field}><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></select></label>
              <label>Amount<input required type="number" min="0.01" step="0.01" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: e.target.value })} style={field} /></label>
              <label>Reference<input value={tx.reference} onChange={(e) => setTx({ ...tx, reference: e.target.value })} style={field} /></label>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={mut.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
