// Gerenciador de serviços para o painel admin
import { useState, useEffect } from "react";

// Configuração dos serviços disponíveis
const serviceConfig = {
  redis: {
    id: "redis",
    name: "Redis",
    description:
      "Serviço de armazenamento em memória para comunicação entre microserviços",
    command: "redis-server",
    port: 6379,
    icon: "📊",
  },
  fastapi: {
    id: "fastapi",
    name: "FastAPI Backend",
    description:
      "API principal do CMEX, responsável pelas validações de NCMs e consultas",
    command: "cd ../fastapi && uvicorn app.main:app --reload",
    port: 8000,
    icon: "🚀",
  },
  node: {
    id: "node",
    name: "Node.js Backend",
    description: "Serviço de busca inteligente para análise de produtos e NCMs",
    command: "cd ../buscador_inteligente && npm start",
    port: 3000,
    icon: "🔍",
  },
  frontend: {
    id: "frontend",
    name: "Frontend React",
    description:
      "Interface web do CMEX para consulta de produtos e validação de NCMs",
    command: "cd ../frontend && npm start",
    port: 3001,
    icon: "💻",
  },
};

// Função para simular execução de comandos (em um ambiente real, usaria Node.js child_process)
const simulateCommand = async (command, serviceId) => {
  console.log(`Executando comando: ${command} para o serviço ${serviceId}`);

  // Em um ambiente real, este código usaria:
  // const { exec } = require('child_process');
  // return new Promise((resolve, reject) => {
  //   const process = exec(command);
  //   // Capturar logs, PID, etc
  // });

  // Simulação para propósito de demonstração
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        pid: Math.floor(Math.random() * 10000) + 1000,
        success: Math.random() > 0.1, // 90% de chance de sucesso
      });
    }, 1500);
  });
};

// Hook personalizado para gerenciar serviços
export const useServiceManager = () => {
  const [services, setServices] = useState(() => {
    // Inicializar serviços a partir da configuração
    return Object.values(serviceConfig).map((service) => ({
      ...service,
      status: "stopped",
      pid: null,
      logs: [],
    }));
  });

  // Verificar status de serviços na inicialização
  useEffect(() => {
    const checkRunningServices = async () => {
      // Em um ambiente real, verificaria se os processos estão rodando
      // Aqui apenas simulamos para demonstração

      // Simular verificação de processos
      const updatedServices = [...services];

      // Registrar alguns logs simulados
      updatedServices.forEach((service) => {
        service.logs = [
          `[${new Date().toISOString()}] Verificando status do serviço ${
            service.name
          }...`,
        ];
      });

      setServices(updatedServices);
    };

    checkRunningServices();
  }, []);

  // Adicionar log a um serviço
  const addLog = (serviceId, logMessage) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              logs: [
                ...service.logs,
                `[${new Date().toISOString()}] ${logMessage}`,
              ],
            }
          : service
      )
    );
  };

  // Iniciar um serviço
  const startService = async (serviceId) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId ? { ...service, status: "loading" } : service
      )
    );

    const service = services.find((s) => s.id === serviceId);
    if (!service) return false;

    addLog(serviceId, `Iniciando ${service.name}...`);

    try {
      const result = await simulateCommand(service.command, serviceId);

      if (result.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId
              ? {
                  ...s,
                  status: "running",
                  pid: result.pid,
                }
              : s
          )
        );

        addLog(serviceId, `Serviço iniciado com sucesso. PID: ${result.pid}`);
        return true;
      } else {
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId ? { ...s, status: "stopped" } : s
          )
        );

        addLog(serviceId, `Falha ao iniciar o serviço.`);
        return false;
      }
    } catch (error) {
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, status: "stopped" } : s))
      );

      addLog(
        serviceId,
        `Erro ao iniciar serviço: ${error.message || "Erro desconhecido"}`
      );
      return false;
    }
  };

  // Parar um serviço
  const stopService = async (serviceId) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId ? { ...service, status: "loading" } : service
      )
    );

    const service = services.find((s) => s.id === serviceId);
    if (!service) return false;

    addLog(serviceId, `Parando ${service.name}...`);

    try {
      // Em um cenário real, usaríamos um comando para matar o processo pelo PID
      // Ex: await simulateCommand(`kill ${service.pid}`, serviceId);

      // Simulação para demonstração
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                status: "stopped",
                pid: null,
              }
            : s
        )
      );

      addLog(serviceId, `Serviço parado com sucesso.`);
      return true;
    } catch (error) {
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, status: "running" } : s))
      );

      addLog(
        serviceId,
        `Erro ao parar serviço: ${error.message || "Erro desconhecido"}`
      );
      return false;
    }
  };

  // Reiniciar um serviço
  const restartService = async (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return false;

    addLog(serviceId, `Reiniciando ${service.name}...`);

    await stopService(serviceId);
    return await startService(serviceId);
  };

  // Iniciar todos os serviços
  const startAllServices = async () => {
    for (const service of services) {
      await startService(service.id);
    }
  };

  // Parar todos os serviços
  const stopAllServices = async () => {
    for (const service of services) {
      if (service.status === "running") {
        await stopService(service.id);
      }
    }
  };

  // Limpar logs de um serviço
  const clearLogs = (serviceId) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId ? { ...service, logs: [] } : service
      )
    );
  };

  return {
    services,
    startService,
    stopService,
    restartService,
    startAllServices,
    stopAllServices,
    clearLogs,
  };
};
