import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/" },
  { label: "Awards", path: "/awards" },
];

export default function Nav() {
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="text-xl">⚽</span>
          <span className="font-bold text-white tracking-tight text-sm">
            MVF
          </span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-gray-800 text-white"
                  : "text-gray-500 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
