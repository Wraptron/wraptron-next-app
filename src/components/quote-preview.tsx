"use client";

import React from "react";
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

function numberToWordsIndian(num: number): string {
  if (!Number.isFinite(num) || num === 0) return "Indian Rupee Zero Only";
  const abs = Math.abs(num);
  const rupees = Math.floor(abs);
  const paise = Math.round((abs - rupees) * 100);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const r = n % 10;
    return tens[t] + (r > 0 ? " " + ones[r] : "");
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let res = "";
    if (h > 0) res += ones[h] + " Hundred";
    if (r > 0) res += (res ? " " : "") + convertTwoDigits(r);
    return res;
  }

  function convertRupees(n: number): string {
    if (n === 0) return "";
    let res = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = n;

    if (crore > 0) res += convertRupees(crore) + " Crore ";
    if (lakh > 0) res += convertTwoDigits(lakh) + " Lakh ";
    if (thousand > 0) res += convertTwoDigits(thousand) + " Thousand ";
    if (hundred > 0) res += convertThreeDigits(hundred) + " ";
    return res.trim();
  }

  const words = convertRupees(rupees);
  let result = words ? `Indian Rupee ${words}` : "Indian Rupee Zero";
  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }
  return result + " Only";
}

export function QuotePreview({
  quote,
  settings,
}: {
  quote: Quote;
  settings?: InvoiceSettings | null;
}) {
  const items = quote.items || [];

  const subtotal = Number(quote.subtotal || 0);
  const taxTotal = Number(quote.tax_total || 0);
  const adjustment = Number(quote.adjustment_amount || 0);
  const total = Number(quote.total || subtotal + taxTotal + adjustment);

  const quoteNumber = quote.quote_number || "000000";
  const formattedQuoteNumber = quoteNumber.startsWith("#")
    ? quoteNumber
    : `# ${quoteNumber}`;

  const placeOfSupply = quote.location || "Tamil Nadu (33)";
  const isInterstate = !placeOfSupply.includes("Tamil Nadu") && !placeOfSupply.includes("33");

  return (
    <div className="mx-auto max-w-[820px] space-y-8 font-sans print:max-w-none print:space-y-0">
      {/* PAGE 1 */}
      <article className="min-h-[1050px] bg-white px-12 py-12 text-[12px] leading-relaxed text-neutral-900 shadow-md border border-neutral-200/80 print:min-h-0 print:border-none print:shadow-none flex flex-col justify-between">
        <div>
          {/* Header */}
          <header className="flex items-start justify-between gap-8">
            {/* Left: Logo & Company Letterhead */}
            <div className="flex flex-col items-start">
              <img
                src="/icon-512.png"
                alt="Wraptron"
                className="h-12 w-12 object-contain"
              />
              <div className="mt-2 text-sm font-black tracking-wider text-neutral-900">
                WRAPTRON
              </div>
              <div className="mt-0.5 text-xs font-bold text-neutral-900">
                {settings?.company_name || "Wraptron Apptech LLP"}
              </div>
              <div className="mt-0.5 space-y-0.5 text-[11px] text-neutral-800">
                <div>12B, Sreedharan street, Ayavoo colony</div>
                <div>Chennai, Tamil Nadu, India</div>
                <div>600029</div>
                <div>GSTIN: {settings?.company_gst || "33AAEFW1781C1ZF"}</div>
                <div>PHONE: 9094779005</div>
              </div>
            </div>

            {/* Right: Title & Meta */}
            <div className="min-w-[240px] text-right">
              <h1 className="text-3xl font-normal tracking-normal text-neutral-900">
                QUOTATION
              </h1>
              <div className="mt-2 text-sm font-bold text-neutral-900">
                {formattedQuoteNumber}
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-end gap-6">
                  <span className="text-neutral-500">Invoice Date :</span>
                  <span className="min-w-[80px] text-right font-medium text-neutral-900">
                    {formatDate(quote.quote_date)}
                  </span>
                </div>
                <div className="flex justify-end gap-6">
                  <span className="text-neutral-500">Terms :</span>
                  <span className="min-w-[80px] text-right font-medium text-neutral-900">
                    Net 30
                  </span>
                </div>
                <div className="flex justify-end gap-6">
                  <span className="text-neutral-500">Due Date :</span>
                  <span className="min-w-[80px] text-right font-medium text-neutral-900">
                    {formatDate(quote.expiry_date || expiryFromQuoteDate(quote.quote_date))}
                  </span>
                </div>
                {quote.reference_number ? (
                  <div className="flex justify-end gap-6">
                    <span className="text-neutral-500">Ref # :</span>
                    <span className="min-w-[80px] text-right font-medium text-neutral-900">
                      {quote.reference_number}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {/* Bill To & Subject */}
          <section className="mt-8">
            <div className="text-[11px] font-normal text-neutral-500">Bill To</div>
            <div className="mt-0.5 text-xs font-bold uppercase text-neutral-900">
              {quote.customer_name}
            </div>
            {quote.customer_gst ? (
              <div className="mt-0.5 text-[11px] text-neutral-800">
                GSTIN {quote.customer_gst}
              </div>
            ) : null}
            <div className="mt-0.5 text-[11px] text-neutral-800">
              Place Of Supply: {placeOfSupply}
            </div>

            {quote.subject ? (
              <div className="mt-4">
                <div className="text-[11px] text-neutral-500">Subject :</div>
                <div className="mt-0.5 text-xs text-neutral-900">{quote.subject}</div>
              </div>
            ) : null}
          </section>

          {/* Items Table */}
          <div className="mt-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#2e2e2e] text-left text-[11px] font-medium text-white">
                  <th className="px-2 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Item & Description</th>
                  <th className="px-2 py-2 text-center font-semibold">HSN/SAC</th>
                  <th className="px-2 py-2 text-right font-semibold">Qty</th>
                  <th className="px-2 py-2 text-right font-semibold">Rate</th>
                  <th className="px-2 py-2 text-right font-semibold">IGST</th>
                  <th className="px-2 py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const detailLines = (item.item_details || "—")
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                  const title = detailLines[0] || "—";
                  const bullets = detailLines.slice(1);
                  const hsn = (item as any).hsn_code || (item as any).hsn || (item as any).product_hsn || (Number(item.tax_percent) === 18 ? "998314" : "");
                  const qty = Number(item.quantity || 1);
                  const rate = Number(item.rate || 0);
                  const discount = Number(item.discount_percent || 0);
                  const taxPercent = Number(item.tax_percent || 0);
                  const netAmount = rate * qty * (1 - discount / 100);
                  const taxAmount = (netAmount * taxPercent) / 100;

                  return (
                    <tr key={item.id ?? index} className="border-b border-neutral-200 align-top">
                      <td className="px-2 py-2.5 text-neutral-900">{index + 1}</td>
                      <td className="px-2 py-2.5">
                        <div className="font-bold text-neutral-900">{title}</div>
                        {bullets.length > 0 ? (
                          <div className="mt-0.5 space-y-0.5 text-[11px] text-neutral-600">
                            {bullets.map((b, bIdx) => (
                              <div key={bIdx}>{b}</div>
                            ))}
                          </div>
                        ) : null}
                        {item.item_group && !bullets.includes(item.item_group) ? (
                          <div className="mt-0.5 text-[11px] text-neutral-500">{item.item_group}</div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2.5 text-center text-neutral-800">{hsn || "—"}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-neutral-900">
                        {qty % 1 === 0 ? qty : qty.toFixed(2)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-neutral-900">
                        {money(rate)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        <div className="text-neutral-900">{money(taxAmount)}</div>
                        {taxPercent > 0 ? (
                          <div className="text-[10px] text-neutral-500">{taxPercent}%</div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums font-normal text-neutral-900">
                        {money(netAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Total In Words */}
          <div className="mt-6 flex flex-col md:flex-row items-start justify-between gap-6">
            {/* Total In Words */}
            <div className="max-w-[320px] text-xs">
              <div className="text-neutral-500">Total In Words:</div>
              <div className="mt-1 font-bold italic text-neutral-900 leading-normal">
                {numberToWordsIndian(total)}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="w-full max-w-[280px] space-y-2 text-xs">
              <div className="flex justify-between text-neutral-800">
                <span>Sub Total</span>
                <span className="tabular-nums">{money(subtotal)}</span>
              </div>

              {isInterstate ? (
                <div className="flex justify-between text-neutral-800">
                  <span>IGST18 (18%)</span>
                  <span className="tabular-nums">{money(taxTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-neutral-800">
                    <span>CGST9 (9%)</span>
                    <span className="tabular-nums">{money(taxTotal / 2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-800">
                    <span>SGST9 (9%)</span>
                    <span className="tabular-nums">{money(taxTotal / 2)}</span>
                  </div>
                </>
              )}

              {adjustment !== 0 ? (
                <div className="flex justify-between text-neutral-800">
                  <span>{quote.adjustment_label || "Adjustment"}</span>
                  <span className="tabular-nums">{money(adjustment)}</span>
                </div>
              ) : null}

              <div className="flex justify-between pt-1 font-bold text-neutral-900 text-sm">
                <span>Total</span>
                <span className="tabular-nums">{money(total)}</span>
              </div>

              {/* Balance Due bar */}
              <div className="flex justify-between items-center bg-[#f4f4f5] px-3 py-2 font-bold text-neutral-900 text-xs">
                <span>Balance Due</span>
                <span className="tabular-nums">{money(total)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Page 1 Bottom Divider & Footer */}
        <div className="mt-8 pt-4 border-t border-neutral-300 flex justify-end text-[10px] text-neutral-400">
          <span>| 1</span>
        </div>
      </article>

      {/* PAGE 2 */}
      <article className="min-h-[600px] bg-white px-12 py-12 text-[12px] leading-relaxed text-neutral-900 shadow-md border border-neutral-200/80 print:min-h-0 print:border-none print:shadow-none print:break-before-page flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Terms & Conditions</h2>

          <div className="mt-4 text-xs font-semibold text-neutral-800">Payment Details</div>
          <div className="mt-1 space-y-0.5 text-xs text-neutral-700">
            <div>Company Name: Wraptron Apptech LLP</div>
            <div>Account Number: 101 0052 7904</div>
            <div>IFSC: IDFB 0080 127</div>
            <div>Swift Code: IDFB IN BB MUM</div>
            <div>Branch: THIRUVANMIYUR BRANCH</div>
            <div>UPI: wraptron@axl</div>
          </div>

          {quote.terms_and_conditions ? (
            <div className="mt-4 text-xs text-neutral-600 whitespace-pre-line">
              {quote.terms_and_conditions}
            </div>
          ) : null}

          {/* Authorized Signature */}
          <div className="mt-16">
            <div className="flex items-center gap-4 text-xs text-neutral-900">
              <span>Authorized Signature</span>
              <div className="w-44 border-b border-neutral-800" />
            </div>
            <div className="mt-1 pl-[135px] text-xs text-neutral-600">
              Brahma Rishi
            </div>
          </div>
        </div>

        {/* Page 2 Bottom Footer */}
        <div className="mt-8 pt-4 border-t border-neutral-300 flex justify-end text-[10px] text-neutral-400">
          <span>| 2</span>
        </div>
      </article>
    </div>
  );
}
