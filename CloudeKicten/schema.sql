-- ==========================================
-- CloudeKitchen Pure PostgreSQL Database Schema
-- ==========================================

-- 1. Users Register Table
CREATE TABLE IF NOT EXISTS user_register (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NULL,
    avatar VARCHAR(500) NULL,
    gender VARCHAR(20) NULL,
    role VARCHAR(50) NOT NULL, -- 'customer', 'vendor', 'rider', 'superadmin'
    reward_points INT DEFAULT 0,
    otp VARCHAR(10) NULL,
    otp_expires_at TIMESTAMP NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);


-- 3. User Roles Mapping Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    cuisines VARCHAR(250) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'restaurant', 'home_tiffin'
    is_approved VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    commission_rate NUMERIC(5,2) DEFAULT 10.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Vendor KYC Documents Table
CREATE TABLE IF NOT EXISTS vendor_documents (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'KYC', 'FSSAI', 'GSTIN', 'PanCard'
    document_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shops (Kitchen Outlets) Table
CREATE TABLE IF NOT EXISTS shops (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'restaurant', 'home_tiffin'
    cuisines VARCHAR(250) NOT NULL,
    rating NUMERIC(3,2) DEFAULT 5.0,
    rating_count INT DEFAULT 0,
    prep_time VARCHAR(50) NOT NULL,
    distance VARCHAR(50) NOT NULL,
    offer VARCHAR(100) NULL,
    image_url VARCHAR(500) NULL,
    is_live BOOLEAN DEFAULT FALSE,
    revenue NUMERIC(18,2) DEFAULT 0.0,
    orders_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Products (Menu Items) Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NULL REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(18,2) NOT NULL,
    description VARCHAR(500) NULL,
    category_name VARCHAR(100) NOT NULL,
    is_veg BOOLEAN NOT NULL,
    image_url VARCHAR(500) NULL,
    customizable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_offset NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
    id VARCHAR(50) PRIMARY KEY REFERENCES user_register(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE, -- online/offline availability
    current_latitude NUMERIC(10,8) NULL,
    current_longitude NUMERIC(11,8) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    items_json TEXT NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    delivery_charge NUMERIC(18,2) NOT NULL,
    tax NUMERIC(18,2) NOT NULL,
    discount NUMERIC(18,2) NOT NULL,
    total NUMERIC(18,2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'placed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled'
    payment_method VARCHAR(50) NOT NULL,
    order_date VARCHAR(100) NOT NULL,
    rider_id VARCHAR(50) NULL REFERENCES user_register(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(18,2) NOT NULL,
    quantity INT NOT NULL
);

-- 14. Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Monthly Subscriptions Table
CREATE TABLE IF NOT EXISTS monthly_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    frequency INT NOT NULL, -- 1, 2, or 3 times/day thali
    duration_days INT NOT NULL, -- 7 or 30 days thali
    meals_selected VARCHAR(150) NOT NULL, -- 'Lunch', 'Lunch,Dinner'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    price NUMERIC(18,2) NOT NULL,
    paid_amount NUMERIC(18,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL, -- 'half_paid', 'fully_paid', 'unpaid'
    status VARCHAR(50) NOT NULL, -- 'active', 'paused', 'suspended', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Subscription Daily Meals Delivery Status Table
CREATE TABLE IF NOT EXISTS subscription_meals (
    id VARCHAR(50) PRIMARY KEY,
    subscription_id VARCHAR(50) NOT NULL REFERENCES monthly_subscriptions(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- 'Breakfast', 'Lunch', 'Snacks', 'Dinner'
    status VARCHAR(50) NOT NULL, -- 'pending', 'delivered', 'skipped'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Kitchen Outlet Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_date TIMESTAMP NOT NULL,
    guest_count INT NOT NULL,
    special_notes VARCHAR(500) NULL,
    total_price NUMERIC(18,2) NOT NULL,
    paid_amount NUMERIC(18,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL, -- 'half_paid', 'fully_paid'
    status VARCHAR(50) NOT NULL, -- 'pending', 'confirmed', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Payments Log Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NULL REFERENCES orders(id) ON DELETE SET NULL,
    subscription_id VARCHAR(50) NULL REFERENCES monthly_subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(18,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'success', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. User Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(50) PRIMARY KEY REFERENCES user_register(id) ON DELETE CASCADE,
    balance NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(50) PRIMARY KEY,
    wallet_id VARCHAR(50) NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount NUMERIC(18,2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'credit', 'debit'
    description VARCHAR(250) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Promo Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    discount_value NUMERIC(18,2) NOT NULL,
    max_discount NUMERIC(18,2) NOT NULL,
    min_order NUMERIC(18,2) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Customer Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    comment VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    body VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 24. Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    address_name VARCHAR(100) NOT NULL, -- 'Home', 'Office'
    address_line VARCHAR(250) NOT NULL,
    latitude NUMERIC(10,8) NULL,
    longitude NUMERIC(11,8) NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. Banners Table
CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(50) PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. Settlements Log Table
CREATE TABLE IF NOT EXISTS settlements (
    id VARCHAR(50) PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL, -- 'vendor', 'rider'
    user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
    amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'settled'
    transaction_details VARCHAR(250) NULL,
    settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 27. App Config Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value VARCHAR(250) NOT NULL
);

-- 28. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    action VARCHAR(100) NOT NULL,
    details VARCHAR(500) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
