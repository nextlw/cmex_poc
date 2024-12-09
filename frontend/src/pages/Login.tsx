import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../auth/SupabaseClient';
import { useSession } from '../auth/SessionContext';

// Página de Login (temporário)
const Login = () => {

  const { session, setSession } = useSession(); // Acessa o contexto de sessão
  const navigate = useNavigate(); // Usado para redirect pós login
  const location = useLocation(); // Guarda a rota de onde o usuário veio para redirect pós login
  const [localSession, setLocalSession] = useState<Session | null>(null); // Estado do componente de login

  useEffect(() => {

    // Atualiza a sessão no contexto
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLocalSession(session);
      setSession(session);
    });

    // Atualiza a sessão no contexto
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLocalSession(session);
      setSession(session);
    });

    // Limpa a inscrição quando o componente é desmontado
    return () => subscription.unsubscribe();
  }, [setSession]);

  // Após o login bem-sucedido, redireciona para a rota de origem
  useEffect(() => {
    if (localSession) {

      // Se a rota de origem não existir, vai para a home
      const redirectTo = (location.state as any)?.from || '/';

      // Redireciona para a página de origem
      navigate(redirectTo);
    }
  }, [localSession, location.state, navigate]);

  // Renderiza o componente de login se não estiver logado
  if (!localSession) {
    return (
      <Auth
        supabaseClient={supabase}
        providers={[]}
        theme='dark'
        appearance={{ theme: ThemeSupa }}
      />
    );
  }

}

export default Login