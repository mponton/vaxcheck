import emitter from 'tiny-emitter/instance'

// NOTE: This is apparently not recommended anymore with Vue 3 but I could not figure
//       out how to send events between the main page and the layout... :-(

const EventBus = {
    $on: (...args) => emitter.on(...args),
    $once: (...args) => emitter.once(...args),
    $off: (...args) => emitter.off(...args),
    $emit: (...args) => emitter.emit(...args)
}

export { EventBus }