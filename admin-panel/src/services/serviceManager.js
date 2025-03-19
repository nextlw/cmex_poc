// Gerenciador de serviços para o painel admin
import { useState, useEffect } from "react";
import { exec, spawn } from "child_process";

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
    command: "cd ../fastapi && uvicorn main:app --reload --port 10000",
    port: 10000,
    icon: "🚀",
  },
  node: {
    id: "node",
    name: "Node.js Backend",
    description: "Serviço de busca inteligente para análise de produtos e NCMs",
    command: "cd ../buscador_inteligente && pnpm run server",
    port: 3000,
    icon: "🔍",
  },
  frontend: {
    id: "frontend",
    name: "Frontend React",
    description:
      "Interface web do CMEX para consulta de produtos e validação de NCMs",
    command: "cd ../frontend && pnpm dev",
    port: 5173,
    icon: "💻",
  },
};

// Objeto para guardar os processos em execução
const runningProcesses = {};

// Função para executar comandos
const executeCommand = async (command, serviceId) => {
  console.log(`Executando comando: ${command} para o serviço ${serviceId}`);

  return new Promise((resolve, reject) => {
    // Para comandos que precisam ser executados em um shell
    const process = exec(command, { shell: "/bin/zsh" });

    // Guarda referência ao processo
    runningProcesses[serviceId] = process;

    let stdoutBuffer = [];
    let stderrBuffer = [];

    // Captura saída padrão
    process.stdout.on("data", (data) => {
      console.log(`[${serviceId}] stdout: ${data}`);
      stdoutBuffer.push(data.toString());
    });

    // Captura erros
    process.stderr.on("data", (data) => {
      console.error(`[${serviceId}] stderr: ${data}`);
      stderrBuffer.push(data.toString());
    });

    // Captura o término do processo
    process.on("close", (code) => {
      console.log(`[${serviceId}] Processo encerrado com código: ${code}`);
      delete runningProcesses[serviceId];

      if (code === 0) {
        resolve({
          pid: process.pid,
          success: true,
          logs: [...stdoutBuffer, ...stderrBuffer],
        });
      } else {
        reject(new Error(`Processo encerrado com código: ${code}`));
      }
    });

    // Captura erros no processo
    process.on("error", (err) => {
      console.error(`[${serviceId}] Erro no processo: ${err.message}`);
      delete runningProcesses[serviceId];
      reject(err);
    });

    // Resolve imediatamente com o PID para não bloquear a interface
    resolve({
      pid: process.pid,
      success: true,
      logs: [],
    });
  });
};

// Função para matar um processo
const killProcess = async (pid) => {
  return new Promise((resolve, reject) => {
    exec(`kill ${pid}`, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(true);
    });
  });
};

// Verificar se um serviço está rodando através da sua porta
const checkServiceRunning = async (port) => {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} | grep LISTEN`, (error, stdout) => {
      if (error || !stdout) {
        resolve(false);
        return;
      }
      resolve(true);
    });
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
      // Verificação real dos serviços
      const updatedServices = [...services];

      // Verificar cada serviço pela porta
      for (const service of updatedServices) {
        const isRunning = await checkServiceRunning(service.port);

        service.status = isRunning ? "running" : "stopped";
        service.logs = [
          `[${new Date().toISOString()}] Verificando status do serviço ${
            service.name
          }...`,
        ];

        if (isRunning) {
          // Tenta obter o PID
          try {
            const pidOutput = await new Promise((resolve) => {
              exec(
                `lsof -i :${service.port} | grep LISTEN | awk '{print $2}'`,
                (error, stdout) => {
                  resolve(error ? null : stdout.trim());
                }
              );
            });

            if (pidOutput) {
              service.pid = parseInt(pidOutput, 10);
              service.logs.push(
                `[${new Date().toISOString()}] Serviço encontrado rodando com PID: ${
                  service.pid
                }`
              );
            }
          } catch (error) {
            console.error(`Erro ao obter PID para ${service.name}:`, error);
          }
        }
      }

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
      // Verifique se o serviço já está rodando
      const isAlreadyRunning = await checkServiceRunning(service.port);

      if (isAlreadyRunning) {
        addLog(serviceId, `Serviço já está rodando na porta ${service.port}`);

        // Obter o PID
        const pidOutput = await new Promise((resolve) => {
          exec(
            `lsof -i :${service.port} | grep LISTEN | awk '{print $2}'`,
            (error, stdout) => {
              resolve(error ? null : stdout.trim());
            }
          );
        });

        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId
              ? {
                  ...s,
                  status: "running",
                  pid: pidOutput ? parseInt(pidOutput, 10) : null,
                }
              : s
          )
        );

        return true;
      }

      // Execute o comando real
      const result = await executeCommand(service.command, serviceId);

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

      // Adicione logs recebidos
      if (result.logs && result.logs.length > 0) {
        result.logs.forEach((log) => addLog(serviceId, log));
      }

      addLog(serviceId, `Serviço iniciado com sucesso. PID: ${result.pid}`);
      return true;
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
      // Se temos o processo em nossa lista
      if (runningProcesses[serviceId]) {
        runningProcesses[serviceId].kill();
        delete runningProcesses[serviceId];
      }
      // Se temos o PID
      else if (service.pid) {
        await killProcess(service.pid);
      }
      // Caso contrário, tente encontrar o processo pela porta
      else {
        const pidOutput = await new Promise((resolve) => {
          exec(
            `lsof -i :${service.port} | grep LISTEN | awk '{print $2}'`,
            (error, stdout) => {
              resolve(error ? null : stdout.trim());
            }
          );
        });

        if (pidOutput) {
          await killProcess(parseInt(pidOutput, 10));
        }
      }

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
      // Verifique se o serviço ainda está rodando
      const isStillRunning = await checkServiceRunning(service.port);

      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, status: isStillRunning ? "running" : "stopped" }
            : s
        )
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
