const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", (req, res, next) => {
  return res.render("index", { title: "Express" });
});

module.exports = router;
