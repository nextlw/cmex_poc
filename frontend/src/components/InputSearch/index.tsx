import React, { useEffect, useRef, forwardRef } from 'react';
import './styles.css';
import { InputSearchProps } from './types';
import InputField from '../InputField';

const InputSearch = forwardRef<HTMLInputElement, InputSearchProps>(({ 
    width, 
    height, 
    placeholder = "Digite aqui", 
    value, 
    onChange, 
    onKeyPress, 
    onBlur, 
    readOnly = false,
    label,
    icon, 
    showInnerLabel = false, 
    className = "" 
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);

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

    const handleFocus = () => {
        inputWrapperRef.current?.classList.add("focused");
    };

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
                        ref={ref}
                        type="text"
                        value={value}
                        onChange={onChange}
                        onKeyPress={onKeyPress}
                        onBlur={onBlur}
                        onFocus={handleFocus}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        className={`campo-input ${className}`}
                    />
                </div>
            </div>
        </div>
    );
});

InputSearch.displayName = 'InputSearch';

export default InputSearch;


