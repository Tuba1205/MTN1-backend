const User = require("../models/User"); 
const Teacher = require("../models/Teacher");
const Student = require("../models/Student"); 

const roleMiddleware = (...allowedRoles) => {
    return async (req, res, next) => {
        console.log("🔍 Checking Role Middleware...");

        if (!req.user || !req.user.id) {
            console.log("❌ No user ID found in request!");
            return res.status(401).json({ message: "Unauthorized: No user ID found" });
        }

        try {
            let userRole = req.user.role.toLowerCase(); // Convert role to lowercase for consistency
            console.log("🔑 User Role from Token:", userRole);
            console.log("✅ Allowed Roles:", allowedRoles);

            // ✅ Directly allow if userRole is in the allowed roles list
            if (allowedRoles.includes(userRole)) {
                console.log(`✅ Access Granted: ${userRole}`);
                return next();
            }

            // 🚨 Check if user exists in the respective model only if needed
            let userExists = false;
            if (userRole === "admin") {
                userExists = await User.exists({ _id: req.user.id });
            } else if (userRole === "teacher") {
                userExists = await Teacher.exists({ _id: req.user.id });
            } else if (userRole === "student") {
                userExists = await Student.exists({ _id: req.user.id });
            }

            if (!userExists) {
                console.log(`❌ ${userRole} not found in the database!`);
                return res.status(403).json({ message: `Access Denied: ${userRole} not found` });
            }

            console.log(`✅ User verified and Access Granted: ${userRole}`);
            next();
        } catch (error) {
            console.error("❌ Error in roleMiddleware:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
};

module.exports = roleMiddleware;
