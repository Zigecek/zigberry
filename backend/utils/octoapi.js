const foo = require("./onoff");
const axios = require("axios");
const main = require("../zigberry");
const { parseJson } = require("parse-json");

module.exports = {
  connect: async () => {
    var current = await api("/api/connection", "GET");
    if (!current.data.current.port) {
      var res = await api("/api/connection", "POST", {
        command: "connect",
      });
      return res;
    } else {
      return null;
    }
  },
  event: (args) => {
    args.splice(2);
    var payload = parseJson(args[0]);
    var eventName = args[1];
    console.log(eventName, args);
  },
};

async function api(path, type, data) {
  var returning = axios({
    url: path,
    baseURL: "https://octo.kozohorsky.xyz/",
    method: type,
    responseType: "json",
    params: type == "GET" ? data : undefined,
    data: type == "POST" ? data : undefined,
    headers: {
      "X-Api-Key": process.env.API_KEY,
    },
  })
    .then((res) => {
      return res;
    })
    .catch((err) => {
      return err.response;
    });
  return returning;
}
