import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./styles.css";

interface HeaderLinksProps {
  links: string[];
}

const HeaderLinks: React.FC<HeaderLinksProps> = ({ links }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (link: string) => {
    switch (link) {
      case "Início":
        navigate("/");
        break;
      case "Histórico":
        navigate("/historico");
        break;
      case "Configurações":
        // Desabilitado por enquanto
        break;
      default:
        break;
    }
  };

  const isLinkActive = (link: string): boolean => {
    switch (link) {
      case "Início":
        return location.pathname === "/";
      case "Histórico":
        return location.pathname === "/historico";
      default:
        return false;
    }
  };

  return (
    <nav className="header-links">
      {links.map((link) => (
        <button
          key={link}
          onClick={() => handleNavigation(link)}
          className={`header-link ${isLinkActive(link) ? "active" : ""} ${
            link === "Configurações" ? "disabled" : ""
          }`}
          disabled={link === "Configurações"}
        >
          {link}
        </button>
      ))}
    </nav>
  );
};

export default HeaderLinks;
