import { describe, expect, it } from "vitest";

import { buildQuotePdfLines, normalizeQuoteRow } from "@/lib/pdf/quotePdf";

describe("quote pdf helpers", () => {
  it("normalizes customer array into a single customer", () => {
    const quote = normalizeQuoteRow({
      id: "1",
      number: "Q-100",
      total: 125.5,
      customer: [{ id: "c-1", name: "Ada Lovelace" }]
    });

    expect(quote.customer?.name).toBe("Ada Lovelace");
  });

  it("normalizes customer object directly", () => {
    const quote = normalizeQuoteRow({
      id: "2",
      number: "Q-200",
      total: 85,
      customer: { id: "c-2", name: "Grace Hopper" }
    });

    expect(quote.customer?.name).toBe("Grace Hopper");
  });

  it("builds pdf lines safely when fields are missing", () => {
    const quote = normalizeQuoteRow({
      id: "3",
      number: null,
      total: null,
      customer: null
    });

    expect(buildQuotePdfLines(quote)).toEqual(["Offerte ", "Klant: ", "Totaal: € 0.00"]);
  });
});
