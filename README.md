#  FundWise AI — Smart Stock Trading Assistant

FundWise AI is a modern web platform that empowers users to automate and optimize their **stock trading strategies** using **AI and technical analysis**.  
Built with ❤️ for calhacks — minimal, fast, and insightful.

---

## Features

- **Live Stock Data** via [Yahoo Finance API](https://www.yahoofinanceapi.com/)
- **AI Trading Assistant** powered by **Gemini Flash 2.5**
- **Technical Analysis Tools** including:
  - Moving Averages (MA, EMA)
  - Bollinger Bands
  - RSI (Relative Strength Index)
  - Momentum Indicators
  - Support & Resistance Detection
- **Automated Fund Allocation** using AI recommendations  
- **News Sentiment Analyzer** (via [Alpha Vantage News API](https://www.alphavantage.co))  
  → Filters and classifies news as *Positive*, *Negative*, or *Neutral*
- **Interactive Stock Graphs** — click any stock to view:
  - Live price chart
  - Related news organized by sentiment

---

## AI Capabilities

The **Gemini Flash 2.5 Trading Assistant** analyzes:
- Market momentum  
- Technical indicators  
- Historical patterns  
- Sentiment trends  

You can ask FundWise AI things like:
>  *“Create a low-risk swing trading strategy for AAPL using Bollinger Bands and RSI.”*  
>  *“Suggest how to allocate \$10,000 across large-cap stocks with moderate risk.”*

## Setup Instructions

## 1 Clone the repository
```bash
git clone https://github.com/<your-username>/FundWise-AI.git
cd FundWise-AI
2️ Install dependencies
npm install

3️ Add your environment variables

Create a .env file in the project root:

ALPHAVANTAGE_API_KEY=your_alphavantage_key_here
YAHOO_API_KEY=your_yahoo_api_key_here
GEMINI_API_KEY=your_gemini_flash_key_here

4️ Run the app
npm run dev


### What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


