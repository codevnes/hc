-- Add slug field to categories table
ALTER TABLE categories ADD COLUMN slug VARCHAR(255) AFTER name;

-- Add slug and thumbnail fields to posts table
ALTER TABLE posts ADD COLUMN slug VARCHAR(255) AFTER title;
ALTER TABLE posts ADD COLUMN thumbnail VARCHAR(255) AFTER slug;

-- Update existing categories to have slugs
UPDATE categories SET slug = LOWER(REPLACE(name, ' ', '-'));

-- Update existing posts to have slugs
UPDATE posts SET slug = LOWER(REPLACE(title, ' ', '-'));
