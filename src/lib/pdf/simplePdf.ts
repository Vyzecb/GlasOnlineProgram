export function buildSimplePdf(lines: string[]) {
  const text = lines.map((line, index) => `BT /F1 12 Tf 50 ${780 - index * 16} Td (${escapePdf(line)}) Tj ET`).join("\n");
  const content = `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${text.length} >>
stream
${text}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000111 00000 n 
0000000240 00000 n 
0000000340 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
420
%%EOF`;

  return new TextEncoder().encode(content);
}

function escapePdf(text: string) {
  return text.replace(/[()\\]/g, "\\$&");
}
