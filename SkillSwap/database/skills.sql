use skillswap;
CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INT,
    location VARCHAR(100),
    status ENUM('active','inactive')
    DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);
