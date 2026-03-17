-- Add death_defiance_used flag to campaigns for the Death Defiance mechanic
-- (unlocked at 5 deaths, single-use per campaign: revive at 1 HP instead of dying)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS death_defiance_used BOOLEAN DEFAULT FALSE;
