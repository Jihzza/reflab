import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  User,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar navigation component.
 * Slides in from the left on mobile.
 */
export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app/dashboard" },
    { label: "Learn", icon: BookOpen, path: "/app/learn" },
    { label: "Tests", icon: ClipboardList, path: "/app/tests" },
    { label: "Chat", icon: MessageCircle, path: "/app/chat" },
    { label: "Profile", icon: User, path: "/app/profile" },
  ];

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[var(--bg-surface)] z-50 p-4 border-r border-[var(--border-subtle)] shadow-[var(--shadow-elev-2)]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-[var(--text-secondary)]">
            Navigation
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,229,138,0.18)]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button)] text-left transition-colors",
                  isActive
                    ? "bg-[rgba(246,194,28,0.12)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5",
                ].join(" ")}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
