import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

const trendingAssets = [
  { symbol: "AAPL", name: "Apple Inc.", price: "$178.45", change: "+2.34%", isUp: true },
  { symbol: "TSLA", name: "Tesla Inc.", price: "$242.67", change: "+5.12%", isUp: true },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: "$495.23", change: "+8.45%", isUp: true },
  { symbol: "MSFT", name: "Microsoft Corp.", price: "$378.91", change: "-1.23%", isUp: false },
];

const MarketTrending = () => {
  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Trending Assets</h3>
      </div>
      
      <div className="space-y-3">
        {trendingAssets.map((asset) => (
          <div
            key={asset.symbol}
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
              <div className="font-semibold">{asset.price}</div>
              <div className={`flex items-center gap-1 text-sm ${asset.isUp ? 'text-success' : 'text-destructive'}`}>
                {asset.isUp ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{asset.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MarketTrending;
