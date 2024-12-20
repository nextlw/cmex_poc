import React, { useState, useEffect } from "react";
import { ICMSTableProps } from "../../types/search";

interface ICMSVerificationConfig {
  enabled: boolean;
  apiUrl?: string;
  updateInterval?: number; // em minutos
}

interface ICMSRate {
  state: string;
  rate: string;
  lastUpdate?: Date;
  isVerified?: boolean;
}

const DEFAULT_CONFIG: ICMSVerificationConfig = {
  enabled: false,
  updateInterval: 60, // 1 hora
};

const ICMSTable: React.FC<
  ICMSTableProps & {
    verificationConfig?: ICMSVerificationConfig;
    ncm?: string;
  }
> = ({
  icmsRates,
  maxHeight = "300px",
  verificationConfig = DEFAULT_CONFIG,
  ncm,
}) => {
  const [verifiedRates, setVerifiedRates] = useState<Record<string, ICMSRate>>(
    {}
  );
  const [isVerifying, setIsVerifying] = useState(false);

  // Função para verificar as alíquotas atuais
  const verifyICMSRates = async (state: string, rate: string) => {
    if (!verificationConfig.enabled || !verificationConfig.apiUrl) return rate;

    try {
      setIsVerifying(true);
      // Aqui você implementará a chamada real à API
      const response = await fetch(
        `${verificationConfig.apiUrl}/${state}/${ncm}`
      );
      const data = await response.json();

      setVerifiedRates((prev) => ({
        ...prev,
        [state]: {
          state,
          rate: data.rate || rate,
          lastUpdate: new Date(),
          isVerified: true,
        },
      }));

      return data.rate || rate;
    } catch (error) {
      console.warn(`Não foi possível verificar ICMS para ${state}:`, error);
      return rate;
    } finally {
      setIsVerifying(false);
    }
  };

  // Efeito para verificar as alíquotas quando configurado
  useEffect(() => {
    if (verificationConfig.enabled && ncm) {
      Object.entries(icmsRates).forEach(([state, rate]) => {
        const lastVerification = verifiedRates[state]?.lastUpdate;
        const shouldVerify =
          !lastVerification ||
          new Date().getTime() - lastVerification.getTime() >
            (verificationConfig.updateInterval || 60) * 60000;

        if (shouldVerify) {
          verifyICMSRates(state, rate);
        }
      });
    }
  }, [icmsRates, ncm, verificationConfig.enabled]);

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-gray-400">ICMS por Estado</h4>
        {verificationConfig.enabled && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              Verificação {isVerifying ? "em andamento" : "ativa"}
            </span>
            {isVerifying && (
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
        )}
      </div>

      <div style={{ maxHeight }} className="overflow-y-auto">
        <table className="w-full">
          <thead className="text-gray-400 text-sm sticky top-0 bg-gray-700/50 z-10">
            <tr>
              <th className="text-left pb-2">Estado</th>
              <th className="text-right pb-2">Alíquota</th>
              {verificationConfig.enabled && (
                <th className="text-right pb-2 w-24">Status</th>
              )}
            </tr>
          </thead>
          <tbody className="text-white text-sm">
            {Object.entries(icmsRates).map(([state, rate]) => {
              const verifiedInfo = verifiedRates[state];
              const isOutdated =
                verifiedInfo?.lastUpdate &&
                new Date().getTime() - verifiedInfo.lastUpdate.getTime() >
                  (verificationConfig.updateInterval || 60) * 60000;

              return (
                <tr key={state} className="border-t border-gray-600/50">
                  <td className="py-1.5">{state}</td>
                  <td className="text-right">{verifiedInfo?.rate || rate}</td>
                  {verificationConfig.enabled && (
                    <td className="text-right">
                      {verifiedInfo?.isVerified && (
                        <span
                          className={`text-xs ${
                            isOutdated ? "text-yellow-400" : "text-green-400"
                          }`}
                        >
                          {isOutdated ? "⚠️" : "✓"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      {verificationConfig.enabled && (
        <div className="mt-4 text-xs text-gray-400 flex items-center space-x-4">
          <span className="flex items-center">
            <span className="text-green-400 mr-1">✓</span> Verificado
          </span>
          <span className="flex items-center">
            <span className="text-yellow-400 mr-1">⚠️</span> Desatualizado
          </span>
        </div>
      )}
    </div>
  );
};

export default ICMSTable;
