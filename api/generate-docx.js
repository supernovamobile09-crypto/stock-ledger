const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, TabStopType } = require('docx');

const ORANGE = "FF6600", WHITE = "FFFFFF", BLACK = "000000", LIGHT_GRAY = "D9D9D9", MID_GRAY = "BBBBBB";
const CONTENT_WIDTH = 10466, COL = [2200, 5000, 1800, 1466];
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE }, thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function tx(text, opts = {}) {
  return new TextRun({ text, font: "Arial", size: opts.size ?? 18, bold: opts.bold ?? false, color: opts.color ?? BLACK, ...opts });
}
function gp(size = 6) { return new Paragraph({ children: [tx("", { size })] }); }
function ws() { return { fill: WHITE, type: ShadingType.CLEAR }; }

function makeTopInfoBar(dt) {
  return new Paragraph({ tabStops: [{ type: TabStopType.CENTER, position: CONTENT_WIDTH / 2 }, { type: TabStopType.RIGHT, position: CONTENT_WIDTH }], children: [tx("Name: ", { size: 16 }), tx("___________________________", { size: 16 }), tx("\t", { size: 16 }), tx("Sales Report", { size: 16, bold: true }), tx("\t", { size: 16 }), tx("Date: ", { size: 16 }), tx(dt || "_______________", { size: 16 })] });
}

function makeCompanyHeader(logoBase64) {
  var logoChildren = [];
  if (logoBase64) {
    try {
      var b64 = logoBase64.replace(/^data:image\/\w+;base64,/, '');
      var imgBuffer = Buffer.from(b64, 'base64');
      logoChildren.push(new Paragraph({ children: [new ImageRun({ data: imgBuffer, transformation: { width: 120, height: 40 } })] }));
    } catch (e) { /* fallback to text logo */ }
  }
  if (logoChildren.length === 0) {
    logoChildren.push(new Paragraph({ children: [tx("SUPERN", { size: 28, bold: true }), tx("❖", { size: 28, bold: true, color: ORANGE }), tx("VA", { size: 28, bold: true })] }));
    logoChildren.push(new Paragraph({ children: [tx("TECHNOLOGIES FZCO", { size: 14, color: "555555" })] }));
  }
  logoChildren.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ORANGE } }, children: [tx("Delivery Order (Internal)", { size: 22, bold: true })] }));
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [CONTENT_WIDTH], borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder }, rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, children: logoChildren })] })] });
}

function makeFrezoneBanner() {
  return new Paragraph({ alignment: AlignmentType.CENTER, children: [tx("Inside Freezone", { size: 22, bold: true })] });
}

function makeMetaInfoTable(customer, week, status, dt) {
  var LABEL_W = 2500, VALUE_W = CONTENT_WIDTH - LABEL_W;
  function infoRow(label, val) {
    return new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: LABEL_W, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 60, right: 60 }, children: [new Paragraph({ children: [tx(label, { size: 16 })] })] }), new TableCell({ borders: noBorders, width: { size: VALUE_W, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 60, right: 60 }, children: [new Paragraph({ children: [tx(val || "", { size: 16 })] })] })] });
  }
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [LABEL_W, VALUE_W], borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder }, rows: [infoRow("Customer / Vendor", customer), infoRow("Week", week), infoRow("Transaction Status", status), infoRow("Date", dt)] });
}

