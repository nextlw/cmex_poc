import React from "react";
import "./styles.css"; // Usaremos o mesmo arquivo de estilo

const EmptyTableState: React.FC = () => (
  <div className="empty-table-state">
    <svg
      width="48"
      height="48"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M90 30H10C7.23858 30 5 32.2386 5 35V75C5 77.7614 7.23858 80 10 80H90C92.7614 80 95 77.7614 95 75V35C95 32.2386 92.7614 30 90 30Z"
        stroke="var(--empty-state-stroke-color, #CBD5E0)"
        strokeWidth="2"
      />
      <path
        d="M5 45H95"
        stroke="var(--empty-state-stroke-color, #CBD5E0)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 30V80"
        stroke="var(--empty-state-stroke-color, #CBD5E0)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 30V80"
        stroke="var(--empty-state-stroke-color, #CBD5E0)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M70 30V80"
        stroke="var(--empty-state-stroke-color, #CBD5E0)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 55C52.7614 55 55 52.7614 55 50C55 47.2386 52.7614 45 50 45C47.2386 45 45 47.2386 45 50C45 52.7614 47.2386 55 50 55Z"
        fill="var(--empty-state-primary-color, #4A90E2)"
      />
      <path
        d="M48 68.0001L50.0001 70.0002L55.0003 65"
        stroke="var(--empty-state-primary-color, #4A90E2)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 70H55"
        stroke="var(--empty-state-primary-color, #4A90E2)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
    <p>Nenhum atributo.</p>
  </div>
);

export default EmptyTableState;
