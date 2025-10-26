import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PortfolioOverview = () => {
  const [accountData, setAccountData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('alpaca-trading', {
          body: { action: 'get_account' }
        });

        if (error) throw error;
        setAccountData(data.account);
      } catch (error) {
        console.error('Error fetching account:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
    const interval = setInterval(fetchAccountData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">Loading portfolio...</div>;
  }

  const equity = accountData ? parseFloat(accountData.equity) : 0;
  const lastEquity = accountData ? parseFloat(accountData.last_equity) : equity;
  const change = equity - lastEquity;
  const changePercent = lastEquity > 0 ? (change / lastEquity) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
            ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
          <span className="text-muted-foreground text-sm">Today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="text-sm text-muted-foreground mb-1">Buying Power</div>
          <div className="text-2xl font-bold mb-2">
            ${accountData ? parseFloat(accountData.buying_power).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-muted-foreground">Available to trade</div>
        </Card>

        <Card className="p-4 border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="text-sm text-muted-foreground mb-1">Cash</div>
          <div className="text-2xl font-bold mb-2">
            ${accountData ? parseFloat(accountData.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-muted-foreground">Available cash</div>
        </Card>

        <Card className="p-4 border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="text-sm text-muted-foreground mb-1">Portfolio Value</div>
          <div className="text-2xl font-bold mb-2">
            ${accountData ? parseFloat(accountData.portfolio_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-muted-foreground">Long positions</div>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioOverview;
