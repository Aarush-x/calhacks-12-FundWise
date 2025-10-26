import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp, TrendingDown } from "lucide-react";
import TradingSettings from "@/components/TradingSettings";
import AutomatedTrades from "@/components/AutomatedTrades";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Trade = () => {
  const { toast } = useToast();
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
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

    if (orderType === "limit" && !limitPrice) {
      toast({
        title: "Error",
        description: "Please enter limit price",
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
          orderType,
          limitPrice: orderType === "limit" ? parseFloat(limitPrice) : undefined,
        }
      });

      if (error) throw error;

      const orderTypeText = orderType === "market" ? "Market" : `Limit (${limitPrice})`;
      toast({
        title: "Order Placed",
        description: `${side.toUpperCase()} ${orderTypeText} order for ${quantity} shares of ${symbol.toUpperCase()} placed successfully`,
      });

      setSymbol("");
      setQuantity("");
      setLimitPrice("");
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
          {/* Manual Trading */}
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
                  <div className="space-y-2">
                    <Label>Order Type</Label>
                    <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as "market" | "limit")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="market" id="market" />
                        <Label htmlFor="market" className="cursor-pointer">Market Order</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="limit" id="limit" />
                        <Label htmlFor="limit" className="cursor-pointer">Limit Order</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {orderType === "limit" && (
                    <div className="space-y-2">
                      <Label htmlFor="limitPrice">Limit Price</Label>
                      <Input 
                        id="limitPrice"
                        type="number" 
                        step="0.01"
                        placeholder="Price per share"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                      />
                    </div>
                  )}
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
                  <div className="space-y-2">
                    <Label>Order Type</Label>
                    <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as "market" | "limit")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="market" id="sell-market" />
                        <Label htmlFor="sell-market" className="cursor-pointer">Market Order</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="limit" id="sell-limit" />
                        <Label htmlFor="sell-limit" className="cursor-pointer">Limit Order</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {orderType === "limit" && (
                    <div className="space-y-2">
                      <Label htmlFor="sell-limitPrice">Limit Price</Label>
                      <Input 
                        id="sell-limitPrice"
                        type="number" 
                        step="0.01"
                        placeholder="Price per share"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                      />
                    </div>
                  )}
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

          {/* Automated Trading */}
          <div className="space-y-6">
            <TradingSettings />
          </div>
        </div>
        
        <div className="mt-6">
          <AutomatedTrades />
        </div>
      </div>
    </>
  );
};

export default Trade;