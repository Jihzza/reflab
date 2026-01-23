import NotificationBell from '@/features/notifications/components/NotificationBell'

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 mr-3"
          aria-label="Open menu"
        >
          <span className="text-xl">☰</span>
        </button>
        <h1 className="font-bold text-lg">RefLab</h1>
      </div>

      <NotificationBell />
    </header>
  );
}
