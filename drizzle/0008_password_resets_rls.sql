-- Access rules for the table added in 0007.
-- password_resets: system table like sessions. The public reset endpoint finds a link by its token
--                  hash before any workspace is known, and issuing runs on the owner role after the
--                  route checks the member belongs to the Director's workspace. So the restricted role
--                  gets no access at all (ALTER DEFAULT PRIVILEGES in 0004 granted it).

REVOKE ALL ON "password_resets" FROM app_rls;
