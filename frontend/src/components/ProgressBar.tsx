import React, { useEffect, useState } from "react";

interface ProgressBarProps {
  isLoading: boolean;
  resetTime: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isLoading, resetTime }) => {
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [lastTime, setLastTime] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isLoading) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
        setProgress((prevProgress) =>
          prevProgress < 100 ? prevProgress + 1 : 100
        );
      }, 1000);
    } else {
      if (timer) {
        clearInterval(timer);
      }
      if (time > 0) {
        setLastTime(time); // Armazena o último tempo de busca
      }
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isLoading, time]);

  useEffect(() => {
    if (resetTime) {
      setTime(0);
      setProgress(0);
    }
  }, [resetTime]);

  return (
    <div className="mt-4 text-white">
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="mt-2">
        <label>Tempo: {time} segundos</label> {/* Exibe o tempo em segundos */}
      </div>
      {lastTime !== null && (
        <div className="mt-2">
          <label>Último tempo de busca: {lastTime} segundos</label>{" "}
          {/* Exibe o último tempo de busca */}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
