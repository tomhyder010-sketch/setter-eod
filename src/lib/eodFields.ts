// Metric columns on the eod_reports table, in display order.
export const EOD_FIELDS: [key: string, label: string][] = [
  // Dials
  ["dials_made", "Dials made"],
  ["pickups", "Dials answered"],
  ["meetings_proposed", "Meetings proposed"],
  ["meetings_booked_dials", "Meetings booked (dials)"],
  // Cold email — the setter works replies inside the campaign
  ["email_responses", "Emails responded to"],
  ["email_meetings_proposed", "Meetings proposed (email)"],
  ["meetings_booked_email", "Meetings booked (email)"],
  // LinkedIn
  ["li_connection_requests", "Connection requests"],
  ["li_accepts", "Accepts"],
  ["li_dms_sent", "DMs sent"],
  ["li_replies", "Replies"],
  ["li_positive_replies", "Positive replies"],
  ["meetings_booked_linkedin", "Meetings booked (LI)"],
  // Sales rep hiring
  ["hiring_messages_sent", "Messages sent"],
  ["hiring_links_sent", "Hiring links sent"],
  ["hiring_applications", "Rep applications submitted"],
  // Miscellaneous — other platforms the setter gets creative with
  ["misc_messages_sent", "Messages sent"],
  ["misc_dials_made", "Dials made"],
  ["misc_meetings_proposed", "Meetings proposed"],
  ["misc_meetings_booked", "Meetings booked"],
];

export const EOD_SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: "Dials",
    keys: [
      "dials_made",
      "pickups",
      "meetings_proposed",
      "meetings_booked_dials",
    ],
  },
  {
    title: "Cold Email",
    keys: [
      "email_responses",
      "email_meetings_proposed",
      "meetings_booked_email",
    ],
  },
  {
    title: "LinkedIn",
    keys: [
      "li_connection_requests",
      "li_accepts",
      "li_dms_sent",
      "li_replies",
      "li_positive_replies",
      "meetings_booked_linkedin",
    ],
  },
  {
    title: "Sales Rep Hiring",
    keys: ["hiring_messages_sent", "hiring_links_sent", "hiring_applications"],
  },
  {
    title: "Miscellaneous",
    keys: [
      "misc_messages_sent",
      "misc_dials_made",
      "misc_meetings_proposed",
      "misc_meetings_booked",
    ],
  },
];

export const emptyMetrics = (): Record<string, number> =>
  Object.fromEntries(EOD_FIELDS.map(([key]) => [key, 0]));

// One row per setter per day, keyed by (setter_name, report_date).
export type EodReport = Record<string, number> & {
  setter_name: string;
  report_date: string;
  hours_worked: number;
  notes: string | null;
  objections_heard: string | null;
};
