import Sidebar from "./components/Sidebar";
import { Outlet } from "react-router-dom";
import { AdaptiveToastProvider } from '@cognicatch/react';
import { CompanionProvider } from "./components/Companion/CompanionProvider";
import CompanionDock from "./components/Companion/CompanionDock";
import ThemeProvider from "./components/theme/ThemeProvider";
import { useTheme } from "./components/theme/theme-context";

function Shell() {
  const { theme } = useTheme();

  return (
    <>
      <AdaptiveToastProvider theme={theme} />
      <div className="bg-[var(--app-bg)] text-stone-300 min-h-screen flex flex-col">
        <Sidebar />
        <div className="app-content flex-1 relative">
          <Outlet />
        </div>
      </div>
      <CompanionDock />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CompanionProvider>
        <Shell />
      </CompanionProvider>
    </ThemeProvider>
  );
}
