const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const User = require("./model/User");
require("dotenv").config();
const auth = require("./auth");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

User.findOne({ role: "admin" }).then((found) => {
  if (!found) {
    let rawdata = fs.readFileSync("admin-account.json", "utf8");
    let data = JSON.parse(rawdata);
    console.log(found);
    data.forEach((account) => {
      User.create({
        username: account.username,
        password: account.password,
        fullName: account.fullName,
        avatar: account.avatar,
        role: "admin",
      });
    });
  }
});

app.post("/register", async (req, res) => {
  const { username, password, fullName, avatar } = req.body;
  const userExists = await User.findByCredentials(username, password);
  if (userExists) {
    return res.status(400).json({ status: "400", error: "User Existed" });
  }
  const user = new User({
    username,
    password,
    fullName,
    avatar,
  });
  await user.save();
  const token = await user.generateAuthToken();
  return res.status(200).json({ status: "200", message: "Success", token });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findByCredentials(username, password);
  if (!user) {
    return res.status(400).json({ status: "400", error: "User Not Found" });
  }
  const token = await user.generateAuthToken();
  return res
    .status(200)
    .json({ status: "200", message: "Login Success", token });
});

app.get("/profile", auth, async (req, res) => {
  if (req.role == "user") {
    const user = await User.findOne({ _id: req.id });
    return res.status(200).json({ status: "200", user });
  } else if (req.role == "admin") {
    const { id } = req.body;
    const user = await User.findById(id);
    return res.status(200).json({ status: "200", user });
  } else {
    return res.status(400).json({ status: "400", error: "User Not Found" });
  }
});

app.put("/userUpdate", auth, async (req, res) => {
  const { username, fullName, avatar } = req.body;
  if (req.role == "user") {
    const user = await User.findOne({ _id: req.id });
    if (!user) {
      return res.status(400).json({ status: "400", error: "User Not Found" });
    }
    user.username = username;
    user.fullName = fullName;
    user.avatar = avatar;
    await user.save();
    return res.status(200).json({ message: "User saved successfully" });
  } else if (req.role == "admin") {
    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ status: "400", error: "User Not Found" });
    }
    user.username = username;
    user.fullName = fullName;
    user.avatar = avatar;
    await user.save();
    return res.status(200).json({ message: "User saved successfully" });
  }
});

app.delete("/deleteUser", auth, async (req, res) => {
  if (req.role != "admin") {
    return res.status(401).json({
      status: "401",
      error: "You do not have permission to delete this user",
    });
  }
  try {
    const { id } = req.body;
    await User.findOneAndDelete({ _id: id });
    return res.status(200).json({ status: " Deleted Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Deleted Failed", error: error });
  }
});

app.post("/changeRole", auth, async (req, res) => {
  if (req.role != "admin") {
    return res.status(401).json({
      status: "401",
      error: "You do not have permission to change this role",
    });
  }
  const { id } = req.body;
  await User.findByIdAndUpdate(
    { _id: id },
    { $set: { role: "admin" } },

    { new: true }
  );
  return res.status(200).json({ status: "Successfully updated user to admin" });
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Server running at http://localhost:${process.env.PORT}`);
    })
  )
  .catch((e) => console.log(e));
