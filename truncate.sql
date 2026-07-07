-- ====================================================================
-- CLOUDE-KITCHEN PostgreSQL Database Truncate & Reset Script
-- Run this script in DBeaver, pgAdmin, or PSQL to reset the database.
-- ====================================================================

-- 1. Truncate all transaction and business tables cascade
TRUNCATE TABLE 
    audit_logs, 
    order_chats, 
    notifications, 
    reviews, 
    payments, 
    wallet_transactions, 
    wallets, 
    subscription_meals, 
    monthly_subscriptions, 
    order_status_history, 
    order_items, 
    orders, 
    product_variants, 
    product_images, 
    products, 
    shops, 
    vendor_documents, 
    vendors, 
    user_roles, 
    roles, 
    addresses, 
    banners, 
    coupons, 
    settlements, 
    delivery_partners,
    bookings,
    categories,
    app_settings
    CASCADE;

-- 2. Clear all users except for the SuperAdmin
DELETE FROM user_register WHERE role <> 'superadmin';

-- 3. Seed/Reset SuperAdmin credentials to 'Dev Kumar' (8527430152@slc)
INSERT INTO user_register (
    id, email, first_name, last_name, phone_number, role, is_verified, upi_number, upi_id, created_at
)
VALUES (
    'usr-admin-dev', 
    'admin@gmail.com', 
    'Dev', 
    'Kumar', 
    '8527430152', 
    'superadmin', 
    true, 
    '8527430152', 
    '8527430152@slc', 
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE 
SET first_name = 'Dev', 
    last_name = 'Kumar', 
    phone_number = '8527430152', 
    role = 'superadmin', 
    upi_number = '8527430152', 
    upi_id = '8527430152@slc';

-- 4. Seed basic food categories
INSERT INTO categories (id, name, image_url, is_active)
VALUES 
    ('cat-pizza', 'Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120', true),
    ('cat-burger', 'Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120', true),
    ('cat-cake', 'Cake', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120', true),
    ('cat-coffee', 'Coffee', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120', true),
    ('cat-colddrink', 'Cold Drink', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120', true),
    ('cat-snacks', 'Snacks', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=120', true),
    ('cat-meal', 'Meal', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120', true),
    ('cat-vegan', 'Vegan', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120', true),
    ('cat-dessert', 'Dessert', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=120', true),
    ('cat-drinks', 'Drinks', 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=120', true)
ON CONFLICT (name) DO NOTHING;

-- 5. Seed promo banners
INSERT INTO banners (id, image_url, link_url, is_active)
VALUES 
    ('ban-1', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', 'restaurant/shp-seed-2', true),
    ('ban-2', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', 'restaurant/shp-seed-1', true),
    ('ban-3', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', 'restaurant/shp-seed-6', true)
ON CONFLICT (id) DO NOTHING;
