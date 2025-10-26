import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  symbol: string;
  order_type: string;
  quantity: number;
  entry_price: number | null;
  current_price: number | null;
  profit_loss_percentage: number | null;
  status: string;
  created_at: string;
}

const AutomatedTrades = () => {
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrades();
    const interval = setInterval(refreshPositions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('automated_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const refreshPositions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('alpaca-trading', {
        body: { action: 'get_positions' }
      });

      if (error) throw error;
      setPositions(data.positions || []);
      await loadTrades(); // Reload trades to get updated data
    } catch (error) {
      console.error('Error refreshing positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Automated Trades</h3>
        <Button onClick={refreshPositions} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Active Positions */}
      {positions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3">Active Positions</h4>
          <div className="space-y-2">
            {positions.map((position) => {
              const profitLoss = parseFloat(position.unrealized_plpc) * 100;
              const isProfit = profitLoss >= 0;
              
              return (
                <div key={position.symbol} className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{position.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {position.qty} shares @ ${parseFloat(position.avg_entry_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${parseFloat(position.current_price).toFixed(2)}</div>
                      <div className={`flex items-center gap-1 text-sm ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {profitLoss.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trade History */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Recent Trades</h4>
        <div className="space-y-2">
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No trades yet. Enable automated trading to get started.
            </p>
          ) : (
            trades.map((trade) => (
              <div key={trade.id} className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{trade.symbol}</span>
                      <Badge variant="outline" className={trade.order_type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                        {trade.order_type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trade.quantity} shares
                      {trade.entry_price && ` @ $${trade.entry_price.toFixed(2)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(trade.status)}>
                      {trade.status}
                    </Badge>
                    {trade.profit_loss_percentage !== null && (
                      <div className={`text-sm mt-1 ${trade.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.profit_loss_percentage >= 0 ? '+' : ''}{trade.profit_loss_percentage.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default AutomatedTrades;