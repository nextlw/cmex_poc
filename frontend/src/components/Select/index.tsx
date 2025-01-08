import React, { useState, useRef, useEffect } from "react";
import "./styles.css";
import { SelectProps } from "./types";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  handleParentChange,
  style = { width: "100%" },
}): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (selectedValue: string | null) => {
    onChange(selectedValue);
    handleParentChange();
    setIsOpen(false);
  };

  return (
    <div
      className="select-wrapper flex flex-col h-[62px] justify-between"
      style={style}
    >
      <label className="text-gray-200 text-xs font-regular pl-1 pb-0">
        {label}
      </label>
      <div
        className="flex-1 flex items-end text-gray-200 font-regular"
        ref={dropdownRef}
      >
        <div className="dropdown">
          <button
            type="button"
            className="dark-select w-full text-left"
            onClick={toggleDropdown}
          >
            {value
              ? options.find((opt) => opt.value === value)?.label
              : placeholder}
            <span className="icon">
              {isOpen ? <BiChevronUp /> : <BiChevronDown />}
            </span>
          </button>
          {isOpen && (
            <ul className="options-list">
              {options.map((option) => (
                <li
                  key={option.value}
                  className="option-item"
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Select;
