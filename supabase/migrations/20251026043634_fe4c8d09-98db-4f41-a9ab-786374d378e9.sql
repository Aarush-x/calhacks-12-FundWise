-- Create enum for risk profiles
CREATE TYPE public.risk_profile_type AS ENUM ('conservative', 'moderate', 'aggressive');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'filled', 'cancelled', 'failed');

-- Create user trading settings table
CREATE TABLE public.user_trading_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  risk_profile risk_profile_type NOT NULL DEFAULT 'moderate',
  profit_target_percentage DECIMAL(5,2) NOT NULL DEFAULT 8.00,
  stop_loss_percentage DECIMAL(5,2) DEFAULT 2.00,
  stop_loss_enabled BOOLEAN NOT NULL DEFAULT false,
  automated_trading_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create automated trades table
CREATE TABLE public.automated_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  order_type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  entry_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  profit_loss_percentage DECIMAL(5,2),
  status order_status NOT NULL DEFAULT 'pending',
  alpaca_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_trading_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_trades ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_trading_settings
CREATE POLICY "Users can view own trading settings"
  ON public.user_trading_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading settings"
  ON public.user_trading_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading settings"
  ON public.user_trading_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for automated_trades
CREATE POLICY "Users can view own trades"
  ON public.automated_trades
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON public.automated_trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON public.automated_trades
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_trading_settings_updated_at
  BEFORE UPDATE ON public.user_trading_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_trades_updated_at
  BEFORE UPDATE ON public.automated_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();