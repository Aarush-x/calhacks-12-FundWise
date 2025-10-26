import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

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

interface HistoricalDataPoint {
  date: string;
  price: number;
}

const StockDetailsDialog = ({ open, onOpenChange, symbol, name }: StockDetailsDialogProps) => {
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["stock-history", symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-stock-history", {
        body: { symbol },
      });
      
      if (error) throw error;
      return data.history as HistoricalDataPoint[];
    },
    enabled: open,
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
            <h3 className="text-lg font-semibold mb-3">30-Day Price Chart</h3>
            {isLoadingHistory ? (
              <Skeleton className="h-64 w-full" />
            ) : historyData && historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
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
                    labelFormatter={(value) => `Date: ${value}`}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No historical data available</p>
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
