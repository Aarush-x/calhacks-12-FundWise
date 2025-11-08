import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface StockDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  name: string;
}

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

interface TechnicalIndicators {
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
}

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: TechnicalIndicators;
}

const StockDetailsDialog = ({ open, onOpenChange, symbol, name }: StockDetailsDialogProps) => {
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');
  
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ["stock-chart", symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-stock-chart-data", {
        body: { symbol },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.chartData as ChartDataPoint[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: newsData, isLoading: isLoadingNews } = useQuery({
    queryKey: ["stock-news", symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-stock-news", {
        body: { symbol, companyName: name },
      });
      
      if (error) throw error;
      return data.news as NewsArticle[];
    },
    enabled: open,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {symbol} - {name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Price Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Advanced Stock Chart</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="chart-type" className="text-sm">Candlestick</Label>
                <Switch
                  id="chart-type"
                  checked={chartType === 'candlestick'}
                  onCheckedChange={(checked) => setChartType(checked ? 'candlestick' : 'line')}
                />
              </div>
            </div>
            
            {isLoadingChart ? (
              <Skeleton className="h-96 w-full" />
            ) : chartData && chartData.length > 0 ? (
              <div className="space-y-4">
                {/* Main Chart */}
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                      }}
                      interval={Math.floor(chartData.length / 10)}
                    />
                    <YAxis 
                      yAxisId="price"
                      className="text-xs"
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`$${value.toFixed(2)}`]}
                    />
                    
                    {chartType === 'candlestick' ? (
                      <>
                        {/* Candlestick bodies */}
                        <Bar
                          yAxisId="price"
                          dataKey={(data: ChartDataPoint) => [data.open, data.close]}
                          fill="hsl(var(--primary))"
                          shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            const isPositive = payload.close >= payload.open;
                            const color = isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
                            const topY = isPositive ? y : y;
                            const candleHeight = Math.abs(height);
                            
                            return (
                              <g>
                                {/* Wick */}
                                <line
                                  x1={x + width / 2}
                                  y1={y - (payload.high - Math.max(payload.open, payload.close)) * (height / (payload.close - payload.open || 1))}
                                  x2={x + width / 2}
                                  y2={y + height + (Math.min(payload.open, payload.close) - payload.low) * (height / (payload.close - payload.open || 1))}
                                  stroke={color}
                                  strokeWidth={1}
                                />
                                {/* Body */}
                                <rect
                                  x={x}
                                  y={topY}
                                  width={width}
                                  height={Math.max(candleHeight, 1)}
                                  fill={color}
                                  stroke={color}
                                />
                              </g>
                            );
                          }}
                        />
                      </>
                    ) : (
                      <Line 
                        yAxisId="price"
                        type="monotone" 
                        dataKey="close" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        name="Price"
                      />
                    )}
                    
                    {/* Technical Indicators */}
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="indicators.sma20" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={1.5}
                      dot={false}
                      name="SMA 20"
                      strokeDasharray="5 5"
                    />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="indicators.sma50" 
                      stroke="hsl(221, 83%, 53%)" 
                      strokeWidth={1.5}
                      dot={false}
                      name="SMA 50"
                      strokeDasharray="5 5"
                    />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="indicators.ema12" 
                      stroke="hsl(280, 100%, 70%)" 
                      strokeWidth={1}
                      dot={false}
                      name="EMA 12"
                      opacity={0.6}
                    />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="indicators.ema26" 
                      stroke="hsl(340, 100%, 70%)" 
                      strokeWidth={1}
                      dot={false}
                      name="EMA 26"
                      opacity={0.6}
                    />
                    
                    {/* Bollinger Bands */}
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="indicators.bb_upper"
                      stroke="hsl(200, 100%, 50%)"
                      fill="hsl(200, 100%, 50%)"
                      fillOpacity={0.1}
                      strokeWidth={1}
                      dot={false}
                      name="BB Upper"
                    />
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="indicators.bb_middle"
                      stroke="hsl(200, 100%, 50%)"
                      strokeWidth={1}
                      dot={false}
                      name="BB Middle"
                      strokeDasharray="3 3"
                    />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="indicators.bb_lower"
                      stroke="hsl(200, 100%, 50%)"
                      fill="hsl(200, 100%, 50%)"
                      fillOpacity={0.1}
                      strokeWidth={1}
                      dot={false}
                      name="BB Lower"
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* RSI Indicator */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">RSI (Relative Strength Index)</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                        }}
                        interval={Math.floor(chartData.length / 10)}
                      />
                      <YAxis 
                        className="text-xs"
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [value?.toFixed(2), 'RSI']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="indicators.rsi" 
                        stroke="hsl(280, 100%, 70%)" 
                        strokeWidth={2}
                        dot={false}
                      />
                      {/* Overbought/Oversold lines */}
                      <Line 
                        type="monotone" 
                        dataKey={() => 70} 
                        stroke="hsl(0, 84%, 60%)" 
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => 30} 
                        stroke="hsl(142, 76%, 36%)" 
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* MACD Indicator */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">MACD</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                        }}
                        interval={Math.floor(chartData.length / 10)}
                      />
                      <YAxis 
                        className="text-xs"
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [value?.toFixed(4)]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="indicators.macd" 
                        stroke="hsl(221, 83%, 53%)" 
                        strokeWidth={2}
                        dot={false}
                        name="MACD"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="indicators.signal" 
                        stroke="hsl(0, 84%, 60%)" 
                        strokeWidth={2}
                        dot={false}
                        name="Signal"
                      />
                      <Bar
                        dataKey={(data: ChartDataPoint) => (data.indicators.macd || 0) - (data.indicators.signal || 0)}
                        fill="hsl(var(--primary))"
                        opacity={0.3}
                        name="Histogram"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume Chart */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Volume</h4>
                  <ResponsiveContainer width="100%" height={100}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                        }}
                        interval={Math.floor(chartData.length / 10)}
                      />
                      <YAxis 
                        className="text-xs"
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                          return value;
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Volume']}
                      />
                      <Bar
                        dataKey="volume"
                        fill="hsl(var(--primary))"
                        opacity={0.6}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No chart data available</p>
            )}
          </div>

          {/* News Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Latest News - {symbol}</h3>
            {isLoadingNews ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </Card>
                ))}
              </div>
            ) : newsData && newsData.length > 0 ? (
              <>
                {/* Positive News */}
                {newsData.filter(a => a.sentiment === 'positive').length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold mb-3 text-green-600 dark:text-green-400">
                      Positive News ({newsData.filter(a => a.sentiment === 'positive').length})
                    </h4>
                    <div className="space-y-3">
                      {newsData.filter(a => a.sentiment === 'positive').map((article, index) => (
                        <Card key={`pos-${index}`} className="p-4 hover:bg-secondary/50 transition-colors border-l-4 border-l-green-500">
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h5 className="font-semibold mb-1 flex items-start gap-2">
                                  {article.title}
                                  <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                </h5>
                                {article.description && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {article.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium">{article.source}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(article.publishedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </a>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Neutral News */}
                {newsData.filter(a => a.sentiment === 'neutral').length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold mb-3 text-blue-600 dark:text-blue-400">
                      Neutral News ({newsData.filter(a => a.sentiment === 'neutral').length})
                    </h4>
                    <div className="space-y-3">
                      {newsData.filter(a => a.sentiment === 'neutral').map((article, index) => (
                        <Card key={`neu-${index}`} className="p-4 hover:bg-secondary/50 transition-colors border-l-4 border-l-blue-500">
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h5 className="font-semibold mb-1 flex items-start gap-2">
                                  {article.title}
                                  <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                </h5>
                                {article.description && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {article.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium">{article.source}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(article.publishedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </a>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative News */}
                {newsData.filter(a => a.sentiment === 'negative').length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-red-600 dark:text-red-400">
                      Negative News ({newsData.filter(a => a.sentiment === 'negative').length})
                    </h4>
                    <div className="space-y-3">
                      {newsData.filter(a => a.sentiment === 'negative').map((article, index) => (
                        <Card key={`neg-${index}`} className="p-4 hover:bg-secondary/50 transition-colors border-l-4 border-l-red-500">
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h5 className="font-semibold mb-1 flex items-start gap-2">
                                  {article.title}
                                  <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                </h5>
                                {article.description && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {article.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium">{article.source}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(article.publishedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </a>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No news available for {symbol}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockDetailsDialog;
