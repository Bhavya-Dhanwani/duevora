import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import useCustomers from "../../hooks/useCustomers";
import { PageHeader, Button, StatusBadge, SkeletonLoader } from "../../../../app/components/common";
import s from "../css/CustomerDetail.module.css";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedItem: customer, loading, getById, clearSelectedItem } = useCustomers();

  useEffect(() => {
    getById(id);
    return () => clearSelectedItem();
  }, [id]);

  if (loading) return <SkeletonLoader rows={3} cols={2} />;
  if (!customer) return null;

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <Button
            icon={HiOutlinePencilSquare}
            onClick={() => navigate(`/dashboard/customers/${id}/edit`)}
            variant="primary"
          >
            Edit Customer
          </Button>
        }
        subtitle={customer.email}
        title={customer.name}
      />

      <div className={s.grid}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Contact Information</h3>
          <div className={s.field}>
            <span className={s.label}>Email</span>
            <span className={s.value}>{customer.email || "-"}</span>
          </div>
          <div className={s.field}>
            <span className={s.label}>Phone</span>
            <span className={s.value}>{customer.phone || "-"}</span>
          </div>
          <div className={s.field}>
            <span className={s.label}>Company</span>
            <span className={s.value}>{customer.company || "-"}</span>
          </div>
          <div className={s.field}>
            <span className={s.label}>Tax ID</span>
            <span className={s.value}>{customer.taxId || "-"}</span>
          </div>
        </div>

        <div className={s.card}>
          <h3 className={s.cardTitle}>Address</h3>
          <div className={s.field}>
            <span className={s.label}>Street</span>
            <span className={s.value}>{customer.address || "-"}</span>
          </div>
          <div className={s.field}>
            <span className={s.label}>City</span>
            <span className={s.value}>{customer.city || "-"}</span>
          </div>
          <div className={s.field}>
            <span className={s.label}>State</span>
            <span className={s.value}>{customer.state || "-"}</span>
          </div>
          <div className={s.field}>
            <span className={s.label}>Postal Code</span>
            <span className={s.value}>{customer.postalCode || "-"}</span>
          </div>
          <div className={s.field}>
            <span className={s.label}>Country</span>
            <span className={s.value}>{customer.country || "-"}</span>
          </div>
        </div>

        <div className={s.card}>
          <h3 className={s.cardTitle}>Status</h3>
          <StatusBadge status={customer.status || "active"}>
            {customer.status || "Active"}
          </StatusBadge>
        </div>

        {customer.notes && (
          <div className={s.card}>
            <h3 className={s.cardTitle}>Notes</h3>
            <p className={s.notes}>{customer.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
