CREATE TABLE reviews (
    id              UUID PRIMARY KEY,
    reviewer_id     UUID NOT NULL,
    reviewee_id     UUID NOT NULL,
    related_type    VARCHAR(15) NOT NULL,   -- TASK | RENTAL_OFFER
    related_id      UUID NOT NULL,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_reviews_reviewer_engagement UNIQUE (reviewer_id, related_type, related_id)
);
CREATE INDEX ix_reviews_reviewee_id ON reviews (reviewee_id);
CREATE INDEX ix_reviews_reviewer_id ON reviews (reviewer_id);

CREATE TABLE reports (
    id                UUID PRIMARY KEY,
    reporter_id       UUID NOT NULL,
    reported_user_id  UUID NOT NULL,
    reason_category   VARCHAR(25) NOT NULL,
    description       TEXT,
    status            VARCHAR(10) NOT NULL DEFAULT 'OPEN',  -- OPEN | REVIEWED | ACTIONED | DISMISSED
    admin_note        TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at       TIMESTAMPTZ
);
CREATE INDEX ix_reports_reported_user_id ON reports (reported_user_id);
CREATE INDEX ix_reports_status ON reports (status);
