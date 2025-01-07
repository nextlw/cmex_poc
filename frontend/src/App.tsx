import React from "react";
import HomePage from "./pages/HomePage";
import PrivateRoute from "../src/auth/PrivateRoute";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
              <HomePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
