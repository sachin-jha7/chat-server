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
    fullName = fullName.trim();

    const keyWords = fullName.toUpperCase().split(/\s+/);
    const normalizedName = fullName.split(/\s+/);
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
        path: "/",
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
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json("Logged in successfully")

}



const logout = (req, res) => {
    res.clearCookie("token",{
        httpOnly: true,
        secure: true,
        sameSite: "none",
        partitioned: true,
        path: "/"
    }).json("Logged Out successfully");
}


export default { signup, login, logout };
