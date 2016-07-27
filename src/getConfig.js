
/**
 *
 * @license
 * Copyright (C) 2016 Joseph Roque
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Joseph Roque
 * @file getConfig.js
 * @description GET request to get current config file versions for a version of the app
 *
 * @flow
 */
'use strict';

// Imports
const fs = require('fs');
const HttpStatus = require('http-status-codes');
const path = require('path');

module.exports = (app, env) => {

  // Contents of the serverConfig file
  let serverConfig: Object = {};
  // Time that the serverConfig file was last updated
  let serverConfigLastModified: number = 0;

  app.get('/config/:version', (req, res) => {

    // Replies to client with current versions and locations of configuration files
    const sendConfigVersions = () => {
      // Get client version of the application
      const appVersion = req.params.version.trim();

      // Load JSON data, prepare data to send back to user
      const appConfig: Object = {};

      for (let i = 0; i < serverConfig.length; i++) {
        const configFile: Object = serverConfig[i];

        // If the file is available for the app version, send the file's most recent version
        if (appVersion in configFile.versions) {
          appConfig[configFile.name] = configFile.versions[appVersion];
        }
      }

      res.json(appConfig);
    };

    // Replies to client with error message
    const error = err => {
      console.error('Error occured while reading server_config.json.', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
    };

    fs.stat(path.join(__dirname, 'json', 'server_config.json'), (statErr, stats) => {
      if (statErr) {
        // Check for error
        error(statErr);
        return;
      }

      // Check if the file has been updated since it was last sent and if so, update it then send
      if (stats.mtime.getTime() === serverConfigLastModified) {
        sendConfigVersions();
      } else {
        fs.readFile(path.join(__dirname, 'json', 'server_config.json'), 'utf8', (readErr, data) => {
          if (readErr) {
            // Check for error
            error(readErr);
            return;
          }

          // Update config file and modified time
          serverConfig = env.replaceConfigUrls(JSON.parse(data), false);
          serverConfigLastModified = stats.mtime.getTime();
          sendConfigVersions();
        });
      }
    });
  });
};