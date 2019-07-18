/**
   easylog
*/
let ENUM_LOG_LEVEL = { debug: 0, info: 1, warn: 2, error: 3, report: 99, disable: 100 }
export default class EasyLogger {
  constructor() {
    // this.logSeq =  // 每条日志序列号
    this.logLevel = ENUM_LOG_LEVEL.disable // 本地日志输出级别
    this.logRemoteLevel = ENUM_LOG_LEVEL.disable // 远程日志上报级别
    //this.logServer = 0;
    this.websocket = null // websocket对象
    this.url = '' // 上报地址
    this.info = null // 上报的信息对象
    this.logCache = [] // 日志本地缓存
    this.logCacheSend = [] // 将要发送的日志缓存
    this.logCacheMax = 100 // 当次可发送的最大日志数
  }
  // 设置本地日志输出级别
  setLogLevel(logLevel) {
    this.logLevel = logLevel
    if (this.logLevel < ENUM_LOG_LEVEL.debug || this.logLevel > ENUM_LOG_LEVEL.report) {
      this.logLevel = ENUM_LOG_LEVEL.disable
    }
  }

  // 设置远程日志输出级别
  setRemoteLogLevel(logLevel) {
    this.logRemoteLevel = logLevel
    if (this.logRemoteLevel < ENUM_LOG_LEVEL.debug || this.logRemoteLevel > ENUM_LOG_LEVEL.report) {
      this.logRemoteLevel = ENUM_LOG_LEVEL.disable
    }
  }
  // 设置要上报的信息
  setSessionInfo(info) {
    this.info = JSON.stringify(info)
  }

  // websocket模式
  openLogServer(url) {
    if (this.url != url) {
      this.url = url
      this.stopLogServer()
      if (!url) return
      this.websocket = new WebSocket(url)
      this.websocket.onopen = function(evt) {}
      this.websocket.onclose = function(evt) {}
      this.websocket.onmessage = function(evt) {}
      this.websocket.onerror = function(evt) {
        console.log('ws发生错误！')
      }
    }
  }

  // websocket模式
  stopLogServer() {
    if (this.websocket) {
      this.websocket.onclose = null
      this.websocket.onerror = null
      this.websocket.close()
      this.websocket = null
    }
  }


  remoteLog(level, log) {
    if (this.url == '') {
      return
    }

    if (this.websocket == null || this.websocket.readyState == 2 || this.websocket.readyState == 3) { // 2正在关闭，3:已关闭或者没有建立失败
      let url = this.url
      this.url = ''
      this.openLogServer(url)
      this.pushLog(log)
    } else if (this.websocket.readyState == 0) { // 正在连接，还未连接
      this.pushLog(log)
    } else if (this.websocket.readyState == 1) { // 连接成功状态
      if (this.logCacheSend > 0) {
        let logBefore = ''
        this.logCacheSend.forEach(logCacheItem => {
          logBefore += logCacheItem + '\n'          
        })
        log += logBefore
        this.logCacheSend = []
      }
      this.websocket.send(log)
    } else {
      //console.log('wrong socket state:'+this.websocket.ready_state)
      this.pushLog(log)
    }
  }

  // 添加log
  pushLog(log) {
    if (this.logCacheSend.length < this.logCacheMax) {
      this.logCacheSend.push(log)
    }
  }

  log(level, log) {
    if (this.logLevel !== ENUM_LOG_LEVEL.disable && this.logLevel <= level) {
      this.logCache.push(log)
      while (this.logCache.length > this.logCacheMax) {
        this.logCache.shift()
      }
    }

    if (this.logRemoteLevel !== ENUM_LOG_LEVEL.disable && this.logRemoteLevel <= level) {
      this.remoteLog(level, log)
    }
  }

  debug() {
    // let log = logParamList(this, 'debug').concat([].slice.call(arguments)).concat(logParamListEnd(this));
    let log = logParamList(this, 'debug', ''.concat([].slice.call(arguments)))
    if (this.logLevel !== ENUM_LOG_LEVEL.disable && this.logLevel <= ENUM_LOG_LEVEL.debug) {
      console.debug.apply(console, log)
    }

    this.log(ENUM_LOG_LEVEL.debug, log)
  }

  info() {
    // let log = logParamList(this, 'info').concat([].slice.call(arguments)).concat(logParamListEnd(this));
    let log = logParamList(this, 'info', ''.concat([].slice.call(arguments)))
    if (this.logLevel !== ENUM_LOG_LEVEL.disable && this.logLevel <= ENUM_LOG_LEVEL.info) {
      console.info.apply(console, log)
    }

    this.log(ENUM_LOG_LEVEL.info, log)
  }

  warn() {
    // let log = logParamList(this, 'warn').concat([].slice.call(arguments)).concat(logParamListEnd(this));
    let log = logParamList(this, 'warn', ''.concat([].slice.call(arguments)))
    if (this.logLevel !== ENUM_LOG_LEVEL.disable && this.logLevel <= ENUM_LOG_LEVEL.warn) {
      console.warn.apply(console, log)
    }

    this.log(ENUM_LOG_LEVEL.warn, log)
  }

  error() {
    // let log = logParamList(this, 'error').concat([].slice.call(arguments)).concat(logParamListEnd(this));
    let log = logParamList(this, 'error', ''.concat([].slice.call(arguments)))
    if (this.logLevel !== ENUM_LOG_LEVEL.disable && this.logLevel <= ENUM_LOG_LEVEL.error) {
      console.error.apply(console, log)
    }

    this.log(ENUM_LOG_LEVEL.error, log)
  }

  report() {
    // let log = logParamList(this, 'report').concat([].slice.call(arguments)).concat(logParamListEnd(this));
    let log = logParamList(this, 'report', ''.concat([].slice.call(arguments)))
    if (this.logLevel !== ENUM_LOG_LEVEL.disable && this.logLevel <= ENUM_LOG_LEVEL.report) {
      console.info.apply(console, log)
    }

    this.log(ENUM_LOG_LEVEL.report, log)
  }
}

let D = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09']
function zero(num) {
  return num > 9 ? num : '0' + num
}
function logParamList(_this, level, logInfo) {
  let t = new Date()
  let stringTime = t.getFullYear() + '/'
  stringTime += zero(t.getMonth() + 1) + '/'
  stringTime += zero(t.getDate()) + ' '
  stringTime += zero(t.getHours()) + ':'
  stringTime += zero(t.getMinutes()) + ':'
  stringTime += zero(t.getSeconds())
  stringTime += '-' + t.getTime()

  //get first space from logInfo
  let action = logInfo.substr(0, logInfo.indexOf(' '))
  if (action.length == 0) {
    action = logInfo
  }

  let content = logInfo.substr(logInfo.indexOf(' ') + 1)
  if (content.length == 0) {
    content = ''
  }

  let s = {
    time: stringTime,
    level: level,
    action: action,
    content: content,
    appid: _this.appid,
    roomid: _this.roomid,
    userid: _this.userid,
    userName: _this.userName,
    sessionid: _this.sessionid
  }

  return [JSON.stringify(s)]
}
