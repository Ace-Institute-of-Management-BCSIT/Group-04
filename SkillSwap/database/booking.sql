use skillswap;
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    seeker_id INT NOT NULL,
    skill_id INT NOT NULL,
    booking_date DATE,
    booking_time TIME,
    status ENUM('Pending','Accepted','Completed','Cancelled')
           DEFAULT 'Pending',

    FOREIGN KEY (seeker_id)
    REFERENCES users(user_id),

    FOREIGN KEY (skill_id)
    REFERENCES skills(skill_id)
);