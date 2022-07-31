const jwt = require("jsonwebtoken");
const User = require("./model/User");

const auth = async (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  const data = jwt.verify(token, process.env.JWT_KEY);
  console.log(data);
  try {
    const user = await User.findOne({ _id: data._id, "tokens.token": token });
    if (!user) {
      return res.status(400).json({ error: "User NOT Login" });
    }
    req.id = user._id;
    req.role = user.role;
    req.token = token;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
module.exports = auth;
