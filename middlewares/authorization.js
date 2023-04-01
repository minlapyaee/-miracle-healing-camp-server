/* eslint-disable consistent-return */
const jwt = require("jsonwebtoken");
const User = require("../app/models/user.model");
const RFToken = require("../app/models/rftoken.model");

const jwtVerifyFunction = (req, res, next) => {
  jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.API_SECRET,
    (err, decode) => {
      if (err) req.user = undefined;
      if (decode && decode.id) {
        User.findOne({
          _id: decode.id,
        }).exec((error, user) => {
          if (error) {
            return res.status(500).send({
              message: error,
            });
          }
          req.user = user;
          return next();
        });
      } else if (req.headers.rftoken_id) {
        RFToken.findOne({
          rftoken_id: req.headers.rftoken_id,
        }).exec((error, data) => {
          if (error) {
            return res.status(500).send({
              message: error,
            });
          }
          if (data && data?.refresh_token) {
            return jwt.verify(
              data.refresh_token,
              process.env.REFRESH_TOKEN_SECRET,
              (errS, decodeS) => {
                if (!decodeS) {
                  return res.status(200).send({
                    message: "Session timeout 1.",
                    success: false,
                  });
                }
                const accessToken = jwt.sign(
                  {
                    id: decodeS.id,
                  },
                  process.env.API_SECRET,
                  {
                    expiresIn: "15m",
                  }
                );
                req.accessToken = accessToken;
                User.findOne({
                  _id: decodeS.id,
                }).exec((errorS, user) => {
                  if (errorS) {
                    return res.status(500).send({
                      message: "Session timeout 2.",
                      success: false,
                    });
                  }
                  req.user = user;
                  return next();
                });
              }
            );
          }
          res.json({ message: "Session timeout 3", success: false });
        });
      } else {
        res.json({ message: "Session timeout 4", success: false });
      }
    }
  );
};

const verifyToken = (req, res, next) => {
  const originalUrl = req.originalUrl.slice(0, -1);
  const removeFirstWord = req.headers.authorization.split(" ")[1];
  if (
    originalUrl === "/client/fetch_post" ||
    originalUrl === "/client/fetch_post_detai"
  ) {
    if (removeFirstWord !== "undefined") {
      return jwtVerifyFunction(req, res, next);
    } else {
      req.user = undefined;
      return next();
    }
  }
  if (req.headers && req.headers.authorization) {
    jwtVerifyFunction(req, res, next);
  } else {
    return res.json({ message: "session timeout" });
  }
};
module.exports = verifyToken;