function makeDispatchTable(products, marks) {
  function hdrCell(label, width, shade) {
    return new TableCell({ borders: thinBorders, width: { size: width, type: WidthType.DXA }, shading: shade, margins: { top: 60, bottom: 60, left: 80, right: 80 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [tx(label, { size: 16, bold: true })] })] });
  }
  function dataCell(label, width, align) {
    return new TableCell({ borders: thinBorders, width: { size: width, type: WidthType.DXA }, shading: ws(), margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: align || AlignmentType.LEFT, children: [tx(label, { size: 16 })] })] });
  }
  function makeTopHeader() {
    return new TableRow({ children: [new TableCell({ borders: thinBorders, columnSpan: 3, width: { size: COL[0] + COL[1] + COL[2], type: WidthType.DXA }, shading: ws(), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [tx("Quantity to Dispatch", { size: 16, bold: true })] })] }), new TableCell({ borders: thinBorders, width: { size: COL[3], type: WidthType.DXA }, shading: ws(), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [tx(String(marks || 'MARKS'), { size: 16, bold: true })] })] })] });
  }
  function makeSubHeader() {
    var shade = { fill: LIGHT_GRAY, type: ShadingType.CLEAR };
    return new TableRow({ children: [hdrCell("Category", COL[0], shade), hdrCell("Product Description", COL[1], shade), hdrCell("Color", COL[2], shade), hdrCell("No Mark", COL[3], shade)] });
  }
  function makeCategoryRow(label) {
    return new TableRow({ children: [new TableCell({ borders: thinBorders, columnSpan: 4, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, shading: { fill: MID_GRAY, type: ShadingType.CLEAR }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [tx(label, { size: 16, bold: true })] })] })] });
  }
  function makeProductRow(label) {
    return new TableRow({ children: [dataCell("", COL[0]), new TableCell({ borders: thinBorders, columnSpan: 3, width: { size: COL[1] + COL[2] + COL[3], type: WidthType.DXA }, shading: ws(), margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [tx(label, { size: 16, bold: true })] })] })] });
  }
  function makeColorQtyRow(color, qty) {
    return new TableRow({ children: [dataCell("", COL[0]), dataCell("", COL[1]), dataCell(color || "", COL[2]), new TableCell({ borders: thinBorders, width: { size: COL[3], type: WidthType.DXA }, shading: ws(), margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [tx(String(qty || ""), { size: 16 })] })] })] });
  }
  function makeSubtotalRow(qty) {
    return new TableRow({ children: [dataCell("", COL[0]), dataCell("`", COL[1]), dataCell("", COL[2]), new TableCell({ borders: thinBorders, width: { size: COL[3], type: WidthType.DXA }, shading: ws(), margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [tx(String(qty || ""), { size: 16, bold: true })] })] })] });
  }
  function makeSpacerRow() {
    return new TableRow({ children: [new TableCell({ borders: thinBorders, columnSpan: 4, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, shading: ws(), margins: { top: 10, bottom: 10, left: 80, right: 80 }, children: [new Paragraph({ children: [tx("", { size: 8 })] })] })] });
  }
  function makeGrandTotalRow(qty) {
    return new TableRow({ children: [new TableCell({ borders: thinBorders, columnSpan: 3, width: { size: COL[0] + COL[1] + COL[2], type: WidthType.DXA }, shading: ws(), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [tx("Grand Total", { size: 16, bold: true })] })] }), new TableCell({ borders: thinBorders, width: { size: COL[3], type: WidthType.DXA }, shading: ws(), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [tx(String(qty), { size: 16, bold: true })] })] })] });
  }
  var rows = [];
  rows.push(makeTopHeader(), makeSubHeader());
  rows.push(makeCategoryRow("Smart Phone"));
  var grandTotal = 0;
  (products || []).forEach(function (prod) {
    rows.push(makeProductRow(prod.name || ""));
    var subtotal = 0;
    (prod.colors || []).forEach(function (c) {
      subtotal += Number(c.qty) || 0;
      rows.push(makeColorQtyRow(c.color, c.qty));
    });
    grandTotal += subtotal;
    rows.push(makeSubtotalRow(subtotal));
    rows.push(makeSpacerRow());
  });
  rows.push(makeGrandTotalRow(grandTotal));
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: COL, borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideH: thinBorder, insideV: thinBorder }, rows: rows });
}

function makeSignatureFooter() {
  var HALF = Math.floor(CONTENT_WIDTH / 2);
  function sigCell(label) {
    return new TableCell({ borders: noBorders, width: { size: HALF, type: WidthType.DXA }, margins: { top: 80, bottom: 40, left: 60, right: 60 }, children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLACK } }, children: [tx(label, { size: 16 })] })] });
  }
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [HALF, HALF], borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder }, rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: HALF, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 60, right: 60 }, children: [new Paragraph({ children: [tx("Inside Freezone", { size: 16 })] })] }), new TableCell({ borders: noBorders, width: { size: HALF, type: WidthType.DXA }, children: [new Paragraph({ children: [tx("", { size: 16 })] })] })] }), new TableRow({ children: [sigCell("Dispatched Approved By"), sigCell("Dispatched By")] })] });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    var body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    var { customer, week, status, date, logistics, marks, products, logo } = body;

    var doc = new Document({
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        children: [makeTopInfoBar(date), gp(8), makeCompanyHeader(logo), gp(8), makeFrezoneBanner(), gp(8), makeMetaInfoTable(customer, week, status, date), gp(8), makeDispatchTable(products, marks), gp(10), makeSignatureFooter()]
      }]
    });

    var buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Delivery_Order_' + (customer || 'Draft') + '.docx"');
    res.send(buffer);
  } catch (e) {
    console.error('DOCX generation error:', e);
    res.status(500).json({ error: 'Failed to generate DOCX: ' + e.message });
  }
};
