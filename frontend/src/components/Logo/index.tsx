import React from "react";
import LogoImage from "../../assets/logo.png"; // Importação correta
import "./styles.css";
import { LogoProps } from "./types";
import { Link } from "react-router-dom";

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link to="/" className="logo text-xl font-bold transition-colors">
      NextCode
    </Link>
  );
};

export default Logo;