require("dotenv").config();
const requestPromise = require("request-promise");
const Customer = require("../models/customer.model");
const Meet = require("../models/meet.model");
const Appointment = require("../models/appointment.model");
const Class = require("../models/class.model");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

let mailOptions = {
  from: process.env.EMAIL,
  subject: "Zoom Meeting Using Node JS :D",
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
        console.log(response);
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
    const { status, id } = req.body;
    const data = await Customer.findByIdAndUpdate(
      id,
      { status },
      {
        upsert: true,
      }
    );
    return res.json({ message: "success", data });
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
      console.log(data);
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
    const { status, id } = req.body;

    const data = await Appointment.findByIdAndUpdate(
      id,
      { status },
      {
        upsert: true,
      }
    );
    if (status === "progress") {
      const { join_url, host_id, password } = await createMeeting(data.email);
      console.log({ join_url, host_id, password });
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
    } else if (data.status === "completed") {
      await Meet.findOneAndDelete({
        user_id: data.requested_by,
      });
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
      await Class.findByIdAndUpdate(class_id, { class_name, google_form_link, duration });
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
exports.removeClass = async (req,res) => {
  const { class_id } = req.body
  try {
    const data = await Class.findByIdAndDelete(class_id);
    return res.status(200).send({ message: "success",});
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
}