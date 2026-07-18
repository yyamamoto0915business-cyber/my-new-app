import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export function AdminDataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyMessage = "データがありません",
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#c8dcd0] bg-white px-4 py-10 text-center text-sm text-[#7a9888]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase tracking-wide text-[#7a9888]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 font-medium ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-[#eef4f0] last:border-0 ${
                onRowClick
                  ? "cursor-pointer hover:bg-[#f4faf6]"
                  : ""
              }`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 align-middle text-[#0e1610] ${col.className ?? ""}`}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
