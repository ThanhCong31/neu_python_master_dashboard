import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@fontsource-variable/inter";
import { App } from "./app/App";
import { initializeTheme } from "./shell/theme";
import "./styles/globals.css";

initializeTheme();
// A data router provides a single navigation blocker for unsaved admin edits.
const router = createBrowserRouter([{ path: "*", element: <App /> }]);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
