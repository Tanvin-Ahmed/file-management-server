const express = require("express");
const {
  register,
  login,
  userUpdate,
  userDelete,
} = require("../controllers/user.controller");
const { isUser } = require("../middlewares/isUser");
const router = express.Router();

/* GET users listing. */
router.post("/register", register);
router.post("/login", login);
router.put("/update/:userId", isUser, userUpdate);
router.put("/delete/:userId", isUser, userDelete);

module.exports = router;
