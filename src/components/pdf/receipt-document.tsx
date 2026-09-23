import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import logoESP from "@/assets/logoESP.png";
import { formatCurrency, formatDate } from "@/lib/format";

const TEAL = "#0d9488";
const TEAL_DARK = "#0f766e";
const DARK = "#0c1a17";
const MUTED = "#5c7570";
const MINT = "#d3f4ec";
const LINE = "#e2ece9";
const PAPER = "#fbfdfc";

export interface ReceiptPago {
  id: string;
  monto: number;
  fecha: string;
  metodo: string | null;
  concepto?: string | null;
}

export interface ReceiptDocumentProps {
  pago: ReceiptPago;
  confirmandoNombre: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingHorizontal: 48,
    paddingBottom: 96,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
    backgroundColor: "#ffffff",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: TEAL,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 40, height: 40, objectFit: "contain", marginRight: 10 },
  company: { fontSize: 15, fontFamily: "Helvetica-Bold", color: DARK },
  tagline: { fontSize: 9, color: MUTED, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: TEAL, letterSpacing: 1.2 },
  receiptNumber: { fontSize: 9, color: MUTED, marginTop: 4 },
  divider: { height: 1, backgroundColor: LINE, marginTop: 22, marginBottom: 26 },
  sectionLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  recipient: { fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK },
  detailsCard: {
    marginTop: 26,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    backgroundColor: PAPER,
    paddingHorizontal: 16,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 11 },
  detailRowBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  detailLabel: { color: MUTED },
  detailValue: { fontFamily: "Helvetica-Bold" },
  amountBlock: {
    marginTop: 26,
    backgroundColor: MINT,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: { fontSize: 9, color: TEAL_DARK, textTransform: "uppercase", letterSpacing: 1 },
  amountValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: TEAL_DARK },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 44,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 14,
    alignItems: "center",
  },
  footerNote: { fontSize: 9, color: MUTED },
  footerBrand: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEAL, marginTop: 4 },
});

export function ReceiptDocument({ pago, confirmandoNombre }: ReceiptDocumentProps) {
  const receiptNumber = pago.id ? pago.id.slice(-8).toUpperCase() : "—";
  const metodoRaw = pago.metodo?.trim() ?? "";
  const metodo = metodoRaw ? metodoRaw.charAt(0).toUpperCase() + metodoRaw.slice(1) : "—";
  const concepto = pago.concepto?.trim() || "Aporte";
  const monto = Number.isFinite(Number(pago.monto)) ? Number(pago.monto) : 0;
  const detalles = [
    { label: "Fecha", value: formatDate(pago.fecha) },
    { label: "Método", value: metodo },
    { label: "Concepto", value: concepto },
  ];

  return (
    <Document
      title={`Recibo ${receiptNumber}`}
      author="Esperanza de San Pablo"
      subject="Recibo de pago"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />

        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image src={logoESP} style={styles.logo} />
            <View>
              <Text style={styles.company}>Esperanza de San Pablo</Text>
              <Text style={styles.tagline}>Una Confirmación de Fe</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>RECIBO DE PAGO</Text>
            <Text style={styles.receiptNumber}>N.º {receiptNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Recibido de</Text>
        <Text style={styles.recipient}>{confirmandoNombre}</Text>

        <View style={styles.detailsCard}>
          {detalles.map((detalle, index) => (
            <View
              key={detalle.label}
              style={index < detalles.length - 1 ? styles.detailRowBorder : styles.detailRow}
            >
              <Text style={styles.detailLabel}>{detalle.label}</Text>
              <Text style={styles.detailValue}>{detalle.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Monto abonado</Text>
          <Text style={styles.amountValue}>{formatCurrency(monto)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>Recibo válido como comprobante de pago.</Text>
          <Text style={styles.footerBrand}>Gracias · Esperanza de San Pablo</Text>
        </View>
      </Page>
    </Document>
  );
}
