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

const port = 3388;
const httpServer = createServer(app);
httpServer.listen(port);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "a1a56g4a56g4as21va23sg153as4g",
    resave: true,
    saveUninitialized: true,
  })
);

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
        return res.status(404).send("Uživatel neexistuje");
      } else {
        if (user.password == password) {
          req.session.user = username;
          res.redirect("/dash");
        } else {
          return res.status(410).send("Špatné heslo");
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
});

// Logout endpoint
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/prihlaseni");
});

app.post("/use", auth, (req, res) => {
  var { method, value } = req.body;
  console.log(req.body);
  switch (method) {
    case "test":
      console.log("test");
      res.status(201).send("test spatny.");
      break;
    case "setPrinter":
      if (value == 0 || value == 1) {
        const result = foo.setPrinter(value);
        if (result == true) {
          if (value == 1) {
            res.status(200).send("Tiskárna byla úspěšně zapnuta.");
          } else {
            res.status(200).send("Tiskárna byla úspěšně vypnuta.");
          }
        } else if (result == false) {
          if (value == 1) {
            res.status(201).send("Při zapínáni tiskárny došlo k chybě.");
          } else {
            res.status(201).send("Při vypínáni tiskárny došlo k chybě.");
          }
        }
      }
      break;
    case "restartWebcamDaemon":
      if (value == true) {
        exec("sudo systemctl restart webcamd", (error, out, errout) => {
          if (error || errout) {
            res.status(201).send("Při restartu kamer došlo k chybě.");
          } else if (out) {
            res.status(200).send("Kamery byly úspěšně restartovány.");
          } else {
            res.status(201).send("Spojení vypršelo.");
          }
        });
      }
      break;
    default:
      break;
  }
});

app.get("/dash", auth);
app.get("/", auth, (req, res, next) => {
  res.redirect("/dash");
});

app.use(serveStatic("./frontend/"));

console.log("Zigberry - " + port);
