const axios = require("axios");
require("dotenv").config({
  path: "../.env",
});
var args = process.argv;
args.splice(0, 2);
var rawPL = args[0];
rawPL = rawPL.replace(/'/g, '"');
var payload = JSON.parse(rawPL);
var eventName = args[1];

axios({
  url: "https://dash.kozohorsky.xyz/event",
  method: "POST",
  data: {
    event: eventName,
    payload,
  },
  headers: {
    auth: process.env.CORS_KEY,
  },
});
