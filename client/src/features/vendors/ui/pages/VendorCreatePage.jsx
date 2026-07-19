import { useState } from "react";
import { useNavigate } from "react-router";
import useVendors from "../../hooks/useVendors";
import { PageHeader, Button, FormBuilder } from "../../../../app/components/common";
import s from "../css/VendorForm.module.css";

const fields = [
  { name: "name", label: "Vendor Name", placeholder: "Enter vendor name", required: true },
  { name: "email", label: "Email Address", placeholder: "vendor@example.com", type: "email", required: true },
  { name: "phone", label: "Phone Number", placeholder: "+1 (555) 000-0000" },
  { name: "company", label: "Company", placeholder: "Company name" },
  { name: "taxId", label: "Tax ID / GSTIN", placeholder: "Tax identification number" },
  { name: "address", label: "Address", placeholder: "Full address", type: "textarea" },
  { name: "city", label: "City", placeholder: "City" },
  { name: "state", label: "State / Region", placeholder: "State or region" },
  { name: "postalCode", label: "Postal Code", placeholder: "Postal code" },
  { name: "country", label: "Country", placeholder: "Country" },
  { name: "notes", label: "Notes", placeholder: "Additional notes about this vendor", type: "textarea" },
];

export default function VendorCreatePage() {
  const navigate = useNavigate();
  const { create } = useVendors();
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
    fields.forEach((f) => {
      if (f.required && !values[f.name]?.trim()) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    const result = await create(values);
    setLoading(false);
    if (result.meta.requestStatus === "fulfilled") navigate("/dashboard/vendors");
  };

  return (
    <div className={s.page}>
      <PageHeader
        action={
          <div className={s.actions}>
            <Button onClick={() => navigate("/dashboard/vendors")} variant="secondary">Cancel</Button>
            <Button disabled={loading} form="vendor-form" loading={loading} type="submit" variant="primary">
              Create Vendor
            </Button>
          </div>
        }
        subtitle="Add a new vendor to your database"
        title="Create Vendor"
      />
      <form className={s.form} id="vendor-form" onSubmit={handleSubmit}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Contact Information</h3>
          <FormBuilder errors={errors} fields={fields.slice(0, 4)} onChange={handleChange} values={values} />
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Business Details</h3>
          <FormBuilder errors={errors} fields={fields.slice(4, 6)} onChange={handleChange} values={values} />
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Location</h3>
          <FormBuilder errors={errors} fields={fields.slice(6, 10)} onChange={handleChange} values={values} />
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Additional</h3>
          <FormBuilder errors={errors} fields={fields.slice(10)} onChange={handleChange} values={values} />
        </div>
      </form>
    </div>
  );
}
