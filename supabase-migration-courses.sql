-- Migration SQL for Supabase 'courses' table to match application schema
-- Run this in the Supabase SQL editor or psql

alter table courses
  add column if not exists custom_id text,
  add column if not exists name text,
  add column if not exists credits integer,
  add column if not exists classes_per_week integer,
  add column if not exists is_lab boolean,
  add column if not exists semester integer,
  add column if not exists program_id text,
  add column if not exists is_elective boolean default false,
  add column if not exists prerequisite_courses jsonb default '[]',
  add column if not exists is_nep boolean default false,
  add column if not exists nep_course_type text,
  add column if not exists department text;

-- Optional: create index for custom_id
create index if not exists idx_courses_custom_id on courses(custom_id);