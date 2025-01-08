import React from "react";
import "./styles.css";
import { HeaderLinksProps } from "./types";

const HeaderLinks: React.FC<HeaderLinksProps> = ({ links }) => {
  return (
    <nav className="header-links">
      {links.map((link) => (
        <a key={link} href="#" className="header-link-item">
          {link}
        </a>
      ))}
    </nav>
  );
};

export default HeaderLinks;
