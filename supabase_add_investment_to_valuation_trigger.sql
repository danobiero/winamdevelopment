-- ============================================================
-- SQL SCRIPT: AUTOMATICALLY ADD NEW INVESTMENT AMOUNT TO TOTAL_ASSET_VALUE
-- Run this in your Supabase SQL Editor.
-- Whenever an investment is inserted or its amount_invested is increased,
-- this automatically increments the opportunity's total_asset_value.
-- ============================================================

-- 1. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.fn_add_investment_to_opportunity_valuation()
RETURNS TRIGGER AS $$
DECLARE
    v_delta NUMERIC;
    v_latest_val RECORD;
    v_new_total NUMERIC;
BEGIN
    -- Calculate how much new capital was added
    IF TG_OP = 'INSERT' THEN
        v_delta := COALESCE(NEW.amount_invested, 0);
    ELSE
        v_delta := COALESCE(NEW.amount_invested, 0) - COALESCE(OLD.amount_invested, 0);
    END IF;

    -- Only proceed if positive capital was added and opportunity_id is present
    IF v_delta > 0 AND NEW.opportunity_id IS NOT NULL THEN
        -- Find the most recent valuation record for this opportunity
        SELECT id, total_asset_value, valuation_date
        INTO v_latest_val
        FROM public.opportunity_valuations
        WHERE opportunity_id = NEW.opportunity_id
        ORDER BY valuation_date DESC, created_at DESC
        LIMIT 1;

        IF v_latest_val.id IS NOT NULL THEN
            v_new_total := COALESCE(v_latest_val.total_asset_value, 0) + v_delta;

            -- If a valuation record exists for today, update it
            IF v_latest_val.valuation_date = CURRENT_DATE THEN
                UPDATE public.opportunity_valuations
                SET total_asset_value = v_new_total,
                    created_at = NOW()
                WHERE id = v_latest_val.id;
            ELSE
                -- Otherwise, insert a new valuation record for today with the updated total
                INSERT INTO public.opportunity_valuations (
                    opportunity_id,
                    total_asset_value,
                    valuation_date,
                    created_at
                ) VALUES (
                    NEW.opportunity_id,
                    v_new_total,
                    CURRENT_DATE,
                    NOW()
                );
            END IF;
        ELSE
            -- No prior valuation existed: start the valuation at the new investment amount
            INSERT INTO public.opportunity_valuations (
                opportunity_id,
                total_asset_value,
                valuation_date,
                created_at
            ) VALUES (
                NEW.opportunity_id,
                v_delta,
                CURRENT_DATE,
                NOW()
            );
        END IF;

        -- Also keep opportunities.total_value up to date if column exists
        BEGIN
            UPDATE public.opportunities
            SET total_value = COALESCE(total_value, 0) + v_delta
            WHERE id = NEW.opportunity_id;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if present
DROP TRIGGER IF EXISTS trg_add_investment_to_opportunity_valuation ON public.investments;

-- 3. Attach the trigger to public.investments
CREATE TRIGGER trg_add_investment_to_opportunity_valuation
AFTER INSERT OR UPDATE OF amount_invested ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.fn_add_investment_to_opportunity_valuation();
