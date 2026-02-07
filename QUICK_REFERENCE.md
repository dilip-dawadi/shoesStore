# Quick Reference Guide

## 📦 Package.json Scripts

### Frontend (Root)

```bash
npm start          # Start development server (port 3000)
npm run build      # Build for production
npm test           # Run tests
npm run dev        # Alias for npm start
```

### Backend

```bash
npm run dev        # Start with nodemon (hot reload)
npm start          # Start production server
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

## 🔑 Environment Variables

### Frontend (.env)

```env
REACT_APP_BASE_URL_LOCAL=http://localhost:5000/api
REACT_APP_BASE_URL=https://api.yourdomain.com/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
```

### Backend (backend/.env)

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_secret_min_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
STRIPE_SECRET_KEY=sk_test_...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🛠️ Common Commands

### Database

```bash
# Create database
createdb shoesstore

# Connect to database
psql shoesstore

# Drop database (careful!)
dropdb shoesstore

# Backup database
pg_dump shoesstore > backup.sql

# Restore database
psql shoesstore < backup.sql
```

### Drizzle ORM

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (DB GUI)
npm run db:studio
```

### Git

```bash
# Commit changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Create feature branch
git checkout -b feature/my-feature
```

## 📚 Custom Hooks

### Products

```javascript
import { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct } from './hooks/useProducts';

// Get all products with filters
const { data, isLoading, error } = useProducts({ category: 'sneakers', brand: 'Nike' });

// Get single product
const { data: product } = useProduct(productId);

// Create product
const { mutate: createProduct } = useCreateProduct();
createProduct({ name, price, ... });

// Update product
const { mutate: updateProduct } = useUpdateProduct();
updateProduct({ id, data: { name, price } });

// Delete product
const { mutate: deleteProduct } = useDeleteProduct();
deleteProduct(productId);
```

### Cart

```javascript
import {
  useCart,
  useAddToCart,
  useUpdateCart,
  useRemoveFromCart,
  useClearCart,
} from "./hooks/useCart";

// Get cart
const { data: cart } = useCart();

// Add to cart
const { mutate: addToCart } = useAddToCart();
addToCart({ productId, quantity, size, color });

// Update cart item
const { mutate: updateCart } = useUpdateCart();
updateCart({ id, data: { quantity: 2 } });

// Remove from cart
const { mutate: removeFromCart } = useRemoveFromCart();
removeFromCart(cartItemId);

// Clear cart
const { mutate: clearCart } = useClearCart();
clearCart();
```

### Authentication

```javascript
import {
  useLogin,
  useRegister,
  useLogout,
  useVerifyEmail,
  useForgotPassword,
  useResetPassword,
} from "./hooks/useAuth";

// Login
const { mutate: login } = useLogin();
login({ email, password });

// Register
const { mutate: register } = useRegister();
register({ name, email, password });

// Logout
const { mutate: logout } = useLogout();
logout();

// Verify email
const { mutate: verifyEmail } = useVerifyEmail();
verifyEmail({ token, userId });

// Forgot password
const { mutate: forgotPassword } = useForgotPassword();
forgotPassword(email);

// Reset password
const { mutate: resetPassword } = useResetPassword();
resetPassword({ token, password });
```

### Wishlist

```javascript
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "./hooks/useWishlist";

// Get wishlist
const { data: wishlist } = useWishlist();

// Add to wishlist
const { mutate: addToWishlist } = useAddToWishlist();
addToWishlist(productId);

// Remove from wishlist
const { mutate: removeFromWishlist } = useRemoveFromWishlist();
removeFromWishlist(wishlistItemId);
```

## 🎨 Form Components

### Login Form

```javascript
import LoginForm from "./components/forms/LoginForm";

<LoginForm onClose={() => setShowModal(false)} />;
```

### Register Form

```javascript
import RegisterForm from "./components/forms/RegisterForm";

<RegisterForm onClose={() => setShowModal(false)} />;
```

### Product Form

```javascript
import ProductForm from './components/forms/ProductForm';

// Create new product
<ProductForm onSuccess={handleSuccess} onClose={handleClose} />

// Edit existing product
<ProductForm product={existingProduct} onSuccess={handleSuccess} onClose={handleClose} />
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register          - Register user
POST   /api/auth/login             - Login
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
```

### Products

```
GET    /api/products               - Get all products (with filters)
GET    /api/products/:id           - Get product by ID
POST   /api/products               - Create product (admin)
PUT    /api/products/:id           - Update product (admin)
DELETE /api/products/:id           - Delete product (admin)
```

### Cart

```
GET    /api/cart                   - Get user's cart
POST   /api/cart                   - Add to cart
PUT    /api/cart/:id               - Update cart item
DELETE /api/cart/:id               - Remove from cart
DELETE /api/cart                   - Clear cart
```

### Wishlist

```
GET    /api/wishlist               - Get wishlist
POST   /api/wishlist               - Add to wishlist
DELETE /api/wishlist/:id           - Remove from wishlist
```

### Orders

