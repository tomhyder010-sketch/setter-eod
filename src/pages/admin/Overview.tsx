import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAll, isConfigured } from "../../lib/api";
import {
  daysAgoISO,
  daysInMonth,
  fmtNum,
  pct,
  sumBy,
  todayISO,
} from "../../lib/metrics";
import type { EodReport } from "../../lib/eodFields";
import { DateRange, Kpi, Panel, Select } from "../../components/ui";

const CHANNELS = [
  {
    label: "Dials",
    activity: "dials made",
    activityKey: "dials_made",
    proposedKey: "meetings_proposed",
    bookedKey: "meetings_booked_dials",
  },
  {
    label: "Cold Email",
    activity: "emails responded to",
    activityKey: "email_responses",
    proposedKey: "email_meetings_proposed",
    bookedKey: "meetings_booked_email",
  },
  {
    label: "LinkedIn",
    activity: "DMs sent",
    activityKey: "li_dms_sent",
    proposedKey: "li_positive_replies",
    bookedKey: "meetings_booked_linkedin",
  },
  {
    label: "Miscellaneous",
    activity: "messages sent",
    activityKey: "misc_messages_sent",
    proposedKey: "misc_meetings_proposed",
    bookedKey: "misc_meetings_booked",
  },
] as const;

export default function Overview() {
  const [from, setFrom] = useState(daysAgoISO(13));
  const [to, setTo] = useState(todayISO());
  const [setterName, setSetterName] = useState("all");
  const [setters, setSetters] = useState<string[]>([]);
  const [allReports, setAllReports] = useState<EodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }
    fetchAll()
      .then((data) => {
        setSetters(data.setters);
        setAllReports(data.reports);
        setLoading(false);
      })
      .catch((e) => {
        setLoadError(String(e.message || e));
        setLoading(false);
      });
  }, []);

  const reports = useMemo(
    () =>
      allReports
        .filter(
          (r) =>
            r.report_date >= from &&
            r.report_date <= to &&
            (setterName === "all" || r.setter_name === setterName)
        )
        .sort((a, b) => a.report_date.localeCompare(b.report_date)),
    [allReports, from, to, setterName]
  );

  // Full history for the selected setter, independent of the date-range
  // picker above (which defaults to 14 days) — monthly projections need
  // every report in a given calendar month, not just a recent slice.
  const reportsForSetter = useMemo(
    () =>
      allReports.filter(
        (r) => setterName === "all" || r.setter_name === setterName
      ),
    [allReports, setterName]
  );

  const bookedTotal = (r: EodReport) =>
    Number(r.meetings_booked_dials ?? 0) +
    Number(r.meetings_booked_email ?? 0) +
    Number(r.meetings_booked_linkedin ?? 0) +
    Number(r.misc_meetings_booked ?? 0);

  const monthlyProjections = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const bookedByMonth = new Map<string, number>();
    for (const r of reportsForSetter) {
      const key = r.report_date.slice(0, 7);
      bookedByMonth.set(key, (bookedByMonth.get(key) ?? 0) + bookedTotal(r));
    }
    // Always show the current month, even with zero reports yet.
    if (!bookedByMonth.has(currentKey)) bookedByMonth.set(currentKey, 0);

    return [...bookedByMonth.entries()]
      .map(([key, bookedSoFar]) => {
        const [year, month] = key.split("-").map(Number);
        const totalDays = daysInMonth(year, month - 1);
        const elapsedDays = key === currentKey ? now.getDate() : totalDays;
        const dailyRate = elapsedDays > 0 ? bookedSoFar / elapsedDays : 0;
        return {
          key,
          label: new Date(year, month - 1, 1).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          }),
          bookedSoFar,
          elapsedDays,
          totalDays,
          dailyRate,
          projected: Math.round(dailyRate * totalDays),
          isCurrent: key === currentKey,
        };
      })
      .sort((a, b) => b.key.localeCompare(a.key))
      .slice(0, 6);
  }, [reportsForSetter]);

  const totals = useMemo(() => {
    const sum = (key: string) => sumBy(reports, (r) => r[key] as number);
    const booked =
      sum("meetings_booked_dials") +
      sum("meetings_booked_email") +
      sum("meetings_booked_linkedin") +
      sum("misc_meetings_booked");
    const proposed =
      sum("meetings_proposed") +
      sum("email_meetings_proposed") +
      sum("misc_meetings_proposed");
    return { sum, booked, proposed };
  }, [reports]);

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of reports) {
      const row =
        byDate.get(r.report_date) ??
        ({
          date: r.report_date.slice(5),
          Dials: 0,
          Email: 0,
          LinkedIn: 0,
          Misc: 0,
        } as Record<string, number | string>);
      row.Dials = (row.Dials as number) + Number(r.meetings_booked_dials ?? 0);
      row.Email = (row.Email as number) + Number(r.meetings_booked_email ?? 0);
      row.LinkedIn =
        (row.LinkedIn as number) + Number(r.meetings_booked_linkedin ?? 0);
      row.Misc = (row.Misc as number) + Number(r.misc_meetings_booked ?? 0);
      byDate.set(r.report_date, row);
    }
    return [...byDate.values()];
  }, [reports]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Setter analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Appointment-setter output across every channel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            className="h-8 w-40 py-0 text-sm"
            value={setterName}
            onChange={(e) => setSetterName(e.target.value)}
          >
            <option value="all">All setters</option>
            {setters.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <DateRange
            from={from}
            to={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />
        </div>
      </div>

      {!isConfigured() && (
        <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Backend not connected yet — link the Google Sheet first (see README).
        </div>
      )}
      {loadError && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Couldn't reach the Google Sheet: {loadError}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Dials made"
          value={fmtNum(totals.sum("dials_made"))}
          sub={`${fmtNum(totals.sum("pickups"))} answered`}
        />
        <Kpi label="Meetings proposed" value={fmtNum(totals.proposed)} />
        <Kpi label="Meetings booked" value={fmtNum(totals.booked)} />
        <Kpi
          label="Rep applications"
          value={fmtNum(totals.sum("hiring_applications"))}
          sub={`${fmtNum(totals.sum("hiring_links_sent"))} hiring links sent`}
        />
        <Kpi
          label="Hours logged"
          value={fmtNum(totals.sum("hours_worked"))}
          sub={`${reports.length} report${reports.length === 1 ? "" : "s"}`}
        />
      </div>

      <div className="mt-6">
        <Panel title="Rates">
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                [
                  "Pickup rate",
                  pct(totals.sum("pickups"), totals.sum("dials_made")),
                  "answered ÷ dials",
                ],
                [
                  "Proposed rate",
                  pct(totals.sum("meetings_proposed"), totals.sum("pickups")),
                  "proposed ÷ answered",
                ],
                [
                  "Booking rate",
                  pct(totals.booked, totals.proposed),
                  "booked ÷ proposed",
                ],
                [
                  "Email booking",
                  pct(
                    totals.sum("meetings_booked_email"),
                    totals.sum("email_meetings_proposed")
                  ),
                  "booked ÷ proposed (email)",
                ],
                [
                  "LI accept rate",
                  pct(
                    totals.sum("li_accepts"),
                    totals.sum("li_connection_requests")
                  ),
                  "accepts ÷ requests",
                ],
                [
                  "Hiring app rate",
                  pct(
                    totals.sum("hiring_applications"),
                    totals.sum("hiring_links_sent")
                  ),
                  "applications ÷ links",
                ],
              ] as const
            ).map(([label, value, sub]) => (
              <div key={label} className="rounded-md bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {value}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground/70">
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Projected bookings by month">
          {monthlyProjections.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {loading ? "Loading…" : "No reports yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Month</th>
                    <th className="pb-2 pr-4 font-medium">Days elapsed</th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Booked so far
                    </th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Daily rate
                    </th>
                    <th className="pb-2 text-right font-medium">
                      Projected total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyProjections.map((m) => (
                    <tr key={m.key} className="border-t border-border">
                      <td className="py-2 pr-4 font-medium">
                        {m.label}
                        {m.isCurrent && (
                          <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-normal text-primary">
                            in progress
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {m.elapsedDays} / {m.totalDays}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtNum(m.bookedSoFar)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                        {m.dailyRate.toFixed(1)}/day
                      </td>
                      <td className="py-2 text-right text-base font-semibold tabular-nums">
                        {fmtNum(m.projected)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Meetings booked per day">
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {loading ? "Loading…" : "No reports in this range yet."}
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="Dials"
                    stackId="a"
                    fill="var(--chart-1)"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="Email"
                    stackId="a"
                    fill="var(--chart-2)"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="LinkedIn"
                    stackId="a"
                    fill="var(--chart-3)"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="Misc"
                    stackId="a"
                    fill="var(--chart-4)"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Channel breakdown">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">Channel</th>
                <th className="pb-2 font-medium">Activity</th>
                <th className="pb-2 text-right font-medium">Proposed</th>
                <th className="pb-2 text-right font-medium">Booked</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((ch) => (
                <tr key={ch.label} className="border-t border-border">
                  <td className="py-2 font-medium">{ch.label}</td>
                  <td className="py-2 text-muted-foreground">
                    {fmtNum(totals.sum(ch.activityKey))} {ch.activity}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtNum(totals.sum(ch.proposedKey))}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtNum(totals.sum(ch.bookedKey))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Rep hiring funnel">
          <div className="grid grid-cols-3 gap-3 text-center">
            {(
              [
                ["Messages sent", totals.sum("hiring_messages_sent")],
                ["Links sent", totals.sum("hiring_links_sent")],
                ["Applications", totals.sum("hiring_applications")],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-md bg-background/60 p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {fmtNum(value)}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Recent reports">
          {reports.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {loading ? "Loading…" : "Nothing logged in this range yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Setter</th>
                    <th className="pb-2 pr-4 text-right font-medium">Hours</th>
                    <th className="pb-2 pr-4 text-right font-medium">Dials</th>
                    <th className="pb-2 pr-4 text-right font-medium">Booked</th>
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...reports].reverse().map((r) => (
                    <tr
                      key={`${r.setter_name}-${r.report_date}`}
                      className="border-t border-border"
                    >
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {r.report_date}
                      </td>
                      <td className="py-2 pr-4">{r.setter_name}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.hours_worked}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtNum(r.dials_made)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtNum(
                          Number(r.meetings_booked_dials ?? 0) +
                            Number(r.meetings_booked_email ?? 0) +
                            Number(r.meetings_booked_linkedin ?? 0) +
                            Number(r.misc_meetings_booked ?? 0)
                        )}
                      </td>
                      <td className="max-w-64 truncate py-2 text-muted-foreground">
                        {r.notes ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
