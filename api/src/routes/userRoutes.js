const user = require("../controllers/userController");
const router = require("express").Router();

router.post("/register", user.registerUser);
router.post("/admin/login", user.adminLogin);
router.post("/register-app", user.registerUserApp);

router.post("/login", user.userLogin);
router.post("/login/app", user.userLoginApp);
router.post("/auto/login", user.autoLogin);

router.put("/update-profile", user.updateProfile);
router.get("/detail", user.userProfile);
router.get("/user-listing", user.getAllUsers);

router.get("/verify", user.verifyUser);
router.put("/change-password", user.changePassword);

router.post("/admin/forgot-password", user.forgotPasswordAdmin);
router.post("/forgot-password", user.forgotPasswordUser);
router.post("/forgot-password/app", user.forgotPasswordUserApp);

router.put("/reset-password", user.resetPassword);
router.post("/add-user", user.addUser);

router.put("/approval-status", user.changeApprovalStatus);
router.put("/change-status", user.changeStatus);
router.delete("/delete", user.deleteUser);

router.get("/resend-verification", user.resendVerificationEmail);
router.post("/verify-otp", user.verifyOtp);

router.post("/logout-user", user.logout);

router.get("/ckeck", user.checkResetLink);
module.exports = router;
