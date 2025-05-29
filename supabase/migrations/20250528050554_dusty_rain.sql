/*
  # Add user relationship to contact notes

  1. Changes
    - Add foreign key constraint between contact_notes.user_id and users.id
    - This enables proper joins between contact notes and user data

  2. Security
    - No changes to RLS policies
    - Existing policies continue to protect access to both tables
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'contact_notes_user_id_fkey'
  ) THEN
    ALTER TABLE public.contact_notes
    ADD CONSTRAINT contact_notes_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users (id);
  END IF;
END $$;