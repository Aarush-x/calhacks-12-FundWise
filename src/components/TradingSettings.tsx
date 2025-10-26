import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings, Target, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TradingSettings = () => {
  const { toast } = useToast();
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [profitTarget, setProfitTarget] = useState(8);
  const [stopLoss, setStopLoss] = useState(2);
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [automatedTrading, setAutomatedTrading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_trading_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRiskProfile(data.risk_profile);
        setProfitTarget(Number(data.profit_target_percentage));
        setStopLoss(Number(data.stop_loss_percentage || 2));
        setStopLossEnabled(data.stop_loss_enabled);
        setAutomatedTrading(data.automated_trading_enabled);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_trading_settings')
        .upsert({
          user_id: user.id,
          risk_profile: riskProfile,
          profit_target_percentage: profitTarget,
          stop_loss_percentage: stopLoss,
          stop_loss_enabled: stopLossEnabled,
          automated_trading_enabled: automatedTrading,
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your trading settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Automated Trading Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Automated Trading Toggle */}
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold">Enable Automated Trading</div>
              <div className="text-sm text-muted-foreground">Auto-buy and sell based on your settings</div>
            </div>
          </div>
          <Switch checked={automatedTrading} onCheckedChange={setAutomatedTrading} />
        </div>

        {/* Risk Profile */}
        <div className="space-y-3">
          <Label>Risk Profile</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['conservative', 'moderate', 'aggressive'] as const).map((profile) => (
              <Button
                key={profile}
                variant={riskProfile === profile ? 'default' : 'outline'}
                onClick={() => setRiskProfile(profile)}
                className="capitalize"
              >
                {profile}
              </Button>
            ))}
          </div>
        </div>

        {/* Profit Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Profit Target: {profitTarget}%</Label>
          </div>
          <Slider
            value={[profitTarget]}
            onValueChange={(value) => setProfitTarget(value[0])}
            min={1}
            max={50}
            step={0.5}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Automatically sell when profit reaches this percentage
          </p>
        </div>

        {/* Stop Loss */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <Label>Stop Loss: {stopLoss}%</Label>
            </div>
            <Switch checked={stopLossEnabled} onCheckedChange={setStopLossEnabled} />
          </div>
          {stopLossEnabled && (
            <>
              <Slider
                value={[stopLoss]}
                onValueChange={(value) => setStopLoss(value[0])}
                min={0.5}
                max={20}
                step={0.5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Automatically sell when loss reaches this percentage
              </p>
            </>
          )}
        </div>

        <Button onClick={saveSettings} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Card>
  );
};

export default TradingSettings;