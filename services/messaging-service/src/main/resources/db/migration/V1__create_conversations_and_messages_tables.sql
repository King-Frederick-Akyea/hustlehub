CREATE TABLE conversations (
    id                  UUID PRIMARY KEY,
    participant_one_id  UUID NOT NULL,
    participant_two_id  UUID NOT NULL,
    related_task_id     UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at     TIMESTAMPTZ
);

-- participant_one_id is always the smaller UUID of the pair (enforced in application code),
-- so this uniquely identifies a single thread per pair of users regardless of who started it.
CREATE UNIQUE INDEX ux_conversations_participants ON conversations (participant_one_id, participant_two_id);
CREATE INDEX ix_conversations_participant_two_id ON conversations (participant_two_id);

CREATE TABLE messages (
    id              UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL,
    text            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX ix_messages_conversation_id_created_at ON messages (conversation_id, created_at);
