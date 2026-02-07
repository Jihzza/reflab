import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  User,
} from "lucide-react";

/**
 * Bottom navigation bar for mobile.
 * Provides quick access to main app sections.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", icon: LayoutDashboard, path: "/app/dashboard" },
    { label: "Learn", icon: BookOpen, path: "/app/learn" },
    { label: "Tests", icon: ClipboardList, path: "/app/tests" },
    { label: "Chat", icon: MessageCircle, path: "/app/chat" },
    { label: "Profile", icon: User, path: "/app/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)]/92 backdrop-blur border-t border-[var(--border-subtle)] md:hidden">
      <div className="flex justify-around py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={[
                "flex flex-col items-center p-2 rounded-[var(--radius-button)] transition-colors",
                isActive
                  ? "text-[var(--brand-yellow)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              ].join(" ")}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
