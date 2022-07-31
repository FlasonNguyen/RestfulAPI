const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    default:
      "https://scr.vn/wp-content/uploads/2020/07/Avatar-Facebook-tr%E1%BA%AFng.jpg",
  },
  role: {
    type: String,
    default: "user",
    enum: ["admin", "user"],
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

User.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});
User.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id, username: user.username, role: user.role },
    process.env.JWT_KEY
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

User.statics.findByCredentials = async function (username, password) {
  const users = await this.findOne({ username });
  console.log(users);
  if (!users) {
    return null;
  }
  const isMatch = await bcrypt.compare(password, users.password);
  if (!isMatch) {
    return null;
  }
  return users;
};
module.exports = mongoose.model("User", User);
