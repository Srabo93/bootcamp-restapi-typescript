import pino from "pino";
import { join } from "path";

const logFilePath = join(__dirname, "../../logs/app.log");

const transport = pino.transport({
  target: "pino/file",
  options: {
    destination: logFilePath,
    mkdir: true,
    translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
    ignore: "pid,hostname",
  },
});
const logger = pino(transport);
export default logger;
