import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { RiAiGenerate2 } from "react-icons/ri";
import Select from "../Select";
import { Modelos } from "../Select/types";
import Notifications from "../Notifications";
import ThemeToggle from "../ThemeToggle";
import AvatarMenu from "../Avatar/AvatarMenu";
import "./styles.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  modeloSelecionado: string | null;
  aoMudarModelo: (valor: string | null) => void;
  userEmail: string;
  userName: string;
  alwaysShowLinks?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  modeloSelecionado,
  aoMudarModelo,
  userEmail,
  userName,
  alwaysShowLinks = false
}) => {
  const location = useLocation();
  const links = ["Início", "Histórico", "Configurações"];

  const getLinkPath = (link: string): string => {
    switch (link) {
      case "Início":
        return "/";
      case "Histórico":
        return "/historico";
      case "Configurações":
        return "/configuracoes";
      default:
        return "/";
    }
  };

  const isLinkActive = (link: string): boolean => {
    const path = getLinkPath(link);
    return location.pathname === path;
  };

  const handleModelChange = (novoModelo: string | null) => {
    aoMudarModelo(novoModelo);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link
              key={link}
              to={getLinkPath(link)}
              className={`sidebar-link ${isLinkActive(link) ? "active" : ""} ${
                link === "Configurações" ? "disabled" : ""
              }`}
              onClick={(e) => {
                if (link === "Configurações") {
                  e.preventDefault();
                } else {
                  onClose();
                }
              }}
            >
              {link}
            </Link>
          ))}
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-model-selector">
            <RiAiGenerate2 className="sidebar-icon" />
            <p className="sidebar-label">Selecione modelo de IA:</p>
            <Select
              label=""
              options={Modelos}
              value={modeloSelecionado}
              onChange={handleModelChange}
              placeholder="Selecione o modelo"
              handleParentChange={() => {}}
            />
          </div>

          <div className="sidebar-actions">
            <Notifications className="sidebar-icon" />
            <ThemeToggle />
            <span className="sidebar-user-name">{userEmail}</span>
            <AvatarMenu name={userName} />
          </div>
        </div>
      </div>
      
      <div className="sidebar-overlay" onClick={onClose} />
    </div>
  );
};

export default Sidebar; 