const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const { ctrlWrapper, HttpError, sendEmail } = require("../helpers");
const { SECRET_KEY, BASE_URL } = process.env;
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const avatarsDir = path.join(__dirname, "../", "public", "avatars");
const Jimp = require("jimp");


const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }
  
  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationCode = Date.now() + Math.floor(Math.random() * 10000000000000);
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationCode,
  });
  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationCode}">Click verify</a>`
  };
   
  await sendEmail(verifyEmail);

    res.status(201).json({
      email: newUser.email,
      password: newUser.password,
    });
}

const verifyEmail = async (req, res) => { 
  const { verificationCode } = req.params;
  const user = await User.findOne({ verificationCode });
  if (!user) {
    throw HttpError(401, "Email not found");
  }
  await User.findByIdAndUpdate(user._id, { verify: true, verificationCode: null });

  res.json({
    message: "email verified successfully",
  })
}

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email not found");
  }
  if (user.verify) {
    throw HttpError(401, "Email already verified");
  }
    const verifyEmail = {
      to: email,
      subject: "Verify email",
      html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationCode}">Click verify</a>`,
  };
  
  await sendEmail(verifyEmail);

  res.json({
    message: "Verify email send successfully",
  })
}

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw HttpError(401, "Email not verified");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
  });
}
  
  const getCurrent = async (req, res) => {
    const { email } = req.user;

    res.json({ email });
  }

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.json({message: "Logout success"})
}



const updateAvatar = async (req, res) => {
    const { _id } = req.user;
    const { path: tempUpload, originalname } = req.file;
    const filename = `${_id}_${originalname}`;
    try {
      async function resize() {
        const image = await Jimp.read(tempUpload);
        await image.resize(250, 250).writeAsync(`resize_${_id}_${originalname}`);
      }
      resize();
      const resultUpload = path.join(avatarsDir, filename);
      await fs.rename(tempUpload, resultUpload);
      const avatarURL = path.join("avatars", filename);
      await User.findByIdAndUpdate(_id, { avatarURL });
      res.json({ avatarURL });
    } catch (err) {
      await fs.unlink(tempUpload);
      throw err;
    }
}


module.exports = {
  signup: ctrlWrapper(signup),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
}