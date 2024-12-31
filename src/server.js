const express = require('express');
const robot = require('robotjs');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
const cors = require('cors')
const { exec } = require('child_process');
const ProjectZomboid = require("./services/ProjectZomboid");

const configFolder = path.join(process.env.LOCALAPPDATA, 'Kappapps - Interaction CLI');
const configPath = path.join(configFolder, 'config.yaml');
const default_config = {
    port: 8888,
    api_key: uuidv4(),
    kappapps_api_key: '',
    keyboard: 'on',
    mouse: 'on',
    screen: 'on',
    zomboid: 'off'
};


async function getConfig() {
    if (!fs.existsSync(configFolder)) {
        fs.mkdirSync(configFolder, { recursive: true });
    }

    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, yaml.dump(default_config), 'utf8');
    }

    let fileContents = fs.readFileSync(configPath, 'utf8');
    return Object.assign({}, default_config, yaml.load(fileContents));
}

async function setConfig(config) {
    let currentConfig = await getConfig();
    let newConfig = Object.assign({}, currentConfig, config);
    fs.writeFileSync(configPath, yaml.dump(newConfig), 'utf8');
    return config;
}

async function printFeatures() {
    let config = await getConfig();

    console.log(`Keyboard: ${config.keyboard}`);
    console.log(`Mouse: ${config.mouse}`);
    console.log(`Screen: ${config.screen}`);
    console.log(`Zomboid: ${config.zomboid}`);
}

function listenForCommands() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', async (input) => {
        const commandAndArgs = input.trim().split(' ');
        const command = commandAndArgs.shift().trim();

        switch (command) {
            case 'resetkey': {
                let newApiKey = uuidv4();
                await setConfig({ api_key: newApiKey });
                console.log(`NEW API KEY: ${newApiKey}`);
                break;
            }
            case 'config': {
                let config = await getConfig();
                let keys = Object.keys(config);

                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    let value = config[key];

                    if (key === 'kappapps_api_key') {
                        value = '********';
                    }

                    console.log(`${key}: ${value}`);
                }

                break;
            }
            case 'help': {
                console.log(`Commands:`);
                console.log(`interactions [on|off] - Turn on/off all interactions`);
                console.log(`keyboard [on|off] - Turn on/off keyboard interaction`);
                console.log(`mouse [on|off] - Turn on/off mouse interaction`);
                console.log(`screen [on|off] - Turn on/off screen interaction`);
                console.log(`zomboid - Turn on/off zomboid interaction`);
                console.log(`off - Turn off all features`);
                console.log(`on - Turn on all features`);
                console.log(`resetkey - Reset the API key`);
                console.log(`config - Display the current configuration`);
                console.log(`openconfig - Open the configuration folder`);
                console.log(`exit - Exit the server`);
                console.log(`help - Display this help message`);
                break;
            }
            case 'openconfig': {
                try {
                    exec(`explorer "${configFolder}"`);
                } catch (e) {
                    console.log(e);
                }
                break;
            }
            case 'exit': {
                server.close(() => {
                    process.exit(0);
                });
                break;
            }
            case 'interactions': {
                if (!commandAndArgs[0]) {
                    console.log('Please specify on or off');
                    break;
                }

                await setConfig({
                    keyboard: commandAndArgs[0] === 'on' ? 'on' : 'off',
                    mouse: commandAndArgs[0] === 'on' ? 'on' : 'off',
                    screen: commandAndArgs[0] === 'on' ? 'on' : 'off',
                });

                await printFeatures();
                break;
            }
            case 'keyboard': {
                let value;

                if (commandAndArgs[0]) {
                    value = commandAndArgs[0] === 'on' ? 'on' : 'off';
                } else {
                    let currentConfig = await getConfig();
                    value = !currentConfig.keyboard;
                }

                await setConfig({ keyboard: value });
                await printFeatures();
                break;
            }
            case 'mouse': {
                let value;

                if (commandAndArgs[0]) {
                    value = commandAndArgs[0] === 'on' ? 'on' : 'off';
                } else {
                    let currentConfig = await getConfig();
                    value = !currentConfig.mouse;
                }

                await setConfig({ mouse: value });
                await printFeatures();
                break;
            }
            case 'screen': {
                let value;

                if (commandAndArgs[0]) {
                    value = commandAndArgs[0] === 'on' ? 'on' : 'off';
                } else {
                    let currentConfig = await getConfig();
                    value = !currentConfig.screen;
                }

                await setConfig({ screen: value });
                await printFeatures();
                break;
            }
            case 'zomboid': {
                let value;

                if (commandAndArgs[0]) {
                    value = commandAndArgs[0] === 'on' ? 'on' : 'off';
                } else {
                    let currentConfig = await getConfig();
                    value = !currentConfig.zomboid;
                }

                await setConfig({ zomboid: value });
                await printFeatures();
                break;
            }
            case 'off': {
                await setConfig({
                    keyboard: 'off',
                    mouse: 'off',
                    screen: 'off',
                    zomboid: 'off',
                });
                await printFeatures();
                break;
            }
            case 'on': {
                await setConfig({
                    keyboard: 'on',
                    mouse: 'on',
                    screen: 'on',
                    zomboid: 'on',
                });
                await printFeatures();
                break;
            }
            default: {
                console.log('Commande inconnue:', command);
            }
        }
    });
}

