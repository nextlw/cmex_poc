import React from "react";
import "./styles.css"; // Insira aqui o CSS mostrado antes ou algo similar

interface SpinnerProps {
  classes?: string
}

const Spinner = (props:SpinnerProps) => {
  return (
    <div className={`spinner ${props.classes}`}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default Spinner;
