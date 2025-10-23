import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bot, Target, ShieldCheck } from "lucide-react";

const AutomatedFeatures = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-5 border-border/50 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <Switch defaultChecked />
        </div>
        <h3 className="font-semibold mb-1">AI Trading</h3>
        <p className="text-sm text-muted-foreground">
          Automated trades using technical analysis and sentiment data
        </p>
      </Card>

      <Card className="p-5 border-border/50 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <Switch defaultChecked />
        </div>
        <h3 className="font-semibold mb-1">Monthly Targets</h3>
        <p className="text-sm text-muted-foreground">
          Compound capital with automated monthly growth goals
        </p>
      </Card>

      <Card className="p-5 border-border/50 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-destructive" />
          </div>
          <Switch defaultChecked />
        </div>
        <h3 className="font-semibold mb-1">Stop Loss</h3>
        <p className="text-sm text-muted-foreground">
          Automatically protect your investments from significant losses
        </p>
      </Card>
    </div>
  );
};

export default AutomatedFeatures;
