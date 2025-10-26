const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

async function fetchStockNews(symbol: string, companyName: string): Promise<NewsArticle[]> {
  const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  
  if (!apiKey) {
    console.error('ALPHA_VANTAGE_API_KEY not found');
    return [];
  }

  try {
    // Fetch news from Alpha Vantage with ticker filter
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}&limit=50`;
    
    console.log(`Fetching news for ${symbol} from Alpha Vantage`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (data.Note) {
      console.error('Alpha Vantage API limit reached:', data.Note);
      return [];
    }

    if (!data.feed || data.feed.length === 0) {
      console.log('No news found for symbol:', symbol);
      return [];
    }

    // Filter and process news articles
    const newsArticles: NewsArticle[] = [];
    const keywords = [symbol.toLowerCase(), companyName.toLowerCase()];
    
    // Add common variations
    if (companyName.toLowerCase().includes('inc')) {
      keywords.push(companyName.toLowerCase().replace('inc.', '').trim());
    }

    for (const article of data.feed) {
      // Check relevance using keywords
      const titleLower = article.title.toLowerCase();
      const summaryLower = (article.summary || '').toLowerCase();
      const combinedText = titleLower + ' ' + summaryLower;
      
      // Calculate relevance score
      let relevanceScore = 0;
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword)) {
          relevanceScore += 1;
        }
      });

      // Only include articles with relevance
      if (relevanceScore > 0) {
        // Get sentiment for the specific ticker
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        
        if (article.ticker_sentiment) {
          const tickerSentiment = article.ticker_sentiment.find(
            (ts: any) => ts.ticker === symbol
          );
          
          if (tickerSentiment && tickerSentiment.ticker_sentiment_label) {
            const label = tickerSentiment.ticker_sentiment_label.toLowerCase();
            if (label.includes('bullish') || label.includes('positive')) {
              sentiment = 'positive';
            } else if (label.includes('bearish') || label.includes('negative')) {
              sentiment = 'negative';
            }
          }
        }

        newsArticles.push({
          title: article.title,
          source: article.source || 'Unknown',
          url: article.url,
          publishedAt: article.time_published 
            ? new Date(
                article.time_published.slice(0, 4) + '-' +
                article.time_published.slice(4, 6) + '-' +
                article.time_published.slice(6, 8) + 'T' +
                article.time_published.slice(9, 11) + ':' +
                article.time_published.slice(11, 13) + ':' +
                article.time_published.slice(13, 15) + 'Z'
              ).toISOString()
            : new Date().toISOString(),
          description: article.summary || '',
          sentiment,
          relevanceScore,
        });
      }
    }

    // Sort by relevance score and date
    newsArticles.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    console.log(`Found ${newsArticles.length} relevant articles for ${symbol}`);
    return newsArticles.slice(0, 20); // Return top 20 most relevant
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, companyName } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching news for:', symbol, companyName);

    const news = await fetchStockNews(symbol, companyName || symbol);

    console.log('Successfully fetched:', news.length, 'articles');

    return new Response(
      JSON.stringify({ news }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-stock-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
