require("../zigberry");
const octo = require("./octoapi");

var args = process.argv;

args.splice(0, 2);
var rawPL = args[0];
rawPL = rawPL.replace(/'/g, '"');
var payload = JSON.parse(rawPL);
var eventName = args[1];

octo.event(eventName, payload);
