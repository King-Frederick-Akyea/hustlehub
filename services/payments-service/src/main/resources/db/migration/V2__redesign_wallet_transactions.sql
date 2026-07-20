-- Redesigns wallet_transactions into a real ledger: every row now carries a direction
-- (CREDIT/DEBIT) and a lifecycle status (PENDING/COMPLETED/FAILED) instead of being an
-- already-final fact, plus the fields needed to reconcile against Paystack (topups,
-- withdrawals) and to record the counterparty of internal wallet-to-wallet transfers
-- (task/rental payments).
--
-- ALTER, not a data migration: the table has zero rows in every environment this has been
-- applied to so far (confirmed via direct query before writing this). Does not touch V1's
-- already-applied definition.

ALTER TABLE wallet_transactions
    ALTER COLUMN type TYPE VARCHAR(30);

ALTER TABLE wallet_transactions
    ADD COLUMN direction          VARCHAR(6)   NOT NULL DEFAULT 'CREDIT',
    ADD COLUMN status             VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ADD COLUMN paystack_reference VARCHAR(100),
    ADD COLUMN related_user_id    UUID,
    ADD COLUMN related_entity_id  UUID,
    ADD COLUMN completed_at       TIMESTAMPTZ;

-- Defaults above only exist to satisfy NOT NULL while the column is being added to an (empty)
-- table; every write path going forward sets both explicitly, so no default should linger.
ALTER TABLE wallet_transactions ALTER COLUMN direction DROP DEFAULT;
ALTER TABLE wallet_transactions ALTER COLUMN status DROP DEFAULT;

ALTER TABLE wallet_transactions
    ADD CONSTRAINT ck_wallet_transactions_direction CHECK (direction IN ('CREDIT', 'DEBIT')),
    ADD CONSTRAINT ck_wallet_transactions_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'));

-- Paystack references (topup/withdrawal) must be unique when present, but plenty of rows (every
-- internal transfer leg) never have one, hence the partial index rather than a plain UNIQUE column.
CREATE UNIQUE INDEX ux_wallet_transactions_paystack_reference
    ON wallet_transactions (paystack_reference)
    WHERE paystack_reference IS NOT NULL;

-- Serves both "this user's transactions by status" (balance queries) and plain "this user's
-- transactions" (leftmost-prefix match) — replaces the old single-column user_id index.
CREATE INDEX ix_wallet_transactions_user_id_status ON wallet_transactions (user_id, status);
DROP INDEX IF EXISTS ix_wallet_transactions_user_id;
