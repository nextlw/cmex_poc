import React from "react";
import styled from "styled-components";

const Card = styled.div`
  background-color: var(--background-color-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color-primary);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
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
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-color-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const Status = styled.span`
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  background-color: ${(props) =>
    props.$status === "running"
      ? "var(--color-success-bg)"
      : props.$status === "stopped"
      ? "var(--color-error-bg)"
      : "var(--color-warning-bg)"};
  color: ${(props) =>
    props.$status === "running"
      ? "var(--color-success)"
      : props.$status === "stopped"
      ? "var(--color-error)"
      : "var(--color-warning)"};
`;

const Description = styled.p`
  margin: 0;
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
`;

const InfoLabel = styled.span`
  color: var(--text-color-tertiary);
`;

const InfoValue = styled.span`
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
`;

const LogContainer = styled.div`
  background-color: var(--background-color-primary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color-secondary);
  padding: var(--spacing-2);
  max-height: 120px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
  white-space: pre-wrap;
`;

const Controls = styled.div`
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
`;

const Button = styled.button`
  background-color: ${(props) => {
    if (props.$primary) return "var(--color-primary)";
    if (props.$danger) return "var(--color-error)";
    if (props.$success) return "var(--color-success)";
    return "var(--color-secondary)";
  }};
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => {
      if (props.$primary) return "var(--color-primary-hover)";
      if (props.$danger) return "var(--color-error-hover)";
      if (props.$success) return "var(--color-success-hover)";
      return "var(--color-secondary-hover)";
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ServiceCard = ({ service, onStart, onStop, onRestart, onViewLogs }) => {
  const { id, name, description, status, port, pid, logs, icon } = service;

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
            : "Carregando..."}
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
        {status === "running" ? (
          <>
            <Button
              $danger
              onClick={() => onStop(id)}
              disabled={status === "loading"}
            >
              Parar
            </Button>
            <Button
              onClick={() => onRestart(id)}
              disabled={status === "loading"}
            >
              Reiniciar
            </Button>
          </>
        ) : (
          <Button
            $success
            onClick={() => onStart(id)}
            disabled={status === "loading"}
          >
            Iniciar
          </Button>
        )}
        <Button $primary onClick={() => onViewLogs(id)}>
          Logs completos
        </Button>
      </Controls>
    </Card>
  );
};

export default ServiceCard;
