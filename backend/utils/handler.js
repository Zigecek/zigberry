const axios = require("axios");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
const { parse } = require("flatted");
var args = process.argv;
args.splice(0, 2);
var rawPL = args[0];
console.log(rawPL);
rawPL = rawPL.replace(/'/g, '"');
console.log(rawPL);
var payload = parse(rawPL);
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
