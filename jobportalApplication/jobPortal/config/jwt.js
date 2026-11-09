const jwt = require("jsonwebtoken");
require("dotenv").config();

const secretKey = process.env.SECRET_KEY;

const jsonAuthentication = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "Token not found"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, secretKey);

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid Token"
        });
    }
};

const generateToken = (userdata) => {

    return jwt.sign(userdata, secretKey, {
        expiresIn: "7d"
    });
};

module.exports = {
    generateToken,
    jsonAuthentication
};
