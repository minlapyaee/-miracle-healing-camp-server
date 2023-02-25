const development = require("./env/development");
const production = require("./env/production");

module.exports = {
  development,
  production,
}[process.env.NODE_ENV || "development"];
