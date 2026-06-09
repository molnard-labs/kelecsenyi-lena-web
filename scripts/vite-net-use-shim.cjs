const childProcess = require("node:child_process");
const { EventEmitter } = require("node:events");

const originalExec = childProcess.exec;

childProcess.exec = function exec(command, options, callback) {
  if (command === "net use") {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => true;

    const done = typeof options === "function" ? options : callback;
    if (done) {
      process.nextTick(() => done(null, "", ""));
    }
    process.nextTick(() => child.emit("close", 0));
    return child;
  }

  return originalExec.apply(this, arguments);
};
