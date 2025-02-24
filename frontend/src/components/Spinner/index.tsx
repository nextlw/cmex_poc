import "./styles.css";

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
