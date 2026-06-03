import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface StatusBarProps {
  systemStatus?: string;
  clusterName?: string;
  showSpeed?: boolean;
  showNetwork?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  systemStatus = 'PROTECTED',
  clusterName = '192.168.1.1',
  showSpeed = true,
  showNetwork = true,
}) => {
  const [memoryUsage, setMemoryUsage] = useState('421MB');
  const [latency, setLatency] = useState('12ms');

  useEffect(() => {
    const interval = setInterval(() => {
      const used = 380 + Math.round(Math.random() * 70);
      const ping = 10 + Math.round(Math.random() * 5);
      setMemoryUsage(`${used}MB`);
      setLatency(`${ping}ms`);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-6 px-3 flex items-center justify-between bg-surface-container-lowest text-[10px] text-secondary font-medium tracking-wide z-50 border-t border-outline/10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
          <span>{systemStatus}</span>
        </div>
        <span>IP: {clusterName}</span>
      </div>
      <div className="flex items-center gap-4">
        {showSpeed && (
          <span>MEM: {memoryUsage}</span>
        )}
        {showNetwork && (
          <span className="flex items-center gap-1">
            <Activity size={12} aria-hidden="true" />
            {latency}
          </span>
        )}
      </div>
    </footer>
  );
};

export default StatusBar;
