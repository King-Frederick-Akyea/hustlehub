CREATE TABLE task_status_updates (
    id         UUID PRIMARY KEY,
    task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id  UUID NOT NULL,
    note       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_task_status_updates_task_id ON task_status_updates (task_id);
