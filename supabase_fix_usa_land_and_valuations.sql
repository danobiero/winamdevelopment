-- ============================================================
-- SQL SCRIPT: REPAIR USA LAND VALUATION & PREVENT PHANTOM GAINS
-- Run this in your Supabase SQL Editor to install the updated triggers.
-- ============================================================

-- 1. Ensure `update_investment_valuations` only divides over active capital
--    and sets exited/cancelled investments to 0 current value.
CREATE OR REPLACE FUNCTION public.update_investment_valuations()
RETURNS TRIGGER AS $$
DECLARE
    v_total_capital NUMERIC;
    v_investment RECORD;
    v_new_value NUMERIC;
BEGIN
    -- Calculate total capital raised for ACTIVE investments only
    SELECT COALESCE(SUM(amount_invested), 0)
    INTO v_total_capital
    FROM public.investments
    WHERE opportunity_id = NEW.opportunity_id
      AND status = 'active';

    IF v_total_capital > 0 THEN
        FOR v_investment IN 
            SELECT id, shareholder_id, amount_invested, status 
            FROM public.investments 
            WHERE opportunity_id = NEW.opportunity_id
        LOOP
            IF v_investment.status = 'active' THEN
                -- Calculate proportional NAV share rounded to 2 decimal places
                v_new_value := ROUND((v_investment.amount_invested / v_total_capital) * NEW.total_asset_value, 2);

                INSERT INTO public.investment_valuations (
                    investment_id, 
                    shareholder_id, 
                    opportunity_id, 
                    current_value, 
                    valuation_date
                ) VALUES (
                    v_investment.id,
                    v_investment.shareholder_id,
                    NEW.opportunity_id,
                    v_new_value,
                    NEW.valuation_date
                );
                
                UPDATE public.investments 
                SET current_value = v_new_value 
                WHERE id = v_investment.id;
            ELSE
                -- Exited or cancelled investments must have 0 current value
                UPDATE public.investments 
                SET current_value = 0 
                WHERE id = v_investment.id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger on opportunity_valuations
DROP TRIGGER IF EXISTS trigger_update_investment_valuations ON public.opportunity_valuations;
CREATE TRIGGER trigger_update_investment_valuations
AFTER INSERT OR UPDATE OF total_asset_value ON public.opportunity_valuations
FOR EACH ROW
EXECUTE FUNCTION public.update_investment_valuations();

-- 2. Update fn_add_investment_to_opportunity_valuation to handle additions and deductions
CREATE OR REPLACE FUNCTION public.fn_add_investment_to_opportunity_valuation()
RETURNS TRIGGER AS $$
DECLARE
    v_delta NUMERIC;
    v_latest_val RECORD;
    v_new_total NUMERIC;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_delta := COALESCE(NEW.amount_invested, 0);
    ELSE
        v_delta := COALESCE(NEW.amount_invested, 0) - COALESCE(OLD.amount_invested, 0);
    END IF;

    IF v_delta <> 0 AND NEW.opportunity_id IS NOT NULL THEN
        SELECT id, total_asset_value, valuation_date
        INTO v_latest_val
        FROM public.opportunity_valuations
        WHERE opportunity_id = NEW.opportunity_id
        ORDER BY valuation_date DESC, created_at DESC
        LIMIT 1;

        IF v_latest_val.id IS NOT NULL THEN
            v_new_total := GREATEST(0, COALESCE(v_latest_val.total_asset_value, 0) + v_delta);

            IF v_latest_val.valuation_date = CURRENT_DATE THEN
                UPDATE public.opportunity_valuations
                SET total_asset_value = v_new_total,
                    created_at = NOW()
                WHERE id = v_latest_val.id;
            ELSE
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
            SELECT GREATEST(0, COALESCE(SUM(amount_invested), v_delta))
            INTO v_new_total
            FROM public.investments
            WHERE opportunity_id = NEW.opportunity_id
              AND status = 'active';

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

        BEGIN
            UPDATE public.opportunities
            SET total_value = GREATEST(0, COALESCE(total_value, 0) + v_delta)
            WHERE id = NEW.opportunity_id;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_add_investment_to_opportunity_valuation ON public.investments;
CREATE TRIGGER trg_add_investment_to_opportunity_valuation
AFTER INSERT OR UPDATE OF amount_invested ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.fn_add_investment_to_opportunity_valuation();
