const foo = require("./onoff");
const axios = require("axios");

module.exports = {
  connect: async () => {
    var current = await api("/api/connection", "GET");
    console.log(current);
    if (!current.data.current.port) {
      var res = await api("/api/connection", "POST", {
        command: "connect",
      });
      console.log(res);
      return res;
    } else {
      return null;
    }
  },
};

async function api(path, type, data) {
  axios({
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
}
