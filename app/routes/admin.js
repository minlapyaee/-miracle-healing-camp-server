const { Router } = require("express");
const verifyToken = require("../../middlewares/authorization");
const {
  fetchCustomerList, findCustomer, updateCustomerStatus, fetchAppointmentList, findAppointment, updateAppointmentStatus, createClass, fetchAllClass, fetchDetailClass, removeClass, fetchUserList, fetchAdminList, createAdmin, fetchUserAudit, fetchCustomerAudit, fetchAppointmentAudit, fetchMaintennceStatus, updateMaintennceStatus
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
router.get("/user-list", verifyToken, fetchUserList)
router.get("/admin-list", verifyToken, fetchAdminList)
router.post("/create-admin", verifyToken, createAdmin)
router.get("/user-audit", verifyToken, fetchUserAudit)
router.get("/customer-audit", verifyToken, fetchCustomerAudit)
router.get("/appointment-audit", verifyToken, fetchAppointmentAudit)
router.get("/fetch_maintenance_status", fetchMaintennceStatus)
router.post("/update_maintenance_status", verifyToken, updateMaintennceStatus)

module.exports = router;
