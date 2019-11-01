# rc-puppet

Send skip-forward, skip-back, and pause to a browser window created by puppeteer

## Installation

```
git clone this repo
cd rc-puppet
npm install
```

IMPORTANT: Close all chrome.exe instances, then start chrome with remote debugging on:

```
c/'Program Files (x86)'/Google/Chrome/Application/chrome.exe --remote-debugging-port=9222
```

Navigate to your desired page in the chrome browser, start casting, set to full screen, etc.

Open a port on your firewall (private network only) (default: 8085)

Make a note of the server's ip:

```
ipconfig
```
Start the server:

```
node index.js --p 8085
```

On another device on your internal network navigate to http://<serverip>:<port>

