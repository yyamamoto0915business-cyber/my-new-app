type AdminPageHeaderProps = {
  title: string;
  description?: string;
};

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <header className="mb-3">
      <h1
        className="text-lg font-semibold leading-tight text-[#0e1610]"
        style={{ fontFamily: "var(--font-serif, serif)" }}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-0.5 max-w-2xl text-xs leading-snug text-[#5a7868]">
          {description}
        </p>
      ) : null}
    </header>
  );
}
