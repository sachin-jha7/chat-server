import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';


const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

const signup = async (req, res) => {

    let { fullName, email, password } = req.body;
    
    email = email.trim();
    password = password.trim();

    const keyWords = fullName.toUpperCase().trim().split(/\s+/);
    const normalizedName = fullName.trim().split(/\s+/);
    fullName = normalizedName.join(" ");
    const searchabelName = normalizedName.join(" ").toUpperCase();


    if (!fullName || !email || !password) {
        return res.status(422).json("Invalid Data");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(409).json("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        fullName,
        email,
        password: hashedPassword,
        keyWords,
        normalizedName: searchabelName
    });

    // console.log(newUser._id);
    const token = generateToken(newUser._id);
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        partitioned: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json("User created successfully");
}

const login = async (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (!email || !password) {
        return res.status(422).json("Invalid Data");
    }

    const userExists = await User.findOne({ email });
    if (!userExists) {
        // console.log("error in userExists")
        return res.status(400).json("Wrong email or password");
    }

    const savedPassword = userExists.password;
    // console.log(savedPassword)

    // const test = await bcrypt.compare("jarvis", userExists.password);
    // console.log("Test result:", test);

    const isMatch = await bcrypt.compare(password, userExists.password);
    if (!isMatch) {
        // console.log("error in isMatch")
        return res.status(400).json("Wrong email or password");
    }

    const token = generateToken(userExists._id);
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        partitioned: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json("Logged in successfully")

}

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
        console.log(err);
    }
}

const logout = (req, res) => {
    return res.clearCookie("token").json("Logged Out successfully");
}

// const hash = await bcrypt.hash("123456", 10);

// console.log(hash);

// console.log(await bcrypt.compare("123456", hash)); // should be true
// console.log(await bcrypt.compare("abcdef", hash));
// const test = await bcrypt.compare("jarvis", existingUser.password);
// console.log("Test result:", test);

export default { signup, login, logout, verify };
