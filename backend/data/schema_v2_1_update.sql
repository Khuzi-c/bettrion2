-- Add Payment Methods and Features columns to casinos table

ALTER TABLE public.casinos 
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- Optional: Create a separate table for payment methods if we wanted strict foreign keys, 
-- but explicit requirement was "Allow per-casino selection from this fixed list" and "text-based labels".
-- An array of text is simplest and efficient for this scale.

-- If we need to standardize the list, we enforce it in the UI, 
-- but for DB integrity we could add a check constraint, but it's overkill given the flexibility needed.
