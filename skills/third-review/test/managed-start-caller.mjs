#!/usr/bin/env node
import fs from "node:fs";
import { Broker } from "../lib/broker.mjs";
import { loadConfig } from "../lib/config.mjs";

const [configPath, requestPath, requestId] = process.argv.slice(2);
const broker = new Broker(loadConfig(configPath));
console.log(JSON.stringify(broker.startManaged(JSON.parse(fs.readFileSync(requestPath, "utf8")), requestId)));
setInterval(() => {}, 1_000);
