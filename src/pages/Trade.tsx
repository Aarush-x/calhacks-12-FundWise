import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

const Trade = () => {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Trade Stocks</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
                <CardDescription>Buy or sell stocks instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Sell
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="buy" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="buy-symbol">Stock Symbol</Label>
                      <Input 
                        id="buy-symbol" 
                        placeholder="e.g., AAPL" 
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buy-quantity">Quantity</Label>
                      <Input 
                        id="buy-quantity" 
                        type="number" 
                        placeholder="Number of shares"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-primary to-accent">
                      Place Buy Order
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="sell" className="space-y-4">
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
                    <Button className="w-full" variant="outline">
                      Place Sell Order
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Buying Power</span>
                  <span className="font-semibold">$25,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Equity</span>
                  <span className="font-semibold">$42,580</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Open Orders</span>
                  <span className="font-semibold">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Trade;
