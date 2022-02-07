const jwt = require("jsonwebtoken");

function authToken(req, res, next) {
  const token = req.body.token;
  if (!token)
    return res
      .status(200)
      .json({ success: false, message: "Access Denied", payload: [] });
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log(verified);
    next();
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: "In-valid Token", payload: [] });
  }
}
module.exports = authToken;
