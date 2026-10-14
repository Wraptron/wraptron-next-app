"use client";

import type { InvoiceSettings, Quote } from "@/lib/api";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function expiryFromQuoteDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function QuotePreview({
  quote,
}: {
  quote: Quote;
  settings?: InvoiceSettings | null;
}) {
  const items = quote.items || [];

  return (
    <article className="mx-auto max-w-[820px] bg-white px-10 py-10 text-[13px] leading-5 text-neutral-900 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <header className="flex items-start justify-between gap-8">
        <div className="flex items-start gap-4">
          <img
            src="/icon-512.png"
            alt="Wraptron"
            className="h-16 w-16 object-contain"
          />
          <div>
            <div className="text-base font-semibold">Wraptron Apptech LLP</div>
            <div>12B, Sreedharan street, Ayavoo colony</div>
            <div>Chennai, Tamil Nadu, India</div>
            <div>600029</div>
            <div className="mt-1">GSTIN: 33AAEFW1781C1ZF</div>
            <div>PHONE: 9094779005</div>
          </div>
        </div>
        <div className="min-w-[220px] text-right">
          <h1 className="text-3xl font-semibold tracking-wide text-neutral-800">QUOTE</h1>
          <div className="mt-3 space-y-1">
            <div className="text-base font-semibold">{quote.quote_number}</div>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <span className="text-neutral-500">Quote Date</span>
              <span>{formatDate(quote.quote_date)}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <span className="text-neutral-500">Expiry Date</span>
              <span>
                {formatDate(quote.expiry_date || expiryFromQuoteDate(quote.quote_date))}
              </span>
            </div>
            {quote.reference_number ? (
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <span className="text-neutral-500">Reference</span>
                <span>{quote.reference_number}</span>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="my-6 border-t border-neutral-300" />

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Bill To
          </div>
          <div className="mt-1 font-semibold">{quote.customer_name}</div>
        </div>
        {quote.project_name ? (
          <div className="sm:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Project
            </div>
            <div className="mt-1">{quote.project_name}</div>
          </div>
        ) : null}
      </section>

      {quote.subject ? (
        <section className="mt-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Subject
          </div>
          <div className="mt-1">{quote.subject}</div>
        </section>
      ) : null}

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="bg-neutral-800 text-left text-[11px] font-medium uppercase tracking-wide text-white">
            <th className="px-2 py-2 font-medium">#</th>
            <th className="px-2 py-2 font-medium">Item & Description</th>
            <th className="px-2 py-2 text-right font-medium">Qty</th>
            <th className="px-2 py-2 text-right font-medium">Rate</th>
            <th className="px-2 py-2 text-right font-medium">Discount</th>
            <th className="px-2 py-2 text-right font-medium">Tax</th>
            <th className="px-2 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? index} className="align-top">
              <td className="border-b border-neutral-200 px-2 py-3">{index + 1}</td>
              <td className="border-b border-neutral-200 px-2 py-3">
                <div className="whitespace-pre-line">{item.item_details}</div>
                {item.item_group ? (
                  <div className="text-neutral-500">{item.item_group}</div>
                ) : null}
              </td>
              <td className="border-b border-neutral-200 px-2 py-3 text-right tabular-nums">
                {Number(item.quantity || 0)}
              </td>
              <td className="border-b border-neutral-200 px-2 py-3 text-right tabular-nums">
                {money(Number(item.rate || 0))}
              </td>
              <td className="border-b border-neutral-200 px-2 py-3 text-right tabular-nums">
                {Number(item.discount_percent || 0)}%
              </td>
              <td className="border-b border-neutral-200 px-2 py-3 text-right tabular-nums">
                {Number(item.tax_percent || 0)}%
              </td>
              <td className="border-b border-neutral-200 px-2 py-3 text-right tabular-nums">
                {money(Number(item.amount || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-4 ml-auto w-full max-w-[260px] space-y-1.5">
        <TotalRow label="Sub Total" value={money(Number(quote.subtotal || 0))} />
        <TotalRow label="Tax" value={money(Number(quote.tax_total || 0))} />
        <TotalRow label="Adjustment" value={money(Number(quote.adjustment_amount || 0))} />
        <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {money(
              Number(quote.subtotal || 0) +
                Number(quote.tax_total || 0) +
                Number(quote.adjustment_amount || 0),
            )}
          </span>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-8 border-t border-neutral-200 pt-6 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Notes
          </div>
          <div className="mt-1 whitespace-pre-line">{quote.customer_notes || "—"}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Terms & Conditions
          </div>
          <div className="mt-1 whitespace-pre-line">{quote.terms_and_conditions || "—"}</div>
        </div>
      </section>
    </article>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-700">
      <span>{label}</span>
      <span className="tabular-nums text-neutral-900">{value}</span>
    </div>
  );
}
