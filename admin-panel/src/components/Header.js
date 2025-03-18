import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  background-color: var(--background-color-tertiary);
  color: var(--text-color-primary);
  padding: var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color-primary);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: var(--spacing-2);
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
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.$primary
        ? "var(--color-primary-hover)"
        : "var(--color-secondary-hover)"};
  }
`;

const Header = ({ onStartAll, onStopAll }) => {
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
      </ActionsContainer>
    </HeaderContainer>
  );
};

export default Header;
