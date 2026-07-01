namespace CloudeKicten
{
    public static class Sql
    {
        // ==========================================
        // DDL: Table Creation Commands
        // ==========================================

        public const string CreateUsersTable = @"
            CREATE TABLE IF NOT EXISTS user_register (
                id VARCHAR(50) PRIMARY KEY,
                email VARCHAR(150) NOT NULL UNIQUE,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone_number VARCHAR(20) NULL,
                avatar VARCHAR(500) NULL,
                gender VARCHAR(20) NULL,
                role VARCHAR(50) NOT NULL,
                reward_points INT DEFAULT 0,
                otp VARCHAR(10) NULL,
                otp_expires_at TIMESTAMP NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateRolesTable = @"
            CREATE TABLE IF NOT EXISTS roles (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            );";

        public const string CreateUserRolesTable = @"
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            );";

        public const string CreateVendorsTable = @"
            CREATE TABLE IF NOT EXISTS vendors (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                business_name VARCHAR(150) NOT NULL,
                owner_name VARCHAR(150) NOT NULL,
                cuisines VARCHAR(250) NOT NULL,
                type VARCHAR(50) NOT NULL,
                is_approved VARCHAR(50) DEFAULT 'pending',
                commission_rate NUMERIC(5,2) DEFAULT 10.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateVendorDocumentsTable = @"
            CREATE TABLE IF NOT EXISTS vendor_documents (
                id VARCHAR(50) PRIMARY KEY,
                vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                document_type VARCHAR(100) NOT NULL,
                document_url VARCHAR(500) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateShopsTable = @"
            CREATE TABLE IF NOT EXISTS shops (
                id VARCHAR(50) PRIMARY KEY,
                vendor_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                name VARCHAR(150) NOT NULL,
                type VARCHAR(50) NOT NULL,
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
                logo_url VARCHAR(500) NULL,
                address VARCHAR(500) NULL,
                floor VARCHAR(50) NULL,
                office_gali_number VARCHAR(100) NULL,
                latitude NUMERIC(10,8) NULL,
                longitude NUMERIC(11,8) NULL,
                is_approved VARCHAR(50) DEFAULT 'pending',
                bank_account VARCHAR(150) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string AlterShopsTable = @"
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL;
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL;
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS floor VARCHAR(50) NULL;
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS office_gali_number VARCHAR(100) NULL;
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8) NULL;
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8) NULL;
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_approved VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE shops ADD COLUMN IF NOT EXISTS bank_account VARCHAR(150) NULL;

            -- Re-bind vendor_id reference to user_register(id) instead of vendors(id)
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'shops_vendor_id_fkey' AND table_name = 'shops'
                ) THEN
                    ALTER TABLE shops DROP CONSTRAINT shops_vendor_id_fkey;
                END IF;
                
                ALTER TABLE shops ADD CONSTRAINT shops_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES user_register(id) ON DELETE CASCADE;
            END $$;

            -- Flow Document Table Alignments
            ALTER TABLE user_register ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8) NULL;
            ALTER TABLE user_register ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8) NULL;
            ALTER TABLE user_register ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

            ALTER TABLE shops ADD COLUMN IF NOT EXISTS category_id VARCHAR(50) NULL;

            ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id VARCHAR(50) NULL;

            ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km NUMERIC(5,2) DEFAULT 0.0;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) NULL;
            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS documents_url VARCHAR(500) NULL;
            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL;
            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS license_photo_url VARCHAR(500) NULL;
            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS vehicle_photo_url VARCHAR(500) NULL;
            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS id_proof_url VARCHAR(500) NULL;
            ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(100) NULL;

            ALTER TABLE shops ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500) NULL;

            ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_by_rider_at TIMESTAMP NULL;

            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS order_id VARCHAR(50) NULL;
        ";

        public const string CreateOrderChatsTable = @"
            CREATE TABLE IF NOT EXISTS order_chats (
                id VARCHAR(50) PRIMARY KEY,
                order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                sender_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                message VARCHAR(1000) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ";

        public const string CreateCategoriesTable = @"
            CREATE TABLE IF NOT EXISTS categories (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                image_url VARCHAR(500) NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateProductsTable = @"
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
            );";

        public const string CreateProductImagesTable = @"
            CREATE TABLE IF NOT EXISTS product_images (
                id VARCHAR(50) PRIMARY KEY,
                product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                image_url VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateProductVariantsTable = @"
            CREATE TABLE IF NOT EXISTS product_variants (
                id VARCHAR(50) PRIMARY KEY,
                product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                price_offset NUMERIC(18,2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateCustomersTable = @"
            CREATE TABLE IF NOT EXISTS customers (
                id VARCHAR(50) PRIMARY KEY REFERENCES user_register(id) ON DELETE CASCADE,
                default_address_id VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateDeliveryPartnersTable = @"
            CREATE TABLE IF NOT EXISTS delivery_partners (
                id VARCHAR(50) PRIMARY KEY REFERENCES user_register(id) ON DELETE CASCADE,
                vehicle_number VARCHAR(50) NOT NULL,
                license_number VARCHAR(50) NOT NULL,
                is_approved BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                current_latitude NUMERIC(10,8) NULL,
                current_longitude NUMERIC(11,8) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateOrdersTable = @"
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
                status VARCHAR(50) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                order_date VARCHAR(100) NOT NULL,
                rider_id VARCHAR(50) NULL REFERENCES user_register(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateOrderItemsTable = @"
            CREATE TABLE IF NOT EXISTS order_items (
                id VARCHAR(50) PRIMARY KEY,
                order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                name VARCHAR(150) NOT NULL,
                price NUMERIC(18,2) NOT NULL,
                quantity INT NOT NULL
            );";

        public const string CreateOrderStatusHistoryTable = @"
            CREATE TABLE IF NOT EXISTS order_status_history (
                id VARCHAR(50) PRIMARY KEY,
                order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                updated_by VARCHAR(50) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateMonthlySubscriptionsTable = @"
            CREATE TABLE IF NOT EXISTS monthly_subscriptions (
                id VARCHAR(50) PRIMARY KEY,
                customer_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                plan_name VARCHAR(100) NOT NULL,
                frequency INT NOT NULL,
                duration_days INT NOT NULL,
                meals_selected VARCHAR(150) NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                price NUMERIC(18,2) NOT NULL,
                paid_amount NUMERIC(18,2) NOT NULL,
                payment_status VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateSubscriptionMealsTable = @"
            CREATE TABLE IF NOT EXISTS subscription_meals (
                id VARCHAR(50) PRIMARY KEY,
                subscription_id VARCHAR(50) NOT NULL REFERENCES monthly_subscriptions(id) ON DELETE CASCADE,
                meal_date DATE NOT NULL,
                meal_type VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateBookingsTable = @"
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(50) PRIMARY KEY,
                customer_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                booking_date TIMESTAMP NOT NULL,
                guest_count INT NOT NULL,
                special_notes VARCHAR(500) NULL,
                total_price NUMERIC(18,2) NOT NULL,
                paid_amount NUMERIC(18,2) NOT NULL,
                payment_status VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreatePaymentsTable = @"
            CREATE TABLE IF NOT EXISTS payments (
                id VARCHAR(50) PRIMARY KEY,
                order_id VARCHAR(50) NULL REFERENCES orders(id) ON DELETE SET NULL,
                subscription_id VARCHAR(50) NULL REFERENCES monthly_subscriptions(id) ON DELETE SET NULL,
                amount NUMERIC(18,2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                transaction_id VARCHAR(150) NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateWalletsTable = @"
            CREATE TABLE IF NOT EXISTS wallets (
                id VARCHAR(50) PRIMARY KEY REFERENCES user_register(id) ON DELETE CASCADE,
                balance NUMERIC(18,2) NOT NULL DEFAULT 0.00,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateWalletTransactionsTable = @"
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id VARCHAR(50) PRIMARY KEY,
                wallet_id VARCHAR(50) NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
                amount NUMERIC(18,2) NOT NULL,
                type VARCHAR(20) NOT NULL,
                description VARCHAR(250) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateCouponsTable = @"
            CREATE TABLE IF NOT EXISTS coupons (
                id VARCHAR(50) PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                discount_type VARCHAR(20) NOT NULL,
                discount_value NUMERIC(18,2) NOT NULL,
                max_discount NUMERIC(18,2) NOT NULL,
                min_order NUMERIC(18,2) NOT NULL,
                expiry_date TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateReviewsTable = @"
            CREATE TABLE IF NOT EXISTS reviews (
                id VARCHAR(50) PRIMARY KEY,
                order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                customer_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                kitchen_id VARCHAR(50) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                rating INT NOT NULL,
                comment VARCHAR(500) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateNotificationsTable = @"
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                title VARCHAR(150) NOT NULL,
                body VARCHAR(500) NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateAddressesTable = @"
            CREATE TABLE IF NOT EXISTS addresses (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                address_name VARCHAR(100) NOT NULL,
                address_line VARCHAR(250) NOT NULL,
                latitude NUMERIC(10,8) NULL,
                longitude NUMERIC(11,8) NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateBannersTable = @"
            CREATE TABLE IF NOT EXISTS banners (
                id VARCHAR(50) PRIMARY KEY,
                image_url VARCHAR(500) NOT NULL,
                link_url VARCHAR(500) NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateSettlementsTable = @"
            CREATE TABLE IF NOT EXISTS settlements (
                id VARCHAR(50) PRIMARY KEY,
                user_type VARCHAR(50) NOT NULL,
                user_id VARCHAR(50) NOT NULL REFERENCES user_register(id) ON DELETE CASCADE,
                amount NUMERIC(18,2) NOT NULL,
                status VARCHAR(50) NOT NULL,
                transaction_details VARCHAR(250) NULL,
                settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        public const string CreateAppSettingsTable = @"
            CREATE TABLE IF NOT EXISTS app_settings (
                config_key VARCHAR(100) PRIMARY KEY,
                config_value VARCHAR(250) NOT NULL
            );";

        public const string CreateAuditLogsTable = @"
            CREATE TABLE IF NOT EXISTS audit_logs (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NULL,
                action VARCHAR(100) NOT NULL,
                details VARCHAR(500) NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );";

        // ==========================================
        // DML: CRUD Queries for Coupons, Wallet, Reviews, Notifications, Settings
        // ==========================================

        public const string InsertCoupon = @"
            INSERT INTO coupons (id, code, discount_type, discount_value, max_discount, min_order, expiry_date, is_active, created_at)
            VALUES (@Id, @Code, @DiscountType, @DiscountValue, @MaxDiscount, @MinOrder, @ExpiryDate, @IsActive, CURRENT_TIMESTAMP);
        ";

        public const string GetAllCoupons = @"
            SELECT id, code, discount_type, discount_value, max_discount, min_order, expiry_date, is_active, created_at
            FROM coupons
            WHERE is_active = TRUE AND expiry_date > CURRENT_TIMESTAMP;
        ";

        public const string GetCouponByCode = @"
            SELECT id, code, discount_type, discount_value, max_discount, min_order, expiry_date, is_active, created_at
            FROM coupons
            WHERE code = @Code;
        ";

        public const string InsertWallet = @"
            INSERT INTO wallets (id, balance, updated_at)
            VALUES (@Id, @Balance, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO NOTHING;
        ";

        public const string GetWalletByUserId = @"
            SELECT id, balance, updated_at
            FROM wallets
            WHERE id = @Id;
        ";

        public const string UpdateWalletBalance = @"
            UPDATE wallets
            SET balance = balance + @Amount, updated_at = CURRENT_TIMESTAMP
            WHERE id = @Id;
        ";

        public const string InsertWalletTransaction = @"
            INSERT INTO wallet_transactions (id, wallet_id, amount, type, description, created_at)
            VALUES (@Id, @WalletId, @Amount, @Type, @Description, CURRENT_TIMESTAMP);
        ";

        public const string GetWalletTransactions = @"
            SELECT id, wallet_id, amount, type, description, created_at
            FROM wallet_transactions
            WHERE wallet_id = @WalletId
            ORDER BY created_at DESC;
        ";

        public const string InsertReview = @"
            INSERT INTO reviews (id, order_id, customer_id, kitchen_id, rating, comment, created_at)
            VALUES (@Id, @OrderId, @CustomerId, @KitchenId, @Rating, @Comment, CURRENT_TIMESTAMP);
        ";

        public const string GetReviewsByKitchenId = @"
            SELECT id, order_id, customer_id, kitchen_id, rating, comment, created_at
            FROM reviews
            WHERE kitchen_id = @KitchenId
            ORDER BY created_at DESC;
        ";

        public const string InsertNotification = @"
            INSERT INTO notifications (id, user_id, title, body, is_read, created_at)
            VALUES (@Id, @UserId, @Title, @Body, FALSE, CURRENT_TIMESTAMP);
        ";

        public const string GetNotificationsByUserId = @"
            SELECT id, user_id, title, body, is_read, created_at
            FROM notifications
            WHERE user_id = @UserId
            ORDER BY created_at DESC;
        ";

        public const string UpdateNotificationReadStatus = @"
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = @UserId;
        ";

        public const string InsertAppSetting = @"
            INSERT INTO app_settings (config_key, config_value)
            VALUES (@Key, @Value)
            ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
        ";

        public const string GetAppSettingByKey = @"
            SELECT config_key, config_value
            FROM app_settings
            WHERE config_key = @Key;
        ";

        public const string InsertAuditLog = @"
            INSERT INTO audit_logs (id, user_id, action, details, timestamp)
            VALUES (@Id, @UserId, @Action, @Details, CURRENT_TIMESTAMP);
        ";

        // ==========================================
        // DML: User CRUD Queries
        // ==========================================

        public const string InsertUser = @"
            INSERT INTO user_register (id, email, first_name, last_name, phone_number, avatar, gender, role, reward_points, otp, otp_expires_at, is_verified, created_at)
            VALUES (@Id, @Email, @FirstName, @LastName, @Phone, @Avatar, @Gender, @Role, @RewardPoints, @Otp, @OtpExpiry, FALSE, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO UPDATE 
            SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;
        ";

        public const string GetUserByEmail = @"
            SELECT id, email, first_name, last_name, phone_number, avatar, gender, role, reward_points, otp, otp_expires_at, is_verified, created_at
            FROM user_register 
            WHERE LOWER(email) = LOWER(@Email);
        ";

        public const string GetUserById = @"
            SELECT id, email, first_name, last_name, phone_number, avatar, gender, role, reward_points, otp, otp_expires_at, is_verified, created_at
            FROM user_register 
            WHERE id = @Id;
        ";

        public const string UpdateUserOtp = @"
            UPDATE user_register 
            SET otp = @Otp, otp_expires_at = @OtpExpiry 
            WHERE LOWER(email) = LOWER(@Email);
        ";

        public const string ClearUserOtp = @"
            UPDATE user_register 
            SET otp = NULL, otp_expires_at = NULL, is_verified = TRUE
            WHERE LOWER(email) = LOWER(@Email);
        ";

        public const string UpdateUserProfile = @"
            UPDATE user_register
            SET first_name = @FirstName, last_name = @LastName, phone_number = @Phone, avatar = @Avatar, gender = @Gender, role = @Role, reward_points = @RewardPoints
            WHERE id = @Id;
        ";

        // ==========================================
        // DML: Kitchen (Shops) Queries
        // ==========================================

        public const string InsertKitchen = @"
            INSERT INTO shops (id, vendor_id, name, type, cuisines, rating, rating_count, prep_time, distance, offer, image_url, is_live, revenue, orders_count, logo_url, address, floor, office_gali_number, latitude, longitude, is_approved, bank_account, created_at)
            VALUES (@Id, @VendorId, @Name, @Type, @Cuisines, @Rating, @RatingCount, @Time, @Distance, @Offer, @Image, @IsLive, @Revenue, @OrdersCount, @LogoUrl, @Address, @Floor, @OfficeGaliNumber, @Latitude, @Longitude, @IsApproved, @BankAccount, CURRENT_TIMESTAMP);
        ";

        public const string GetAllKitchens = @"
            SELECT s.id, s.vendor_id, s.name, s.type, s.cuisines, s.rating, s.rating_count, s.prep_time, s.distance, s.offer, s.image_url, s.is_live, s.revenue, s.orders_count, s.logo_url, s.address, s.floor, s.office_gali_number, s.latitude, s.longitude, s.is_approved, s.bank_account, s.created_at,
                   COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Housewife Partner') AS owner_name
            FROM shops s
            LEFT JOIN user_register u ON s.vendor_id = u.id
            ORDER BY s.name ASC;
        ";

        public const string GetKitchenById = @"
            SELECT s.id, s.vendor_id, s.name, s.type, s.cuisines, s.rating, s.rating_count, s.prep_time, s.distance, s.offer, s.image_url, s.is_live, s.revenue, s.orders_count, s.logo_url, s.address, s.floor, s.office_gali_number, s.latitude, s.longitude, s.is_approved, s.bank_account, s.created_at,
                   COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Housewife Partner') AS owner_name
            FROM shops s
            LEFT JOIN user_register u ON s.vendor_id = u.id
            WHERE s.id = @Id;
        ";

        public const string UpdateKitchen = @"
            UPDATE shops
            SET name = @Name, type = @Type, cuisines = @Cuisines, prep_time = @Time, distance = @Distance, offer = @Offer, image_url = @Image, is_live = @IsLive, logo_url = @LogoUrl, address = @Address, floor = @Floor, office_gali_number = @OfficeGaliNumber, latitude = @Latitude, longitude = @Longitude, is_approved = @IsApproved
            WHERE id = @Id;
        ";

        public const string DeleteKitchen = @"
            DELETE FROM shops WHERE id = @Id;
        ";

        public const string UpdateKitchenStats = @"
            UPDATE shops
            SET revenue = revenue + @TotalAmount, orders_count = orders_count + 1
            WHERE id = @Id;
        ";

        // ==========================================
        // DML: Product Queries
        // ==========================================

        public const string InsertProduct = @"
            INSERT INTO products (id, kitchen_id, name, price, description, category_name, is_veg, image_url, customizable, created_at)
            VALUES (@Id, @KitchenId, @Name, @Price, @Description, @Category, @IsVeg, @Image, @Customizable, CURRENT_TIMESTAMP);
        ";

        public const string GetAllProducts = @"
            SELECT id, kitchen_id, name, price, description, category_name, is_veg, image_url, customizable, created_at
            FROM products;
        ";

        public const string GetProductsByKitchenId = @"
            SELECT id, kitchen_id, name, price, description, category_name, is_veg, image_url, customizable, created_at
            FROM products
            WHERE kitchen_id = @KitchenId;
        ";

        public const string GetProductById = @"
            SELECT id, kitchen_id, name, price, description, category_name, is_veg, image_url, customizable, created_at
            FROM products
            WHERE id = @Id;
        ";

        public const string UpdateProduct = @"
            UPDATE products
            SET name = @Name, price = @Price, description = @Description, category_name = @Category, is_veg = @IsVeg, image_url = @Image, customizable = @Customizable
            WHERE id = @Id;
        ";

        public const string DeleteProduct = @"
            DELETE FROM products WHERE id = @Id;
        ";

        // ==========================================
        // DML: Order Queries
        // ==========================================

        public const string InsertOrder = @"
            INSERT INTO orders (id, kitchen_id, customer_id, items_json, subtotal, delivery_charge, tax, discount, total, status, payment_method, order_date, rider_id, created_at)
            VALUES (@Id, @KitchenId, @CustomerId, @ItemsJson, @Subtotal, @DeliveryCharge, @Tax, @Discount, @Total, @Status, @PaymentMethod, @OrderDate, @RiderId, CURRENT_TIMESTAMP);
        ";

        public const string GetAllOrders = @"
            SELECT id, kitchen_id, customer_id, items_json, subtotal, delivery_charge, tax, discount, total, status, payment_method, order_date, rider_id, created_at
            FROM orders
            ORDER BY created_at DESC;
        ";

        public const string GetOrderById = @"
            SELECT id, kitchen_id, customer_id, items_json, subtotal, delivery_charge, tax, discount, total, status, payment_method, order_date, rider_id, created_at
            FROM orders
            WHERE id = @Id;
        ";

        public const string GetOrdersByCustomerId = @"
            SELECT id, kitchen_id, customer_id, items_json, subtotal, delivery_charge, tax, discount, total, status, payment_method, order_date, rider_id, created_at
            FROM orders
            WHERE customer_id = @CustomerId
            ORDER BY created_at DESC;
        ";

        public const string GetOrdersByKitchenId = @"
            SELECT id, kitchen_id, customer_id, items_json, subtotal, delivery_charge, tax, discount, total, status, payment_method, order_date, rider_id, created_at
            FROM orders
            WHERE kitchen_id = @KitchenId
            ORDER BY created_at DESC;
        ";

        public const string UpdateOrderStatus = @"
            UPDATE orders
            SET status = @Status
            WHERE id = @Id;
        ";

        public const string AssignRiderToOrder = @"
            UPDATE orders
            SET rider_id = @RiderId
            WHERE id = @Id;
        ";

        public const string DeleteOrder = @"
            DELETE FROM orders WHERE id = @Id;
        ";

        // ==========================================
        // DML: Meal Subscription Queries
        // ==========================================

        public const string InsertSubscription = @"
            INSERT INTO monthly_subscriptions (id, customer_id, kitchen_id, plan_name, frequency, duration_days, meals_selected, start_date, end_date, price, paid_amount, payment_status, status, created_at)
            VALUES (@Id, @CustomerId, @KitchenId, @PlanName, @Frequency, @DurationDays, @MealsSelected, @StartDate, @EndDate, @Price, @PaidAmount, @PaymentStatus, @Status, CURRENT_TIMESTAMP);
        ";

        public const string GetAllSubscriptions = @"
            SELECT id, customer_id, kitchen_id, plan_name, frequency, duration_days, meals_selected, start_date, end_date, price, paid_amount, payment_status, status, created_at
            FROM monthly_subscriptions
            ORDER BY created_at DESC;
        ";

        public const string GetSubscriptionById = @"
            SELECT id, customer_id, kitchen_id, plan_name, frequency, duration_days, meals_selected, start_date, end_date, price, paid_amount, payment_status, status, created_at
            FROM monthly_subscriptions
            WHERE id = @Id;
        ";

        public const string GetSubscriptionsByCustomerId = @"
            SELECT id, customer_id, kitchen_id, plan_name, frequency, duration_days, meals_selected, start_date, end_date, price, paid_amount, payment_status, status, created_at
            FROM monthly_subscriptions
            WHERE customer_id = @CustomerId
            ORDER BY created_at DESC;
        ";

        public const string GetSubscriptionsByKitchenId = @"
            SELECT id, customer_id, kitchen_id, plan_name, frequency, duration_days, meals_selected, start_date, end_date, price, paid_amount, payment_status, status, created_at
            FROM monthly_subscriptions
            WHERE kitchen_id = @KitchenId
            ORDER BY created_at DESC;
        ";

        public const string UpdateSubscriptionStatus = @"
            UPDATE monthly_subscriptions
            SET status = @Status
            WHERE id = @Id;
        ";

        // ==========================================
        // DML: Bulk Kitchen Booking Queries
        // ==========================================

        public const string InsertBooking = @"
            INSERT INTO bookings (id, customer_id, kitchen_id, booking_date, guest_count, special_notes, total_price, paid_amount, payment_status, status, created_at)
            VALUES (@Id, @CustomerId, @KitchenId, @BookingDate, @GuestCount, @SpecialNotes, @TotalPrice, @PaidAmount, @PaymentStatus, @Status, CURRENT_TIMESTAMP);
        ";

        public const string GetAllBookings = @"
            SELECT id, customer_id, kitchen_id, booking_date, guest_count, special_notes, total_price, paid_amount, payment_status, status, created_at
            FROM bookings
            ORDER BY created_at DESC;
        ";

        public const string GetBookingById = @"
            SELECT id, customer_id, kitchen_id, booking_date, guest_count, special_notes, total_price, paid_amount, payment_status, status, created_at
            FROM bookings
            WHERE id = @Id;
        ";

        public const string GetBookingsByCustomerId = @"
            SELECT id, customer_id, kitchen_id, booking_date, guest_count, special_notes, total_price, paid_amount, payment_status, status, created_at
            FROM bookings
            WHERE customer_id = @CustomerId
            ORDER BY created_at DESC;
        ";

        public const string GetBookingsByKitchenId = @"
            SELECT id, customer_id, kitchen_id, booking_date, guest_count, special_notes, total_price, paid_amount, payment_status, status, created_at
            FROM bookings
            WHERE kitchen_id = @KitchenId
            ORDER BY created_at DESC;
        ";

        public const string UpdateBookingStatus = @"
            UPDATE bookings
            SET status = @Status
            WHERE id = @Id;
        ";

        // ==========================================
        // DML: Rider Details & Tracking
        // ==========================================

        public const string InsertRider = @"
            INSERT INTO delivery_partners (id, vehicle_number, license_number, is_approved, is_active, current_latitude, current_longitude, delivery_zone, created_at)
            VALUES (@Id, @VehicleNumber, @LicenseNumber, FALSE, @IsActive, NULL, NULL, @DeliveryZone, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE 
            SET vehicle_number = EXCLUDED.vehicle_number, license_number = EXCLUDED.license_number, is_active = EXCLUDED.is_active, delivery_zone = EXCLUDED.delivery_zone;
        ";

        public const string GetRiderById = @"
            SELECT id, vehicle_number, license_number, is_approved, is_active, current_latitude, current_longitude, delivery_zone, created_at
            FROM delivery_partners
            WHERE id = @Id;
        ";

        public const string UpdateRiderLocation = @"
            UPDATE delivery_partners
            SET current_latitude = @Latitude, current_longitude = @Longitude
            WHERE id = @Id;
        ";

        public const string UpdateRiderStatus = @"
            UPDATE delivery_partners
            SET is_active = @IsActive
            WHERE id = @Id;
        ";

        public const string UpdateRiderApproval = @"
            UPDATE delivery_partners
            SET is_approved = @IsApproved
            WHERE id = @Id;
        ";

        // ==========================================
        // DML: Vendor Specific Queries
        // ==========================================

        public const string InsertVendor = @"
            INSERT INTO vendors (id, user_id, business_name, owner_name, cuisines, type, is_approved, commission_rate, created_at)
            VALUES (@Id, @UserId, @BusinessName, @OwnerName, @Cuisines, @Type, @IsApproved, @CommissionRate, CURRENT_TIMESTAMP);
        ";

        public const string GetVendorById = @"
            SELECT id, user_id, business_name, owner_name, cuisines, type, is_approved, commission_rate, created_at
            FROM vendors
            WHERE id = @Id;
        ";

        public const string GetVendorByUserId = @"
            SELECT id, user_id, business_name, owner_name, cuisines, type, is_approved, commission_rate, created_at
            FROM vendors
            WHERE user_id = @UserId;
        ";

        public const string UpdateVendorApproval = @"
            UPDATE vendors
            SET is_approved = @IsApproved
            WHERE id = @Id;
        ";

        public const string InsertVendorDocument = @"
            INSERT INTO vendor_documents (id, vendor_id, document_type, document_url, status, uploaded_at)
            VALUES (@Id, @VendorId, @DocumentType, @DocumentUrl, 'pending', CURRENT_TIMESTAMP);
        ";

        public const string GetVendorDocuments = @"
            SELECT id, vendor_id, document_type, document_url, status, uploaded_at
            FROM vendor_documents
            WHERE vendor_id = @VendorId;
        ";

        public const string UpdateVendorDocumentStatus = @"
            UPDATE vendor_documents
            SET status = @Status
            WHERE id = @Id;
        ";

        public const string InsertChat = @"
            INSERT INTO order_chats (id, order_id, sender_id, message, created_at)
            VALUES (@Id, @OrderId, @SenderId, @Message, CURRENT_TIMESTAMP);
        ";

        public const string GetChatsByOrderId = @"
            SELECT c.id, c.order_id, c.sender_id, c.message, c.created_at,
                   CONCAT(u.first_name, ' ', u.last_name) AS sender_name
            FROM order_chats c
            LEFT JOIN user_register u ON c.sender_id = u.id
            WHERE c.order_id = @OrderId
            ORDER BY c.created_at ASC;
        ";
    }
}
