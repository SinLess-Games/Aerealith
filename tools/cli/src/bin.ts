#!/usr/bin/env node
import { createCli } from './index.js';

void createCli().runExit(process.argv.slice(2));
