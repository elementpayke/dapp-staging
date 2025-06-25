import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check } from "lucide-react";

const DashboardHeader = () => {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
              <span className="ml-2 text-primary">👋</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center bg-gray-100 rounded-md p-2 max-w-[200px] sm:max-w-[300px]">
                    <span className="text-sm text-gray-600 truncate">
                      {address}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? "Address copied!" : "Click to copy address"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyAddress}
              className="hover:bg-primary/10 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-500 max-w-md">
          Spend and deposit crypto into your ElementPay wallet instantly with upto
          zero fees
        </p>
      </CardContent>
    </Card>
  );
};

export default DashboardHeader;
