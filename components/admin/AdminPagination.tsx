import Link from "next/link";

export function AdminPagination({
  page,
  pageSize,
  total,
  basePath,
  query = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#5a7868]">
      <span>
        {total.toLocaleString("ja-JP")} 件中{" "}
        {((page - 1) * pageSize + 1).toLocaleString("ja-JP")}–
        {Math.min(page * pageSize, total).toLocaleString("ja-JP")}
      </span>
      <div className="flex gap-1.5">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="rounded-md border border-[#c8dcd0] bg-white px-2.5 py-1 hover:bg-[#eaf2ec]"
          >
            前へ
          </Link>
        ) : null}
        <span className="px-2 py-1">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="rounded-md border border-[#c8dcd0] bg-white px-2.5 py-1 hover:bg-[#eaf2ec]"
          >
            次へ
          </Link>
        ) : null}
      </div>
    </div>
  );
}
