require("dotenv").config();
const requestPromise = require("request-promise");
const Customer = require("../models/customer.model");
const CustomerAudit = require("../models/customeraudit.model");
const Meet = require("../models/meet.model");
const Appointment = require("../models/appointment.model");
const Maintenance = require("../models/maintenance.model");
const AppointmentAudit = require("../models/appointmentaudit.model");
const User = require("../models/user.model");
const UserAudit = require("../models/useraudit.model");
const Class = require("../models/class.model");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");

let mailOptions = {
  from: process.env.EMAIL,
  subject: "Zoom Meeting  :D",
};

let mailOptionsCreateAdmin = {
  from: process.env.EMAIL,
  subject: "Welcomet to Miracle Healing Camp Admin",
};

const payload = {
  iss: process.env.ZOOM_API_KEY, //your API KEY
  exp: new Date().getTime() + 5000,
};
const token = jwt.sign(payload, process.env.ZOOM_API_SECRET);
// create zoom meeting link
const createMeeting = async (sendTo) => {
  return new Promise((resolve) => {
    email = process.env.EMAIL;

    const options = {
      method: "POST",
      uri: "https://api.zoom.us/v2/users/" + email + "/meetings",
      body: {
        topic: "Your appointment is ready", //meeting title
        start_time: new Date(),
        type: 1,
        settings: {
          host_video: "true",
          participant_video: "true",
        },
      },
      auth: {
        bearer: token,
      },
      headers: {
        "User-Agent": "Zoom-api-Jwt-Request",
        "content-type": "application/json",
      },
      json: true,
    };

    requestPromise(options)
      .then(function (response) {
        const { join_url, id, password } = response;
        mailOptions.html = `Successful.`;
        mailOptions.to = sendTo;
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
          console.log("Sent Mail");
          resolve({ join_url, host_id: id, password });
        });
      })
      .catch(function (err) {
        console.log("API call failed, reason ", err);
      });
  });
};