async function apiKeyMiddleware(req, res, next) {
    let config = await getConfig();
    const apiKey = req.headers['x-kappapps-api-key'];

    if (apiKey && apiKey === config.api_key) {
        next();
    } else {
        res.status(401).json({ reason: 'Unauthorized' });
    }
}

function randomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function startServer() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());

    app.get(['/', '/status'], async (req, res) => {
        let config = await getConfig();

        res.json({
            status: 'ok',
            keyboard: config.keyboard,
            mouse: config.mouse,
            screen: config.screen,
            zomboid: config.zomboid,
            version: '1.3.0'
        });
    });

    app.post('/keyboard/maintain', [apiKeyMiddleware], async (req, res) => {
        if (!(await getConfig()).keyboard) {
            res.status(403).json({ reason: `keyboard est off. La fonction peut être activée dans le fichier config ${configPath}` });
            return;
        }

        if (!req.body.key) {
            res.status(400).json({ reason: "L'argument 'key' est obligatoire" });
            return;
        }

        if (!req.body.duration) {
            res.status(400).json({ reason: "L'argument 'duration' est obligatoire" });
            return;
        }

        robot.keyToggle(req.body.key, 'down');

        setTimeout(_ => {
            robot.keyToggle(req.body.key, 'up');
        }, req.body.duration);

        res.json({ status: 'ok' });
    });

    app.post('/keyboard/press', [apiKeyMiddleware], async (req, res) => {
        if (!(await getConfig()).keyboard) {
            res.status(403).json({ reason: `keyboard est off. La fonction peut être activée dans le fichier config ${configPath}` });
            return;
        }

        if (!req.body.key) {
            res.status(400).json({ reason: "L'argument 'key' est obligatoire" });
            return;
        }

        if (req.body.maintain) {
            robot.keyToggle(req.body.maintain, 'down');
        }

        robot.keyTap(req.body.key);

        if (req.body.maintain) {
            robot.keyToggle(req.body.maintain, 'up');
        }

        res.json({ status: 'ok' });
    });

    app.post('/mouse/shake', [apiKeyMiddleware], async (req, res) => {
        if (!(await getConfig()).mouse) {
            res.status(403).json({ reason: `mouse est off. La fonction peut être activée dans le fichier config ${configPath}` });
            return;
        }

        if (!req.body.duration) {
            res.status(400).json({ reason: "L'argument 'duration' est obligatoire" });
            return;
        }

        let startTime = new Date().getTime();

        let shakeInterval = setInterval(() => {
            let currentTime = new Date().getTime();
            let pos = robot.getMousePos();

            if (currentTime - startTime >= req.body.duration) {
                clearInterval(shakeInterval);
                return;
            }

            let intensity = Number(req.body.intensity || 1);

            let newX = pos.x + randomNumberBetween(-(10 * intensity), (10 * intensity));
            let newY = pos.y + randomNumberBetween(-(10 * intensity), (10 * intensity));

            robot.moveMouse(newX, newY);
        }, 50);

        res.json({ status: 'ok' });
    });

    app.post('/mouse/click', [apiKeyMiddleware], async (req, res) => {
        if (!(await getConfig()).mouse) {
            res.status(403).json({ reason: `mouse est off. La fonction peut être activée dans le fichier config ${configPath}` });
            return;
        }

        if (req.body.duration) {
            robot.mouseToggle('down', 'left');

            setTimeout(() => {
                robot.mouseToggle('up', 'left');
            }, 5000);
        } else {
            robot.mouseClick();
        }

        res.json({ status: 'ok' });
    });

    app.post('/screen/capture', [apiKeyMiddleware], async (req, res) => {
        res.status(403).json({ reason: `Feature not yet implemented` });
        return;

        if (!(await getConfig()).screen) {
            res.status(403).json({ reason: `screen est off. La fonction peut être activée dans le fichier config ${configPath}` });
            return;
        }

        const screenSize = robot.getScreenSize();
        const width = screenSize.width;
        const height = screenSize.height;

        const image = robot.screen.capture(0, 0, width, height);
        const base64Image = Buffer.from(image.image, 'base64').toString('base64');
        res.json({ status: 'ok', data: base64Image });
    });

    app.post('/zomboid/command', [apiKeyMiddleware], async (req, res) => {
        if (!(await getConfig()).zomboid) {
            res.status(403).json({ reason: `zomboid est off. La fonction peut être activée dans le fichier config ${configPath}` });
            return;
        }

        if (!req.body.command) {
            res.status(400).json({ reason: "L'argument 'command' est obligatoire" });
            return;
        }

        ProjectZomboid.sendCommand(req.body.command)
            .then(result => {
                res.json({ status: 'ok', data: result });
            })
            .catch(error => {
                res.status(500).json({ reason: error });
            });
    });

    let config = await getConfig();

    if (
        config.mouse_inversion
        || config.keyboard_press
        || config.mouse_shake
        || config.mouse_click
        || config.screen_capture
        || config.project_zomboid
    ) {
        delete config.keyboard_press;
        delete config.mouse_shake;
        delete config.mouse_click;
        delete config.screen_capture;
        delete config.project_zomboid;
        delete config.mouse_inversion;
        fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
    }

    server = app.listen(config.port, 'localhost', () => {
        console.log(`Port: ${config.port}`);
        console.log(`Clé API: ${config.api_key}`);
        console.log(``);
        printFeatures();
    });

    listenForCommands();
}


let server;

startServer();