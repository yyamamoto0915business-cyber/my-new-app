type EventFormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function EventFormSection({
  title,
  description,
  children,
}: EventFormSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        <div className="mt-2 h-0.5 w-12 rounded-full bg-[var(--mg-accent,theme(colors.amber.600))]/20" />
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
