import React, { useEffect, useRef } from 'react';
import './styles.css';
import { InputSearchProps } from './types';

const InputSearch: React.FC<InputSearchProps> = ({ 
    width, 
    height, 
    placeholder = "Digite aqui", 
    value, onChange, 
    onKeyPress, 
    onBlur, 
    readOnly = false,
    label,
    icon, 
    showInnerLabel = false, 
    className = "" 
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);

    const handleFocus = () => {
        inputWrapperRef.current?.classList.add("focused");

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
            inputWrapperRef.current &&
            !inputWrapperRef.current.contains(event.target as Node)
            ) {
            inputWrapperRef.current.classList.remove("focused");
            }
        };

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);
    }
    return (
        <div ref={containerRef} style={{ width: width || "100%", height }}>
            {!showInnerLabel && label && <label>{label}</label>}
            <div className="envoltorio-campo-input" ref={inputWrapperRef}>
                {icon && <span className="icone-campo-input">{icon}</span>}
                <div className="campo-input-container">
                {showInnerLabel && label && (
                    <span className="inner-label">{label}</span>
                )}
                    <input 
                        ref={inputRef}
                        width={width}
                        height={height}
                        className={`input-search ${className}`}
                        type="text" 
                        value={value} 
                        onChange={onChange} 
                        onBlur={onBlur} 
                        readOnly={readOnly} 
                        placeholder={placeholder}
                    />
                </div>
            </div>
        </div>
        );
    }

export default InputSearch;


