import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineCurrencyDollar,
  HiOutlinePlus,
} from "react-icons/hi2";
import { settingsApi } from "../../api/settingsApi";
import {
  PageHeader,
  Button,
  Tabs,
  DataTable,
  Modal,
  StatusBadge,
} from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";

const inputStyle = {
  boxSizing: "border-box",
  width: "100%",
  padding: 9,
  marginTop: 5,
  border: "1px solid #cbd5e1",
  borderRadius: 7,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();
  const [activeTab, setActiveTab] = useState("general");
  const [isFYOpen, setIsFYOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [fyForm, setFYForm] = useState({ name: "", startDate: "", endDate: "" });
  const [currencyForm, setCurrencyForm] = useState({ name: "", code: "", symbol: "" });

  // Financial Years
  const { data: fyResponse, isLoading: fyLoading } = useQuery({
    queryKey: ["financialYears"],
    queryFn: () => settingsApi.listFinancialYears(),
  });
  const fyList = fyResponse?.data || [];

  const createFY = useMutation({
    mutationFn: (data) => settingsApi.createFinancialYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["financialYears"]);
      setIsFYOpen(false);
      setFYForm({ name: "", startDate: "", endDate: "" });
      success("Financial year created");
    },
    onError: (err) => notifyError(err.response?.data?.message || "Failed to create financial year"),
  });

  const archiveFY = useMutation({
    mutationFn: (id) => settingsApi.archiveFinancialYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["financialYears"]);
      success("Financial year archived");
    },
    onError: (err) => notifyError(err.response?.data?.message || "Failed to archive"),
  });

  // Currencies
  const { data: currResponse, isLoading: currLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => settingsApi.listCurrencies(),
  });
  const currList = currResponse?.data || [];

  const createCurrency = useMutation({
    mutationFn: (data) => settingsApi.createCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["currencies"]);
      setIsCurrencyOpen(false);
      setCurrencyForm({ name: "", code: "", symbol: "" });
      success("Currency added");
    },
    onError: (err) => notifyError(err.response?.data?.message || "Failed to add currency"),
  });

  const fyColumns = [
    { key: "name", label: "Name" },
    {
      key: "startDate",
      label: "Start Date",
      render: (val) => (val ? new Date(val).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "endDate",
      label: "End Date",
      render: (val) => (val ? new Date(val).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "isClosed",
      label: "Status",
      render: (val) => (
        <StatusBadge status={val ? "active" : "pending"}>
          {val ? "Archived" : "Open"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      render: (_, row) =>
        !row.isClosed ? (
          <Button
            variant="secondary"
            style={{ padding: "4px 10px", fontSize: 11 }}
            onClick={() => archiveFY.mutate(row._id)}
          >
            Archive
          </Button>
        ) : null,
    },
  ];

  const currencyColumns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    { key: "symbol", label: "Symbol" },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <StatusBadge status={val || "active"}>{val || "Active"}</StatusBadge>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        title="Settings"
        subtitle="Organization controls, financial years, and currency configuration."
      />

      <Tabs
        tabs={[
          { key: "general", label: "General" },
          { key: "financial-years", label: "Financial Years" },
          { key: "currencies", label: "Currencies" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
          <section
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 24,
              maxWidth: 720,
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ padding: 11, borderRadius: 10, background: "#eff6ff", color: "#1d4ed8" }}>
                <HiOutlineShieldCheck size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Roles & permissions</h2>
                <p style={{ margin: "0 0 18px", color: "#64748b", lineHeight: 1.5 }}>
                  Create organization roles and grant or revoke permissions from the role matrix.
                </p>
                <Button variant="primary" onClick={() => navigate("/dashboard/users?tab=roles")} icon={HiOutlineUserGroup}>
                  Manage roles & permissions
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "financial-years" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Button variant="primary" onClick={() => setIsFYOpen(true)} icon={HiOutlinePlus}>
              New Financial Year
            </Button>
          </div>
          <DataTable
            columns={fyColumns}
            data={fyList}
            loading={fyLoading}
            emptyTitle="No financial years"
            emptyDescription="Create your first financial year to start tracking periods."
          />
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Button variant="secondary" onClick={() => navigate("/dashboard/financial-years")}>
              View all financial years
            </Button>
          </div>
        </div>
      )}

      {activeTab === "currencies" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Button variant="primary" onClick={() => setIsCurrencyOpen(true)} icon={HiOutlinePlus}>
              Add Currency
            </Button>
          </div>
          <DataTable
            columns={currencyColumns}
            data={currList}
            loading={currLoading}
            emptyTitle="No currencies"
            emptyDescription="Add currencies to use in invoices and transactions."
          />
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Button variant="secondary" onClick={() => navigate("/dashboard/currencies")}>
              Manage currencies
            </Button>
            <Button variant="secondary" style={{ marginLeft: 8 }} onClick={() => navigate("/dashboard/exchange-rates")}>
              Exchange rates
            </Button>
          </div>
        </div>
      )}

      {/* Create Financial Year Modal */}
      <Modal isOpen={isFYOpen} onClose={() => setIsFYOpen(false)} title="New Financial Year">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createFY.mutate(fyForm);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label>
              Year Name
              <input
                required
                style={inputStyle}
                placeholder="e.g. FY 2026-27"
                value={fyForm.name}
                onChange={(e) => setFYForm({ ...fyForm, name: e.target.value })}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <label>
                Start Date
                <input
                  required
                  type="date"
                  style={inputStyle}
                  value={fyForm.startDate}
                  onChange={(e) => setFYForm({ ...fyForm, startDate: e.target.value })}
                />
              </label>
              <label>
                End Date
                <input
                  required
                  type="date"
                  style={inputStyle}
                  value={fyForm.endDate}
                  onChange={(e) => setFYForm({ ...fyForm, endDate: e.target.value })}
                />
              </label>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button type="button" variant="secondary" onClick={() => setIsFYOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createFY.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Currency Modal */}
      <Modal isOpen={isCurrencyOpen} onClose={() => setIsCurrencyOpen(false)} title="Add Currency">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCurrency.mutate(currencyForm);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label>
              Currency Name
              <input
                required
                style={inputStyle}
                placeholder="e.g. Indian Rupee"
                value={currencyForm.name}
                onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <label>
                Code
                <input
                  required
                  style={inputStyle}
                  placeholder="e.g. INR"
                  value={currencyForm.code}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
                />
              </label>
              <label>
                Symbol
                <input
                  required
                  style={inputStyle}
                  placeholder="e.g. ₹"
                  value={currencyForm.symbol}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                />
              </label>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button type="button" variant="secondary" onClick={() => setIsCurrencyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createCurrency.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
