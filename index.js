
import { NativeModules } from 'react-native'

const RNTUmengAnalytics = NativeModules.RNTUmengAnalytics

// 原生模块是否已集成到当前二进制。
// 典型场景：通过 OTA 热更新（EAS Update / CodePush）下发了引用本包的 JS，
// 但用户手上的二进制并未编译进原生模块，此时 RNTUmengAnalytics 为 null。
// 下面所有接口都会先判断 isAvailable，缺少原生模块时安全降级为无操作，绝不抛错导致 App 崩溃。
export const isAvailable = !!RNTUmengAnalytics

if (!isAvailable && typeof __DEV__ !== 'undefined' && __DEV__) {
  console.warn(
    '[expo-umeng-analytics] 原生模块未集成（可能是 JS 已热更新但原生未重新构建）。' +
    '所有统计接口将降级为无操作，请重新构建并安装包含原生模块的版本。'
  )
}

// 初始化时配置的渠道
export const CHANNEL = isAvailable ? RNTUmengAnalytics.CHANNEL : ''

export function init() {
  if (!isAvailable) {
    return Promise.resolve()
  }
  return RNTUmengAnalytics.init()
}

export function getDeviceInfo() {
  if (!isAvailable) {
    return Promise.resolve({})
  }
  return RNTUmengAnalytics.getDeviceInfo()
}

export function getUserAgent() {
  if (!isAvailable) {
    return Promise.resolve({})
  }
  return RNTUmengAnalytics.getUserAgent()
}

export function getPhoneNumber() {
  if (!isAvailable) {
    return Promise.resolve({})
  }
  return RNTUmengAnalytics.getPhoneNumber()
}

export function signIn(userId, provider) {
  if (!isAvailable) return
  RNTUmengAnalytics.signIn(userId, provider)
}

export function signOut() {
  if (!isAvailable) return
  RNTUmengAnalytics.signOut()
}

export function exitApp() {
  if (!isAvailable) return
  RNTUmengAnalytics.exitApp()
}

// enterPage / leavePage 底层对应友盟的 onPageStart / onPageEnd，必须成对调用。
// 这里做一层防护：进入新页面前，自动结束上一个还没 leave 的页面，
// 避免 RN 导航切换时（新页 enter 早于旧页 leave）出现漏报或重复统计。
let currentPage

export function enterPage(pageName) {
  if (!isAvailable) return
  if (currentPage === pageName) {
    return
  }
  // 上一个页面还没 leave，先补一次 leave，保证 onPageStart/onPageEnd 成对
  if (currentPage) {
    RNTUmengAnalytics.leavePage(currentPage)
  }
  RNTUmengAnalytics.enterPage(pageName)
  currentPage = pageName
}

export function leavePage(pageName) {
  if (!isAvailable) return
  if (currentPage === pageName) {
    RNTUmengAnalytics.leavePage(pageName)
    currentPage = undefined
  }
}

// 友盟文档规定：id，ts，du 是保留字段，不能作为 event id 及 key 的名称。
const bannedKeys = {
  id: true,
  ts: true,
  du: true,
}

function checkEventId(eventId) {
  if (bannedKeys[eventId]) {
    throw new Error(`[${eventId}] 是保留字段，不能作为 event id.`)
  }
}
function checkEventDataKey(data) {
  for (let key in data) {
    if (bannedKeys[key]) {
      throw new Error(`${key} 是保留字段，不能作为 event data 的 key.`)
    }
  }
}

export function sendEvent(eventId) {
  if (!isAvailable) return
  checkEventId(eventId)
  RNTUmengAnalytics.sendEvent(eventId)
}

export function sendEventLabel(eventId, label) {
  if (!isAvailable) return
  checkEventId(eventId)
  RNTUmengAnalytics.sendEventLabel(eventId, label)
}

export function sendEventData(eventId, data) {
  if (!isAvailable) return
  checkEventId(eventId)
  checkEventDataKey(data)
  RNTUmengAnalytics.sendEventData(eventId, data)
}

export function sendEventCounter(eventId, data, counter) {
  if (!isAvailable) return
  checkEventId(eventId)
  checkEventDataKey(data)
  RNTUmengAnalytics.sendEventCounter(eventId, data, counter)
}

export function sendError(error) {
  // 安卓才有这个接口
  if (isAvailable && RNTUmengAnalytics.sendError) {
    RNTUmengAnalytics.sendError(error)
  }
}
