# Migration Guide - From Old Stack to New Stack

## Overview

This guide explains the major changes made to modernize the shoe store application for AWS deployment.

## Key Changes Summary

### 1. State Management: Redux → React Query

**Old (Redux):**

```javascript
// Old store setup
import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./slices/productSlice";

const store = configureStore({
  reducer: {
    products: productReducer,
  },
});
```

**New (React Query):**

```javascript
// New setup
import { QueryProvider } from "./lib/react-query";

function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}
```

**Usage Example:**

```javascript
// Old Redux way
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "./slices/productSlice";

const dispatch = useDispatch();
const { products, loading } = useSelector((state) => state.products);

useEffect(() => {
  dispatch(fetchProducts());
}, []);

// New React Query way
import { useProducts } from "./hooks/useProducts";

const { data: products, isLoading } = useProducts({ category: "sneakers" });
```

### 2. Database: MongoDB → PostgreSQL with Drizzle ORM

**Old (Mongoose):**

```javascript
// Old schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  // ...
});

const Product = mongoose.model("Product", productSchema);
```

**New (Drizzle):**

```javascript
// New schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // ...
});

// Usage
const allProducts = await db.select().from(products);
const product = await db.select().from(products).where(eq(products.id, id));
```

### 3. Authentication: Custom JWT → JWT with React Query

**Old:**

```javascript
// Store token
localStorage.setItem("authenticate", token);

// Manual token decode
import { decodeToken } from "react-jwt";
const decoded = decodeToken(token);
```

**New:**

```javascript
// Store token
localStorage.setItem("token", token);

// Use hooks
import { useLogin, useLogout } from "./hooks/useAuth";

const { mutateAsync: login } = useLogin();
await login({ email, password });
```

### 4. Forms: Manual State → React Hook Form

**Old:**

```javascript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [errors, setErrors] = useState({});

const handleSubmit = (e) => {
  e.preventDefault();
  // Manual validation
  if (!email) setErrors({ email: "Required" });
  // ...
};
```

**New:**

```javascript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(loginSchema),
});

const onSubmit = async (data) => {
  await login(data);
};
```

### 5. File Storage: Firebase → Cloudinary

**Old (Firebase):**

```javascript
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storageRef = ref(storage, `images/${file.name}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

**New (Cloudinary):**

```javascript
// Backend
import { uploadToCloudinary } from "./services/cloudinary";

const result = await uploadToCloudinary(dataURI, "shoes-store/products");
// Returns: { url, publicId, width, height }
```

### 6. Backend: Express + Mongoose → Express + Drizzle

**Old Routes:**

```javascript
// Old route
import Product from "../models/Product";

router.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
```

**New Routes:**

```javascript
// New route
import { db } from "../db";
import { products } from "../db/schema";

router.get("/products", async (req, res) => {
  const allProducts = await db.select().from(products);
  res.json(allProducts);
});
```

## Migration Steps

### Step 1: Update Dependencies

```bash
# Frontend
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form @hookform/resolvers zod
npm install cloudinary-react
npm uninstall @reduxjs/toolkit react-redux firebase react-jwt

# Backend
npm install drizzle-orm postgres drizzle-kit
npm install cloudinary multer
npm install helmet express-rate-limit express-validator
npm install stripe aws-sdk @aws-sdk/client-s3 @aws-sdk/client-sns
npm uninstall mongoose body-parser cookie-parser
```

### Step 2: Database Migration

```bash
# 1. Export data from MongoDB (if needed)
mongoexport --db=shoesstore --collection=products --out=products.json

# 2. Set up PostgreSQL
createdb shoesstore

# 3. Run Drizzle migrations
cd backend
npm run db:generate
npm run db:migrate

# 4. Import data (write custom script if needed)
node scripts/import-from-mongo.js
```

### Step 3: Update Frontend Code

1. **Remove Redux:**
   - Delete `statemanagement/` folder
   - Remove Redux provider from `index.js`

2. **Add React Query:**
   - Create `lib/react-query.js`
   - Wrap app with `QueryProvider`
   - Create custom hooks in `hooks/`

3. **Update Components:**
   - Replace `useSelector` with `useQuery` hooks
   - Replace `useDispatch` with `useMutation` hooks
   - Update form components with React Hook Form

### Step 4: Update Backend Code

1. **Database Setup:**
   - Create `db/schema.js` with Drizzle schemas
   - Create `db/index.js` for connection
   - Update `drizzle.config.ts`

2. **Update Routes:**
   - Replace Mongoose queries with Drizzle
   - Update middleware
   - Add security middleware (helmet, rate-limit)

3. **Add Services:**
   - Create `services/cloudinary.js`
   - Create `services/email.js` with AWS SNS
   - Update file upload logic

### Step 5: Environment Configuration

**Old .env:**

```env
MONGO_URI=mongodb://...
FIREBASE_API_KEY=...
JWT_SECRET=...
```

