import Navigation from "@/components/Navigation";
import NewsFeed from "@/components/NewsFeed";

const News = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Market News</h1>
        <NewsFeed />
      </main>
    </div>
  );
};

export default News;
