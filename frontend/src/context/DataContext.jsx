import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [c, comps, ins] = await Promise.all([
      api.get("/company"),
      api.get("/competitors"),
      api.get("/insights"),
    ]);
    setCompany(c.data);
    setCompetitors(comps.data || []);
    setInsights(ins.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <DataContext.Provider value={{ company, competitors, insights, loading, refresh, setCompany, setCompetitors, setInsights }}>
      {children}
    </DataContext.Provider>
  );
}
