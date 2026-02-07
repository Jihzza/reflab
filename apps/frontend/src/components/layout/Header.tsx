import NotificationBell from '@/features/notifications/components/NotificationBell'
import BannerLogo from '@/assets/logos/Banner RefLab No BG.svg'
import { Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b bg-[var(--bg-surface)]/85 backdrop-blur px-4 py-3 flex items-center justify-between">
      <div className="flex items-center min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 mr-3 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,229,138,0.18)]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/app/dashboard')}
          className="flex items-center min-w-0"
          aria-label="Go to dashboard"
        >
          <img
            src={BannerLogo}
            alt="RefLab"
            className="h-7 sm:h-8 w-auto"
          />
          <h1 className="sr-only">RefLab</h1>
        </button>
      </div>

      <NotificationBell />
    </header>
  );
}
