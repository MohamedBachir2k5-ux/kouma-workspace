-- Drop duplicate trigger: the application layer (notify_users RPC) already handles
-- direct message notifications with better content (message preview).
-- The trigger was creating a generic duplicate notification for every direct message.
DROP TRIGGER IF EXISTS on_new_direct_message ON messages;
