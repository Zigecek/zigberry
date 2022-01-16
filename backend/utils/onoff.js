const oof = require("onoff");
const Gpio = oof.Gpio;
const printerIO = new Gpio(22, "out");

module.exports = {
  setPrinter: (val) => {
    try {
      printerIO.writeSync(val);
      console.log(val);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
};

process.on("SIGINT", (_) => {
  printerIO.unexport();
});
