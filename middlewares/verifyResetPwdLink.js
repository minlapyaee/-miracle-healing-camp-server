const jwt = require("jsonwebtoken");

const verifyResetPwdLink = (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    console.log(req.headers)
    jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.API_SECRET,
      (err, decode) => {
          console.log(err);
        if (err) req.user = undefined;
        req.user = decode;
        return next();
      }
    );
  } else {
    req.user = undefined;
    next();
  }
};

module.exports = verifyResetPwdLink;
