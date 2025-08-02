import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RealtimeStatusProps {
  isConnected: boolean;
  lastBidTime?: string;
  className?: string;
  error?: string | null;
}

export function RealtimeStatus({
  isConnected,
  lastBidTime,
  className,
  error,
}: RealtimeStatusProps) {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (lastBidTime) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastBidTime]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant={isConnected ? "default" : "secondary"}
        className={cn(
          "text-xs",
          isConnected
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-yellow-100 text-yellow-800 border-yellow-200",
        )}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full mr-1",
            isConnected ? "bg-green-500" : "bg-yellow-500",
          )}
        />
        {isConnected ? "Connecté" : "Déconnecté"}
      </Badge>

      {showNotification && (
        <div className="animate-in slide-in-from-right-2 duration-300">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Nouvelle enchère !
          </Badge>
        </div>
      )}

      {error && <div className="text-red-600 text-xs">⚠️ {error}</div>}
    </div>
  );
}
