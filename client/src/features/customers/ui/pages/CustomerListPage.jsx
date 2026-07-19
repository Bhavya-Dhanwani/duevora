import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { HiPlus, HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";
import useCustomers from "../../hooks/useCustomers";
import {
  PageHeader,
  Button,
  DataTable,
  FilterBar,
  StatusBadge,
  ConfirmDialog,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from "../../../../app/components/common";
import s from "../css/CustomerList.module.css";

const columns = [
  {
    key: "name",
    label: "Customer",
    render: (_, row) => (
      <div className={s.customerCell}>
        <Avatar name={row.name} size={32} />
        <div>
          <div className={s.customerName}>{row.name}</div>
          <div className={s.customerEmail}>{row.email}</div>
        </div>
      </div>
    ),
  },
  { key: "phone", label: "Phone" },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusBadge status={val || "active"}>{val || "Active"}</StatusBadge>,
  },
  {
    key: "createdAt",
    label: "Created",
    render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
  },
];

export default function CustomerListPage() {
  const navigate = useNavigate();
  const { items, loading, total, page, totalPages, getAll, remove, setPage, setPageSize, pageSize } =
    useCustomers();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getAll({ page, limit: pageSize, search });
  }, [page, pageSize]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    getAll({ page: 1, limit: pageSize, search: val });
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await remove(deleteTarget._id);
      setDeleteTarget(null);
      getAll({ page, limit: pageSize, search });
    }
  };

  const actionCol = {
    key: "actions",
    label: "",
    width: "60px",
    render: (_, row) => (
      <DropdownMenu trigger={<button className={s.moreBtn} type="button">⋯</button>}>
        {({ onClose }) => (
          <>
            <DropdownItem
              icon={HiOutlinePencilSquare}
              label="Edit"
              onClick={() => {
                onClose();
                navigate(`/dashboard/customers/${row._id}/edit`);
              }}
            />
            <DropdownItem
              icon={HiOutlineTrash}
              label="Delete"
              danger
              onClick={() => {
                onClose();
                setDeleteTarget(row);
              }}
            />
          </>
        )}
      </DropdownMenu>
    ),
  };

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <Button icon={HiPlus} onClick={() => navigate("/dashboard/customers/create")} variant="primary">
            Add Customer
          </Button>
        }
        subtitle="Manage your customer profiles and contact information"
        title="Customers"
      />

      <FilterBar onSearch={handleSearch} search={search} searchPlaceholder="Search customers..." />

      <DataTable
        columns={[...columns, actionCol]}
        data={items}
        loading={loading}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onRowClick={(row) => navigate(`/dashboard/customers/${row._id}`)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Delete customer "${deleteTarget?.name}"? This action cannot be undone.`}
        title="Delete Customer"
      />
    </div>
  );
}
