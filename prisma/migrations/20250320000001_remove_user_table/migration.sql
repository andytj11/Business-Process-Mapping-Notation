-- First remove foreign key constraints
ALTER TABLE "Node" DROP CONSTRAINT IF EXISTS "Node_lockedById_fkey";
ALTER TABLE "PlaybookCollaborator" DROP CONSTRAINT IF EXISTS "PlaybookCollaborator_userId_fkey";
ALTER TABLE "CollaborationSession" DROP CONSTRAINT IF EXISTS "CollaborationSession_userId_fkey";
ALTER TABLE "ChangeLog" DROP CONSTRAINT IF EXISTS "ChangeLog_userId_fkey";

-- We need to modify the Playbook constraint since it references User
ALTER TABLE "Playbook" DROP CONSTRAINT IF EXISTS "Playbook_ownerId_fkey";

-- Drop the User table
DROP TABLE IF EXISTS "User";

-- Update the lockedById in Node to be text instead of reference
-- It will now store the Supabase Auth user ID directly
COMMENT ON COLUMN "Node"."lockedById" IS 'Supabase Auth user ID';
COMMENT ON COLUMN "PlaybookCollaborator"."userId" IS 'Supabase Auth user ID';
COMMENT ON COLUMN "CollaborationSession"."userId" IS 'Supabase Auth user ID';
COMMENT ON COLUMN "ChangeLog"."userId" IS 'Supabase Auth user ID';
COMMENT ON COLUMN "Playbook"."ownerId" IS 'Supabase Auth user ID';
