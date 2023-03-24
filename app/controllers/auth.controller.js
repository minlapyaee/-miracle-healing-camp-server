require("dotenv").config();
const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");
const bcrypt = require("bcrypt");
const UserPending = require("../models/userpending.model");
const User = require("../models/user.model");
const RFToken = require("../models/rftoken.model");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");

// KrVXZJ 2023-02-18T07:46:23.677+00:00
let mailOptions = {
  from: process.env.EMAIL,
  subject: "Hello ✔ From Miracle Camp Healing",
};

const generateToken = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.API_SECRET,
    {
      expiresIn: "5m",
    }
  );
  const refreshToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );
  const rftoken_id = v4();
  return RFToken.findOneAndUpdate(
    { user_id: user.id },
    { rftoken_id, user_id: user.id, refresh_token: refreshToken },
    { new: true, upsert: true }
  )
    .then(() => ({
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        fullname: user.fullname,
        profile: user.profile,
      },
      rftoken_id,
      accessToken,
      message: "Login successfully",
      success: true,
    }))
    .catch((err) => ({
      message: err,
      success: false,
    }));
};

const generateResetPwdToken = (user) => {
  const pwdTokem = jwt.sign(
    {
      id: user.id,
    },
    process.env.API_SECRET,
    {
      expiresIn: "5m",
    }
  );
  return pwdTokem;
};
exports.signup = async (req, res) => {
  try {
    let otp_code = otpGenerator.generate(6, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: true,
      specialChars: false,
      digits: true,
    });
    const data = {
      fullname: req.body.fullname,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      otp_code: otp_code,
    };

    mailOptions.to = req.body.email;
    mailOptions.html = `
    Hello please do not share this with anyone <br />
    <h3>OTP code </h3>
    <p>${otp_code}</p>
    `;

    const user = await User.findOne({ email: data.email });

    if (user) {
      return res.json({
        message: "failed",
        success: false,
        info: "user already existed.",
      });
    }

    await UserPending.findOneAndUpdate({ email: data.email }, data, {
      upsert: true,
    });
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        return console.log("Error occurs", err);
      }
      return res.status(200).send({ message: "success", success: true });
    });
  } catch (err) {
    return res.json({ message: "failed", success: false });
  }
};

exports.checkOtp = async (req, res) => {
  try {
    const { otp_code, email } = req.body;

    const user = await UserPending.findOneAndDelete({ email, otp_code });

    if (user) {
      const data = await User.create({
        fullname: user.fullname,
        email: user.email,
        password: user.password,
        role: user.role,
      });

      const responseData = await generateToken(data);

      return res
        .status(200)
        .send({ message: "success", success: true, data: responseData });
    } else {
      return res.json({ message: "failed", success: false });
    }
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "failed", success: false });
  }
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email,
  }).exec(async (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (!user) {
      res.status(404).send({ message: "User Not found.", success: false });
      return;
    }

    // comparing passwords
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    // checking if password was valid and send response accordingly
    if (!passwordIsValid) {
      res.status(401).send({
        accessToken: null,
        message: "User Not found.",
        success: false,
      });
      return;
    }
    const responseData = await generateToken({
      _id: user._id,
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    });
    res.status(200).send(responseData);
  });
};

exports.getinfo = (req, res) => {
  const { user, accessToken } = req;
  if (user) {
    return res.json({
      message: "ok",
      user,
      accessToken,
      success: true,
    });
  }
  return res.json({ message: "not ok" });
};

exports.updateprofile = async (req, res) => {
  try {
    const { fullname } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullname },
      {
        returnDocument: "after",
      }
    );
    return res.json({
      message: "ok",
      user,
      accessToken: req.accessToken,
      success: true,
    });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.resetPasswordLink = async (req, res) => {
  try {
    const token = generateResetPwdToken(req.user);
    mailOptions.to = req.body.email;
    mailOptions.html = `
    Reset Password Link<br />
    <a href=http://localhost:3000/reset-password/${token}>Reset Password Link</a>
    `;
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        return console.log("Error occurs", err);
      }
      return res.status(200).send({ message: "success", success: true });
    });

    console.log({ token });
    return res.json({ message: "success", token });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const password = bcrypt.hashSync(req.body.password, 8);

    await User.findByIdAndUpdate(req.user.id, { password });

    return res.json({ message: "success" });
  } catch (err) {
    return res.json({ message: "something went wrong", success: false });
  }
};
