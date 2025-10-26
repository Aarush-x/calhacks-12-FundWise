import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RiskProfileType = "conservative" | "moderate" | "aggressive";

const riskProfiles = [
  {
    name: "Conservative",
    value: "conservative" as RiskProfileType,
    description: "70% Large Cap, 20% Mid Cap, 10% Small Cap",
    color: "from-blue-500 to-blue-600",
    profitTarget: 5,
    stopLoss: 2
  },
  {
    name: "Moderate",
    value: "moderate" as RiskProfileType,
    description: "50% Large Cap, 30% Mid Cap, 20% Small Cap",
    color: "from-primary to-accent",
    profitTarget: 8,
    stopLoss: 3
  },
  {
    name: "Aggressive",
    value: "aggressive" as RiskProfileType,
    description: "30% Large Cap, 40% Mid Cap, 30% Small Cap",
    color: "from-orange-500 to-red-500",
    profitTarget: 12,
    stopLoss: 5
  },
];

const RiskProfile = () => {
  const [selectedProfile, setSelectedProfile] = useState<RiskProfileType>("moderate");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_trading_settings')
        .select('risk_profile')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setSelectedProfile(data.risk_profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const selectProfile = async (profile: typeof riskProfiles[0]) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save your risk profile",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('user_trading_settings')
        .upsert({
          user_id: user.id,
          risk_profile: profile.value,
          profit_target_percentage: profile.profitTarget,
          stop_loss_percentage: profile.stopLoss,
          stop_loss_enabled: true,
          automated_trading_enabled: false
        });

      if (error) throw error;

      setSelectedProfile(profile.value);
      toast({
        title: "Risk profile updated",
        description: `Your risk profile has been set to ${profile.name}`,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save risk profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Your Risk Profile</h3>
      </div>
      
      <div className="space-y-3">
        {riskProfiles.map((profile) => (
          <button
            key={profile.name}
            onClick={() => selectProfile(profile)}
            disabled={isLoading}
            className="w-full p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all group relative disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-left">
                <div className="font-semibold flex items-center gap-2">
                  {profile.name}
                  {selectedProfile === profile.value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{profile.description}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Target: +{profile.profitTarget}% | Stop: -{profile.stopLoss}%
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${profile.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
          </button>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground mt-4">
        Enable automated trading in the Trade section to activate your risk profile.
      </p>
    </Card>
  );
};

export default RiskProfile;
