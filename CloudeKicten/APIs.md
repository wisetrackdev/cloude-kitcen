# 🍔 CloudeKitchen REST API Documentation

This document describes all API endpoints available in the **CloudeKitchen** backend, categorized by roles: **Customer (User)**, **Vendor (Seller / Housewife)**, **Rider (Delivery Boy)**, and **SuperAdmin**.

* **Base URL**: `http://localhost:5059` (or `http://10.0.2.2:5059` for Android Emulator)
* **Auth Scheme**: JWT Bearer (`Authorization: Bearer <token>`)

---

## 🔑 1. Common Authentication APIs
All roles register and log in through these base endpoints.

### Request OTP Login
* **Endpoint**: `POST /api/auth/request-otp`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "customer.name@gmail.com"
}
```
* **Description**: Generates a 6-digit OTP code, saves it to the database with a 10-minute expiry, and sends it via SMTP. 
* **Note**: First/Last names are automatically parsed from the email username part (e.g. `customer.name@gmail.com` ➡️ First Name: `Customer`, Last Name: `Name`).

### Verify OTP & Get Token
* **Endpoint**: `POST /api/auth/verify-otp`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "customer.name@gmail.com",
  "otp": "123456"
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "refreshToken": "4a08f51a2d6e...",
    "user": {
      "id": "usr_7382f1",
      "email": "customer.name@gmail.com",
      "name": "Customer Name",
      "phone": "+91 9876543210",
      "avatar": "https://cloudinary.com/avatar.jpg",
      "gender": "male",
      "role": "customer",
      "rewardPoints": 10
    }
  }
}
```

---

## 🛒 2. Customer (User) APIs
Used by food buyers to browse kitchens, order items, subscribe to tiffin meal packages, or book party dining options.

### Fetch All Kitchens
* **Endpoint**: `GET /api/kitchens`
* **Access**: Customer, SuperAdmin
* **Description**: Lists nearby outlets, ratings, average prep times, distances, and running promo offers.

### Fetch Menu by Kitchen
* **Endpoint**: `GET /api/products?kitchenId=k1`
* **Access**: Customer, Vendor, SuperAdmin
* **Description**: Retrieves all food products listed under a specific kitchen, grouped by categories (e.g., Pizzas, Starters, Tiffins).

### Place Single Food Order
* **Endpoint**: `POST /api/orders`
* **Access**: Customer
* **Request Body**:
```json
{
  "kitchenId": "k1",
  "kitchenName": "The Pizza Box",
  "customerId": "usr_7382f1",
  "customerName": "Customer Name",
  "items": [
    { "id": "p1", "name": "Margherita Pizza", "price": 249, "quantity": 1 }
  ],
  "subtotal": 249.00,
  "deliveryCharge": 29.00,
  "tax": 12.45,
  "discount": 0.00,
  "total": 290.45,
  "paymentMethod": "cod"
}
```

### Subscribe to Meal Plans (Tiffin Services)
Customers can subscribe to daily homestyle tiffin meals (morning, afternoon, or evening) from home chefs (housewives) for **1 week** or **1 month**, with customization for meal frequency and payment options (Full or Half payment).
* **Endpoint**: `POST /api/subscriptions`
* **Access**: Customer
* **Request Body**:
```json
{
  "customerId": "usr_7382f1",
  "kitchenId": "k3",
  "planName": "Monthly Premium Homestyle Veg Meals",
  "frequency": 2, // 1 = Once/day (e.g. Lunch), 2 = Twice/day (Lunch & Dinner), 3 = Breakfast + Lunch + Dinner
  "durationDays": 30, // 7 = Weekly subscription, 30 = Monthly subscription
  "mealsSelected": "Lunch, Dinner", 
  "price": 4500.00, // Total cost for 30 days
  "paidAmount": 2250.00, // E.g., customer paid 50% upfront
  "paymentStatus": "half_paid" // Options: 'half_paid', 'fully_paid', 'unpaid'
}
```

### Reserve/Book Kitchen (Restaurant Booking)
Customers can reserve a kitchen outlet or home kitchen for small family gatherings or bulk catering operations.
* **Endpoint**: `POST /api/bookings`
* **Access**: Customer
* **Request Body**:
```json
{
  "customerId": "usr_7382f1",
  "kitchenId": "k3",
  "bookingDateString": "2026-07-15T19:00:00Z", // Reservation date & time
  "guestCount": 15,
  "specialNotes": "Requesting homestyle buffet service and decoration support",
  "totalPrice": 12000.00,
  "paidAmount": 6000.00, // Supports bulk half-payment options
  "paymentStatus": "half_paid" // Options: 'half_paid', 'fully_paid'
}
```

---

