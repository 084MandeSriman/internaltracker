import { createContext, useState } from "react";

export const SearchContext = createContext();

export function SearchProvider({ children }) {

  const [search, setSearch] = useState("");
  const [results, setResults] = useState({});

  return (
    <SearchContext.Provider value={{ search, setSearch, results, setResults }}>
      {children}
    </SearchContext.Provider>
  );
}