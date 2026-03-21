const isDevelopment = import.meta.env.DEV

function write(method, args) {
  if (!isDevelopment) {
    return
  }

  console[method](...args)
}

export const logger = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args)
}
