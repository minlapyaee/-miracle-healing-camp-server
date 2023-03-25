const { Router } = require("express");
const verifyToken = require("../../middlewares/authorization");
const {
  fetchCustomerList, findCustomer, updateCustomerStatus, fetchAppointmentList, findAppointment, updateAppointmentStatus, createClass, fetchAllClass, fetchDetailClass, removeClass
} = require("../controllers/admin.controller");

const router = Router();

router.get("/customer_list", verifyToken, fetchCustomerList)
router.get("/customer_detail", verifyToken, findCustomer)
router.post("/update_customer", verifyToken, updateCustomerStatus)
router.get("/appointment_list", verifyToken, fetchAppointmentList)
router.get("/appointment_detail", verifyToken, findAppointment)
router.post("/update_appointment", verifyToken, updateAppointmentStatus)
router.get("/classes", fetchAllClass)
router.get("/detail_class", verifyToken, fetchDetailClass)
router.post("/create-class", verifyToken, createClass)
router.post("/remove-class", verifyToken, removeClass)

module.exports = router;