exports.fetchCustomerList = async (req, res) => {
  try {
    const data = await Customer.find()
      .sort({
        createdAt: "descending",
      })
      .populate({
        path: "created_by",
        model: "User",
        select: "id fullname",
      });

    return res.json({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.findCustomer = async (req, res) => {
  try {
    const { customer_id } = req.query;
    const data = await Customer.findById(customer_id);
    return res.json({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.updateCustomerStatus = async (req, res) => {
  try {
    const { status, id, reason } = req.body;
    const data = await Customer.findByIdAndUpdate(
      id,
      { status },
      {
        upsert: true,
      }
    );

    if (reason) {
      const customer_audit = new CustomerAudit({
        reason,
        created_by: req.user.id,
        customer_id: id,
      });
      customer_audit.save((err) => {
        if (err) return handleError(err);
        // saved!
        return res.json({ message: "success", data });
      });
    } else {
      return res.json({ message: "success", data });
    }
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchAppointmentList = async (req, res) => {
  try {
    const data = await Appointment.find()
      .sort({
        createdAt: "descending",
      })
      .populate({
        path: "requested_by",
        model: "User",
        select: "id fullname",
      });

    return res.json({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.findAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.query;
    const data = await Appointment.findById(appointment_id);
    if (data.status === "progress") {
      const meeting = await Meet.findOne({ user_id: data.requested_by });
      return res.json({ message: "success", data, meeting });
    }
    return res.json({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, id, appointment_id, reason } = req.body;
    const data = await Appointment.findByIdAndUpdate(
      id,
      { status },
      {
        upsert: true,
      }
    );
    if (reason) {
      const newAudit = new AppointmentAudit({
        reason,
        created_by: req.user.id,
        appointment_id: appointment_id,
      });
      await newAudit.save();
    }
    if (status === "progress") {
      const { join_url, host_id, password } = await createMeeting(data.email);
      Meet.findOneAndUpdate(
        { user_id: data.requested_by },
        { join_url, host_id, password, user_id: data.requested_by },
        { new: true, upsert: true }
      )
        .then(() => {
          return res.json({
            message: "success",
            data,
            meeting: { join_url, host_id, password },
          });
        })
        .catch((err) => {
          console.log(err);
          return res.json({ message: "failed" });
        });
    } else if (status === "completed") {
      await Meet.findOneAndDelete({
        user_id: data.requested_by,
      });
      await Customer.findOneAndUpdate(
        { created_by: data.requested_by, status: "verified" },
        { status: "expired" }
      );
      return res.json({ message: "success" });
    } else {
      return res.json({ message: "success", data });
    }
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.createClass = async (req, res) => {
  const { class_name, google_form_link, class_id, duration } = req.body;
  try {
    if (class_id) {
      await Class.findByIdAndUpdate(class_id, {
        class_name,
        google_form_link,
        duration,
      });
      return res.status(200).send({ message: "success" });
    }
    const createClass = new Class({
      class_name,
      google_form_link,
      duration,
      created_by: req.user.id,
    });

    return createClass.save(async (err, data) => {
      if (err) {
        return res.status(302).send({ success: false, message: err });
      }

      return res.status(200).send({ message: "success", success: true, data });
    });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchAllClass = async (req, res) => {
  try {
    const data = await Class.find().sort({
      createdAt: "descending",
    });
    return res.status(200).send({ message: "success", success: true, data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
exports.fetchDetailClass = async (req, res) => {
  const { class_id } = req.query;
  try {
    const data = await Class.findById(class_id);
    return res.status(200).send({ message: "success", success: true, data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
exports.removeClass = async (req, res) => {
  const { class_id } = req.body;
  try {
    const data = await Class.findByIdAndDelete(class_id);
    return res.status(200).send({ message: "success" });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
exports.fetchUserList = async (req, res) => {
  try {
    const data = await User.find({ role: "client" })
      .select("id fullname email created_at")
      .sort({ created_at: "descending" });
      const totalCount = await User.count({ role: "client" });
    return res.status(200).send({ message: "success", data, totalCount });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchAdminList = async (req, res) => {
  try {
    const data = await User.find({ role: "admin" })
      .select("id fullname email created_at")
      .sort({ created_at: "descending" });
    const totalCount = await User.count({ role: "admin" });
    return res.status(200).send({ message: "success", data, totalCount });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    let password = otpGenerator.generate(8, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: true,
      specialChars: false,
      digits: true,
    });
    const user = {
      fullname: req.body.fullname,
      email: req.body.email,
      password: bcrypt.hashSync(password, 8),
    };

    const findUser = await User.findOne({ email: req.body.email });

    if (findUser) {
      return res.json({
        message: "failed",
        success: false,
        info: "user already existed.",
      });
    }

    const data = await User.create({
      fullname: user.fullname,
      email: user.email,
      password: user.password,
      role: "admin",
    });

    await UserAudit.create({
      user_id: data._id,
      created_by: req.user.id,
      reason: "Created an account.",
    });

    mailOptionsCreateAdmin;
    mailOptionsCreateAdmin.to = user.email;
    mailOptionsCreateAdmin.html = `
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
                                                    <p>Hello ${user.fullname}!<br><br>Your password: ${password}<br><br>(If you cannot connect to the server, please contact the administrator.)<br>From Miracle Healing Camp</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td class="es-m-p0r esd-container-frame" width="560" valign="top" align="center">
                                    <table width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                            <tr>
                                                <td align="left" class="esd-block-text">
                                                    <p><br></p>
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
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    transporter.sendMail(mailOptionsCreateAdmin, (err, data) => {
      if (err) {
        return console.log("Error occurs", err);
      }
      return res.status(200).send({ message: "success", success: true });
    });

    console.log({ password });
    return res.json({ message: "success", password });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchUserAudit = async (req, res) => {
  try {
    const data = await UserAudit.findOne({
      user_id: req.query.user_id,
    }).populate({
      path: "created_by",
      model: "User",
      select: "id fullname",
    });

    return res.status(200).send({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
exports.fetchCustomerAudit = async (req, res) => {
  try {
    const data = await CustomerAudit.find({
      customer_id: req.query.customer_id,
    }).populate({
      path: "created_by",
      model: "User",
      select: "id fullname",
    });

    return res.status(200).send({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchAppointmentAudit = async (req, res) => {
  try {
    const data = await AppointmentAudit.find({
      appointment_id: req.query.appointment_id,
    }).populate({
      path: "created_by",
      model: "User",
      select: "id fullname",
    });

    return res.status(200).send({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
exports.fetchMaintennceStatus = async (req, res) => {
  try {
    const data = await Maintenance.find();

    return res.status(200).send({ message: "success", data: data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
exports.updateMaintennceStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const data = await Maintenance.findByIdAndUpdate(
      id,
      { status },
      { new: true, upsert: true }
    );

    return res.status(200).send({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
