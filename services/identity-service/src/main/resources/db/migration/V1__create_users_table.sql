CREATE TABLE users (
    id                   UUID PRIMARY KEY,
    full_name            VARCHAR(100)  NOT NULL,
    email                VARCHAR(254)  NOT NULL,
    password_hash        VARCHAR(100)  NOT NULL,
    role                 VARCHAR(20)   NOT NULL,
    verification_status  VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_users_email ON users (lower(email));
