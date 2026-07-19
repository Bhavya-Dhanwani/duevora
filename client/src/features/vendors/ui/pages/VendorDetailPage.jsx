import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import useVendors from "../../hooks/useVendors";
import { PageHeader, Button, StatusBadge, SkeletonLoader } from "../../../../app/components/common";
import s from "../css/VendorDetail.module.css";

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedItem: vendor, loading, getById, clearSelectedItem } = useVendors();

  useEffect(() => {
    getById(id);
    return () => clearSelectedItem();
  }, [id]);

  if (loading) return <SkeletonLoader rows={3} cols={2} />;
  if (!vendor) return null;

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <Button icon={HiOutlinePencilSquare} onClick={() => navigate(`/dashboard/vendors/${id}/edit`)} variant="primary">
            Edit Vendor
          </Button>
        }
        subtitle={vendor.email}
        title={vendor.name}
      />
      <div className={s.grid}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Contact Information</h3>
          <div className={s.field}><span className={s.label}>Email</span><span className={s.value}>{vendor.email || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Phone</span><span className={s.value}>{vendor.phone || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Company</span><span className={s.value}>{vendor.company || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Tax ID</span><span className={s.value}>{vendor.taxId || "-"}</span></div>
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Address</h3>
          <div className={s.field}><span className={s.label}>Street</span><span className={s.value}>{vendor.address || "-"}</span></div>
          <div className={s.field}><span className={s.label}>City</span><span className={s.value}>{vendor.city || "-"}</span></div>
          <div className={s.field}><span className={s.label}>State</span><span className={s.value}>{vendor.state || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Postal Code</span><span className={s.value}>{vendor.postalCode || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Country</span><span className={s.value}>{vendor.country || "-"}</span></div>
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Status</h3>
          <StatusBadge status={vendor.status || "active"}>{vendor.status || "Active"}</StatusBadge>
        </div>
        {vendor.notes && (
          <div className={s.card}>
            <h3 className={s.cardTitle}>Notes</h3>
            <p className={s.notes}>{vendor.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
