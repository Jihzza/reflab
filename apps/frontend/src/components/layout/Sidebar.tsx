import { useNavigate, useLocation } from "react-router-dom";

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
    { label: "Dashboard", icon: "🏠", path: "/app/dashboard" },
    { label: "Learn", icon: "📚", path: "/app/learn" },
    { label: "Tests", icon: "📝", path: "/app/tests" },
    { label: "Chat", icon: "💬", path: "/app/chat" },
    { label: "Profile", icon: "👤", path: "/app/profile" },
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
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white z-50 p-4">
        <button onClick={onClose} className="mb-4 text-gray-500 hover:text-gray-700">
          ✕ Close
        </button>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
