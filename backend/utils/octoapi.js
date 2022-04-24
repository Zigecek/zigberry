const foo = require("./onoff");
const axios = require("axios");
const short = require("short-uuid");
const MjpegDecoder = require("mjpeg-decoder");
const { imgbox } = require("imgbox");
var latestEUUID = "";

const octoapiFNs = {
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
        octoapiFNs.autoOff();
        break;

      case "PrintStarted":
        octoapiFNs.newUUID();
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
        octoapiFNs.autoOff();
        const frame = await MjpegDecoder.decoderForSnapshot(
          "https://octo.kozohorsky.xyz/webcam0/?action=stream"
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
        octoapiFNs.autoOff();
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
  autoOff: async () => {
    const uid = short.generate();
    latestEUUID = uid;

    console.log(uid);

    var res = await api("/api/printer?exclude=temperature,sd", "GET");
    if (res) {
      if (
        (res.data.state?.flags.ready && !res.data.state?.flags.printing) ||
        res?.status == 409
      ) {
        setTimeout(async () => {
          if (uid == latestEUUID) {
            var state = await api("/api/printer?exclude=temperature,sd", "GET");
            if (state) {
              if (
                (res.data.state?.flags.ready &&
                  !res.data.state?.flags.printing) ||
                res?.status == 409
              ) {
                foo.setPrinter(0);
              }
            }
          }
        }, 20 * 60 * 1000);
      }
    }
  },
  newUUID: () => {
    latestEUUID = short.generate();
    console.log(latestEUUID);
  },
};
module.exports = octoapiFNs;

octoapiFNs.autoOff();

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
