-- Message reactions table: emoji reactions per user per message
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES profiles(id)  ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Members of the conversation can see all reactions in that conversation
CREATE POLICY "Conversation members can view reactions"
  ON message_reactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cm.user_id = auth.uid()
    )
  );

-- Users can add/remove their own reactions
CREATE POLICY "Users manage own reactions"
  ON message_reactions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;
