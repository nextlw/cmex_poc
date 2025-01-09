import React from "react";
import "./styles.css";
import { HamburgerProps } from "./types";
const Hamburger: React.FC<HamburgerProps> = ({ onClick, reactIcon }) => {
  return (
    <div className="hamburger" onClick={onClick}>
      {reactIcon}
    </div>
  );
};
export default Hamburger;
