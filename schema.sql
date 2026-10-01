CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at BIGINT NOT NULL,
  INDEX idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  author VARCHAR(60) NOT NULL,
  title VARCHAR(100) NOT NULL,
  city VARCHAR(70) NOT NULL,
  country VARCHAR(70) NOT NULL,
  category ENUM('kuliner','destinasi','kafe') NOT NULL,
  story TEXT NOT NULL,
  image VARCHAR(500) NOT NULL,
  media_type ENUM('image','video') NOT NULL DEFAULT 'image',
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  INDEX idx_posts_created (created_at),
  INDEX idx_posts_category (category),
  INDEX idx_posts_geo (lat,lng),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS post_media (
  post_id CHAR(36) NOT NULL,
  position TINYINT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  media_type ENUM('image','video') NOT NULL,
  PRIMARY KEY (post_id,position),
  CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reactions (
  user_id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  kind ENUM('like','save') NOT NULL,
  PRIMARY KEY(user_id,post_id,kind),
  INDEX idx_reactions_post (post_id,kind),
  CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reactions_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ratings (
  user_id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  score TINYINT NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY(user_id,post_id),
  INDEX idx_ratings_post (post_id),
  CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
  id CHAR(36) PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  author VARCHAR(60) NOT NULL,
  body VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_comments_post_created (post_id,created_at),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
