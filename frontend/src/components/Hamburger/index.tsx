import React from "react";
import "./styles.css";

interface HamburgerProps {
  onClick: () => void;
  reactIcon: React.ReactElement;
}

const Hamburger: React.FC<HamburgerProps> = ({ onClick, reactIcon }) => {
  return (
    <button className="hamburger-button" onClick={onClick}>
      {reactIcon}
    </button>
  );
};

export default Hamburger;
