const { app, utilityProcess } = require("electron")
const path = require("node:path")
app.whenReady().then(() => {
  const worker = utilityProcess.fork(path.resolve(process.argv[2]), [], { stdio: "pipe" })
  worker.stdout.pipe(process.stdout)
  worker.stderr.pipe(process.stderr)
  const timer = setTimeout(() => { worker.kill(); app.exit(1) }, 15_000)
  worker.on("exit", (code) => { clearTimeout(timer); app.exit(code ?? 1) })
})
