import { useState } from "react";
import { useNavigate } from "react-router";
import useProducts from "../../hooks/useProducts";
import { PageHeader, Button, FormBuilder } from "../../../../app/components/common";
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

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const { create } = useProducts();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    fields.forEach((f) => { if (f.required && !values[f.name]?.trim()) newErrors[f.name] = `${f.label} is required`; });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setLoading(true);
    const result = await create(values);
    setLoading(false);
    if (result.meta.requestStatus === "fulfilled") navigate("/dashboard/products");
  };

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <div className={s.actions}>
            <Button onClick={() => navigate("/dashboard/products")} variant="secondary">Cancel</Button>
            <Button disabled={loading} form="product-form" loading={loading} type="submit" variant="primary">Create Product</Button>
          </div>
        }
        subtitle="Add a new product to your catalog"
        title="Create Product"
      />
      <form className={s.form} id="product-form" onSubmit={handleSubmit}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Product Information</h3>
          <FormBuilder errors={errors} fields={fields.slice(0, 4)} onChange={handleChange} values={values} />
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Pricing & Inventory</h3>
          <FormBuilder errors={errors} fields={fields.slice(4)} onChange={handleChange} values={values} />
        </div>
      </form>
    </div>
  );
}
