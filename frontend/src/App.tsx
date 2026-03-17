import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Resumes from "./pages/Resumes";
import Editor from "./pages/Editor";
import { ActionProvider } from "./context/AppContext";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const preventGlobalZoom = (e: WheelEvent) => {
      // e.metaKey for mac
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // passive: false to allow preventDefault()
    window.addEventListener("wheel", preventGlobalZoom, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventGlobalZoom);
    };
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <ActionProvider>
              <Layout />
            </ActionProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/Jobs" element={<Jobs />} />
        <Route path="/editor/:resumeId" element={<Editor />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
