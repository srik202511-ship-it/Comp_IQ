import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Competitors from "./pages/Competitors";
import Compare from "./pages/Compare";
import Analysis from "./pages/Analysis";
import History from "./pages/History";
import Insights from "./pages/Insights";
import Swot from "./pages/Swot";
import Settings from "./pages/Settings";
import { Loader2 } from "lucide-react";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F17]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  if (user === false) return <Navigate to="/login" replace />;
  return <DataProvider>{children}</DataProvider>;
}

function App() {
  return (
    <div className="App">
      <Toaster theme="dark" position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected><Layout /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="competitors" element={<Competitors />} />
              <Route path="compare" element={<Compare />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="history" element={<History />} />
              <Route path="insights" element={<Insights />} />
              <Route path="swot" element={<Swot />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
