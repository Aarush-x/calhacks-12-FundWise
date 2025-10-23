import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const riskProfiles = [
  {
    name: "Conservative",
    description: "70% Large Cap, 20% Mid Cap, 10% Small Cap",
    color: "from-blue-500 to-blue-600"
  },
  {
    name: "Moderate",
    description: "50% Large Cap, 30% Mid Cap, 20% Small Cap",
    color: "from-primary to-accent"
  },
  {
    name: "Aggressive",
    description: "30% Large Cap, 40% Mid Cap, 30% Small Cap",
    color: "from-orange-500 to-red-500"
  },
];

const RiskProfile = () => {
  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Your Risk Profile</h3>
      </div>
      
      <div className="space-y-3">
        {riskProfiles.map((profile) => (
          <div
            key={profile.name}
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold">{profile.name}</div>
                <div className="text-sm text-muted-foreground">{profile.description}</div>
              </div>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${profile.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
          </div>
        ))}
      </div>
      
      <Button className="w-full mt-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
        Update Strategy
      </Button>
    </Card>
  );
};

export default RiskProfile;