```
GET    /api/orders                 - Get user's orders
GET    /api/orders/:id             - Get order by ID
POST   /api/orders                 - Create order
PUT    /api/orders/:id/status      - Update order status (admin)
```

### Upload

```
POST   /api/upload/image           - Upload single image (admin)
POST   /api/upload/images          - Upload multiple images (admin)
DELETE /api/upload/image           - Delete image (admin)
```

## 🗄️ Database Schema (Drizzle)

### Tables

- **users** - User accounts
- **products** - Product catalog
- **carts** - Shopping carts
- **wishlists** - User wishlists
- **orders** - Order history
- **reviews** - Product reviews

### Query Examples

```javascript
import { db } from "./db";
import { products, users, carts } from "./db/schema";
import { eq, and, like, gte, lte } from "drizzle-orm";

// Select all
const allProducts = await db.select().from(products);

// Select with condition
const product = await db.select().from(products).where(eq(products.id, 1));

// Select with multiple conditions
const filtered = await db
  .select()
  .from(products)
  .where(
    and(
      eq(products.category, "sneakers"),
      gte(products.price, "50"),
      lte(products.price, "200"),
    ),
  );

// Join tables
const cartWithProducts = await db
  .select()
  .from(carts)
  .leftJoin(products, eq(carts.productId, products.id))
  .where(eq(carts.userId, userId));

// Insert
const [newProduct] = await db
  .insert(products)
  .values({ name, price, category })
  .returning();

// Update
const [updated] = await db
  .update(products)
  .set({ price: "99.99" })
  .where(eq(products.id, 1))
  .returning();

// Delete
await db.delete(products).where(eq(products.id, 1));
```

## ☁️ AWS Services Used

- **RDS PostgreSQL** - Primary database
- **EC2 / Elastic Beanstalk / ECS** - Application hosting
- **S3** - Static file storage
- **CloudFront** - CDN for frontend
- **SNS** - Email notifications
- **CloudWatch** - Logging and monitoring
- **IAM** - Access management
- **VPC** - Network isolation
- **Route 53** - DNS management
- **Certificate Manager** - SSL/TLS certificates
- **Secrets Manager** - Secure credential storage

## 🔐 Security Checklist

- [ ] All .env files in .gitignore
- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] Database in private subnet
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Helmet security headers
- [ ] Input validation
- [ ] SQL injection protection (Drizzle parameterized queries)
- [ ] XSS protection
- [ ] CORS properly configured
- [ ] No secrets in code
- [ ] Regular dependency updates

## 📊 Monitoring

### CloudWatch Logs

```bash
# View logs
aws logs tail /aws/elasticbeanstalk/app-name --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/app-name \
  --filter-pattern "ERROR"
```

### Health Check

```bash
# Check backend health
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

## 🐛 Debugging

### Common Issues

**Database connection error:**

```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL"
```

**Token expired:**

```javascript
// Token is valid for 7 days
// Clear localStorage to login again
localStorage.removeItem("token");
```

**CORS error:**

```javascript
// Check backend CORS config
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

**Image upload fails:**

```bash
# Check Cloudinary credentials
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY

# Verify file size < 5MB
# Verify file type is image/*
```

## 📱 Testing

### Manual Testing Checklist

- [ ] User registration
- [ ] Email verification
- [ ] User login
- [ ] Browse products
- [ ] Filter products
- [ ] View product details
- [ ] Add to cart
- [ ] Update cart quantity
- [ ] Remove from cart
- [ ] Add to wishlist
- [ ] Remove from wishlist
- [ ] Checkout process
- [ ] Stripe payment (use test card: 4242 4242 4242 4242)
- [ ] Order confirmation email
- [ ] View order history
- [ ] Admin: Create product
- [ ] Admin: Update product
- [ ] Admin: Delete product
- [ ] Admin: Upload images

### Test Stripe Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

## 📦 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] DNS configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security groups configured
- [ ] Load balancer configured
- [ ] Auto-scaling enabled
- [ ] CloudWatch alarms set
- [ ] Error tracking enabled

## 🔗 Useful Links

- [AWS Console](https://console.aws.amazon.com/)
- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [React Query DevTools](http://localhost:3000) - Check bottom of page
- [Drizzle Studio](http://localhost:4983) - Run `npm run db:studio`

## 💡 Tips

1. **Use React Query DevTools** - See all queries and their state
2. **Use Drizzle Studio** - Visual database explorer
3. **Check CloudWatch Logs** - First place to debug production issues
4. **Use .env.example** - Never commit real credentials
5. **Test locally first** - Before deploying to production
6. **Monitor costs** - AWS can get expensive
7. **Use git branches** - For features and bug fixes
8. **Write migrations** - For database changes
9. **Invalidate CloudFront** - After frontend deploys
10. **Keep dependencies updated** - Security patches

## 🆘 Getting Help

1. Check [SETUP.md](./SETUP.md) for detailed setup
2. Review [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md) for architecture
3. Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for code changes
4. Check application logs
5. Search GitHub issues
6. Open new issue with details
