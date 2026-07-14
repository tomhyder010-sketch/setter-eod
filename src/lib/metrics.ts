export const pct = (num: number, den: number) =>
  !den || den <= 0 ? "—" : ((num / den) * 100).toFixed(1) + "%";

export const fmtNum = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString();

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysAgoISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export const sumBy = <T,>(rows: T[], get: (row: T) => number | null | undefined) =>
  rows.reduce((acc, row) => acc + Number(get(row) ?? 0), 0);

// month0 is 0-indexed (January = 0), matching Date's convention.
export const daysInMonth = (year: number, month0: number) =>
  new Date(year, month0 + 1, 0).getDate();
