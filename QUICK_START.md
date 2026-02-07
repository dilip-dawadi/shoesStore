# 🚀 Quick Start Guide

## Prerequisites

- Node.js v18+ installed
- PostgreSQL database (Docker recommended)
- Stripe account (free test mode)

## Step 1: Environment Setup

### Frontend `.env`

Create `.env` in root directory:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

Get your Stripe publishable key from: https://dashboard.stripe.com/test/apikeys

### Backend `.env`

Your `backend/.env` should have:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:pass@localhost:5432/myshoestore
JWT_SECRET=your_secret_key_here
STRIPE_SECRET_KEY=sk_test_51...
```

Get your Stripe secret key from the same dashboard page.

## Step 2: Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

## Step 3: Database Setup

Your PostgreSQL database should already be running in Docker.
The migrations have been applied with:

- Users table
- Products table
- Orders table
- Carts table
- Wishlists table
- Reviews table
- 17 performance indexes

## Step 4: Start the Application

### Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

You should see:

```
✅ Database connected successfully
🚀 Server running on port 3001
📊 Environment: development
```

### Start Frontend (Terminal 2)

```bash
npm start
```

The app will open at http://localhost:3000

## Step 5: Test the Features

### Test Advanced Filters

1. Go to `/products`
2. Use the advanced filter sidebar:
   - Select multiple categories (e.g., Running + Basketball)
   - Select multiple brands (e.g., Nike + Adidas)
   - Drag the price range slider
   - Try different sort options
3. Click "Apply Filters"
4. Toggle between Grid and List view

### Test Checkout (Stripe)

1. Add products to cart
2. Click the cart icon
3. Click "Proceed to Checkout"
4. Fill in shipping information
5. Use Stripe test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
6. Click "Pay"
7. You'll be redirected to the Orders page

### Test Orders

1. Go to `/orders`
2. View your order history
3. See order status and details
4. Try cancelling a pending order

### Test Profile

1. Go to `/profile`
2. Click "Edit Profile"
3. Update your information
4. Click "Save Changes"

## 📝 Quick Commands

```bash
# Backend
npm run dev          # Start development server
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio

# Frontend
npm start            # Start development server
npm run build        # Build for production
npm test            # Run tests
```

## 🎯 Testing Stripe Payments

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **3D Secure**: `4000 0027 6000 3184`

All test cards:

- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### View Test Payments

Go to: https://dashboard.stripe.com/test/payments

## 🐛 Troubleshooting

### Backend won't start

- Check if PostgreSQL is running: `docker ps`
- Verify DATABASE_URL in `.env`
- Check port 3001 is free: `lsof -i :3001`

### Frontend errors

- Clear browser cache
- Delete `node_modules` and reinstall
- Check if backend is running on port 3001

### Stripe errors

- Verify your Stripe keys are correct
- Check if you're using test mode keys (pk*test* and sk*test*)
- Ensure no firewall blocks Stripe API

### Database errors

- Restart PostgreSQL: `docker restart pg`
- Check migrations: `cd backend && npm run db:studio`
- Verify tables exist in Drizzle Studio

## 🎨 Features to Try

1. **Advanced Multi-Select Filters** - Select Nike + Adidas + Puma together
2. **Price Range Slider** - Drag to set $50-$200 range
3. **Grid/List Toggle** - Switch views in Products page
4. **Add to Cart** - Add multiple products with different quantities
5. **Wishlist** - Heart icon to save favorites
6. **Stripe Checkout** - Complete payment flow
7. **Order Tracking** - View order status
8. **Profile Management** - Update shipping address
9. **Order Cancellation** - Cancel pending orders (gets refunded)
10. **Responsive Design** - Try on mobile/tablet

## 📱 Mobile Testing

1. Open Chrome DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select a device (iPhone, iPad, etc.)
4. Test collapsible filters
5. Test touch interactions

## ✅ What's Working

- ✅ Advanced filtering (multi-select, price range, search)
- ✅ Sorting (7 options)
- ✅ Grid/List view toggle
- ✅ Add to cart/wishlist
- ✅ Stripe checkout flow
- ✅ Order creation and tracking
- ✅ Order cancellation with refund
- ✅ User profile management
- ✅ Responsive design
- ✅ Loading states and animations
- ✅ Error handling

## 🔜 What You Can Add

- Seed sample products for testing
- Add product images
- Configure AWS S3 for image uploads
- Set up email notifications
- Add product reviews
- Create admin dashboard

## 💡 Pro Tips

1. **Seed Products**: Create a seed script to add sample products
2. **Images**: Upload product images to test the image gallery
3. **Multiple Users**: Test with different user accounts
4. **Admin Features**: Set `isAdmin: true` in database for a user
5. **Webhooks**: Set up Stripe webhooks for production

Enjoy your advanced shoe store! 🎉
