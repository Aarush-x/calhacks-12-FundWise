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

async function fetchMarketNews(country?: string): Promise<NewsArticle[]> {
  const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  
  if (!apiKey) {
    console.error('ALPHA_VANTAGE_API_KEY not found');
    return [];
  }

  try {
    // Fetch general market news from Alpha Vantage
    // Alpha Vantage doesn't have country-specific filtering, so we'll use topics
    const topics = country === 'India' ? 'finance,economy' : 'finance';
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topics}&apikey=${apiKey}&limit=50`;
    
    console.log(`Fetching general market news for ${country || 'Global'}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // Check for rate limiting
    if (data.Note) {
      console.error('Alpha Vantage API limit reached:', data.Note);
      throw new Error('API_RATE_LIMIT: Alpha Vantage rate limit reached. Please wait a moment and try again.');
    }

    // Check for other API errors
    if (data['Error Message']) {
      console.error('Alpha Vantage API error:', data['Error Message']);
      throw new Error(`API_ERROR: ${data['Error Message']}`);
    }

    if (!data.feed || data.feed.length === 0) {
      console.log('No news found');
      return [];
    }

    // Process news articles with country filtering
    const newsArticles: NewsArticle[] = [];
    const countryKeywords: Record<string, string[]> = {
      'US': ['us', 'united states', 'america', 'wall street', 'nasdaq', 'dow jones', 's&p', 'fed', 'federal reserve'],
      'India': ['india', 'indian', 'nifty', 'sensex', 'bse', 'nse', 'mumbai', 'rbi', 'reserve bank of india']
    };

    for (const article of data.feed) {
      const titleLower = article.title.toLowerCase();
      const summaryLower = (article.summary || '').toLowerCase();
      const combinedText = titleLower + ' ' + summaryLower;
      
      // If country is specified, filter by country keywords
      let isRelevant = true;
      if (country && countryKeywords[country]) {
        isRelevant = countryKeywords[country].some(keyword => 
          combinedText.includes(keyword)
        );
      }

      if (isRelevant) {
        // Get overall sentiment
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        
        if (article.overall_sentiment_label) {
          const label = article.overall_sentiment_label.toLowerCase();
          if (label.includes('bullish') || label.includes('positive')) {
            sentiment = 'positive';
          } else if (label.includes('bearish') || label.includes('negative')) {
            sentiment = 'negative';
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
        });
      }
    }

    // Sort by date
    newsArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    console.log(`Found ${newsArticles.length} articles for ${country || 'Global'}`);
    return newsArticles.slice(0, 30); // Return top 30 most recent
  } catch (error) {
    console.error(`Error fetching market news:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country } = await req.json();

    console.log('Fetching market news for:', country || 'Global');

    const news = await fetchMarketNews(country);

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
