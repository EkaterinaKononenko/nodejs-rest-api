const { User } = require("../models/user");
const { ctrlWrapper } = require("../helpers");

const signup = async (req, res) => {
    const newUser = await User.create(req.body);
    res.status(201).json({
      email: newUser.email,
      name: newUser.name,
      password: newUser.password,
    });
}

module.exports = {
    signup: ctrlWrapper(signup),
}