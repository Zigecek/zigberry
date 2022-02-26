const foo = require("./onoff");
const axios = require("axios");
const main = require("../zigberry");

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
    args.splice(0, 2);
    console.log(args);
    var rawPL = args[0];
    rawPL = rawPL.replace(/'/g, '"');
    console.log(rawPL);
    var payload = JSON.parse(rawPL);
    console.log(payload);
    var eventName = args[1];
    console.log(eventName, payload);
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
