CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  alt_text VARCHAR(255),
  title VARCHAR(255),
  caption TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
