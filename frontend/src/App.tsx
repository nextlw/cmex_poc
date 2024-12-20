import React from "react";
import LoginForm from "./components/SearchForm";
import PrivateRoute from "../src/auth/PrivateRoute";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Navigate to="/demo" />} />
        <Route path="/login" element={<Login />} />

        {/* Rotas privadas */}
        <Route
          path="/demo"
          element={
            <PrivateRoute>
              <LoginForm />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
