// Builds small, valid PDFs in memory so tests don't depend on committed binaries.
// Each inner array is one page; each string is one line of Helvetica text.

function escapePdfText(line: string): string {
  return line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function makePdf(pages: string[][]): Uint8Array {
  const objects: string[] = [];
  const add = (body: string) => objects.push(body) - 1 + 1; // 1-based object number

  const catalog = add(""); // filled in once the pages tree exists
  const pagesTree = add("");
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageRefs = pages.map((lines) => {
    const stream = lines.length
      ? `BT /F1 11 Tf 14 TL 50 760 Td ${lines.map((l) => `(${escapePdfText(l)}) Tj T*`).join(" ")} ET`
      : "";
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    return add(
      `<< /Type /Page /Parent ${pagesTree} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`,
    );
  });

  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesTree} 0 R >>`;
  objects[pagesTree - 1] = `<< /Type /Pages /Kids [${pageRefs.map((r) => `${r} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

export const SAMPLE_RESUME_LINES = [
  "Jordan Rivera",
  "jordan.rivera@example.com | (555) 010-0199 | Austin, TX",
  "SUMMARY",
  "Backend engineer with 6 years of experience building Java and Spring Boot services.",
  "EXPERIENCE",
  "Senior Software Engineer, Northwind Logistics (2021 - present)",
  "Designed REST APIs in Spring Boot serving 2M requests per day on AWS.",
  "Migrated reporting from Oracle to PostgreSQL, cutting query time by 60 percent.",
  "Software Engineer, Contoso Health (2018 - 2021)",
  "Built Kafka consumers for claims processing in Java 11.",
  "EDUCATION",
  "B.S. Computer Science, University of Texas",
  "SKILLS: Java, Spring Boot, PostgreSQL, Kafka, AWS, Docker",
];
