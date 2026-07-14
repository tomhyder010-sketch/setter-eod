import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";
import Eod from "./pages/Eod";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";

import { DASHBOARD_PATH } from "./lib/paths";

// Hash router so the site works on any static host (GitHub Pages included)
// without server-side redirect rules. The root is the setter-facing form;
// the dashboard lives on the unguessable path from lib/paths.ts.
const router = createHashRouter([
  { path: "/", element: <Eod /> },
  {
    path: DASHBOARD_PATH,
    element: <AdminLayout />,
    children: [{ index: true, element: <Overview /> }],
  },
  { path: "*", element: <Eod /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster theme="dark" richColors position="top-center" />
    <RouterProvider router={router} />
  </React.StrictMode>
);
