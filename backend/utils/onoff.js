const oof = require("onoff");
const Gpio = oof.Gpio;
const printerIO = new Gpio(22, "out");

module.exports = {
  setPrinter: (val) => {
    try {
      printerIO.writeSync(Number(val));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  getPrinter: () => {
    try {
      var val = printerIO.readSync();
      return val;
    } catch (error) {
      console.error(error);
      return "err";
    }
  },
};

process.on("SIGINT", (_) => {
  printerIO.unexport();
});