**New .env:**

```env
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=...
AWS_REGION=...
JWT_SECRET=...
```

### Step 6: Testing

```bash
# 1. Test backend
cd backend
npm run dev

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/products

# 2. Test frontend
npm start

# Navigate to http://localhost:3000
# Test all features:
# - Registration
# - Login
# - Product browsing
# - Add to cart
# - Checkout
```

## Breaking Changes

### API Endpoints

**Old:**

- `/user/register` → `/api/auth/register`
- `/user/login` → `/api/auth/login`
- `/shoesPage/products` → `/api/products`

**New structure:**

- All endpoints prefixed with `/api`
- RESTful naming conventions
- Consistent response formats

### Authentication

**Old:**

- Token stored as `authenticate`
- Route: `/user/:userId/verify/:verifyId`

**New:**

- Token stored as `token`
- Route: `/verify-email?token=xxx&userId=123`
- Better query parameter handling

### Response Formats

**Old:**

```json
{
  "products": [...],
  "total": 100
}
```

**New:**

```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "pages": 9
  }
}
```

## Code Comparison Examples

### Fetching Products

**Old:**

```javascript
// Redux slice
const fetchProducts = createAsyncThunk("products/fetch", async () => {
  const response = await API.get("/shoesPage/products");
  return response.data;
});

// Component
const dispatch = useDispatch();
const { products, loading, error } = useSelector((state) => state.products);

useEffect(() => {
  dispatch(fetchProducts());
}, [dispatch]);
```

**New:**

```javascript
// Hook
export const useProducts = (filters) => {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productsApi.getAll(filters).then((res) => res.data),
  });
};

// Component
const {
  data: products,
  isLoading,
  error,
} = useProducts({ category: "sneakers" });
```

### Adding to Cart

**Old:**

```javascript
// Redux action
const addToCart = createAsyncThunk("cart/add", async (item) => {
  const response = await API.post("/cart", item);
  return response.data;
});

// Component
const dispatch = useDispatch();
const handleAdd = () => {
  dispatch(addToCart({ productId, quantity }));
};
```

**New:**

```javascript
// Hook
const { mutate: addToCart } = useAddToCart();

const handleAdd = () => {
  addToCart(
    { productId, quantity },
    {
      onSuccess: () => {
        NotifySuccess("Added to cart!");
      },
    },
  );
};
```

## Benefits of New Stack

### Performance

- **React Query**: Automatic caching, background refetching
- **PostgreSQL**: Better performance for relational data
- **Drizzle ORM**: Type-safe, zero runtime overhead
- **Cloudinary CDN**: Faster image delivery

### Developer Experience

- **TypeScript Support**: Better with Drizzle
- **Type Safety**: Drizzle schemas, Zod validation
- **DevTools**: React Query DevTools, Drizzle Studio
- **Less Boilerplate**: React Query vs Redux

### Security

- **Helmet**: Security headers
- **Rate Limiting**: DDoS protection
- **Input Validation**: Express-validator + Zod
- **AWS Security**: IAM, Security Groups

### Scalability

- **PostgreSQL**: Better for complex queries
- **AWS RDS**: Auto-scaling, backups
- **CloudWatch**: Monitoring and alerting
- **Load Balancing**: AWS ALB/ELB

### Cost

- **No MongoDB Atlas**: Use AWS RDS (cheaper at scale)
- **No Firebase**: Cloudinary free tier is generous
- **AWS Free Tier**: RDS, EC2, S3, SNS

## Troubleshooting

### Issue: Database connection fails

```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string
psql "postgresql://user:pass@host:5432/dbname"

# Check security groups (AWS)
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### Issue: React Query not updating

```javascript
// Invalidate queries manually
queryClient.invalidateQueries({ queryKey: ["products"] });

// Check cache
console.log(queryClient.getQueryCache().getAll());
```

### Issue: Cloudinary upload fails

```javascript
// Verify credentials
console.log(process.env.CLOUDINARY_CLOUD_NAME);

// Check file size (max 5MB by default)
// Check file type (images only)
```

## Next Steps

1. **Set up CI/CD**: AWS CodePipeline, GitHub Actions
2. **Add Tests**: Jest, React Testing Library
3. **Performance**: Add Redis caching
4. **Monitoring**: Set up CloudWatch dashboards
5. **Analytics**: Add Google Analytics
6. **SEO**: Add meta tags, sitemap
7. **Mobile**: Test responsive design
8. **Accessibility**: WCAG compliance

## Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [React Hook Form Docs](https://react-hook-form.com/)
- [AWS RDS Guide](https://docs.aws.amazon.com/rds/)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Stripe API Docs](https://stripe.com/docs/api)

## Support

If you encounter issues during migration:

1. Check error logs
2. Review environment variables
3. Verify all dependencies are installed
4. Check [SETUP.md](./SETUP.md) for configuration
5. Open a GitHub issue with details
