-- Fix the search path for the update function using CASCADE
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_user_trading_settings_updated_at
  BEFORE UPDATE ON public.user_trading_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_trades_updated_at
  BEFORE UPDATE ON public.automated_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();