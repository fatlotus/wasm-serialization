// monkey patch the Go class to expose the values in wrapped closures.
var original = Go.prototype._makeFuncWrapper;
Go.prototype._makeFuncWrapper = function(id) {
  var result = original(id);
  result._funcWrapperId = id;
  return result;
};

MrFreeze.Go = {
  save: function(go) {
    var stored = {
      underlying: MrFreeze.saveRaw(go._inst),
      values: [],
      refCounts: go._goRefCounts.slice(),
    };

    // skip the first six entries (they're always the same)
    for (var val of go._values.slice(7)) {
      if (val.funcWrapperId) {
        stored.values.push({type: "func_wrapper", id: val._funcWrapperId});
      } else if (val instanceof Go) {
        stored.values.push({type: "go"});
      } else if (typeof val == "function" && window[val.name] === val) {
        stored.values.push({type: "constructor", name: val.name});
      } else if (val.chmod) {
        stored.values.push({type: "fs"});
      } else {
        stored.values.push(null);
      }
    }
    return JSON.stringify(stored);
  },
  
  restore: function(value, go, instance) {
    var parsed = JSON.parse(value);

    MrFreeze.restoreRaw(parsed.underlying, instance);

    go._inst = instance;
    go.mem = new DataView(go._inst.exports.mem.buffer);

    // copy the behavior of wasm_exec.js.
    go._values = [NaN, 0, null, true, false, window, go];

    for (var packedValue of parsed.values) {
      if (!packedValue) {
        go._values.push("poison");
        continue;
      }

      switch (packedValue.type) {
      case "func_wrapper":
        go._values.push(go._makeFuncWrapper(packedValue.id));
        break;
      case "go":
        go._values.push(go);
        break;
      case "constructor":
        go._values.push(window[packedValue.name]);
        break;
      case "fs":
        go._values.push(window.fs); // created by wasm_exec.js
        break;
      default:
        throw "Not sure what to do with " + packedValue.type;
      }
    }

    go._goRefCounts = parsed.refCounts;
    go._idPool = [];
    go._ids = new Map([
      [0, 1],
      [null, 2],
      [true, 3],
      [false, 4],
      [global, 5],
      [this, 6],
    ]);
    go.exited = false;

    go._resume();
  },
  
  // Stop a Go VM in its tracks (without logging an error)
  forciblyTerminateVM: function(go) {
    go._resume = function() {};
  
    // Hack for the workaround that calls _resume in a loop.
    go._scheduledTimeouts = new Map();
  }
};