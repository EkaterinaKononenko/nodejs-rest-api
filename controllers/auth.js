const bcrypt = require("bcryptjs");
const { User } = require("../models/user");
const { ctrlWrapper, HttpError } = require("../helpers");

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email already exists");
  }
  
  const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({...req.body, password: hashPassword});
    res.status(201).json({
      email: newUser.email,
      name: newUser.name,
      password: newUser.password,
    });
}

module.exports = {
    signup: ctrlWrapper(signup),
}