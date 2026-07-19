import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { HiPlus, HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";
import useProducts from "../../hooks/useProducts";
import {
  PageHeader, Button, DataTable, FilterBar, StatusBadge,
  ConfirmDialog, DropdownMenu, DropdownItem,
} from "../../../../app/components/common";
import s from "../css/ProductList.module.css";

const columns = [
  { key: "name", label: "Product", render: (_, row) => <div className={s.productName}>{row.name}</div> },
  { key: "sku", label: "SKU" },
  { key: "sellingPrice", label: "Price", render: (val) => val ? `$${Number(val).toFixed(2)}` : "-" },
  { key: "quantity", label: "Stock", render: (val) => val ?? "-" },
  {
    key: "status", label: "Status",
    render: (val) => <StatusBadge status={val || "active"}>{val || "Active"}</StatusBadge>,
  },
  { key: "createdAt", label: "Created", render: (val) => val ? new Date(val).toLocaleDateString() : "-" },
];

export default function ProductListPage() {
  const navigate = useNavigate();
  const { items, loading, total, page, totalPages, getAll, remove, setPage, setPageSize, pageSize } = useProducts();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { getAll({ page, limit: pageSize, search }); }, [page, pageSize]);

  const handleSearch = (val) => { setSearch(val); setPage(1); getAll({ page: 1, limit: pageSize, search: val }); };
  const handleDelete = async () => { if (deleteTarget) { await remove(deleteTarget._id); setDeleteTarget(null); getAll({ page, limit: pageSize, search }); } };

  const actionCol = {
    key: "actions", label: "", width: "60px",
    render: (_, row) => (
      <DropdownMenu trigger={<button className={s.moreBtn} type="button">⋯</button>}>
        {({ onClose }) => (
          <>
            <DropdownItem icon={HiOutlinePencilSquare} label="Edit" onClick={() => { onClose(); navigate(`/dashboard/products/${row._id}/edit`); }} />
            <DropdownItem icon={HiOutlineTrash} label="Delete" danger onClick={() => { onClose(); setDeleteTarget(row); }} />
          </>
        )}
      </DropdownMenu>
    ),
  };

  return (
    <div className={s.page}>
      <PageHeader
        action={<Button icon={HiPlus} onClick={() => navigate("/dashboard/products/create")} variant="primary">Add Product</Button>}
        subtitle="Manage your product catalog and inventory"
        title="Products"
      />
      <FilterBar onSearch={handleSearch} search={search} searchPlaceholder="Search products..." />
      <DataTable
        columns={[...columns, actionCol]} data={items} loading={loading}
        onPageSizeChange={setPageSize} onPageChange={setPage} page={page} pageSize={pageSize}
        total={total} totalPages={totalPages} onRowClick={(row) => navigate(`/dashboard/products/${row._id}`)}
      />
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message={`Delete product "${deleteTarget?.name}"? This action cannot be undone.`} title="Delete Product" />
    </div>
  );
}
