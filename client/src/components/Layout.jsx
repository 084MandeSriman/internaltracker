import Sidebar from "./Sidebar";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { SearchContext } from "../context/SearchContext";

export default function Layout({ children }) {

  const { user } = useContext(AuthContext);
  const { search, setSearch, results, setResults } = useContext(SearchContext);

  const handleSearch = async (value) => {

    setSearch(value);

    if (!value) {
      setResults({});
      return;
    }

    try {

      const res = await fetch(
        `http://localhost:5000/search?q=${value}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await res.json();
      setResults(data);

    } catch (err) {
      console.error("Search error", err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-gray-800">

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20">

          {/* Title */}
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Welcome back 👋
            </h1>
            <p className="text-xs text-gray-500">
              Galacticos Recruitment Suite
            </p>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 relative">

            {/* Search */}
           
           

            {/* User */}
            <div className="flex items-center gap-3 bg-gray-100 px-3 py-2 rounded-lg">

              <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0) || "A"}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user?.name || "Admin"}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>

            </div>

          </div>

        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}