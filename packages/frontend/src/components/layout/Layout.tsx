import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useThemeStore } from "../../stores/themeStore";

export function Layout() {
  // Initialize theme
  useThemeStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-0 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
