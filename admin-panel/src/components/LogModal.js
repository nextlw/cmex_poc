import React, { useRef, useEffect } from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: var(--background-color-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color-primary);
  width: 80%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: modalFadeIn 0.2s ease-out;

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  padding: var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color-primary);
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

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-color-secondary);
  font-size: var(--font-size-xl);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1);

  &:hover {
    color: var(--text-color-primary);
  }
`;

const LogContent = styled.div`
  padding: var(--spacing-4);
  overflow-y: auto;
  flex-grow: 1;
  background-color: var(--background-color-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
  white-space: pre-wrap;
  line-height: 1.5;
`;

const ModalFooter = styled.div`
  padding: var(--spacing-3) var(--spacing-4);
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border-color-primary);
`;

const Button = styled.button`
  background-color: ${(props) =>
    props.$primary ? "var(--color-primary)" : "var(--color-secondary)"};
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.$primary
        ? "var(--color-primary-hover)"
        : "var(--color-secondary-hover)"};
  }
`;

const LogModal = ({ isOpen, onClose, service, onClearLogs }) => {
  const logContentRef = useRef(null);

  useEffect(() => {
    if (isOpen && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [isOpen, service?.logs]);

  if (!isOpen || !service) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>
            <span>{service.icon}</span>
            Logs - {service.name}
          </Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <LogContent ref={logContentRef}>
          {service.logs && service.logs.length > 0 ? (
            service.logs.map((log, index) => <div key={index}>{log}</div>)
          ) : (
            <div>Nenhum log disponível.</div>
          )}
        </LogContent>
        <ModalFooter>
          <Button onClick={() => onClearLogs(service.id)}>Limpar logs</Button>
          <Button $primary onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default LogModal;
