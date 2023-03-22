const { Router } = require("express");
const verifyToken = require("../../middlewares/authorization");
const {
  create_post,
  fetchPost,
  createComment,
  fetchComment,
  createLike,
  fetchPostDetail,
  createAppointment,
  checkAppointment,
  registerCustomer,
} = require("../controllers/client.controller");

const router = Router();

router.post("/create_post", verifyToken, create_post);
router.get("/fetch_post", verifyToken, fetchPost);
router.get("/fetch_post_detail", verifyToken, fetchPostDetail);
router.post("/create_comment", verifyToken, createComment);
router.get("/fetch_comment", verifyToken, fetchComment);
router.post("/create_like", verifyToken, createLike);
router.post("/create_appointment", verifyToken, createAppointment)
router.get("/check_appointment", verifyToken, checkAppointment)
router.post("/register_customer", verifyToken, registerCustomer)

module.exports = router;
