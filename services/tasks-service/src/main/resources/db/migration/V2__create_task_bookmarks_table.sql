CREATE TABLE task_bookmarks (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL,
    task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_task_bookmarks_user_task ON task_bookmarks (user_id, task_id);
CREATE INDEX ix_task_bookmarks_user_id ON task_bookmarks (user_id);
