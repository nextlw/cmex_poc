import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
import "./styles.css";
import { Notificacao, NotificationsProps } from "./types";

const Notifications: React.FC<NotificationsProps> = ({
  notifications = [],
  className,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }} className={className}>
      <FaBell onClick={() => setOpen(!open)} className="bellIcon" />
      {open && (
        <div className="notificationsMenu">
          {notifications.map((n, idx) => (
            <div key={idx} className="notificationItem">
              <div>{n.icon || <FaBell />}</div>
              <div className="notificationContent">
                <span className="notificationTitle">{n.title}</span>
                <span>{n.description}</span>
                <div className="notificationButtons">
                  <button>Cancelar</button>
                  <button>Lida</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
