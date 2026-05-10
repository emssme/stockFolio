ALTER TABLE assets
    ADD COLUMN brokerage VARCHAR(50) NULL AFTER avg_purchase_price;
