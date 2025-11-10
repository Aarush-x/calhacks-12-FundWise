import { Card } from "@/components/ui/card";
import { Newspaper, ExternalLink, Clock, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
}

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "India", name: "India", flag: "🇮🇳" },
];

const NewsFeed = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>("US");

  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Market News & Headlines</h3>
        </div>
        
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <MarketNewsContent country={selectedCountry} />
    </Card>
  );
};

const MarketNewsContent = ({ country }: { country: string }) => {
  const { data: newsData, isLoading, error } = useQuery({
    queryKey: ["market-news", country],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-stock-news", {
        body: { country },
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
          No news available for {country}
        </p>
      )}
    </div>
  );
};

export default NewsFeed;
