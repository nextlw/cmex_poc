import React from "react";
import { AvatarProps } from "./types";
import "./styles.css";

function getDailyColor() {
  // ...função simples para gerar cor aleatória baseada no dia...
  const colors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];
  const index = new Date().getDate() % colors.length;
  return colors[index];
}

function getInitials(name: string) {
  // ...extrair as primeiras letras...
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return name[0] || "";
}

const Avatar: React.FC<AvatarProps> = ({ name, src }) => {
  const color = React.useMemo(() => getDailyColor(), []);

  return (
    <div
      className="avatar"
      style={{ backgroundColor: src ? "transparent" : color }}
    >
      {src ? (
        <img className="avatar-image" src={src} alt={name} />
      ) : (
        <span className="avatar-initials">{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;
