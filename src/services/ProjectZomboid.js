const {v4: uuidv4} = require("uuid");
const fs = require("fs");

class ProjectZomboid {
    static sendCommand(command) {
        return new Promise((res, rej) => {
            let userFolderPath = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
            let commandFilePath = userFolderPath + "\\Zomboid\\Lua\\kappapps.lua";
            let responseFilePath = userFolderPath + "\\Zomboid\\Lua\\kappapps.txt";
            let uuid = uuidv4();

            fs.appendFileSync(commandFilePath, command, 'utf8');

            res('commande envoyée');

            /*setTimeout(() => {
                fs.readFile(responseFilePath, 'utf8', (err, data) => {
                    if (err) {
                        rej(err);
                        return;
                    }

                    let lines = data.split('\n');

                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];

                        if (line.startsWith('#eventId=' + uuid)) {
                            let response = line.replace('#eventId=' + uuid, '');

                            lines.splice(i, 1);
                            fs.writeFileSync(responseFilePath, lines.join('\n'), 'utf8');

                            res(response);
                            return;
                        }
                    }

                    fs.readFile(commandFilePath, 'utf8', (err, data) => {
                        if (err) {
                            return;
                        }

                        let lines = data.split('\n');
                        lines = lines.filter(line => line !== commandLine);
                        fs.writeFileSync(commandFilePath, lines.join('\n'), 'utf8');
                    });

                    rej("L'application n'a pas répondu");
                });
            }, 3000);*/
        });
    }
}

module.exports = ProjectZomboid;