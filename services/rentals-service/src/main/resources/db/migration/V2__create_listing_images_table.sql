CREATE TABLE listing_images (
    id              UUID PRIMARY KEY,
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    storage_path    VARCHAR(500) NOT NULL,
    content_type    VARCHAR(20) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_listing_images_listing_id ON listing_images (listing_id, sort_order);
