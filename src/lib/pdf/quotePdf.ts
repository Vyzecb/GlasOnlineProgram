export type QuoteCustomer = {
  id?: string | null;
  name?: string | null;
};

export type QuoteRow = {
  id: string;
  number: string | number | null;
  total: number | null;
  customer?: QuoteCustomer | QuoteCustomer[] | null;
};

export type QuoteWithCustomer = {
  id: string;
  number: string | number | null;
  total: number | null;
  customer: QuoteCustomer | null;
};

export function normalizeQuoteRow(quote: QuoteRow): QuoteWithCustomer {
  return {
    id: quote.id,
    number: quote.number ?? null,
    total: quote.total ?? null,
    customer: normalizeQuoteCustomer(quote.customer ?? null)
  };
}

export function normalizeQuoteCustomer(customer: QuoteCustomer | QuoteCustomer[] | null): QuoteCustomer | null {
  if (!customer) {
    return null;
  }

  if (Array.isArray(customer)) {
    return customer[0] ?? null;
  }

  return customer;
}

export function getQuoteCustomerName(quote: QuoteWithCustomer) {
  return quote.customer?.name?.toString() ?? "";
}

export function buildQuotePdfLines(quote: QuoteWithCustomer) {
  const number = quote.number ?? "";
  const total = typeof quote.total === "number" ? quote.total : 0;

  return [`Offerte ${number}`, `Klant: ${getQuoteCustomerName(quote)}`, `Totaal: € ${total.toFixed(2)}`];
}
