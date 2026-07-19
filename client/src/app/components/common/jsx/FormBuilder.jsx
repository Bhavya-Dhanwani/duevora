import s from "../css/FormBuilder.module.css";

export default function FormBuilder({ fields, values, errors, onChange, disabled }) {
  return (
    <div className={s.form}>
      {fields.map((field) => (
        <FormField
          disabled={disabled}
          error={errors?.[field.name]}
          key={field.name}
          onChange={onChange}
          value={values?.[field.name] ?? ""}
          {...field}
        />
      ))}
    </div>
  );
}

function FormField({
  name,
  label,
  type = "text",
  placeholder,
  required,
  disabled,
  value,
  error,
  onChange,
  options,
  rows,
  icon: Icon,
  hint,
}) {
  const handleChange = (e) => {
    onChange?.(name, e.target.value);
  };

  const wrapperClass = [
    s.field,
    error && s.hasError,
  ].filter(Boolean).join(" ");

  if (type === "select") {
    return (
      <div className={wrapperClass}>
        {label && (
          <label className={s.label} htmlFor={name}>
            {label}
            {required && <span className={s.required}>*</span>}
          </label>
        )}
        <div className={s.selectWrap}>
          <select
            className={s.select}
            disabled={disabled}
            id={name}
            onChange={handleChange}
            value={value}
          >
            <option value="">{placeholder || "Select..."}</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {hint && !error && <p className={s.hint}>{hint}</p>}
        {error && <p className={s.error}>{error}</p>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className={wrapperClass}>
        {label && (
          <label className={s.label} htmlFor={name}>
            {label}
            {required && <span className={s.required}>*</span>}
          </label>
        )}
        <textarea
          className={s.textarea}
          disabled={disabled}
          id={name}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows || 4}
          value={value}
        />
        {hint && !error && <p className={s.hint}>{hint}</p>}
        {error && <p className={s.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {label && (
        <label className={s.label} htmlFor={name}>
          {label}
          {required && <span className={s.required}>*</span>}
        </label>
      )}
      <div className={s.inputWrap}>
        {Icon && <span className={s.icon}><Icon /></span>}
        <input
          className={[s.input, Icon && s.inputWithIcon].filter(Boolean).join(" ")}
          disabled={disabled}
          id={name}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
      </div>
      {hint && !error && <p className={s.hint}>{hint}</p>}
      {error && <p className={s.error}>{error}</p>}
    </div>
  );
}
