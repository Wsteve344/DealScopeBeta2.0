/*
  # Add deleted_at column to deals table

  1. Changes
    - Add `deleted_at` column to `deals` table for soft deletes
    - Column type: timestamptz (timestamp with timezone)
    - Nullable: true (deleted_at is NULL for active records)

  2. Purpose
    - Enable soft delete functionality for deals
    - Maintain data integrity by not permanently deleting records
    - Allow filtering of active/deleted deals
*/

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;