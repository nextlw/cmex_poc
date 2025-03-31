import "./styles.css";
import { SpinnerProps } from "./types";

const Spinner = (props: SpinnerProps) => {
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
