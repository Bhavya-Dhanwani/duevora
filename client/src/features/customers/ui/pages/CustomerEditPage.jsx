import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import useCustomers from "../../hooks/useCustomers";
import { PageHeader, Button, FormBuilder, SkeletonLoader } from "../../../../app/components/common";
import s from "../css/CustomerForm.module.css";

const fields = [
  { name: "name", label: "Customer Name", placeholder: "Enter customer name", required: true },
  { name: "email", label: "Email Address", placeholder: "customer@example.com", type: "email", required: true },
  { name: "phone", label: "Phone Number", placeholder: "+1 (555) 000-0000" },
  { name: "company", label: "Company", placeholder: "Company name" },
  { name: "taxId", label: "Tax ID / GSTIN", placeholder: "Tax identification number" },
  { name: "address", label: "Address", placeholder: "Full address", type: "textarea" },
  { name: "city", label: "City", placeholder: "City" },
  { name: "state", label: "State / Region", placeholder: "State or region" },
  { name: "postalCode", label: "Postal Code", placeholder: "Postal code" },
  { name: "country", label: "Country", placeholder: "Country" },
  { name: "notes", label: "Notes", placeholder: "Additional notes about this customer", type: "textarea" },
];

export default function CustomerEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedItem: customer, loading, getById, update, clearSelectedItem } = useCustomers();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getById(id);
    return () => clearSelectedItem();
  }, [id]);

  useEffect(() => {
    if (customer) {
      setValues({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        company: customer.company || "",
        taxId: customer.taxId || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        postalCode: customer.postalCode || "",
        country: customer.country || "",
        notes: customer.notes || "",
      });
    }
  }, [customer]);

  const handleChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    fields.forEach((f) => {
      if (f.required && !values[f.name]?.trim()) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    const result = await update(id, values);
    setSaving(false);

    if (result.meta.requestStatus === "fulfilled") {
      navigate(`/dashboard/customers/${id}`);
    }
  };

  if (loading) return <SkeletonLoader rows={3} cols={2} />;
  if (!customer) return null;

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <div className={s.actions}>
            <Button onClick={() => navigate(`/dashboard/customers/${id}`)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={saving} form="customer-form" loading={saving} type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        }
        subtitle={`Editing ${customer.name}`}
        title="Edit Customer"
      />

      <form className={s.form} id="customer-form" onSubmit={handleSubmit}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Contact Information</h3>
          <FormBuilder
            errors={errors}
            fields={fields.slice(0, 4)}
            onChange={handleChange}
            values={values}
          />
        </div>

        <div className={s.card}>
          <h3 className={s.cardTitle}>Business Details</h3>
          <FormBuilder
            errors={errors}
            fields={fields.slice(4, 6)}
            onChange={handleChange}
            values={values}
          />
        </div>

        <div className={s.card}>
          <h3 className={s.cardTitle}>Location</h3>
          <FormBuilder
            errors={errors}
            fields={fields.slice(6, 10)}
            onChange={handleChange}
            values={values}
          />
        </div>

        <div className={s.card}>
          <h3 className={s.cardTitle}>Additional</h3>
          <FormBuilder
            errors={errors}
            fields={fields.slice(10)}
            onChange={handleChange}
            values={values}
          />
        </div>
      </form>
    </div>
  );
}
