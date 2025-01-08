import React from "react";
import LogoImage from "../../assets/logo.png"; // Importação correta
import "./styles.css";
import { LogoProps } from "./types";

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`logo ${className || ""}`}>
      <img src={LogoImage} alt="Logo" />
    </div>
  );
};

export default Logo;
