CREATE TABLE listings (
    id              UUID PRIMARY KEY,
    owner_id        UUID NOT NULL,
    type            VARCHAR(10) NOT NULL,        -- RENTAL | BARTER
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    daily_rate      NUMERIC(10,2),                -- RENTAL only; null = cash not accepted for this listing
    barter_accepted BOOLEAN NOT NULL DEFAULT FALSE,-- RENTAL only; true = owner will also/instead accept a trade
    offering        VARCHAR(255),                 -- BARTER only: what the owner has to offer
    seeking         VARCHAR(255),                 -- BARTER: what they want; also RENTAL's barter preference when barter_accepted=true (e.g. "a book" or "a service")
    status          VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | CLOSED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_listings_owner_id ON listings (owner_id);
CREATE INDEX ix_listings_status_type ON listings (status, type);

CREATE TABLE listing_offers (
    id              UUID PRIMARY KEY,
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    requester_id    UUID NOT NULL,
    offer_type      VARCHAR(6) NOT NULL,          -- CASH | BARTER
    duration_days   INT,                          -- CASH rental offers only
    barter_message  TEXT,                         -- BARTER offers: what they're proposing
    status          VARCHAR(10) NOT NULL DEFAULT 'PENDING',  -- PENDING | ACCEPTED | REJECTED | WITHDRAWN
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_listing_offers_listing_id ON listing_offers (listing_id);
CREATE INDEX ix_listing_offers_requester_id ON listing_offers (requester_id);
