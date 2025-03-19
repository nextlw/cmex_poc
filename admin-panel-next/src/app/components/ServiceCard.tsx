"use client";

import React from "react";
import styled from "styled-components";
import { ServiceId } from "../actions/services";

const Card = styled.div`
  background-color: #1e1e1e;
  border-radius: 0.5rem;
  border: 1px solid #333;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f2f2f2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Status = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${(props) =>
    props.$status === "running"
      ? "rgba(52, 168, 83, 0.2)"
      : props.$status === "stopped"
      ? "rgba(234, 67, 53, 0.2)"
      : "rgba(251, 188, 5, 0.2)"};
  color: ${(props) =>
    props.$status === "running"
      ? "#34a853"
      : props.$status === "stopped"
      ? "#ea4335"
      : "#fbbc05"};
`;

const Description = styled.p`
  margin: 0;
  color: #b8b8b8;
  font-size: 0.875rem;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
`;

const InfoLabel = styled.span`
  color: #7d7d7d;
`;

const InfoValue = styled.span`
  color: #b8b8b8;
  font-family: monospace;
`;

const LogContainer = styled.div`
  background-color: #121212;
  border-radius: 0.25rem;
  border: 1px solid #444;
  padding: 0.5rem;
  max-height: 120px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.75rem;
  color: #b8b8b8;
  white-space: pre-wrap;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Button = styled.button<{
  $primary?: boolean;
  $danger?: boolean;
  $success?: boolean;
}>`
  background-color: ${(props) => {
    if (props.$primary) return "#4285f4";
    if (props.$danger) return "#ea4335";
    if (props.$success) return "#34a853";
    return "#626262";
  }};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => {
      if (props.$primary) return "#5294ff";
      if (props.$danger) return "#ff4f41";
      if (props.$success) return "#3ebe5f";
      return "#6e6e6e";
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface Service {
  id: ServiceId;
  name: string;
  description: string;
  status: "stopped" | "running" | "loading" | "unknown";
  port: number;
  pid: number | null;
  logs: string[];
  icon: string;
}

interface ServiceCardProps {
  service: Service;
  onStart: (id: ServiceId) => void;
  onStop: (id: ServiceId) => void;
  onRestart: (id: ServiceId) => void;
  onViewLogs: (id: ServiceId) => void;
  onCleanupPort?: (id: ServiceId) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onStart,
  onStop,
  onRestart,
  onViewLogs,
  onCleanupPort,
}) => {
  const { id, name, description, status, port, pid, logs, icon } = service;

  const isRunning = status === "running";
  const isLoading = status === "loading";

  return (
    <Card>
      <Header>
        <Title>
          <span>{icon}</span>
          {name}
        </Title>
        <Status $status={status}>
          {status === "running"
            ? "Em execução"
            : status === "stopped"
            ? "Parado"
            : status === "loading"
            ? "Carregando..."
            : "Desconhecido"}
        </Status>
      </Header>

      <Description>{description}</Description>

      <Info>
        <InfoItem>
          <InfoLabel>Porta:</InfoLabel>
          <InfoValue>{port || "N/A"}</InfoValue>
        </InfoItem>
        {pid && (
          <InfoItem>
            <InfoLabel>PID:</InfoLabel>
            <InfoValue>{pid}</InfoValue>
          </InfoItem>
        )}
      </Info>

      {logs && logs.length > 0 && (
        <LogContainer>
          {logs.slice(-5).map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </LogContainer>
      )}

      <Controls>
        {isRunning ? (
          <>
            <Button $danger onClick={() => onStop(id)} disabled={isLoading}>
              Parar
            </Button>
            <Button onClick={() => onRestart(id)} disabled={isLoading}>
              Reiniciar
            </Button>
          </>
        ) : (
          <>
            <Button $success onClick={() => onStart(id)} disabled={isLoading}>
              Iniciar
            </Button>
            {onCleanupPort && (
              <Button onClick={() => onCleanupPort(id)} disabled={isLoading}>
                Limpar Porta
              </Button>
            )}
          </>
        )}
        <Button $primary onClick={() => onViewLogs(id)}>
          Logs completos
        </Button>
      </Controls>
    </Card>
  );
};

export default ServiceCard;
