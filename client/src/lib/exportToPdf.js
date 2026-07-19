import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export data to PDF.
 *
 * @param {Object} options
 * @param {string}   options.title      - Document / table heading
 * @param {string}   [options.filename] - Download filename (without .pdf)
 * @param {Array}    options.columns    - Column definitions [{ key, label, render? }]
 * @param {Array}    options.data       - Row data array
 * @param {Array}    [options.summary]  - Optional summary rows [{ label, value }]
 */
export function exportToPdf({ title, filename, columns, data, summary = [] }) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 14, 27);
  doc.text(`${data.length} record${data.length !== 1 ? "s" : ""}`, 14, 32);
  doc.setTextColor(0);

  // Table
  const head = [columns.map((c) => c.label)];
  const body = data.map((row) =>
    columns.map((col) => {
      const raw = row[col.key];
      if (col.render) return String(col.render(raw, row));
      if (raw == null) return "";
      if (typeof raw === "object") return raw?.name || raw?.code || JSON.stringify(raw);
      return String(raw);
    })
  );

  autoTable(doc, {
    startY: 36,
    head,
    body,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      font: "helvetica",
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Summary
  if (summary.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    summary.forEach((item, i) => {
      doc.text(item.label, 14, finalY + i * 7);
      doc.text(String(item.value), pageWidth - 14, finalY + i * 7, { align: "right" });
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("DUEVORA", 14, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  doc.save(`${filename || title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
