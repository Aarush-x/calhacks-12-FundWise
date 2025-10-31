import { Card } from "@/components/ui/card";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
}

const STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "MSFT", name: "Microsoft" },
];

const NewsFeed = () => {
  const fetchNewsForStock = async (symbol: string, name: string) => {
    const { data, error } = await supabase.functions.invoke("fetch-stock-news", {
      body: { symbol, companyName: name },
    });
    
    if (error) throw error;
    return data.news as NewsArticle[];
  };

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
    <Card className="p-6 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Market News</h3>
      </div>
      
      <Tabs defaultValue="AAPL" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          {STOCKS.map((stock) => (
            <TabsTrigger key={stock.symbol} value={stock.symbol}>
              {stock.symbol}
            </TabsTrigger>
          ))}
        </TabsList>

        {STOCKS.map((stock) => (
          <TabsContent key={stock.symbol} value={stock.symbol}>
            <StockNewsTab symbol={stock.symbol} name={stock.name} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};

const StockNewsTab = ({ symbol, name }: { symbol: string; name: string }) => {
  const { data: newsData, isLoading, error } = useQuery({
    queryKey: ["news", symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-stock-news", {
        body: { symbol, companyName: name },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.news as NewsArticle[];
    },
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error instanceof Error && error.message.includes('API_RATE_LIMIT')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimit = errorMessage.includes('API_RATE_LIMIT');
    
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {isRateLimit 
            ? '⏱️ Alpha Vantage API rate limit reached'
            : '⚠️ Unable to fetch news'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRateLimit 
            ? 'Please wait a few minutes and try again. Free tier has 5 requests/minute limit.'
            : errorMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {newsData && newsData.length > 0 ? (
        newsData.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-sm leading-tight mb-1 flex items-start gap-2">
                  {article.title}
                  <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                </h4>
                {article.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{article.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No news available for {symbol}
        </p>
      )}
    </div>
  );
};

export default NewsFeed;
