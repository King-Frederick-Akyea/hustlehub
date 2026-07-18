CREATE TABLE wallet_transactions (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL,
    amount      NUMERIC(10, 2) NOT NULL,
    type        VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_wallet_transactions_user_id ON wallet_transactions (user_id);
