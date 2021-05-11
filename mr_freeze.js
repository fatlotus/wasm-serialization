var MrFreeze = {
  runLengthEncode: function(array) {
    var prev = -1, count = 0, result = [];
    for (var item of array) {
      if (item === prev) {
        count += 1;
      } else {
        if (count > 0) {
          result.push(prev, count);
        }
        prev = item;
        count = 1;
      }
    }
    if (count > 0) {
      result.push(prev, count);
    }
    return result;
  },

  runLengthDecode: function(array) {
    var result = [];
    for (var i = 0; i < array.length; i += 2) {
      for (var j = 0; j < array[i + 1]; j++) {
        result.push(array[i]);
      }
    }
    return result;
  },

  saveRaw: function(instance) {
    var stored = {
      globals: {},
      memory: {},
    };

    for (var key in instance.exports) {
      if (instance.exports[key] instanceof WebAssembly.Global) {
        var val = instance.exports[key].value;
        stored.globals[key] = (typeof val == "bigint") ? val.toString() : val;
      } else if (instance.exports[key] instanceof WebAssembly.Memory) {
        stored.memory[key] = MrFreeze.runLengthEncode(Array.from(
          new Int8Array(instance.exports[key].buffer)));
      }
    }

    return stored;
  },

  restoreRaw: function(parsed, instance) {
    for (var key in instance.exports) {
      var target = instance.exports[key];
      if (target instanceof WebAssembly.Global && parsed.globals[key]) {
        var val = parsed.globals[key];
        target.value = (typeof target.value == "bigint") ? BigInt(val) : val;
      } else if (target instanceof WebAssembly.Memory && parsed.memory[key]) {
        var source = MrFreeze.runLengthDecode(parsed.memory[key]);
        while (target.buffer.byteLength < source.length) {
          target.grow(1);
        }
        new Int8Array(target.buffer).set(source);
      }
    }
  },

  save: function(instance) {
    return JSON.stringify(MrFreeze.saveRaw(instance));
  },

  restore: function(buffer, instance) {
    MrFreeze.restoreRaw(JSON.parse(buffer), instance);
  },
};