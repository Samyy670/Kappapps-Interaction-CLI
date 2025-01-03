const fs = require("fs");

class ProjectZomboid {
    static COMMAND_FILE = "kappapps.lua";
    static RESPONSE_FILE = "kappapps_responses.txt";
    static DATA_FILE = "kappapps.txt";

    static getUserZomboidFolderPath() {
        return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] + "\\Zomboid\\Lua\\";
    }

    static sendCommand(command) {
        return new Promise((res, rej) => {
            let commandFilePath = ProjectZomboid.getUserZomboidFolderPath() + ProjectZomboid.COMMAND_FILE;
            let responseFilePath = ProjectZomboid.getUserZomboidFolderPath() + ProjectZomboid.RESPONSE_FILE;

            fs.appendFileSync(commandFilePath, command, 'utf8');

            setTimeout(() => {
                fs.readFile(responseFilePath, 'utf8', (err, data) => {
                    if (err) {
                        rej(err);
                        return;
                    }

                    fs.writeFileSync(responseFilePath, '', 'utf8');
                    fs.writeFileSync(commandFilePath, '', 'utf8');

                    if (!data) {
                        rej("L'application n'a pas répondu");
                        return;
                    }

                    let response = {};
                    let lines = data.split('\n');

                    if (lines.length === 0) {
                        rej("L'application n'a pas répondu");
                        return;
                    }

                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i].split('=');
                        response[line[0]] = line[1];
                    }

                    response.success = response.success === 'true';

                    if (response.success) {
                        res('ok');
                    } else if (response.response) {
                        rej(response.response);
                    }
                });
            }, 2000);
        });
    }

    static getData() {
        return new Promise((res, rej) => {
            let dataFilePath = ProjectZomboid.getUserZomboidFolderPath() + ProjectZomboid.DATA_FILE;

            fs.readFile(dataFilePath, 'utf8', (err, data) => {
                if (err) {
                    rej(err);
                    return;
                }

                let response = {};
                let lines = data.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    let lineSplitted = line.split('=');

                    if (lineSplitted.length < 2) {
                        continue;
                    }

                    response[lineSplitted[0]] = lineSplitted[1];
                }

                res(response);
            });
        });
    }
}

module.exports = ProjectZomboid;