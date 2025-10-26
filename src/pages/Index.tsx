import Navigation from "@/components/Navigation";
import PortfolioOverview from "@/components/PortfolioOverview";
import MarketTrending from "@/components/MarketTrending";
import RiskProfile from "@/components/RiskProfile";
import AutomatedFeatures from "@/components/AutomatedFeatures";
import KTradingAI from "@/components/KTradingAI";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <PortfolioOverview />
        
        <AutomatedFeatures />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MarketTrending />
            <KTradingAI />
          </div>
          
          <div>
            <RiskProfile />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
