import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';

// Tipagem do componente
interface PrivateRouteProps {
  children: ReactNode;
}

// Cria um componente que será usado para encapsular rotas protegidas
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {

  // Acessa o valor atual do contexto de sessão
  const { session } = useSession();

  // Se não há sessão, redireciona para a página de login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário estiver logado, renderiza o conteúdo da rota protegida
  return <>{children}</>;
};

export default PrivateRoute;
