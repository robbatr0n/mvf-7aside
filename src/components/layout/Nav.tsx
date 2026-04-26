import { Link, useLocation } from "react-router-dom";
import { useTheme } from '../../hooks/useTheme'

const NAV_ITEMS = [
  { label: "Players", path: "/players" },
  { label: "Awards", path: "/awards" },
  { label: "Season", path: "/season" },
];

export default function Nav() {
  const { pathname } = useLocation()
  const { isDark, toggle } = useTheme()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <nav className="bg-[#FFFFFF] dark:bg-black border-b-2 border-b-mvf sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="MVF" className="w-8 h-8 object-contain" />
          <span className="font-bold dark:text-[#E5E6E3] text-[#1C1C1C] tracking-tight text-sm">
            <span className="sm:hidden">MVF</span>
            <span className="hidden sm:inline">MVF Wednesday</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                ? 'bg-mvf text-white'
                : 'text-gray-600 dark:text-[#9CA3AF] hover:text-white hover:bg-mvf/80'
                }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={toggle}
            className="ml-2 cursor-pointer flex items-center"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-checked={isDark}
            role="switch"
          >
            <span className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 ${isDark ? 'bg-mvf' : 'bg-[#D4D3D0]'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center text-[10px] transition-transform duration-200 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}>
                {isDark ? '☀️' : '🌙'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}