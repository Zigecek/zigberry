require("dotenv").config({
  path: require("find-config")(".env"),
});
require("./utils/mongoose").init();

const express = require("express");
const app = express();
const session = require("express-session");
const { createServer } = require("http");
const serveStatic = require("serve-static");
const User = require("./models/user");
const bodyParser = require("body-parser");
const foo = require("./utils/onoff");
const { exec } = require("child_process");
var MongoDBStore = require("connect-mongodb-session")(session);
const octo = require("./utils/octoapi");
var sudo = require("sudo-js");
const config = require("./config");
const socketIo = require("socket.io");
sudo.setPassword(process.env.SUDOPSWD);

var store = new MongoDBStore({
  uri: process.env.MONGOOSE_KEY,
  collection: "sessions",
});

const httpServer = createServer(app);
httpServer.listen(config.port);

const io = new socketIo.Server(httpServer, {
  cors: {
    origin: [
      "https://kozohorsky.xyz",
      "https://octo.kozohorsky.xyz",
      "https://dash.kozohorsky.xyz",
      "https://kozohorsky-xyz.herokuapp.com",
    ],
    methods: ["GET", "POST"],
  },
});

octo.initSocket(io);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

store.on("error", function (error) {
  console.log(error);
});

app.use(
  session({
    secret: "a1a56g4a56g4as21va23sg153as4g",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: config.cookieLifetime, // 3 days
    },
    store: store,
  })
);

app.use(function (req, res, next) {
  res.header("Access-Control-Expose-Headers", "Authorization");
  next();
});

// Authentication and Authorization Middleware
var auth = function (req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    return res.redirect("/prihlaseni");
  }
};

// Login endpoint
app.post("/login", async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(406).send("login failed");
  } else {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).send("U??ivatel neexistuje");
      } else {
        if (user.password == password) {
          req.session.user = username;
          return res.status(200).send("/dash?alert=login");
        } else {
          return res.status(410).send("??patn?? heslo");
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
});

// Logout endpoint
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/prihlaseni");
});

const evFn = (req, res, next) => {
  if (req.headers.authorization == process.env.CORS_KEY) {
    return next();
  } else {
    return res.sendStatus(401);
  }
};

app.post("/events", evFn, (req, res) => {
  octo.event(req.body.args);
  res.sendStatus(204);
});

app.post("/use", auth, function useFn(req, res) {
  var { method, value } = req.body;
  console.log(req.body);
  switch (method) {
    case "getPrinter":
      const result = foo.getPrinter();
      if (result != "err") {
        res.status(200).send(result.toString());
      } else {
        res.status(201).send("Do??lo k chyb??");
      }
      break;
    case "setPrinter":
      if (value == 0 || value == 1) {
        const result = foo.setPrinter(value);
        octo.autoOff();

        if (result == true) {
          if (value == 1) {
            res.status(200).send("Tisk??rna byla ??sp????n?? zapnuta.");
          } else {
            res.status(200).send("Tisk??rna byla ??sp????n?? vypnuta.");
          }
        } else if (result == false) {
          if (value == 1) {
            res.status(201).send("P??i zap??n??ni tisk??rny do??lo k chyb??.");
          } else {
            res.status(201).send("P??i vyp??n??ni tisk??rny do??lo k chyb??.");
          }
        }
      }
      break;
    case "restartWebcamDaemon":
      sudo.exec(
        ["sudo", "/home/" + config.user + "/cc/webcamd.sh"],
        { check: false, withResult: false },
        (error, pid, out) => {
          console.log(error, pid, out);
          if (!error) {
            res.status(200).send("Kamery byly ??sp????n?? restartov??ny.");
          } else {
            console.error(error);
            res.status(201).send("P??i restartu kamer do??lo k chyb??.");
          }
        }
      );
      break;
    case "restartUSB":
      sudo.exec(
        ["sudo", "/home/" + config.user + "/cc/restart.sh"],
        { check: false, withResult: false },
        (error, pid, out) => {
          console.log(error, pid, out);
          if (!error) {
            setTimeout(async () => {
              const conRes = await octo.connect();

              res.send(
                `USB za????zen?? se ??sp????n?? aktualizovala. (${
                  conRes?.status ? conRes.status : res
                })`
              );
            }, 3000);
          } else {
            console.error(error);
            res.status(201).send("P??i restartu USB do??lo k chyb??.");
          }
        }
      );
      break;
  }
});

app.post("/event", (req, res) => {
  if (req.headers.auth == process.env.CORS_KEY) {
    octo.event(req.body.event, req.body.payload);
    res.sendStatus(204);
  } else {
    res.sendStatus(401);
  }
});

app.get("/dash", auth);
app.get("/", auth, (req, res, next) => {
  res.redirect("/dash");
});

app.get("/get");

app.use(serveStatic("./frontend/"));

console.log("Zigberry - " + config.port);

