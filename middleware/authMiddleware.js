const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        console.log("❌ No Token Found in Request Headers!");
        return res.status(401).json({ message: 'Unauthorized: No Token Provided' });
    }

    try {
        if (token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        console.log("🔍 Extracted Token from Header:", token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token Payload:", decoded);

        if (!decoded.userId || !decoded.role) {
            console.log("❌ Missing User ID or Role in Token Payload!");
            return res.status(401).json({ message: "Unauthorized: Invalid Token Data" });
        }

        // Store user info in request object
        req.user = { id: decoded.userId, role: decoded.role };
        console.log("🔑 User ID & Role stored in req.user:", req.user);

        next(); // ✅ Allow request to proceed
    } catch (error) {
        console.error("❌ Token Verification Failed:", error);
        return res.status(401).json({ message: 'Unauthorized: Invalid Token' });
    }
};

module.exports = authMiddleware;
