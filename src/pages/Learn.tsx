import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Activity, Target } from "lucide-react";

const Learn = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Technical Analysis Learning Center</h1>
        <p className="text-muted-foreground mb-8">Master the art of reading charts and making informed trading decisions</p>
        
        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patterns">Chart Patterns</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="basics">Basics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="patterns" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Common Chart Patterns
                </CardTitle>
                <CardDescription>Learn to identify key price patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Head and Shoulders</h3>
                  <p className="text-muted-foreground">A reversal pattern that signals a change from bullish to bearish trend. Consists of three peaks: a higher peak (head) between two lower peaks (shoulders).</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Double Top/Bottom</h3>
                  <p className="text-muted-foreground">Reversal patterns where price tests a level twice and fails to break through. Double tops indicate bearish reversals, double bottoms indicate bullish reversals.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Triangle Patterns</h3>
                  <p className="text-muted-foreground">Consolidation patterns including ascending, descending, and symmetrical triangles. These indicate potential breakouts in either direction.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Cup and Handle</h3>
                  <p className="text-muted-foreground">A bullish continuation pattern that resembles a tea cup. The cup forms after a price decline, followed by consolidation and a handle before breaking higher.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="indicators" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Technical Indicators
                </CardTitle>
                <CardDescription>Essential tools for market analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Moving Averages (MA)</h3>
                  <p className="text-muted-foreground">Simple and exponential moving averages smooth out price data to identify trends. Common periods: 50-day, 100-day, and 200-day MAs.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Relative Strength Index (RSI)</h3>
                  <p className="text-muted-foreground">Momentum oscillator measuring speed and magnitude of price changes. Values above 70 indicate overbought, below 30 indicate oversold conditions.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">MACD (Moving Average Convergence Divergence)</h3>
                  <p className="text-muted-foreground">Trend-following momentum indicator showing the relationship between two moving averages. Crossovers signal potential buy/sell opportunities.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Bollinger Bands</h3>
                  <p className="text-muted-foreground">Volatility bands placed above and below a moving average. Wider bands indicate higher volatility, narrower bands indicate lower volatility.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="strategies" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Trading Strategies
                </CardTitle>
                <CardDescription>Proven approaches to market trading</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Trend Following</h3>
                  <p className="text-muted-foreground">Buy during uptrends, sell during downtrends. Use moving averages and trendlines to identify direction. "The trend is your friend."</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Breakout Trading</h3>
                  <p className="text-muted-foreground">Enter positions when price breaks through key support or resistance levels with increased volume. Set stop losses below breakout point.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Mean Reversion</h3>
                  <p className="text-muted-foreground">Trade on the assumption that prices will return to their average. Buy oversold conditions, sell overbought conditions using RSI or Bollinger Bands.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Swing Trading</h3>
                  <p className="text-muted-foreground">Hold positions for several days to weeks, capturing "swings" in price. Combine chart patterns with indicators for entry and exit points.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="basics" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Technical Analysis Basics
                </CardTitle>
                <CardDescription>Fundamental concepts every trader should know</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Support and Resistance</h3>
                  <p className="text-muted-foreground">Support is a price level where buying interest is strong enough to prevent further decline. Resistance is where selling pressure prevents further rise. These levels often reverse roles when broken.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Trend Lines</h3>
                  <p className="text-muted-foreground">Draw lines connecting higher lows in uptrends or lower highs in downtrends. Valid trendlines should connect at least three points and can act as dynamic support/resistance.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Volume Analysis</h3>
                  <p className="text-muted-foreground">Volume confirms price movements. Rising prices on high volume indicate strong buying, while declining prices on high volume suggest strong selling pressure.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Timeframes</h3>
                  <p className="text-muted-foreground">Different timeframes reveal different perspectives. Day traders use 1-15 minute charts, swing traders use daily charts, investors use weekly/monthly charts.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Learn;
