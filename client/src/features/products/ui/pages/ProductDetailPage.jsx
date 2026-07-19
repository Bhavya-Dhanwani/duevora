import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import useProducts from "../../hooks/useProducts";
import { PageHeader, Button, StatusBadge, SkeletonLoader } from "../../../../app/components/common";
import s from "../css/ProductDetail.module.css";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedItem: product, loading, getById, clearSelectedItem } = useProducts();

  useEffect(() => { getById(id); return () => clearSelectedItem(); }, [id]);

  if (loading) return <SkeletonLoader rows={3} cols={2} />;
  if (!product) return null;

  return (
    <div className={s.page}>
      <PageHeader
        action={<Button icon={HiOutlinePencilSquare} onClick={() => navigate(`/dashboard/products/${id}/edit`)} variant="primary">Edit Product</Button>}
        subtitle={product.sku}
        title={product.name}
      />
      <div className={s.grid}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Product Information</h3>
          <div className={s.field}><span className={s.label}>SKU</span><span className={s.value}>{product.sku || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Category</span><span className={s.value}>{product.category || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Unit</span><span className={s.value}>{product.unit || "-"}</span></div>
          <div className={s.field}><span className={s.label}>Description</span><span className={s.value}>{product.description || "-"}</span></div>
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Pricing & Stock</h3>
          <div className={s.field}><span className={s.label}>Selling Price</span><span className={s.value}>{product.sellingPrice ? `$${Number(product.sellingPrice).toFixed(2)}` : "-"}</span></div>
          <div className={s.field}><span className={s.label}>Cost Price</span><span className={s.value}>{product.costPrice ? `$${Number(product.costPrice).toFixed(2)}` : "-"}</span></div>
          <div className={s.field}><span className={s.label}>Stock</span><span className={s.value}>{product.quantity ?? "-"}</span></div>
          <div className={s.field}><span className={s.label}>Low Stock Alert</span><span className={s.value}>{product.lowStockAlert ?? "-"}</span></div>
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Status</h3>
          <StatusBadge status={product.status || "active"}>{product.status || "Active"}</StatusBadge>
        </div>
      </div>
    </div>
  );
}
