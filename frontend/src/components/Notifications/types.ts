import React from "react";

export interface Notificacao {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export interface NotificationsProps {
  notifications?: Notificacao[];
  className?: string;
}
