import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../auth/SupabaseClient';
import { useSession } from '../auth/SessionContext';
import './login.css';

// Página de Login
const Login = () => {
  const { setSession } = useSession(); // Acessa o contexto de sessão
  const navigate = useNavigate(); // Usado para redirect pós login
  const location = useLocation(); // Guarda a rota de onde o usuário veio para redirect pós login
  const [localSession, setLocalSession] = useState<Session | null>(null); // Estado do componente de login

  useEffect(() => {
    // Adiciona a classe quando o componente é montado
    document.body.classList.add('login-page');
    
    // Remove a classe quando o componente é desmontado
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

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
      <div className="login-container">
        <div className="login-content">
          <div className="login-title-container">
            <h1 className='login-title'>
              <span>Bem-vindo</span>
              <span>ao consulta</span>
              <span className='text-primary'>inteligente de NCM</span>
            </h1>
          </div>
          <div className="login-form-container">
            <div className="login-wrapper">
              <h2 className='login-subtitle'>Login</h2>
              <Auth
                supabaseClient={supabase}
                providers={[]}
                theme='dark'
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'E-mail',
                      email_input_placeholder: 'Digite seu e-mail',
                      password_label: 'Senha',
                      password_input_placeholder: 'Digite sua senha',
                      button_label: 'Entrar',
                      link_text: 'Não tem uma conta? Cadastre-se',
                      loading_button_label: 'Entrando...',
                    }
                  }
                }}
                appearance={{ 
                  theme: ThemeSupa,
                  style: {
                    container: {
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    },
                    label: {
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-small)',
                      marginBottom: 'var(--sp-sm)'
                    },
                    input: {
                      width: '100%',
                      padding: 'var(--pd-sm)',
                      border: '1px solid var(--color-input-field-border)',
                      borderRadius: 'var(--sp-sm)',
                      backgroundColor: 'var(--color-input-background)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-base)'
                    },
                    button: {
                      width: '100%',
                      padding: 'var(--pd-sm)',
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-text-primary)',
                      border: 'none',
                      borderRadius: 'var(--sp-sm)',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default Login;