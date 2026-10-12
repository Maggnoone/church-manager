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
  presentation?: { brandedAttendance?: { summary?: string } },
) {
  const doc = new jsPDF();
  const branded = presentation?.brandedAttendance;
  const teal: [number, number, number] = [13, 148, 136];
  if (branded) {
    doc.setFillColor(...teal);
    doc.rect(0, 0, 210, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 118, 110);
    doc.text("ESPERANZA DE SAN PABLO", 14, 13);
    doc.setFont("helvetica", "normal");
  }
  doc.setFontSize(branded ? 18 : 16);
  doc.setTextColor(
    ...(branded
      ? ([12, 26, 23] as [number, number, number])
      : ([40, 80, 50] as [number, number, number])),
  );
  doc.text(title, 14, branded ? 22 : 18);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(
      ...(branded
        ? ([92, 117, 112] as [number, number, number])
        : ([100, 100, 100] as [number, number, number])),
    );
    doc.text(subtitle, 14, branded ? 29 : 25);
  }
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generado: ${new Date().toLocaleString("es-AR")}`,
    14,
    branded ? 35 : subtitle ? 31 : 25,
  );

  if (branded?.summary) {
    doc.setFillColor(211, 244, 236);
    doc.roundedRect(14, 40, 182, 13, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(15, 118, 110);
    doc.text(branded.summary, 19, 48);
  }

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: branded ? (branded.summary ? 59 : 41) : subtitle ? 36 : 30,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: branded ? [12, 26, 23] : 20,
      lineColor: branded ? [226, 236, 233] : 200,
    },
    headStyles: { fillColor: branded ? teal : [82, 130, 95], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: branded ? [251, 253, 252] : [248, 245, 235] },
    margin: branded ? { top: 18, bottom: 18, left: 14, right: 14 } : undefined,
    didParseCell,
  });

  if (branded) {
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(226, 236, 233);
      doc.line(14, 282, 196, 282);
      doc.setFontSize(8);
      doc.setTextColor(92, 117, 112);
      doc.text("Esperanza de San Pablo · Una Confirmación de Fe", 14, 288);
      doc.text(`Página ${page} de ${pageCount}`, 196, 288, { align: "right" });
    }
  }

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
