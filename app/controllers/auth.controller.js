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
  subject: "Please verify Miracle Healing Camp email",
};

let resetmailOptions = {
  from: process.env.EMAIL,
  subject: "Your Miracle Healing Camp password",
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
    <table class="es-header-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
    <tbody>
        <tr>
            <td class="es-p20t es-p20r es-p20l esd-structure" align="left">
                <table cellspacing="0" cellpadding="0" width="100%">
                    <tbody>
                        <tr>
                            <td class="es-m-p0r esd-container-frame" width="560" valign="top" align="center">
                                <table width="100%" cellspacing="0" cellpadding="0">
                                    <tbody>
                                        <tr>
                                            <td align="left" class="esd-block-text">
                                                <p>Hello ${req.body.fullname}!<br><br>To verify your email address, please use the following One Time Password (OTP):&nbsp;<br><br></p>
                                                <p><span style="font-size:15px;"><strong>${otp_code}</strong></span><br><br>Thanks,<br>Miracle Healing Camp&nbsp;Support Team</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table>
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
    resetmailOptions.to = req.body.email;
    resetmailOptions.html = `
    <table class="es-header-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
    <tbody>
        <tr>
            <td class="es-p20t es-p20r es-p20l esd-structure" align="left">
                <table cellspacing="0" cellpadding="0" width="100%">
                    <tbody>
                        <tr>
                            <td class="es-m-p0r esd-container-frame" width="560" valign="top" align="center">
                                <table width="100%" cellspacing="0" cellpadding="0">
                                    <tbody>
                                        <tr>
                                            <td align="left" class="esd-block-text">
                                                <p>Hello ${req.user.fullname}!<br><br>We're sending you this because we've received a request to reset your password. If you didn't make this request, just ignore this email. Otherwise, you can change your password using this link:<br><br></p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" class="esd-block-button">
                                                <!--[if mso]><a href="http://localhost:3000/reset-password/${token}" target="_blank" hidden>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="http://localhost:3000/reset-password/${token}" 
            style="height:39px; v-text-anchor:middle; width:176px" arcsize="21%" strokecolor="#2cb543" strokeweight="2px" fillcolor="#4b4d99">
<w:anchorlock></w:anchorlock>
<center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:14px; font-weight:400; line-height:14px;  mso-text-raise:1px'>Reset Password</center>
</v:roundrect></a>
<![endif]-->
                                                <!--[if !mso]><!-- --><span class="msohide es-button-border-1679927494810 es-button-border" style="background: #4b4d99; border-radius: 8px;">
                                                    <a href="http://localhost:3000/reset-password/${token}" class="es-button es-button-1679927494788" target="_blank" style="background: #4b4d99; border-color: #4b4d99; border-radius: 8px;">Reset Password</a>
                                                </span>
                                                <!--<![endif]-->
                                            </td>
                                        </tr>
                                        <tr><td align="left" class="esd-block-text">
                                        <p><br>Thanks,<br>Miracle Healing Camp&nbsp;Support Team</p>
                                    </td></tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table>
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

    transporter.sendMail(resetmailOptions, (err, data) => {
      if (err) {
        return console.log("Error occurs", err);
      }
      return res.status(200).send({ message: "success", success: true });
    });

    // return res.json({ message: "success", token });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = generateResetPwdToken(user);
      resetmailOptions.to = req.body.email;
      resetmailOptions.html = `
      <table class="es-header-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
      <tbody>
          <tr>
              <td class="es-p20t es-p20r es-p20l esd-structure" align="left">
                  <table cellspacing="0" cellpadding="0" width="100%">
                      <tbody>
                          <tr>
                              <td class="es-m-p0r esd-container-frame" width="560" valign="top" align="center">
                                  <table width="100%" cellspacing="0" cellpadding="0">
                                      <tbody>
                                          <tr>
                                              <td align="left" class="esd-block-text">
                                                  <p>Hello ${user.fullname}!<br><br>We're sending you this because we've received a request to reset your password. If you didn't make this request, just ignore this email. Otherwise, you can change your password using this link:<br><br></p>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td align="center" class="esd-block-button">
                                                  <!--[if mso]><a href="http://localhost:3000/reset-password/${token}" target="_blank" hidden>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="http://localhost:3000/reset-password/${token}" 
              style="height:39px; v-text-anchor:middle; width:176px" arcsize="21%" strokecolor="#2cb543" strokeweight="2px" fillcolor="#4b4d99">
  <w:anchorlock></w:anchorlock>
  <center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:14px; font-weight:400; line-height:14px;  mso-text-raise:1px'>Reset Password</center>
  </v:roundrect></a>
  <![endif]-->
                                                  <!--[if !mso]><!-- --><span class="msohide es-button-border-1679927494810 es-button-border" style="background: #4b4d99; border-radius: 8px;">
                                                      <a href="http://localhost:3000/reset-password/${token}" class="es-button es-button-1679927494788" target="_blank" style="background: #4b4d99; border-color: #4b4d99; border-radius: 8px;">Reset Password</a>
                                                  </span>
                                                  <!--<![endif]-->
                                              </td>
                                          </tr>
                                          <tr><td align="left" class="esd-block-text">
                                          <p><br>Thanks,<br>Miracle Healing Camp&nbsp;Support Team</p>
                                      </td></tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </td>
          </tr>
      </tbody>
  </table>
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

      transporter.sendMail(resetmailOptions, (err, data) => {
        if (err) {
          return console.log("Error occurs", err);
        }
        return res.status(200).send({ message: "success", success: true });
      });
    } else {
      return res.status(200).send({ message: "success", success: true });
    }
    // return res.json({ message: "success", token });
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
