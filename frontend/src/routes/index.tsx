import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import HistoricoPage from "../pages/Historico";
import BuscaPage from "../pages/BuscaPage";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/historico" element={<HistoricoPage />} />
      <Route path="/busca" element={<BuscaPage />} />
    </Routes>
  );
};

export default AppRoutes; 