var fs = require('fs');
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const cmd = "c/'Program Files (x86)'/Google/Chrome/Application/chrome.exe --remote-debugging-port=9222"
const puppeteer = require('puppeteer')
const http = require('http')
let elHandle
const getElHandle = async function (page) {
  let els = await page.$$('video')
  if (els.length == 0) {
    const childFrames = page.mainFrame().childFrames()
    const videoFrames = []
    for (var i = 0; i < childFrames.length; i++) {
      const f = childFrames[i]
      const cEls = await f.$$('video')
      if (cEls.length > 0) {
        return cEls[0]
      }
    }
  } else {
    return els[0]
  }

};
//const getElHandle = async function (page) { };

(async () => {
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
    const pages = await browser.pages()
    const page = pages.find(p => { return p.url().substring(0, 3) != 'dev' })
    elHandle = await getElHandle(page)

  } catch (e) {
    console.log("Could not connect to chrome remote debugger. Make sure to shut down all instances then run the following command: ")
    console.log(cmd)
    console.log(e)
  }
})()

const actions = {
  back5: {
    key: 'ArrowLeft',
    count: 1
  },
  skip5: {
    key: 'ArrowRight',
    count: 1
  },
  back15: {
    key: 'ArrowLeft',
    count: 1,
    wrapperHoldKey: 'Control',
    holdKey: 'Shift'
  },
  skip15: {
    key: 'ArrowRight',
    count: 1,
    wrapperHoldKey: 'Control',
    holdKey: 'Shift'
  },
  back30: {
    key: 'ArrowLeft',
    count: 2,
    wrapperHoldKey: 'Control',
    holdKey: 'Shift'
  },
  skip30: {
    key: 'ArrowRight',
    count: 2,
    wrapperHoldKey: 'Control',
    holdKey: 'Shift'
  },
  back15m: {
    key: 'ArrowLeft',
    count: 60,
    holdKey: 'Shift',
    wrapperHoldKey: 'Control',
  },
  skip15m: {
    key: 'ArrowRight',
    count: 60,
    wrapperHoldKey: 'Control',
    holdKey: 'Shift'
  },
  playpause: {
    key: 'Space',
    count: 1,
  }

}
const delay = function (time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  });
}
let locked = false
let cancelPending = false
const handle = async function ({ wrapperHoldKey, holdKey, key, count }, elHandle) {
  if (wrapperHoldKey) await elHandle._page.keyboard.down(wrapperHoldKey)
  await delay(20)
  if (holdKey) await elHandle._page.keyboard.down(holdKey)
  await delay(20)
  for (let i = 0; i < count; i++) {
    if (cancelPending) {
      console.log('cancelling')
      count = i
      break
    }
    await elHandle.press(key)
    await delay(200)
  }
  if (holdKey) await elHandle._page.keyboard.up(holdKey)
  await delay(20)
  if (wrapperHoldKey) await elHandle._page.keyboard.up(wrapperHoldKey)
  console.log("Pressed: " + (wrapperHoldKey ? wrapperHoldKey + '+' : '') + (holdKey ? holdKey + '+' : '') + key + ' ' + count + ' time(s)')
}
var myArgs = process.argv.slice(2);
const port = (myArgs.length == 1) ? myArgs[0] : 8085

http.createServer(async function (req, res) {
  if (!elHandle) {
    res.writeHead(500)
    res.end()
    return
  }
  if (req.url == '/') {
    const contents = await readFileAsync("index.html")
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(contents);
    res.end();
    return
  }

  const action = actions[req.url.substring(1)]
  if (!action) {
    res.writeHead(500)
    res.end()
    return
  }
  if (locked) {
    cancelPending = true
    res.writeHead(200)
    res.end()
    return
  }
  locked = true
  await handle(action, await elHandle)
  locked = false
  cancelPending = false
  res.writeHead(200)
  res.end()
  return
}).listen(port)
console.log('Listening on port: ' + port)



