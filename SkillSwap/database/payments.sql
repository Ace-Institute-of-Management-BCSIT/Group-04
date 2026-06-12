use skillswap;
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2),
    commission DECIMAL(10,2),
    payment_status ENUM('Pending','Paid','Failed')
                   DEFAULT 'Pending',

    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
);