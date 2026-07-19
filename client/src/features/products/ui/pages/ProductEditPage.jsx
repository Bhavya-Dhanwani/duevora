import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import useProducts from "../../hooks/useProducts";
import { PageHeader, Button, FormBuilder, SkeletonLoader } from "../../../../app/components/common";
import s from "../css/ProductForm.module.css";

const fields = [
  { name: "name", label: "Product Name", placeholder: "Enter product name", required: true },
  { name: "sku", label: "SKU", placeholder: "Stock keeping unit", required: true },
  { name: "description", label: "Description", placeholder: "Product description", type: "textarea" },
  { name: "category", label: "Category", placeholder: "Product category" },
  { name: "unit", label: "Unit", placeholder: "e.g. pcs, kg, litre" },
  { name: "sellingPrice", label: "Selling Price", placeholder: "0.00", type: "number" },
  { name: "costPrice", label: "Cost Price", placeholder: "0.00", type: "number" },
  { name: "quantity", label: "Opening Stock", placeholder: "0", type: "number" },
  { name: "lowStockAlert", label: "Low Stock Alert", placeholder: "Minimum stock level", type: "number" },
];

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedItem: product, loading, getById, update, clearSelectedItem } = useProducts();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { getById(id); return () => clearSelectedItem(); }, [id]);

  useEffect(() => {
    if (product) {
      setValues({
        name: product.name || "", sku: product.sku || "", description: product.description || "",
        category: product.category || "", unit: product.unit || "",
        sellingPrice: product.sellingPrice || "", costPrice: product.costPrice || "",
        quantity: product.quantity || "", lowStockAlert: product.lowStockAlert || "",
      });
    }
  }, [product]);

  const handleChange = (name, value) => { setValues((v) => ({ ...v, [name]: value })); if (errors[name]) setErrors((e) => ({ ...e, [name]: null })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    fields.forEach((f) => { if (f.required && !values[f.name]?.trim()) newErrors[f.name] = `${f.label} is required`; });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setSaving(true);
    const result = await update(id, values);
    setSaving(false);
    if (result.meta.requestStatus === "fulfilled") navigate(`/dashboard/products/${id}`);
  };

  if (loading) return <SkeletonLoader rows={3} cols={2} />;
  if (!product) return null;

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <div className={s.actions}>
            <Button onClick={() => navigate(`/dashboard/products/${id}`)} variant="secondary">Cancel</Button>
            <Button disabled={saving} form="product-form" loading={saving} type="submit" variant="primary">Save Changes</Button>
          </div>
        }
        subtitle={`Editing ${product.name}`}
        title="Edit Product"
      />
      <form className={s.form} id="product-form" onSubmit={handleSubmit}>
        <div className={s.card}><h3 className={s.cardTitle}>Product Information</h3><FormBuilder errors={errors} fields={fields.slice(0, 4)} onChange={handleChange} values={values} /></div>
        <div className={s.card}><h3 className={s.cardTitle}>Pricing & Inventory</h3><FormBuilder errors={errors} fields={fields.slice(4)} onChange={handleChange} values={values} /></div>
      </form>
    </div>
  );
}
