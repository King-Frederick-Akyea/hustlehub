CREATE TABLE tasks (
    id                 UUID PRIMARY KEY,
    poster_id          UUID NOT NULL,
    title              VARCHAR(150) NOT NULL,
    description        TEXT NOT NULL,
    category           VARCHAR(20) NOT NULL,
    budget             NUMERIC(10, 2) NOT NULL,
    location           VARCHAR(255) NOT NULL,
    location_lat       DOUBLE PRECISION,
    location_lng       DOUBLE PRECISION,
    is_delivery        BOOLEAN NOT NULL DEFAULT FALSE,
    pickup_location    VARCHAR(255),
    pickup_lat         DOUBLE PRECISION,
    pickup_lng         DOUBLE PRECISION,
    dropoff_location   VARCHAR(255),
    dropoff_lat        DOUBLE PRECISION,
    dropoff_lng        DOUBLE PRECISION,
    deadline           TIMESTAMPTZ NOT NULL,
    is_urgent          BOOLEAN NOT NULL DEFAULT FALSE,
    status             VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_tasker_id UUID,
    final_price        NUMERIC(10, 2),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at       TIMESTAMPTZ
);

CREATE INDEX ix_tasks_poster_id ON tasks (poster_id);
CREATE INDEX ix_tasks_assigned_tasker_id ON tasks (assigned_tasker_id);
CREATE INDEX ix_tasks_status ON tasks (status);

CREATE TABLE bids (
    id            UUID PRIMARY KEY,
    task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tasker_id     UUID NOT NULL,
    amount        NUMERIC(10, 2) NOT NULL,
    message       VARCHAR(500),
    delivery_time VARCHAR(100),
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_bids_task_id ON bids (task_id);
CREATE INDEX ix_bids_tasker_id ON bids (tasker_id);
