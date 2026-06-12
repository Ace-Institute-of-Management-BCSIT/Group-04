use skillswap;
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    rating INT CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,

    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
);