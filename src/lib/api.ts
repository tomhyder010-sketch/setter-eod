import type { EodReport } from "./eodFields";

// The Google Apps Script web-app URL (ends in /exec) — the script lives in
// Tom's "Setter EOD Reports" Google Sheet; see ../apps-script/.
export const API_URL =
  "https://script.google.com/macros/s/AKfycbyf-BqTNWULyzRd5KSg5J8Tnr59xrBRnTXJOJFzj36kIC0Uo8XADYNtZp1_TLlU6q_dfw/exec";

// Local override so the app can be pointed at a different backend without a
// rebuild: localStorage.setItem('eod_api_url', 'https://…/exec')
export const apiUrl = (): string =>
  localStorage.getItem("eod_api_url") || API_URL;

export const isConfigured = () => apiUrl() !== "";

export type AllData = { setters: string[]; reports: EodReport[] };

// Google Sheets turns date strings into Date cells, which come back as long
// strings like "Sat Jan 01 2000 00:00:00 GMT+0000 (…)". Normalize to
// YYYY-MM-DD so filtering and display stay consistent.
const toISODate = (value: unknown): string => {
  const s = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export async function fetchAll(): Promise<AllData> {
  const res = await fetch(apiUrl());
  if (!res.ok) throw new Error(`Backend returned ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Backend error");
  const reports = (data.reports ?? []).map((r: EodReport) => ({
    ...r,
    report_date: toISODate(r.report_date),
  }));
  return { setters: data.setters ?? [], reports };
}

// Content-type is deliberately text/plain: it keeps the request "simple" so
// the browser skips the CORS preflight that Apps Script can't answer.
export async function submitReport(
  payload: Record<string, unknown>
): Promise<void> {
  const res = await fetch(apiUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Backend returned ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Backend error");
}
