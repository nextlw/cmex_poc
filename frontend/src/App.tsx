import React from "react";
import LoginForm from "./components/LoginForm";
import PrivateRoute from "../src/auth/PrivateRoute";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './pages/Login'

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login/>} />

        {/* Rotas privadas */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <LoginForm/>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;