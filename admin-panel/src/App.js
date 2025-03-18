import React, { useState } from "react";
import styled from "styled-components";
import { useServiceManager } from "./services/serviceManager";
import Header from "./components/Header";
import ServiceCard from "./components/ServiceCard";
import LogModal from "./components/LogModal";
import GlobalStyles from "./styles/GlobalStyles";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color-primary);
`;

const Content = styled.main`
  flex-grow: 1;
  padding: var(--spacing-6);
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-4);
  margin-top: var(--spacing-4);
`;

const Title = styled.h2`
  color: var(--text-color-primary);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-4);
`;

const Footer = styled.footer`
  background-color: var(--background-color-tertiary);
  color: var(--text-color-tertiary);
  padding: var(--spacing-4);
  text-align: center;
  border-top: 1px solid var(--border-color-primary);
`;

function App() {
  const {
    services,
    startService,
    stopService,
    restartService,
    startAllServices,
    stopAllServices,
    clearLogs,
  } = useServiceManager();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleViewLogs = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setModalOpen(true);
    }
  };

  const handleClearLogs = (serviceId) => {
    clearLogs(serviceId);
    // Atualiza o serviço selecionado se o modal estiver aberto
    if (modalOpen && selectedService && selectedService.id === serviceId) {
      setSelectedService(services.find((s) => s.id === serviceId));
    }
  };

  return (
    <AppContainer>
      <GlobalStyles />
      <Header onStartAll={startAllServices} onStopAll={stopAllServices} />

      <Content>
        <Title>Gerenciamento de Serviços</Title>

        <ServicesGrid>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onStart={startService}
              onStop={stopService}
              onRestart={restartService}
              onViewLogs={handleViewLogs}
            />
          ))}
        </ServicesGrid>
      </Content>

      <Footer>© 2023 CMEX - Painel de Administração</Footer>

      <LogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        service={selectedService}
        onClearLogs={handleClearLogs}
      />
    </AppContainer>
  );
}

export default App;
