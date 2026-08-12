"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectIsAuthenticated, logout } from "../auth/authSlice";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (isMounted && !isAuthenticated) {
      router.push("/auth?tab=login");
    }
  }, [isAuthenticated, router, isMounted]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth?tab=login");
  };
 
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "⌂" },
    { name: "My Exams", href: "/dashboard/exams", icon: "▣" },
    // { name: "Available Tests", href: "/dashboard/tests", icon: "◈" },
    { name: "Results", href: "/dashboard/results", icon: "◫" },
    { name: "Upload Questions", href: "/dashboard/upload", icon: "⇪" },
    // { name: "Performance", href: "/dashboard/performance", icon: "◒" },
    // { name: "Leaderboard", href: "/dashboard/leaderboard", icon: "♛" },
  ];

  return (
    <div
      className="dashboard-app"
      style={{
        visibility: isMounted && isAuthenticated ? "visible" : "hidden",
      }}
    >
      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? "mobile-open" : ""}`}>
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">✦</div>
          <span>Quizly</span>
        </div>

        <div className="dashboard-menu-title">Main Menu</div>
        <nav className="dashboard-nav">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`dashboard-nav-item ${isActive ? "active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="dashboard-nav-icon">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-menu-title" style={{ marginTop: "30px" }}>
          Account
        </div>
        <nav className="dashboard-nav">
          <Link href="#" className="dashboard-nav-item">
            <span className="dashboard-nav-icon">⚙</span> Settings
          </Link>
          <Link href="#" className="dashboard-nav-item">
            <span className="dashboard-nav-icon">?</span> Help Center
          </Link>
        </nav>

       
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">
        {/* Mobile header */}
        <div className="dashboard-mobile-header">
          <div className="dashboard-mobile-logo">
            <div className="dashboard-mobile-logo-icon">✦</div>
            Quizly
          </div>
          <div 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            style={{ cursor: "pointer", fontSize: "24px" }}
          >
            ☰
          </div>
        </div>

        {/* Topbar */}
        {/* <header className="dashboard-topbar">
          <div className="dashboard-search">
            <span className="dashboard-search-icon">⌕</span>
            <input type="text" placeholder="Search exams, tests..." />
          </div>

          <div className="dashboard-top-actions">
            <div className="dashboard-notification">
              ♧<span className="dashboard-notification-dot"></span>
            </div>

            <div className="dashboard-profile">
              <div className="dashboard-avatar">TS</div>
              <div className="dashboard-profile-info">
                <strong>Tushar Sharma</strong>
                <span>Student</span>
              </div>
              <span>⌄</span>
            </div>
          </div>
        </header> */}

        {/* Content (Injected per page) */}
        <section className="dashboard-content">{children}</section>
      </main>
    </div>
  );
}
