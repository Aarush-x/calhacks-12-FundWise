import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import StockDetailsDialog from "./StockDetailsDialog";

interface StockData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean;
}

const TRENDING_SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT"];

const MarketTrending = () => {
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
  const { data: stocksData, isLoading } = useQuery({
    queryKey: ["trending-stocks"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
        body: { symbols: TRENDING_SYMBOLS },
      });
      
      if (error) throw error;
      return data.stocks as StockData[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const trendingAssets = stocksData || [];
  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Trending Assets</h3>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/50">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </>
        ) : (
          trendingAssets.map((asset) => (
          <div
            key={asset.symbol}
            onClick={() => setSelectedStock({ symbol: asset.symbol, name: asset.name })}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-sm font-bold">{asset.symbol[0]}</span>
              </div>
              <div>
                <div className="font-semibold">{asset.symbol}</div>
                <div className="text-xs text-muted-foreground">{asset.name}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold">${asset.price}</div>
              <div className={`flex items-center gap-1 text-sm ${asset.isUp ? 'text-success' : 'text-destructive'}`}>
                {asset.isUp ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{asset.isUp ? '+' : ''}{asset.changePercent}%</span>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      <StockDetailsDialog
        open={!!selectedStock}
        onOpenChange={(open) => !open && setSelectedStock(null)}
        symbol={selectedStock?.symbol || ""}
        name={selectedStock?.name || ""}
      />
    </Card>
  );
};

export default MarketTrending;
