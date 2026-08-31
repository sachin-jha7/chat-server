import jwt from 'jsonwebtoken';


const verify = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(400).json("Unauthorized");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if(err.name === "TokenExpiredError") {
            return res.status(401).json("Unauthorized");
        }
        console.log(err);
    }
}



export default { verify };
