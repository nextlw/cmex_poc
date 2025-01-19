import React from "react";
import LogoImage from "../../assets/logo.png"; // Importação correta
import "./styles.css";
import { LogoProps } from "./types";
import { Link } from "react-router-dom";

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link to="/" className="text-xl font-bold text-white hover:text-gray-200 transition-colors">
      NextCode
    </Link>
  );
};

export default Logo;