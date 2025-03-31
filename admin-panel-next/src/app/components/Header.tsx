"use client";

import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  background-color: #1e1e1e;
  color: #f2f2f2;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  background-color: ${(props) => (props.$primary ? "#4285f4" : "#626262")};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => (props.$primary ? "#5294ff" : "#6e6e6e")};
  }
`;

interface HeaderProps {
  onStartAll: () => void;
  onStopAll: () => void;
  onCheckStatus: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onStartAll,
  onStopAll,
  onCheckStatus,
}) => {
  return (
    <HeaderContainer>
      <Title>
        <span>🚀</span>
        CMEX Admin Panel
      </Title>
      <ActionsContainer>
        <Button $primary onClick={onStartAll}>
          Iniciar Todos
        </Button>
        <Button onClick={onStopAll}>Parar Todos</Button>
        <Button onClick={onCheckStatus}>Verificar Status</Button>
      </ActionsContainer>
    </HeaderContainer>
  );
};

export default Header;
