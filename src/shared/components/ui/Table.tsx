import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string | number;
  emptyState?: ReactNode;
};

export function DataTable<T>({ columns, data, getRowId, emptyState }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn("px-4 py-3 font-medium", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={getRowId(row)} className="transition-colors hover:bg-muted/50">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3", column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center px-4 py-10 text-sm text-muted-foreground">
          {emptyState ?? "No records found."}
        </div>
      ) : null}
    </div>
  );
}
