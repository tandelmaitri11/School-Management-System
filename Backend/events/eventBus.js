const EventEmitter = require("events");

class AppEventBus extends EventEmitter {
  emitAsync(eventName, payload) {
    setImmediate(() => {
      this.emit(eventName, payload);
    });
  }
}

module.exports = new AppEventBus();
