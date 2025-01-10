import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import HistoricoPage from "../pages/Historico";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/historico" element={<HistoricoPage />} />
    </Routes>
  );
};

export default AppRoutes; 