const express = require('express');
const robot = require('robotjs');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
const cors = require('cors')
const { exec } = require('child_process');

const configFolder = path.join(process.env.LOCALAPPDATA, 'Kappapps - Interaction CLI');
const configPath = path.join(configFolder, 'config.yaml');

const default_config = {
    port: 8888,
    keyboard_press: 'on',
    mouse_shake: 'on',
    mouse_click: 'on',
    api_key: uuidv4(),
    kappapps_api_key: '',
};

async function getConfig() {
    if (!fs.existsSync(configFolder)) {
        fs.mkdirSync(configFolder, { recursive: true });
    }

    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, yaml.dump(default_config), 'utf8');
    }

    let fileContents = fs.readFileSync(configPath, 'utf8');
    let config = Object.assign({}, default_config, yaml.load(fileContents));
    fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
    return config;
}

function listenForCommands() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', async (input) => {
        const command = input.trim();

        switch (command) {
            case 'resetkey': {
                config.api_key = uuidv4();
                const yamlStr = yaml.dump(config);
                fs.writeFileSync(configPath, yamlStr, 'utf8');
                console.log(`API KEY: ${config.api_key}`);
                break;
            }
            case 'restart': {
                server.close(async () => {
                    await startServer();
                });
                break;
            }
            case 'config': {
                console.log(Object.assign({}, config, { kappapps_api_key: '********' }));
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
            default: {
                console.log('Commande inconnue:', command);
            }
        }
    });
}

function apiKeyMiddleware(req, res, next) {
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
    config = await getConfig();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());

    app.get(['/', '/status'], (req, res) => {
        res.json({
            status: 'ok'
        });
    });

    app.post('/keyboard/press', apiKeyMiddleware, (req, res) => {
        if (!req.body.key) {
            res.status(400).json({ reason: "L'argument 'key' est obligatoire" });
            return;
        }

        if (config.keyboard_press === 'on') {
            robot.keyTap(req.body.key);
            res.json();
        }
        else {
            res.status(403).json({ reason: `keyboard_press est off. La fonction peut être activée dans le fichier config ${configPath}` });
        }
    });

    app.post('/mouse/shake', apiKeyMiddleware, (req, res) => {
        if (!req.body.duration) {
            res.status(400).json({ reason: "L'argument 'duration' est obligatoire" });
            return;
        }

        if (config.mouse_shake === 'on') {
            let startTime = new Date().getTime();

            let shakeInterval = setInterval(() => {
                let currentTime = new Date().getTime();
                let pos = robot.getMousePos();

                if (currentTime - startTime >= req.body.duration) {
                    clearInterval(shakeInterval);
                    return;
                }

                let newX = pos.x + randomNumberBetween(-10, 10);
                let newY = pos.y + randomNumberBetween(-10, 10);

                robot.moveMouse(newX, newY);
            }, 50);

            res.json();
        }
        else {
            res.status(403).json({ reason: `mouse_shake est off. La fonction peut être activée dans le fichier config ${configPath}` });
        }
    });

    app.post('/mouse/click', apiKeyMiddleware, (req, res) => {
        if (config.mouse_click === 'on') {
            if (req.body.duration) {
                robot.mouseToggle('down', 'left');

                setTimeout(() => {
                    robot.mouseToggle('up', 'left');
                }, 5000);
            } else {
                robot.mouseClick();
            }
            res.json();
        }
        else {
            res.status(403).json({ reason: `mouse_click est off. La fonction peut être activée dans le fichier config ${configPath}` });
        }
    });

    server = app.listen(config.port, 'localhost', () => {
        console.log(`Port: ${config.port}`);
        console.log(`Clé API: ${config.api_key}`);
    });

    listenForCommands();
}


let server;
let config;
startServer();