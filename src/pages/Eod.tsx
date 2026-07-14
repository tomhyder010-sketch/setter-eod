import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchAll, isConfigured, submitReport } from "../lib/api";
import { pct, todayISO } from "../lib/metrics";
import {
  EOD_FIELDS,
  EOD_SECTIONS,
  emptyMetrics,
  type EodReport,
} from "../lib/eodFields";
import {
  Button,
  Counter,
  Input,
  Label,
  Select,
  Textarea,
} from "../components/ui";

const labelFor = (key: string) =>
  EOD_FIELDS.find(([k]) => k === key)?.[1] ?? key;

export default function Eod() {
  const [setters, setSetters] = useState<string[]>([]);
  const [reports, setReports] = useState<EodReport[]>([]);
  const [setterName, setSetterName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState(8);
  const [metrics, setMetrics] = useState<Record<string, number>>(emptyMetrics());
  const [notes, setNotes] = useState("");
  const [objections, setObjections] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured()) return;
    fetchAll()
      .then((data) => {
        setSetters(data.setters);
        setReports(data.reports);
      })
      .catch((e) => setLoadError(String(e.message || e)));
  }, []);

  const existing = useMemo(
    () =>
      reports.find(
        (r) => r.setter_name === setterName && r.report_date === date
      ) ?? null,
    [reports, setterName, date]
  );

  const loadExisting = () => {
    if (!existing) return;
    setHours(Number(existing.hours_worked ?? 0));
    const loaded: Record<string, number> = {};
    EOD_FIELDS.forEach(([key]) => (loaded[key] = Number(existing[key] ?? 0)));
    setMetrics(loaded);
    setNotes(existing.notes ?? "");
    setObjections(existing.objections_heard ?? "");
    toast.success("Loaded that day's report for editing.");
  };

  const rates = useMemo(
    () => ({
      answer: pct(metrics.pickups, metrics.dials_made),
      dialBooking: pct(metrics.meetings_booked_dials, metrics.meetings_proposed),
      emailBooking: pct(
        metrics.meetings_booked_email,
        metrics.email_meetings_proposed
      ),
      liAccept: pct(metrics.li_accepts, metrics.li_connection_requests),
      totalBooked:
        metrics.meetings_booked_dials +
        metrics.meetings_booked_email +
        metrics.meetings_booked_linkedin +
        metrics.misc_meetings_booked,
    }),
    [metrics]
  );

  const submit = async () => {
    if (!isConfigured()) {
      toast.error("Backend not connected yet — ask Tom.");
      return;
    }
    if (!setterName) {
      toast.error("Pick a setter");
      return;
    }
    setSaving(true);
    try {
      await submitReport({
        setter_name: setterName,
        report_date: date,
        hours_worked: hours,
        notes: notes || "",
        objections_heard: objections || "",
        ...metrics,
      });
      toast.success(existing ? "Report updated." : "Report submitted.");
      setSubmitted(true);
    } catch (e) {
      toast.error(String((e as Error).message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="text-xs uppercase tracking-widest text-primary">
          Systemised Scaling
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Setter EOD report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log your day's outreach activity.
        </p>

        {!isConfigured() && (
          <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            Backend not connected yet — reports can't be saved until the
            Google Sheet is linked (see README).
          </div>
        )}
        {loadError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            Couldn't reach the Google Sheet: {loadError}
          </div>
        )}

        <div className="mt-6 grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Setter</Label>
            <Select
              value={setterName}
              onChange={(e) => setSetterName(e.target.value)}
            >
              <option value="" disabled>
                Pick a setter
              </option>
              {setters.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              {setters.length === 0 && (
                <option disabled>No setters yet — ask Tom</option>
              )}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hours">Hours worked</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min={0}
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value || "0"))}
            />
          </div>
          {existing && (
            <div className="flex items-center justify-between rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm sm:col-span-2">
              <span>A report already exists for this setter and day.</span>
              <Button variant="outline" size="sm" onClick={loadExisting}>
                Load &amp; edit
              </Button>
            </div>
          )}
        </div>

        {EOD_SECTIONS.map((section) => (
          <section
            key={section.title}
            className="mt-6 rounded-lg border border-border bg-card p-4"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.keys.map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{labelFor(key)}</Label>
                  <Counter
                    id={key}
                    value={metrics[key] ?? 0}
                    onChange={(value) =>
                      setMetrics((m) => ({ ...m, [key]: value }))
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-6 space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obj">Objections heard</Label>
            <Textarea
              id="obj"
              rows={2}
              value={objections}
              onChange={(e) => setObjections(e.target.value)}
            />
          </div>
        </section>

        <div className="sticky bottom-4 mt-6">
          <Button
            className="h-12 w-full text-base"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Saving…" : existing ? "Update report" : "Submit report"}
          </Button>
        </div>

        {submitted && (
          <section className="mt-6 rounded-lg border border-primary/30 bg-primary/10 p-4">
            <h3 className="text-sm font-semibold">Day's rates</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
              {(
                [
                  ["Pickup rate", rates.answer],
                  ["Dial booking", rates.dialBooking],
                  ["Email booking", rates.emailBooking],
                  ["LI accept", rates.liAccept],
                  ["Booked total", rates.totalBooked],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-md bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
