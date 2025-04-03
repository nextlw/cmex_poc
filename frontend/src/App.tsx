import HomePage from "./pages/HomePage";
import HistoricoPage from "./pages/Historico";
import PrivateRoute from "../src/auth/PrivateRoute";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import "./styles/tokens.css";
import "./styles/globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./auth/AuthContext";
import BuscaPage from "./pages/BuscaPage";
import ChatPage from "./pages/ChatPage";
import ConfigPage from "./pages/ConfigPage";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
            <Route
              path="/historico"
              element={
                <PrivateRoute>
                  <HistoricoPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/busca"
              element={
                <PrivateRoute>
                  <BuscaPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <PrivateRoute>
                  <ConfigPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/configuracoes/doc/:docPath"
              element={
                <PrivateRoute>
                  <ConfigPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
