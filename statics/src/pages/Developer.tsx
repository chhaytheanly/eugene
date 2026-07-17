import { Activity, Cpu, HardDrive, Terminal, Network, Search, Play, Settings, RefreshCw, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

const logs = [
  { id: 1, time: "10:42:01.014", level: "info", message: "Application initialized. Loading modules..." },
  { id: 2, time: "10:42:01.105", level: "info", message: "Theme service loaded (Mode: dark, Effect: matrix)" },
  { id: 3, time: "10:42:01.240", level: "info", message: "Connecting to API server at http://localhost:6868" },
  { id: 4, time: "10:42:01.402", level: "success", message: "WebSocket connection established" },
  { id: 5, time: "10:42:02.115", level: "info", message: "Fetching user preferences..." },
  { id: 6, time: "10:42:02.320", level: "warn", message: "API rate limit approaching (85/100)" },
  { id: 7, time: "10:42:03.041", level: "info", message: "Memory cache populated with 42 items" },
  { id: 8, time: "10:42:05.112", level: "info", message: "Ready for user interaction." },
];

export default function Developer() {
  const [activeTab, setActiveTab] = useState("metrics");
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memUsage, setMemUsage] = useState(45);
  const [networkPing, setNetworkPing] = useState(24);

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.max(5, Math.min(95, prev + (Math.random() * 10 - 5))));
      setMemUsage(prev => Math.max(20, Math.min(80, prev + (Math.random() * 4 - 2))));
      setNetworkPing(prev => Math.max(10, Math.min(150, prev + (Math.random() * 20 - 10))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--fg)] relative">
      <div className="flex items-center justify-between px-6 h-14 shrink-0 border-b border-[var(--border)] bg-[var(--surface-elevated)]/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center border border-[var(--accent)]/30">
            <Terminal className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Developer Environment</h1>
            <p className="text-xs text-[var(--fg-muted)] font-mono">sys.admin // eugene_core</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
            </span>
            <span className="text-xs font-mono text-[var(--fg-muted)]">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
        {/* Top metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <MetricCard 
            title="CPU Utilization" 
            value={`${cpuUsage.toFixed(1)}%`} 
            icon={Cpu} 
            color="var(--info)" 
            progress={cpuUsage} 
          />
          <MetricCard 
            title="Memory Allocation" 
            value={`${memUsage.toFixed(1)}%`} 
            icon={HardDrive} 
            color="var(--accent)" 
            progress={memUsage} 
          />
          <MetricCard 
            title="Network Latency" 
            value={`${networkPing.toFixed(0)} ms`} 
            icon={Network} 
            color={networkPing > 100 ? "var(--warning)" : "var(--success)"} 
            progress={Math.min(100, networkPing)} 
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 min-h-0 flex gap-6">
          {/* Sidebar */}
          <div className="w-48 shrink-0 flex flex-col gap-1 border-r border-[var(--border)] pr-4">
            <TabButton active={activeTab === "metrics"} onClick={() => setActiveTab("metrics")} icon={Activity} label="System Metrics" />
            <TabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={Terminal} label="Application Logs" />
            <TabButton active={activeTab === "api"} onClick={() => setActiveTab("api")} icon={Network} label="API Playground" />
            <TabButton active={activeTab === "config"} onClick={() => setActiveTab("config")} icon={Settings} label="Configuration" />
          </div>

          {/* Tab content */}
          <div className="flex-1 min-w-0 bg-[var(--surface-elevated)]/30 border border-[var(--border)] rounded-xl overflow-hidden backdrop-blur-sm relative">
            {activeTab === "logs" && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[var(--fg-muted)]" />
                    <span className="text-xs font-mono text-[var(--fg-muted)]">/var/log/eugene.log</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded hover:bg-[var(--surface-elevated)] text-[var(--fg-muted)]">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-[var(--surface-elevated)] text-[var(--fg-muted)]">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5">
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-3 hover:bg-[var(--surface)] px-2 py-1 rounded transition-colors group">
                      <span className="text-[var(--fg-muted)] shrink-0">{log.time}</span>
                      <LogIcon level={log.level} />
                      <span className={cn(
                        "flex-1",
                        log.level === "error" ? "text-[var(--danger)]" :
                        log.level === "warn" ? "text-[var(--warning)]" :
                        log.level === "success" ? "text-[var(--success)]" :
                        "text-[var(--fg)]"
                      )}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div className="animate-pulse flex gap-3 px-2 py-1">
                    <span className="text-[var(--fg-muted)]">10:42:06.---</span>
                    <span className="text-[var(--fg-muted)]">Waiting for events...</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="flex flex-col h-full p-6 items-center justify-center text-center">
                <Network className="w-12 h-12 text-[var(--fg-muted)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--fg)] mb-2">API Playground</h3>
                <p className="text-sm text-[var(--fg-muted)] max-w-md">
                  Test endpoints, monitor WebSocket connections, and debug payload structures in real-time.
                </p>
                <div className="mt-6 flex gap-3">
                  <button className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium flex items-center gap-2 shadow-soft hover:brightness-110 transition-all">
                    <Play className="w-4 h-4 fill-current" />
                    Start Session
                  </button>
                </div>
              </div>
            )}
            
            {(activeTab === "metrics" || activeTab === "config") && (
               <div className="flex flex-col h-full p-6 items-center justify-center text-center">
               <Activity className="w-12 h-12 text-[var(--fg-muted)] mb-4" />
               <h3 className="text-lg font-medium text-[var(--fg)] mb-2">Advanced Tools</h3>
               <p className="text-sm text-[var(--fg-muted)] max-w-md">
                 Module {activeTab} is currently initializing. Advanced diagnostics will be available shortly.
               </p>
             </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, progress }: any) {
  return (
    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 z-0" />
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)]">
            <Icon className="w-4 h-4 text-[var(--fg-muted)]" />
          </div>
          <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">{title}</span>
        </div>
      </div>
      <div className="z-10 flex items-end justify-between">
        <span className="text-2xl font-mono tracking-tight font-semibold">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden z-10">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${progress}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }} 
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left w-full",
        active 
          ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] font-medium" 
          : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)]"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function LogIcon({ level }: { level: string }) {
  switch (level) {
    case "info": return <Info className="w-3.5 h-3.5 text-[var(--info)] shrink-0" />;
    case "warn": return <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />;
    case "error": return <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)] shrink-0" />;
    case "success": return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />;
    default: return <Info className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />;
  }
}
