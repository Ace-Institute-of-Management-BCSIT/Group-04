use skillswap;
CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    description TEXT,
    
    skill_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    
    price_per_session DECIMAL(10,2) DEFAULT 0.00,
    location VARCHAR(100) DEFAULT 'Kathmandu',
    availability VARCHAR(100) DEFAULT 'Flexible',
    
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (provider_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- Add useful indexes
CREATE INDEX idx_provider ON skills(provider_id);
CREATE INDEX idx_skill_name ON skills(skill_name);