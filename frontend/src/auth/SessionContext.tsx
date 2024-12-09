import React, { createContext, useState, useContext, useLayoutEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../auth/SupabaseClient';

// Tipagem do contexto
interface SessionContextType {
    session: Session | null;
    setSession: (session: Session | null) => void;
}

// Criação do contexto com um valor inicial
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Função para ler o localStorage
const loadAndValidateSession = async (): Promise<Session | null> => {

    // Chave do localStorage
    const localStorageKey = `sb-onpoluundzgoigcjuthw-auth-token`

    // Verifica se existe uma sessão salva no localStorage
    const storedSession = localStorage.getItem(localStorageKey);

    // Caso encontre uma sessão, valida ela com o Supabase
    if (storedSession) {
        try {

            // Valida o token com o Supabase
            const session: Session = JSON.parse(storedSession);
            const { data, error } = await supabase.auth.getSession();

            // Caso o token não seja válido, remove do localStorage
            if (error || !data?.session || data.session.access_token !== session.access_token) {
                localStorage.removeItem(localStorageKey);
                return null;
            }

            // Retorne a sessão se o token for válido
            return session;
            
        } catch (error) {

            // Caso ocorra erro, remova o item do localStorage e retorne null
            localStorage.removeItem(localStorageKey);
            return null;
        }
    }

    return null;
};

// Cria um provider para o contexto
export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    // Inicializa as configurações do provider
    const [session, setSession] = useState<Session | null>(null);

    // Necessário para esperar a validação da sessão
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {

        // Carrega e valida a sessão
        const loadSession = async () => {
            const validSession = await loadAndValidateSession();
            setSession(validSession);
            setLoading(false);
        };

        loadSession();
    }, []);

    // Placeholder para esperar a validação da sessão
    if (loading) {
        return <div>Loading...</div>; // TODO: melhorar a UX dessa validação
    }

    // Retorna o provedor de contexto
    // Será utilizado para encapsular todo o app
    return (
        <SessionContext.Provider value={{ session, setSession }}>
            {children}
        </SessionContext.Provider>
    );
};

// Hook customizado para acessar o contexto
export const useSession = (): SessionContextType => {

    // Acessa o contexto dentro do provider
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }

    return context;
};
