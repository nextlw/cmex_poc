"use client";

import React, { useState, useEffect } from "react";
import { useServiceManager } from "./hooks/useServiceManager";
import styled, { ThemeProvider } from "styled-components";
import ServiceCard from "./components/ServiceCard";
import Header from "./components/Header";
import { ServiceId } from "./actions/services";

const theme = {
  colors: {
    background: "#121212",
    card: "#1e1e1e",
    text: "#f2f2f2",
    textSecondary: "#b8b8b8",
    primary: "#4285f4",
    success: "#34a853",
    danger: "#ea4335",
    warning: "#fbbc05",
  },
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: ${(props) => props.theme.colors.text};
`;

const StatusBar = styled.div`
  background-color: rgba(0, 0, 0, 0.3);
  color: ${(props) => props.theme.colors.textSecondary};
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const LogsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  padding: 2rem;
  z-index: 100;
`;

const LogsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const LogsTitle = styled.h2`
  color: ${(props) => props.theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.text};
  font-size: 1.5rem;
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.colors.primary};
  }
`;

const LogsContent = styled.div`
  background-color: #0a0a0a;
  border-radius: 0.5rem;
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
  white-space: pre-wrap;
`;

const ButtonBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ $primary?: boolean; $warning?: boolean }>`
  background-color: ${(props) =>
    props.$warning ? "#fbbc05" : props.$primary ? "#4285f4" : "#626262"};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.$warning ? "#ffc82c" : props.$primary ? "#5294ff" : "#6e6e6e"};
  }
`;

export default function AdminPanel() {
  const {
    services,
    start,
    stop,
    restart,
    checkStatus,
    startAll,
    stopAll,
    checkAllStatus,
    cleanupAllPorts,
    toggleJinaServices,
  } = useServiceManager();

  const [selectedServiceLogs, setSelectedServiceLogs] =
    useState<ServiceId | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [isCleaningPorts, setIsCleaningPorts] = useState<boolean>(false);
  const [statusBarText, setStatusBarText] = useState<string>("");

  const handleViewLogs = (serviceId: ServiceId) => {
    setSelectedServiceLogs(serviceId);
  };

  const handleCloseLogs = () => {
    setSelectedServiceLogs(null);
  };

  const handleCheckStatus = async () => {
    await checkAllStatus();
    setLastChecked(new Date().toLocaleTimeString());
  };

  const handleCleanupAllPorts = async () => {
    setIsCleaningPorts(true);
    await cleanupAllPorts();
    await checkAllStatus();
    setIsCleaningPorts(false);
  };

  const handleCleanupPort = async (serviceId: ServiceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    await stop(serviceId);
    await cleanupAllPorts();
    await checkStatus(serviceId);
  };

  useEffect(() => {
    setStatusBarText(
      "Portas utilizadas: Redis (6378), FastAPI (10000), Node (3001), Frontend (5173), Node-Jina (3001), UI-Jina (8080)"
    );
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  const selectedService = selectedServiceLogs
    ? services.find((service) => service.id === selectedServiceLogs)
    : null;

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Header
          onStartAll={startAll}
          onStopAll={stopAll}
          onCheckStatus={handleCheckStatus}
        />

        <StatusBar>
          {statusBarText} | Última verificação: {lastChecked}
        </StatusBar>

        <ButtonBar>
          <Button
            $warning
            onClick={handleCleanupAllPorts}
            disabled={isCleaningPorts}
          >
            {isCleaningPorts
              ? "Limpando portas..."
              : "Limpar todas as portas manualmente"}
          </Button>

          <Button $primary onClick={() => toggleJinaServices("start")}>
            Iniciar DeepSearch Jina
          </Button>

          <Button onClick={() => toggleJinaServices("stop")}>
            Parar DeepSearch Jina
          </Button>
        </ButtonBar>

        <ServicesGrid>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onStart={start}
              onStop={stop}
              onRestart={restart}
              onViewLogs={handleViewLogs}
              onCleanupPort={handleCleanupPort}
            />
          ))}
        </ServicesGrid>

        {selectedService && (
          <LogsModal>
            <LogsHeader>
              <LogsTitle>
                {selectedService.icon} Logs: {selectedService.name}
              </LogsTitle>
              <CloseButton onClick={handleCloseLogs}>×</CloseButton>
            </LogsHeader>
            <LogsContent>
              {selectedService.logs.length > 0 ? (
                selectedService.logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              ) : (
                <div>Nenhum log disponível</div>
              )}
            </LogsContent>
          </LogsModal>
        )}
      </Container>
    </ThemeProvider>
  );
}
