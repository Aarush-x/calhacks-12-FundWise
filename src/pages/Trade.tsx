import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import TradingSettings from "@/components/TradingSettings";
import AutomatedTrades from "@/components/AutomatedTrades";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Trade = () => {
  const { toast } = useToast();
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!symbol || !quantity) {
      toast({
        title: "Error",
        description: "Please enter both symbol and quantity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('alpaca-trading', {
        body: {
          action: 'place_order',
          symbol: symbol.toUpperCase(),
          quantity: parseFloat(quantity),
          side,
        }
      });

      if (error) throw error;

      toast({
        title: "Order Placed",
        description: `${side.toUpperCase()} order for ${quantity} shares of ${symbol.toUpperCase()} placed successfully`,
      });

      setSymbol("");
      setQuantity("");
    } catch (error: any) {
      console.error('Trade error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Trade Stocks</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Trading Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
                <CardDescription>Buy or sell stocks manually</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Sell
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="buy" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Stock Symbol</Label>
                      <Input 
                        id="symbol"
                        placeholder="e.g., AAPL" 
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input 
                        id="quantity"
                        type="number" 
                        placeholder="Number of shares"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleTrade('buy')} 
                      disabled={loading}
                    >
                      {loading ? 'Placing Order...' : 'Place Buy Order'}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="sell" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="sell-symbol">Stock Symbol</Label>
                      <Input 
                        id="sell-symbol"
                        placeholder="e.g., AAPL"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sell-quantity">Quantity</Label>
                      <Input 
                        id="sell-quantity"
                        type="number" 
                        placeholder="Number of shares"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      variant="destructive" 
                      onClick={() => handleTrade('sell')} 
                      disabled={loading}
                    >
                      {loading ? 'Placing Order...' : 'Place Sell Order'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Automated Trading Section */}
          <div className="space-y-6">
            <TradingSettings />
            <AutomatedTrades />
          </div>
        </div>
      </div>
    </>
  );
};

export default Trade;