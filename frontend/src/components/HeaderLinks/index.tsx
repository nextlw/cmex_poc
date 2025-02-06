import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./styles.css";
import { HeaderLinksProps } from "./types";

const HeaderLinks: React.FC<HeaderLinksProps> = ({ links }) => {
  const location = useLocation();

  const getLinkPath = (link: string): string => {
    switch (link) {
      case "Início":
        return "/";
      case "Histórico":
        return "/historico";
      case "Configurações":
        return "/configuracoes";
      case "Busca":
        return "/busca";
      case "Chat":
        return "/chat";
      default:
        return "/";
    }
  };

  const isLinkActive = (link: string): boolean => {
    switch (link) {
      case "Início":
        return location.pathname === "/";
      case "Histórico":
        return location.pathname === "/historico";
      case "Busca":
        return location.pathname === "/busca";
      case "Chat":
        return location.pathname === "/chat";
      default:
        return false;
    }
  };

  return (
    <nav className="header-links">
      {links.map((link) => (
        <Link
          key={link}
          to={getLinkPath(link)}
          className={`header-link ${isLinkActive(link) ? "active" : ""} ${
            link === "Configurações" ? "disabled" : ""
          }`}
          onClick={(e) => {
            if (link === "Configurações") {
              e.preventDefault();
            }
          }}
        >
          {link}
        </Link>
      ))}
    </nav>
  );
};

export default HeaderLinks;
