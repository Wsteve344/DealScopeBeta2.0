-- Delete test contact requests
DELETE FROM contact_requests 
WHERE name = 'Test' 
  AND (
    email = 'test@test.com' 
    OR email = 'blahblah@gmail.com'
  );

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Cleaned up test contact requests';
END $$;