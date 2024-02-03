import jwt from "jsonwebtoken";
import User from "../models/user.js";
const auth = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            res.status(440).json({ message: "Unknown Request" });
            return;
        }
        const token = req.headers.authorization.split(" ")[1];
        let decodedData;
        decodedData = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedData?._id) {
            req.userId = decodedData._id;
            req.user = await User.findById(decodedData._id, "-password");
            next();
        }
        else {
            throw new Error("Invalid token");
        }
    }
    catch (error) {
        res.status(440).json({ message: "Sorry, you are not authorized" });
    }
};
const checkAdmin = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            res.status(440).json({ message: "Unknown Request" });
            return;
        }
        const token = req.headers.authorization.split(" ")[1];
        let decodedData;
        decodedData = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedData?.role === true) {
            req.userId = decodedData?._id;
            next();
        }
        else {
            throw new Error("Unauthorized Admin");
        }
    }
    catch (error) {
        res.status(440).json({ message: error.message });
    }
};
export { auth, checkAdmin };
