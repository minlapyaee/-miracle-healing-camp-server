const { Router } = require("express");
const verifyToken = require("../../middlewares/authorization");
const verifyResetPwdLink = require("../../middlewares/verifyResetPwdLink");
const {
  signin,
  signup,
  getinfo,
  updateprofile,
  checkOtp,
  resetPasswordLink,
  resetPassword
} = require("../controllers/auth.controller");

const router = Router();

router.post("/register", signup);
router.post("/verify_otp", checkOtp);
router.post("/login", signin);
router.get("/get_user", verifyToken, getinfo);
router.post("/update_profile", verifyToken, updateprofile);
// generate Link
router.post("/reset_password_link", verifyToken, resetPasswordLink);
router.post("/update_password", verifyResetPwdLink, resetPassword);

module.exports = router;
