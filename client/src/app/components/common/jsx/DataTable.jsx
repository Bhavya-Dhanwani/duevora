import { useMemo, useState } from "react";
import {
  HiChevronUp,
  HiChevronDown,
  HiEllipsisVertical,
} from "react-icons/hi2";
import Pagination from "./Pagination";
import EmptyState from "./EmptyState";
import SkeletonLoader from "./SkeletonLoader";
import s from "../css/DataTable.module.css";

export default function DataTable({
  columns,
  data = [],
  loading = false,
  page = 1,
  totalPages = 1,
  total = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortField,
  sortOrder,
  onRowClick,
  emptyTitle = "No data found",
  emptyDescription = "Try adjusting your filters or create a new record.",
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = "_id",
}) {
  const allSelected = data.length > 0 && data.every((d) => selectedRows.includes(d[rowKey]));

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map((d) => d[rowKey]));
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      onSelectionChange?.(selectedRows.filter((r) => r !== id));
    } else {
      onSelectionChange?.([...selectedRows, id]);
    }
  };

  const handleSort = (field) => {
    if (!onSort) return;
    if (sortField === field) {
      onSort(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "asc");
    }
  };

  const gridCols = useMemo(() => {
    const cols = [];
    if (selectable) cols.push("40px");
    columns.forEach((c) => cols.push(c.width || "1fr"));
    return cols.join(" ");
  }, [columns, selectable]);

  if (loading) {
    return <SkeletonLoader rows={5} cols={columns.length} />;
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={s.tableWrap}>
      <div className={s.table} style={{ gridTemplateColumns: gridCols }}>
        {/* Header */}
        <div className={s.header}>
          {selectable && (
            <div className={s.cell}>
              <input
                checked={allSelected}
                className={s.checkbox}
                onChange={handleSelectAll}
                type="checkbox"
              />
            </div>
          )}
          {columns.map((col) => (
            <div
              className={[s.cell, s.headerCell, col.align === "right" && s.alignRight]
                .filter(Boolean)
                .join(" ")}
              key={col.key}
              onClick={() => col.sortable !== false && handleSort(col.key)}
              style={{ cursor: col.sortable !== false && onSort ? "pointer" : "default" }}
            >
              <span>{col.label}</span>
              {onSort && sortField === col.key && (
                sortOrder === "asc" ? <HiChevronUp /> : <HiChevronDown />
              )}
            </div>
          ))}
          <div className={[s.cell, s.headerCell].join(" ")} style={{ width: 48 }} />
        </div>

        {/* Body */}
        {data.map((row, idx) => (
          <div
            className={[s.row, onRowClick && s.clickable].filter(Boolean).join(" ")}
            key={row[rowKey] || idx}
            onClick={() => onRowClick?.(row)}
          >
            {selectable && (
              <div className={s.cell}>
                <input
                  checked={selectedRows.includes(row[rowKey])}
                  className={s.checkbox}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectRow(row[rowKey]);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  type="checkbox"
                />
              </div>
            )}
            {columns.map((col) => (
              <div
                className={[s.cell, col.align === "right" && s.alignRight]
                  .filter(Boolean)
                  .join(" ")}
                key={col.key}
              >
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </div>
            ))}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
        />
      )}

      {total > 0 && (
        <div className={s.footer}>
          Showing {data.length} of {total} records
        </div>
      )}
    </div>
  );
}

export function DataTableActions({ children }) {
  return <div className={s.actionsCell}>{children}</div>;
}
