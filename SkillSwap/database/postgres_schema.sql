-- PostgreSQL schema for SkillSwap
-- Run this inside the Render Postgres database using psql or the Render dashboard SQL editor.

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Skill Seeker', 'Skill Provider')),
    email_verified BOOLEAN DEFAULT FALSE,
    logout_count INTEGER DEFAULT 0,
    verification_code VARCHAR(10),
    verification_expires TIMESTAMP,
    avatar TEXT,
    bio TEXT,
    location VARCHAR(255),
    rating NUMERIC(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    description TEXT,
    skill_level VARCHAR(50) DEFAULT 'Intermediate' CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    price_per_session NUMERIC(10,2) DEFAULT 0.00,
    location VARCHAR(100) DEFAULT 'Kathmandu',
    availability VARCHAR(100) DEFAULT 'Flexible',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_provider ON skills(provider_id);
CREATE INDEX idx_skill_name ON skills(skill_name);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(user_id),
    receiver_id INTEGER NOT NULL REFERENCES users(user_id),
    message_text TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    seeker_id INTEGER NOT NULL REFERENCES users(user_id),
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id),
    booking_date DATE,
    booking_time TIME,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Completed', 'Cancelled')),
    session_status VARCHAR(20) DEFAULT 'Not Started',
    session_token VARCHAR(64),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(booking_id),
    amount NUMERIC(10,2),
    commission NUMERIC(10,2),
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed'))
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(booking_id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT
);

CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255)
);
