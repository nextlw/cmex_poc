"use client";

import { useState, useEffect, useCallback } from "react";
import {
  checkServiceStatus,
  startService,
  stopService,
  checkAllServices,
  killAllServiceProcesses,
  type ServiceId,
} from "../actions/services";

// Interface para um serviço
export interface Service {
  id: ServiceId;
  name: string;
  description: string;
  port: number;
  icon: string;
  status: "stopped" | "running" | "loading" | "unknown";
  pid: number | null;
  logs: string[];
}

type ServiceMap = Record<ServiceId, Service>;

// Função auxiliar para obter porta do .env ou usar valor padrão
function getEnvPort(envVar: string, defaultPort: number): number {
  const portValue = process.env[envVar];
  return portValue ? parseInt(portValue, 10) : defaultPort;
}

// Configuração inicial dos serviços com portas do .env
const serviceConfig: Record<
  ServiceId,
  Omit<Service, "status" | "pid" | "logs">
> = {
  redis: {
    id: "redis",
    name: "Redis",
    description:
      "Banco de dados em memória usado para cache e armazenamento de dados",
    port: getEnvPort("REDIS_PORT", 6378),
    icon: "🔄",
  },
  fastapi: {
    id: "fastapi",
    name: "FastAPI",
    description:
      "Backend Python com FastAPI para processamento de dados e integração com IA",
    port: getEnvPort("FASTAPI_PORT", 10000),
    icon: "🐍",
  },
  node: {
    id: "node",
    name: "Node.js Backend",
    description:
      "Servidor Node.js para buscador inteligente e integração com Jina",
    port: getEnvPort("NODE_PORT", 3001),
    icon: "🟢",
  },
  frontend: {
    id: "frontend",
    name: "Frontend React",
    description: "Interface de usuário React com Vite",
    port: getEnvPort("FRONTEND_PORT", 5173),
    icon: "⚛️",
  },
  "node-jina": {
    id: "node-jina",
    name: "DeepResearch Jina",
    description: "Servidor Node.js para DeepResearch com Jina AI",
    port: getEnvPort("NODE_JINA_PORT", 3001),
    icon: "🔍",
  },
  "ui-jina": {
    id: "ui-jina",
    name: "DeepSearch UI Jina",
    description: "Interface de usuário para DeepSearch com Jina AI",
    port: getEnvPort("UI_JINA_PORT", 8080),
    icon: "🔎",
  },
};

