import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface CertificateDocument {
  userName: string;
  formationTitle: string;
  certificateNumber: string;
  issuedAt: string;
}
export async function createCertificatePdf(data: CertificateDocument) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
    await readFile(path.join(process.cwd(), "public/fonts/Lora.ttf")),
    { subset: true },
  );
  doc.setTitle(`Certificado — ${data.formationTitle}`);
  doc.setAuthor("Mitra");
  doc.setSubject(`Certificado ${data.certificateNumber}`);
  const page = doc.addPage([842, 595]);
  const ink = rgb(0.16, 0.24, 0.21),
    gold = rgb(0.64, 0.48, 0.23);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: rgb(0.98, 0.97, 0.94),
  });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: 794,
    height: 547,
    borderColor: gold,
    borderWidth: 1.3,
  });
  page.drawRectangle({
    x: 32,
    y: 32,
    width: 778,
    height: 531,
    borderColor: gold,
    borderWidth: 0.4,
  });
  const clean = (text: string) => text.replace(/[\r\n\t]+/g, " ").trim();
  const centered = (text: string, y: number, size: number, color = ink) =>
    page.drawText(clean(text), {
      x: (842 - font.widthOfTextAtSize(clean(text), size)) / 2,
      y,
      size,
      font,
      color,
    });
  function lines(text: string, face: PDFFont, size: number, maxWidth: number) {
    const result: string[] = [];
    let line = "";
    for (const char of clean(text)) {
      if (face.widthOfTextAtSize(line + char, size) > maxWidth) {
        result.push(line);
        line = "";
      }
      line += char;
    }
    if (line) result.push(line);
    return result;
  }
  const block = (text: string, y: number, size: number) => {
    let rows = lines(text, font, size, 680);
    while (rows.length > 2 && size > 8) {
      size -= 1;
      rows = lines(text, font, size, 680);
    }
    for (const row of rows) {
      centered(row, y, size);
      y -= size * 1.4;
    }
    return y;
  };
  centered("MITRA", 503, 23, gold);
  centered("CERTIFICADO DE FINALIZACIÓN", 456, 18);
  centered("Este certificado acredita que", 409, 12);
  const afterName = block(data.userName, 369, 30);
  centered("ha completado satisfactoriamente la formación", afterName - 12, 12);
  block(data.formationTitle, afterName - 54, 23);
  page.drawLine({
    start: { x: 260, y: 143 },
    end: { x: 582, y: 143 },
    thickness: 0.7,
    color: gold,
  });
  centered(
    new Date(data.issuedAt).toLocaleDateString("es-ES", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    112,
    12,
  );
  centered(`N.º ${data.certificateNumber}`, 83, 11, gold);
  centered("Formación de desarrollo personal · Mitra", 58, 9);
  return doc.save();
}
