import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const PortfolioOverview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">$47,234.82</h2>
        <div className="flex items-center gap-2 text-success">
          <ArrowUpRight className="w-4 h-4" />
          <span className="text-sm font-medium">+$2,847.23 (6.41%)</span>
          <span className="text-muted-foreground text-sm">Today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="text-sm text-muted-foreground mb-1">Large Cap</div>
          <div className="text-2xl font-bold mb-2">$28,340</div>
          <div className="flex items-center gap-1 text-success text-sm">
            <ArrowUpRight className="w-3 h-3" />
            <span>+4.2%</span>
          </div>
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[60%] bg-gradient-to-r from-primary to-accent rounded-full" />
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="text-sm text-muted-foreground mb-1">Mid Cap</div>
          <div className="text-2xl font-bold mb-2">$14,170</div>
          <div className="flex items-center gap-1 text-success text-sm">
            <ArrowUpRight className="w-3 h-3" />
            <span>+8.7%</span>
          </div>
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[30%] bg-gradient-to-r from-accent to-primary rounded-full" />
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="text-sm text-muted-foreground mb-1">Small Cap</div>
          <div className="text-2xl font-bold mb-2">$4,724</div>
          <div className="flex items-center gap-1 text-destructive text-sm">
            <ArrowDownRight className="w-3 h-3" />
            <span>-2.1%</span>
          </div>
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[10%] bg-gradient-to-r from-primary/70 to-accent/70 rounded-full" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioOverview;
