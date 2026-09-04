import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type LineItem = { description: string; quantity: number; unit_price: number; amount: number };
type Payment = { amount: number; payment_date: string; method: string; reference_no?: string | null };

export type InvoicePdfInput = {
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date?: string | null;
    status: string;
    subtotal: number;
    tax_percent: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    currency: string;
    notes?: string | null;
    terms?: string | null;
  };
  customer: {
    company_name: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    tax_id?: string | null;
  };
  company: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  lineItems: LineItem[];
  payments: Payment[];
};

const fmtMoney = (n: number, c: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(n || 0);

export function generateInvoicePdf(input: InvoicePdfInput): jsPDF {
  const { invoice, customer, company, lineItems, payments } = input;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(company.name, 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let y = 66;
  if (company.address) { doc.text(company.address, 40, y); y += 12; }
  if (company.email) { doc.text(company.email, 40, y); y += 12; }
  if (company.phone) { doc.text(company.phone, 40, y); y += 12; }

  // Invoice meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("INVOICE", pageWidth - 40, 50, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`# ${invoice.invoice_number}`, pageWidth - 40, 68, { align: "right" });
  doc.text(`Issue: ${invoice.issue_date}`, pageWidth - 40, 82, { align: "right" });
  if (invoice.due_date) doc.text(`Due: ${invoice.due_date}`, pageWidth - 40, 96, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(invoice.status === "paid" ? 16 : invoice.status === "overdue" ? 200 : 80, invoice.status === "paid" ? 140 : 80, 80);
  doc.text(invoice.status.toUpperCase(), pageWidth - 40, 112, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // Bill to
  let bty = Math.max(y, 130) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BILL TO", 40, bty);
  doc.setFont("helvetica", "normal");
  bty += 14;
  doc.text(customer.company_name, 40, bty); bty += 12;
  if (customer.contact_name) { doc.text(customer.contact_name, 40, bty); bty += 12; }
  if (customer.address) { doc.text(customer.address, 40, bty); bty += 12; }
  if (customer.email) { doc.text(customer.email, 40, bty); bty += 12; }
  if (customer.phone) { doc.text(customer.phone, 40, bty); bty += 12; }
  if (customer.tax_id) { doc.text(`Tax ID: ${customer.tax_id}`, 40, bty); bty += 12; }

  // Items table
  autoTable(doc, {
    startY: bty + 10,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: lineItems.map((it) => [
      it.description,
      String(it.quantity),
      fmtMoney(it.unit_price, invoice.currency),
      fmtMoney(it.amount, invoice.currency),
    ]),
    theme: "striped",
    headStyles: { fillColor: [40, 40, 60] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    margin: { left: 40, right: 40 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const labelX = pageWidth - 200;
  const valueX = pageWidth - 40;
  doc.setFontSize(10);
  let ty = finalY;
  doc.text("Subtotal", labelX, ty);
  doc.text(fmtMoney(invoice.subtotal, invoice.currency), valueX, ty, { align: "right" }); ty += 14;
  if (invoice.discount_amount > 0) {
    doc.text("Discount", labelX, ty);
    doc.text(`- ${fmtMoney(invoice.discount_amount, invoice.currency)}`, valueX, ty, { align: "right" }); ty += 14;
  }
  if (invoice.tax_amount > 0) {
    doc.text(`Tax (${invoice.tax_percent}%)`, labelX, ty);
    doc.text(fmtMoney(invoice.tax_amount, invoice.currency), valueX, ty, { align: "right" }); ty += 14;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL", labelX, ty + 4);
  doc.text(fmtMoney(invoice.total, invoice.currency), valueX, ty + 4, { align: "right" });
  ty += 22;

  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  if (paid > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Paid", labelX, ty);
    doc.text(fmtMoney(paid, invoice.currency), valueX, ty, { align: "right" }); ty += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Balance Due", labelX, ty);
    doc.text(fmtMoney(invoice.total - paid, invoice.currency), valueX, ty, { align: "right" });
    ty += 16;
  }

  // Notes & terms
  let ny = ty + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (invoice.notes) {
    doc.setFont("helvetica", "bold"); doc.text("Notes", 40, ny); ny += 12;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(invoice.notes, pageWidth - 80);
    doc.text(lines, 40, ny); ny += lines.length * 11 + 10;
  }
  if (invoice.terms) {
    doc.setFont("helvetica", "bold"); doc.text("Terms", 40, ny); ny += 12;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(invoice.terms, pageWidth - 80);
    doc.text(lines, 40, ny);
  }

  return doc;
}