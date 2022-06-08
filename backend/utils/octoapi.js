const foo = require("./onoff");
const axios = require("axios");
const short = require("short-uuid");
const MjpegDecoder = require("mjpeg-decoder");
const { imgbox } = require("imgbox");
var latestEUUID = "";
const config = require("../config");

const octoapiFNs = {
  connect: async () => {
    var current = await api("/api/connection", "GET");
    if (!current?.data?.current?.port) {
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
      case "PrintStateChanged":
        octoapiFNs.autoOff(eventName);
        break;

      case "PrintStarted":
        octoapiFNs.newUUID(eventName);
        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            event: eventName,
            data: {
              file: payload.name,
            },
          },
        });
        break;
      case "PrintDone":
        octoapiFNs.autoOff(eventName);
        const frame = await MjpegDecoder.decoderForSnapshot(
          config.apiPath + config.webcamPath
        ).takeSnapshot();
        var url =
          "https://www.solidbackgrounds.com/images/1280x720/1280x720-smoky-black-solid-color-background.jpg";
        try {
          var img = await imgbox(frame);
          if (img.ok) {
            url = img.files[0].original_url;
          }
        } catch (err) {
          console.error(err);
        }

        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            event: eventName,
            data: {
              file: payload.name,
              image: url,
              time: payload.time,
            },
          },
        });
        break;
      case "PrintFailed":
        octoapiFNs.autoOff(eventName);
        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            event: eventName,
            data: {
              file: payload.name,
              cancelled: payload.reason == "cancelled",
            },
          },
        });
        break;
      case "PrintCancelled":
        octoapiFNs.autoOff(eventName);
        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            event: eventName,
            data: {
              file: payload.name,
              cancelled: true,
            },
          },
        });
        break;
      case "PrintCancelling":
        octoapiFNs.autoOff();
        axios({
          method: "post",
          url: "/toAdmin",
          baseURL: "http://localhost:3321",
          data: {
            event: eventName,
            data: {
              file: payload.name,
              cancelled: true,
            },
          },
        });
        break;
    }
  },
  autoOff: async (ename) => {
    const uid = short.generate();
    latestEUUID = uid;

    console.log("autooff start", ename, uid);

    var res = await api("/api/printer?exclude=temperature,sd", "GET");
    if (res) {
      if (
        (res.data.state?.flags.ready && !res.data.state?.flags.printing) ||
        res?.status == 409
      ) {
        console.log("autooff init");
        setTimeout(async () => {
          if (uid == latestEUUID) {
            var state = await api("/api/printer?exclude=temperature,sd", "GET");
            if (state) {
              console.log("autooff finalcheck");
              if (
                (res.data.state?.flags.ready &&
                  !res.data.state?.flags.printing) ||
                res?.status == 409
              ) {
                console.log("autooff POWEROFF", ename);
                foo.setPrinter(0);
              }
            }
          }
        }, config.autoOffDelay);
      }
    }
  },
  newUUID: (ename) => {
    latestEUUID = short.generate();
    console.log(ename, latestEUUID);
  },
};
module.exports = octoapiFNs;

octoapiFNs.autoOff();

async function api(path, type, data) {
  var ret = axios({
    url: path,
    baseURL: config.apiPath,
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
      console.error(err.response);
      return err.response;
    });
  return ret;
}
