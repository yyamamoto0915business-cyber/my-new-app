export default function OrganizerLoading() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-5 pb-10 sm:max-w-2xl">
      <div className="space-y-3">
        <div className="h-8 w-3/4 rounded-lg bg-slate-200/90" />
        <div className="h-4 w-full rounded-md bg-slate-100" />
        <div className="h-4 w-5/6 rounded-md bg-slate-100" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-14 flex-1 rounded-2xl bg-slate-200/80" />
        <div className="h-12 flex-1 rounded-2xl bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
