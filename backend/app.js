import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";
import shoesPageRoutes from "./routes/productRoute.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import InitialRoute from "./routes/initialRoute.js";
const app = express();
app.use(cookieParser());
dotenv.config();
app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use("/user", userRoutes);
app.use("/shoesPage", shoesPageRoutes);
InitialRoute(app, express);
const PORT = process.env.PORT || 5000;
mongoose.set("strictQuery", false); // Add this line
mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => app.listen(PORT, () => console.log(`Server running ${PORT}`)))
  .catch((error) => console.log(error));
export default app;
