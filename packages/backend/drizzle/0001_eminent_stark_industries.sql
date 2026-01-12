-- First, delete any existing projects (since they have invalid vlnv data)
DELETE FROM "projects";

-- Then alter the column type
ALTER TABLE "projects" ALTER COLUMN "vlnv" SET DATA TYPE jsonb USING vlnv::jsonb;