// Hook para gerenciar serviços
export function useServiceManager() {
  const [services, setServices] = useState<ServiceMap>({
    redis: { ...serviceConfig.redis, status: "unknown", pid: null, logs: [] },
    fastapi: {
      ...serviceConfig.fastapi,
      status: "unknown",
      pid: null,
      logs: [],
    },
    node: { ...serviceConfig.node, status: "unknown", pid: null, logs: [] },
    frontend: {
      ...serviceConfig.frontend,
      status: "unknown",
      pid: null,
      logs: [],
    },
    "node-jina": {
      ...serviceConfig["node-jina"],
      status: "unknown",
      pid: null,
      logs: [],
    },
    "ui-jina": {
      ...serviceConfig["ui-jina"],
      status: "unknown",
      pid: null,
      logs: [],
    },
  });

  const addLog = useCallback((serviceId: ServiceId, message: string) => {
    setServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        logs: [
          ...prev[serviceId].logs,
          `[${new Date().toLocaleTimeString()}] ${message}`,
        ],
      },
    }));
  }, []);

  const updateServiceStatus = useCallback(
    (
      serviceId: ServiceId,
      status: Service["status"],
      pid: number | null = null
    ) => {
      setServices((prev) => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          status,
          pid: pid ?? prev[serviceId].pid,
        },
      }));
    },
    []
  );

  const checkStatus = useCallback(
    async (serviceId: ServiceId) => {
      try {
        updateServiceStatus(serviceId, "loading");
        addLog(serviceId, "Verificando status...");

        const result = await checkServiceStatus(serviceId);

        updateServiceStatus(
          serviceId,
          result.running ? "running" : "stopped",
          result.pid
        );

        addLog(
          serviceId,
          `Status: ${result.running ? "Em execução" : "Parado"}${
            result.pid ? ` (PID: ${result.pid})` : ""
          }`
        );

        return result;
      } catch (error) {
        console.error(
          `Erro ao verificar status do serviço ${serviceId}:`,
          error
        );
        updateServiceStatus(serviceId, "unknown");
        addLog(
          serviceId,
          `Erro ao verificar status: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return { running: false, pid: null };
      }
    },
    [addLog, updateServiceStatus]
  );

  const start = useCallback(
    async (serviceId: ServiceId) => {
      try {
        updateServiceStatus(serviceId, "loading");
        addLog(serviceId, "Iniciando serviço...");

        const result = await startService(serviceId);

        if (result.success) {
          updateServiceStatus(serviceId, "running", result.pid);
          addLog(
            serviceId,
            `Serviço iniciado com sucesso${
              result.pid ? ` (PID: ${result.pid})` : ""
            }`
          );
        } else {
          updateServiceStatus(serviceId, "stopped");
          addLog(
            serviceId,
            `Falha ao iniciar serviço: ${
              result.message || "Motivo desconhecido"
            }`
          );
        }

        return result;
      } catch (error) {
        console.error(`Erro ao iniciar serviço ${serviceId}:`, error);
        updateServiceStatus(serviceId, "stopped");
        addLog(
          serviceId,
          `Erro ao iniciar: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return { success: false, message: String(error), pid: null };
      }
    },
    [addLog, updateServiceStatus]
  );

  const stop = useCallback(
    async (serviceId: ServiceId) => {
      try {
        updateServiceStatus(serviceId, "loading");
        addLog(serviceId, "Parando serviço...");

        const result = await stopService(serviceId);

        if (result.success) {
          updateServiceStatus(serviceId, "stopped", null);
          addLog(serviceId, "Serviço parado com sucesso");
        } else {
          // Verificar o status atual
          const statusCheck = await checkStatus(serviceId);
          addLog(
            serviceId,
            `Falha ao parar serviço: ${result.message || "Motivo desconhecido"}`
          );
        }

        return result;
      } catch (error) {
        console.error(`Erro ao parar serviço ${serviceId}:`, error);
        // Verificar status atual após erro
        await checkStatus(serviceId);
        addLog(
          serviceId,
          `Erro ao parar: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return { success: false, message: String(error) };
      }
    },
    [addLog, updateServiceStatus, checkStatus]
  );

  const restart = useCallback(
    async (serviceId: ServiceId) => {
      addLog(serviceId, "Reiniciando serviço...");
      await stop(serviceId);
      // Pequena pausa para garantir que o serviço parou completamente
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return await start(serviceId);
    },
    [stop, start, addLog]
  );

  const checkAllStatus = useCallback(async () => {
    try {
      const allStatuses = await checkAllServices();

      Object.entries(allStatuses).forEach(([id, status]) => {
        const serviceId = id as ServiceId;
        updateServiceStatus(
          serviceId,
          status.running ? "running" : "stopped",
          status.pid
        );
        addLog(
          serviceId,
          `Status: ${status.running ? "Em execução" : "Parado"}${
            status.pid ? ` (PID: ${status.pid})` : ""
          }`
        );
      });

      return allStatuses;
    } catch (error) {
      console.error("Erro ao verificar status de todos os serviços:", error);
      return {};
    }
  }, [addLog, updateServiceStatus]);

  const startAll = useCallback(async () => {
    for (const serviceId of Object.keys(services) as ServiceId[]) {
      await start(serviceId);
      // Pequena pausa entre o início de cada serviço para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }, [services, start]);

  const stopAll = useCallback(async () => {
    // Primeiro para os serviços na ordem de dependência
    // Frontend → Node → Node-Jina → UI-Jina → FastAPI → Redis

    // Primeiro parar as interfaces de usuário
    await stop("frontend");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Depois parar o UI-Jina se estiver em execução
    await stop("ui-jina");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Depois parar os backends Node
    await stop("node");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Depois parar o Node-Jina
    await stop("node-jina");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Por fim, parar os serviços de infraestrutura
    await stop("fastapi");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await stop("redis");

    // Verificar se realmente todos pararam
    await checkAllStatus();
  }, [stop, checkAllStatus]);

  // Função específica para lidar com serviços Jina
  const toggleJinaServices = useCallback(
    async (action: "start" | "stop") => {
      if (action === "start") {
        // Inicia os serviços Jina na ordem correta
        await start("node-jina");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await start("ui-jina");
      } else {
        // Para os serviços Jina na ordem inversa
        await stop("ui-jina");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await stop("node-jina");
      }

      await checkAllStatus();
    },
    [start, stop, checkAllStatus]
  );

  // Encerrar todos os processos em todas as portas utilizadas
  const cleanupAllPorts = useCallback(async () => {
    try {
      for (const service of Object.values(services)) {
        addLog(service.id, "Limpando todas as portas...");
      }

      const results = await killAllServiceProcesses();

      Object.entries(results).forEach(([id, killed]) => {
        const serviceId = id as ServiceId;
        const service = services[serviceId];
        if (killed && service) {
          const portMsg =
            service.id === "ui-jina"
              ? `(porta real detectada ou configurada: ${service.port})`
              : `(porta: ${service.port})`;

          addLog(serviceId, `Processos anteriores encerrados ${portMsg}`);
          updateServiceStatus(serviceId, "stopped", null);
        }
      });

      await checkAllStatus();

      return true;
    } catch (error) {
      console.error("Erro ao limpar portas:", error);
      return false;
    }
  }, [services, addLog, updateServiceStatus, checkAllStatus]);

  // Verificar status inicial e limpar portas na inicialização
  useEffect(() => {
    let isMounted = true;
    let lastStatus: Record<ServiceId, boolean> = {
      redis: false,
      fastapi: false,
      node: false,
      frontend: false,
      "node-jina": false,
      "ui-jina": false,
    };

    // Função de inicialização executada apenas uma vez - somente verificar status, sem limpar portas
    const init = async () => {
      if (isMounted) {
        console.log("Verificando status inicial dos serviços...");
        const initialStatus = await checkAllStatus();

        // Inicializa o lastStatus com o status atual
        Object.entries(initialStatus).forEach(([id, status]) => {
          if (status && typeof status === "object" && "running" in status) {
            const serviceId = id as ServiceId;
            lastStatus[serviceId] = Boolean(status.running);
          }
        });
      }
    };

    init();

    // Verificar periodicamente o status dos serviços
    const interval = setInterval(async () => {
      if (isMounted) {
        const currentStatus = await checkAllStatus();

        // Só atualiza o status se houver mudança
        Object.entries(currentStatus).forEach(([id, status]) => {
          if (status && typeof status === "object" && "running" in status) {
            const serviceId = id as ServiceId;
            const isRunning = Boolean(status.running);
            if (lastStatus[serviceId] !== isRunning) {
              lastStatus[serviceId] = isRunning;
              const pid =
                status && typeof status === "object" && "pid" in status
                  ? status.pid
                  : null;
              addLog(
                serviceId,
                `Status alterado: ${isRunning ? "Em execução" : "Parado"}${
                  pid ? ` (PID: ${pid})` : ""
                }`
              );
            }
          }
        });
      }
    }, 10000);

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [checkAllStatus, addLog]); // Adicionamos as dependências necessárias

  return {
    services: Object.values(services),
    checkStatus,
    start,
    stop,
    restart,
    checkAllStatus,
    startAll,
    stopAll,
    toggleJinaServices,
    cleanupAllPorts, // Mantemos esta função disponível para uso manual via botão
  };
}
