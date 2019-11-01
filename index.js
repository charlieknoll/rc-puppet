var fs = require('fs');
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const cmd = "c/'Program Files (x86)'/Google/Chrome/Application/chrome.exe --remote-debugging-port=9222"
const puppeteer = require('puppeteer-core')
const http = require('http')
let elHandle
const getElHandle = async function () {
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
    const pages = await browser.pages()
    const page = pages.find(p => { return p.url().substring(0, 3) != 'dev' })
    if (!page) throw new Error("Cannot find a page with a video element, have you started a video?")
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
  } catch (e) {
    console.log("Could not connect to chrome remote debugger. Make sure to shut down all instances then run the following command: ")
    console.log(cmd)
    throw e
  }


};
//const getElHandle = async function (page) { };



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
    count: 3,
    // wrapperHoldKey: 'Control',
    // holdKey: 'Shift'
  },
  skip15: {
    key: 'ArrowRight',
    count: 3,
    // wrapperHoldKey: 'Control',
    // holdKey: 'Shift'
  },
  back30: {
    key: 'ArrowLeft',
    count: 6,
    // wrapperHoldKey: 'Control',
    // holdKey: 'Shift'
  },
  skip30: {
    key: 'ArrowRight',
    count: 6,
    // wrapperHoldKey: 'Control',
    // holdKey: 'Shift'
  },
  back15m: {
    key: 'ArrowLeft',
    count: 180,
    // holdKey: 'Shift',
    // wrapperHoldKey: 'Control',
  },
  skip15m: {
    key: 'ArrowRight',
    count: 180,
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
    (key == 'Space') ? await elHandle.click() : await elHandle.press(key)
    await delay(70)
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
    try {
      elHandle = await getElHandle()
      if (!elHandle) throw new Error('Could not find video element on the opened page.')
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(`<div style="font-size: 2em;"><h1 style="color: red; margin-top: 40px; text-align: center;">` + e.message + `</h1>
        <h3 style="text-align: center;">Check the chrome tab and make sure a video is playing then click refresh.</h3>
        <div style="text-align: center; font-size: 1em;" ><button  style="text-align: center; font-size: 4em;" onclick="window.location.reload()">Refresh</button></div></div>`)
      res.end()
      return
    }
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
    res.writeHead(404)
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
  try {
    await handle(action, await elHandle)
  } catch (e) {
    elHandle = null
    res.writeHead(500)
    res.end()
    locked = false
    cancelPending = false
    return
  }
  locked = false
  cancelPending = false
  res.writeHead(200)
  res.end()
  return
}).listen(port)
console.log('Listening on port: ' + port)



