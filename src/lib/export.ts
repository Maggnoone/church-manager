import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export { formatCurrency, formatDate, formatDateTime } from "./format";

export function exportToCSV<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportToXLSX<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  sheetName = "Datos",
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  subtitle?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  didParseCell?: (data: any) => void,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(40, 80, 50);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 25);
  }
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, 14, subtitle ? 31 : 25);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: subtitle ? 36 : 30,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [82, 130, 95], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 245, 235] },
    didParseCell,
  });

  doc.save(`${filename}.pdf`);
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