## 👩‍🍳 3. Vendor (Seller / Housewife) APIs
Used by home chefs and restaurant owners to register, list menu items, manage kitchen status, and monitor subscriptions/bookings.

### Register Vendor
* **Endpoint**: `POST /api/kitchens`
* **Access**: Vendor / SuperAdmin
* **Request Body**:
```json
{
  "name": "Maa Ki Rasoi",
  "ownerId": "usr_9281",
  "type": "home_tiffin", // Options: 'restaurant', 'home_tiffin'
  "cuisines": "North Indian, Pure Veg Thali",
  "time": "30-35 mins",
  "distance": "1.5 km",
  "offer": "₹50 OFF on first subscription",
  "image": "https://cloudinary.com/kitchen.jpg"
}
```

### Manage Kitchen Status / Profile
* **Endpoint**: `PUT /api/kitchens/{id}`
* **Access**: Vendor (Owner)
* **Request Body**:
```json
{
  "name": "Maa Ki Rasoi",
  "type": "home_tiffin",
  "cuisines": "North Indian, Pure Veg Thali",
  "time": "25-30 mins",
  "distance": "1.5 km",
  "offer": "10% OFF on all tiffins",
  "image": "https://cloudinary.com/kitchen_updated.jpg"
}
```

### Add Menu Product
* **Endpoint**: `POST /api/products`
* **Access**: Vendor (Owner)
* **Request Body**:
```json
{
  "kitchenId": "k3",
  "name": "Special Paneer Butter Masala Thali",
  "price": 160.00,
  "description": "4 Butter Rotis, Paneer Sabji, Dal Fry, Jeera Rice, Sweet, and Salad.",
  "category": "Tiffin Meals",
  "isVeg": true,
  "image": "https://cloudinary.com/paneer_thali.jpg",
  "customizable": false
}
```

### Edit Menu Product
* **Endpoint**: `PUT /api/products/{id}`
* **Access**: Vendor (Owner)

### Delete Menu Product
* **Endpoint**: `DELETE /api/products/{id}`
* **Access**: Vendor (Owner)

### Get Kitchen Subscriptions
* **Endpoint**: `GET /api/subscriptions?kitchenId=k3`
* **Access**: Vendor (Owner)
* **Description**: Retrieves all customers currently subscribed to their daily tiffin meal cycles (helps housewives plan raw materials for breakfast, lunch, and dinner).

### Get Kitchen Bookings
* **Endpoint**: `GET /api/bookings?kitchenId=k3`
* **Access**: Vendor (Owner)
* **Description**: Lists all bulk party/buffet reservations scheduled for their kitchen.

---

## 🛵 4. Rider (Delivery Boy) APIs
Used by delivery riders to register, set availability, accept order delivery tasks, and push live GPS locations.

### Register Rider Profile
* **Endpoint**: `POST /api/riders/register`
* **Access**: Public / Rider
* **Request Body**:
```json
{
  "userId": "usr_rider43",
  "vehicleNumber": "MH-02-CD-5678",
  "licenseNumber": "DL-9821827"
}
```
* **Description**: Upgrades the user's role to 'rider' and creates vehicle/driver records in the database.

### Toggle Availability Status
* **Endpoint**: `PUT /api/riders/{id}/status`
* **Access**: Rider
* **Request Body**:
```json
{
  "isActive": true // true = Active (shows in active riders map), false = Off duty
}
```

### Push Live GPS Location
* **Endpoint**: `PUT /api/riders/{id}/location`
* **Access**: Rider
* **Request Body**:
```json
{
  "latitude": 19.0792,
  "longitude": 72.8801
}
```
* **Description**: Updates the delivery boy's live GPS coordinates in the database to show live transit status to customers.

### Update Dispatch Delivery Status
* **Endpoint**: `PUT /api/orders/{orderId}/status`
* **Access**: Rider, Vendor
* **Request Body**:
```json
{
  "status": "on_the_way" // Options: 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled'
}
```

---

## 👑 5. SuperAdmin APIs
Used by platform owners to manage users, restaurants, riders, assign tasks, and monitor global analytics.

### Assign Rider to Order
* **Endpoint**: `PUT /api/orders/{id}/status` & `PUT /api/orders/{id}/assign-rider` (internal)
* **Access**: SuperAdmin
* **Request Body**:
```json
{
  "riderId": "usr_rider43"
}
```

### Fetch Global Bookings
* **Endpoint**: `GET /api/bookings`
* **Access**: SuperAdmin

### Fetch Global Subscriptions
* **Endpoint**: `GET /api/subscriptions`
* **Access**: SuperAdmin

### Delete/Suspend Outlets
* **Endpoint**: `DELETE /api/kitchens/{id}`
* **Access**: SuperAdmin
