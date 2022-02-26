const foo = require("./onoff");
const axios = require("axios");
const main = require("../zigberry");
const short = require("short-uuid");
var latestEUUID = "";

const fns = {
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
  event: async (eventName, payload) => {
    console.log(eventName, payload);

    switch (eventName) {
      case "Connected":
      case "FileAdded":
      case "FileRemoved":
      case "UpdatedFiles":
      case "FileSelected":
      case "TransferStarted":
      case "PrintStateChanged":
        fns.autoOff();
        break;

      case "PrintStarted":
        fns.newUUID();
        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            state: eventName,
            data: {
              file: payload.name,
            },
          },
        });
      case "PrintDone":
        fns.autoOff();
        var image = await getImage();
        var base64 = image ? Buffer.from(image, "base64") : undefined;
        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            state: eventName,
            data: {
              file: payload.name,
              image: base64,
              time: payload.time,
            },
          },
        });
      case "PrintFailed":
        fns.autoOff();
        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            state: eventName,
            data: {
              file: payload.name,
              cancelled: payload.reason == "cancelled",
            },
          },
        });
        break;
    }
  },
  autoOff: async () => {
    const uid = short.generate();
    latestEUUID = uid;

    console.log(uid);
    var res = await api("/api/printer?exclude=temperature,sd", "GET");
    if (res) {
      console.log("1");
      if (res.flags) {
        console.log("2");
        if (res.state.flags.ready && !res.state.flags.printing) {
          console.log("3");
          setTimeout(async () => {
            console.log("4");
            if (uid == latestEUUID) {
              console.log("5");
              var state = await api(
                "/api/printer?exclude=temperature,sd",
                "GET"
              );
              if (state) {
                console.log("6");
                if (state.flags) {
                  console.log("7");
                  if (state.state.flags.ready && !res.state.flags.printing) {
                    console.log("8");
                    var succ = foo.setPrinter(0);
                  }
                }
              }
            }
          }, 3 * 60 * 60 * 1000);
        }
      }
    }
  },
  newUUID: () => {
    latestEUUID = short.generate();
  },
};
module.exports = fns;

fns.autoOff();

async function api(path, type, data) {
  var ret = axios({
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
  return ret;
}

async function getImage() {
  axios({
    url: "https://octo.kozohorsky.xyz/webcam0/?action=snapshot",
    method: "GET",
    responseType: "arraybuffer",
  })
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log(err);
      return undefined;
    });
}
