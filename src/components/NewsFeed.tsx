import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper } from "lucide-react";

const newsItems = [
  {
    title: "Fed Signals Potential Rate Cuts in Q4",
    source: "Bloomberg",
    sentiment: "positive",
    time: "2h ago"
  },
  {
    title: "Tech Stocks Rally on Strong Earnings Reports",
    source: "Reuters",
    sentiment: "positive",
    time: "4h ago"
  },
  {
    title: "Oil Prices Decline Amid Supply Concerns",
    source: "CNBC",
    sentiment: "negative",
    time: "6h ago"
  },
  {
    title: "Market Analysis: Small-Cap Growth Opportunities",
    source: "Financial Times",
    sentiment: "neutral",
    time: "8h ago"
  },
];

const NewsFeed = () => {
  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Market News</h3>
      </div>
      
      <div className="space-y-4">
        {newsItems.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
              <Badge
                variant={
                  item.sentiment === "positive"
                    ? "default"
                    : item.sentiment === "negative"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs shrink-0"
              >
                {item.sentiment}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>•</span>
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NewsFeed;
