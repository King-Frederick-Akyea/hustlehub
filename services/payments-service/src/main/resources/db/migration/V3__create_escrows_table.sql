CREATE TABLE escrows (
    id                UUID PRIMARY KEY,
    payer_id          UUID NOT NULL,
    entity_type       VARCHAR(20) NOT NULL,
    related_entity_id UUID NOT NULL,
    amount            NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status            VARCHAR(20) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at       TIMESTAMPTZ,
    CONSTRAINT ck_escrows_status CHECK (status IN ('HELD', 'RELEASED', 'REFUNDED'))
);

-- One escrow row per task/offer ever - hold/adjust update this row in place, never insert a second one.
CREATE UNIQUE INDEX ux_escrows_related_entity ON escrows (related_entity_id);
CREATE INDEX ix_escrows_payer_id_status ON escrows (payer_id, status);
