"use client";

/** 特典をオンにしたときに出す、中身の入力欄。 */
export function RewardFields({
  fields,
  note,
}: {
  fields: { label: string; value: string; onChange: (value: string) => void; max: number; placeholder: string }[];
  note: string;
}) {
  return (
    <div style={{ display: "grid", gap: "0.35rem", width: "100%" }}>
      {fields.map((field) => (
        <label key={field.label} style={{ display: "grid", gap: "0.2rem", fontSize: "0.78rem", fontWeight: 700, color: "#3c4a40" }}>
          {field.label}
          <input
            value={field.value}
            maxLength={field.max}
            placeholder={field.placeholder}
            onChange={(event) => field.onChange(event.target.value)}
            style={{
              minHeight: "2.2rem",
              padding: "0 0.7rem",
              border: "1px solid #d5e2d8",
              borderRadius: "0.7rem",
              background: "#fff",
              fontSize: "0.9rem",
            }}
          />
        </label>
      ))}
      <p style={{ margin: 0, fontSize: "0.72rem", color: "#5d6b62", lineHeight: 1.5 }}>{note}</p>
    </div>
  );
}
