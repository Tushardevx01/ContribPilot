#!/usr/bin/env node
import { Command } from 'commander';
import { VERSION } from '@contribpilot/core';

const program = new Command();

program
  .name('contribpilot')
  .description('ContribPilot: AI-powered Open-Source Contribution Assistant')
  .version(VERSION);

program
  .command('doctor')
  .description('Check environment: node, git, network, keys')
  .action(() => {
    console.log(`ContribPilot v${VERSION} Doctor: OK (Node ${process.version})`);
  });

program.parse(process.argv);
