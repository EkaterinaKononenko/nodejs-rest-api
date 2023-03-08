const express = require('express');
const { validateBody } = require("../../middlewares");
const { schemas } = require("../../models/user"); 
const ctrl = require("../../controllers/auth");

const router = express.Router();

router.post("/signup", validateBody(schemas.signupSchema), ctrl.signup);

module.exports = router;