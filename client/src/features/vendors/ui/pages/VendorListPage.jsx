import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { HiPlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import useVendors from "../../hooks/useVendors";
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
  AccessDenied,
} from "../../../../app/components/common";
import { exportToPdf } from "../../../../lib/exportToPdf";
import s from "../css/VendorList.module.css";

const columns = [
  {
    key: "name",
    label: "Vendor",
    render: (_, row) => (
      <div className={s.vendorCell}>
        <Avatar name={row.name} size={32} />
        <div>
          <div className={s.vendorName}>{row.name}</div>
          <div className={s.vendorEmail}>{row.email}</div>
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

export default function VendorListPage() {
  const navigate = useNavigate();
  const { items, loading, total, page, totalPages, getAll, remove, setPage, setPageSize, pageSize } =
    useVendors();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await getAll({ page, limit: pageSize, search });
      if (result?.payload?.status === 403) {
        setPermissionError(true);
      }
    };
    load();
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
                navigate(`/dashboard/vendors/${row._id}/edit`);
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

  if (permissionError) {
    return <AccessDenied permission="VENDORS.VIEW" />;
  }

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <>
            <Button
              variant="secondary"
              icon={HiOutlineDocumentArrowDown}
              onClick={() => exportToPdf({ data: items, columns: [{key:"name",label:"Name"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"status",label:"Status"}], filename: "vendors" })}
            >
              Export PDF
            </Button>
            <Button icon={HiPlus} onClick={() => navigate("/dashboard/vendors/create")} variant="primary">
              Add Vendor
            </Button>
          </>
        }
        subtitle="Manage your vendor profiles and supplier information"
        title="Vendors"
      />

      <FilterBar onSearch={handleSearch} search={search} searchPlaceholder="Search vendors..." />

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
        onRowClick={(row) => navigate(`/dashboard/vendors/${row._id}`)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Delete vendor "${deleteTarget?.name}"? This action cannot be undone.`}
        title="Delete Vendor"
      />
    </div>
  );
}
