import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `px-4 py-2.5 rounded-xl transition-all font-medium block ${isActive(path)
      ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-100/50'
      : 'text-gray-500 hover:bg-gray-50 hover:text-teal-600'
    }`;

  return (
    <div className="w-64 bg-white border-r border-gray-100/80 flex flex-col h-full py-6 px-4">
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">G</div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-tight">
          Galacticos 
        </h2>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 px-3 mt-4">Core Platform</div>

        <Link to="/dashboard" className={linkClass('/dashboard')}>
          Dashboard
        </Link>
        {user?.role !== 'client' && (
          <Link to="/analytics" className={linkClass('/analytics')}>
            Analytics
          </Link>
        )}
        <Link to="/candidates" className={linkClass('/candidates')}>
          Candidate Information
        </Link>
        {user?.role !== 'client' && (
          <Link to="/add" className={linkClass('/add')}>
            Add Candidate
          </Link>
        )}

        {user?.role === 'admin' && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 px-3 mt-8">Configuration</div>

            <Link to="/register" className={linkClass('/register')}>
              Add User
            </Link>
            <Link to="/validation" className={linkClass('/validation')}>
              Data Validation
            </Link>
          </>
        )}
      </nav>

      <div className="mt-auto pt-6 px-2">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-100 text-red-500 font-semibold hover:bg-red-50 transition-colors shadow-sm text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}