import { Link, Outlet, useLocation } from "react-router-dom";
import { ClipboardList, PhoneOutgoing } from "lucide-react";
import { DASHBOARD_PATH } from "../../lib/paths";

const NAV = [
  { to: DASHBOARD_PATH, label: "Setter Analytics", icon: PhoneOutgoing },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5">
          <div className="text-xs uppercase tracking-widest text-primary">
            Systemised Scaling
          </div>
          <div className="text-lg font-semibold">Analytics</div>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60"
                }`}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-sidebar-accent/60"
          >
            <ClipboardList className="h-4 w-4" /> EOD form
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
