import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import AddCandidate from "./pages/AddCandidate";
import EditCandidate from "./pages/EditCandidate";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SetPassword from "./pages/SetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import DataValidation from "./pages/DataValidation";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/set-password" element={<SetPassword />} />

          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddCandidate /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditCandidate /></ProtectedRoute>} />
          <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />

          {/* Sidebar Features */}
          <Route path="/validation" element={<ProtectedRoute><DataValidation /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;