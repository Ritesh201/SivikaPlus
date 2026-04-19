-- Add missing bank detail columns to seller_profiles
ALTER TABLE sivikaplus.seller_profiles
    ADD COLUMN IF NOT EXISTS bank_account_holder_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
