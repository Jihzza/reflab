import { useNavigate, useLocation } from "react-router-dom";

/**
 * Bottom navigation bar for mobile.
 * Provides quick access to main app sections.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", icon: "🏠", path: "/app/dashboard" },
    { label: "Learn", icon: "📚", path: "/app/learn" },
    { label: "Tests", icon: "📝", path: "/app/tests" },
    { label: "Chat", icon: "💬", path: "/app/chat" },
    { label: "Profile", icon: "👤", path: "/app/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center p-2 ${
                isActive ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
