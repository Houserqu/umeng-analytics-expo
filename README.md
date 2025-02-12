本库是基于 [@react-native-hero/umeng-analytics](https://github.com/react-native-hero/umeng-analytics) fork 而来，主要针对 expo 框架进行了适配，提供了 expo 插件配置原生代码，并添加了 typescript 声明文件。非 expo 开发模式请使用原库。

## Getting started

Install the library using either Yarn:

```
yarn add expo-umeng-analytics
```

or npm:

```
npm install --save expo-umeng-analytics
```

## Setup

1. 先获取友盟平台的 appKey
2. 在 app.json 中配置插件和 appKey
   ```
   "plugins": [
      [
        "expo-umeng-analytics",
        {
          "androidAppKey": "你的 android appkey",
          "iosAppKey": "你的 ios appkey",
          "channel": "你的 channel"
        }
      ]
   ]
   ```

## Usage

```js
import {
  // 初始化友盟时传入的 channel 参数
  CHANNEL,

  init,
  getDeviceInfo,
  getPhoneNumber,
  signIn,
  signOut,
  exitApp,
  enterPage,
  leavePage,
  sendEvent,
  sendEventLabel,
  sendEventData,
  sendEventCounter,
} from '@react-native-hero/umeng-analytics'

// 对于安卓来说，需要等用户同意隐私政策后，再调用 init，js 的 init 才是真正的初始化
// https://developer.umeng.com/docs/119267/detail/182050
init().then(() => {
  // 初始化完成
})

// 提供一个退出 app 的方法
// 好像 RN 官方也没提供此方法，单个方法不好写一个库，就放在这个库了
exitApp()

// 以下方法必须等 init() 调用结束后才能调用，否则会抛出错误

getDeviceInfo().then(data => {
  data.deviceId
  data.deviceType
  data.brand
  data.bundleId
})

getUserAgent().then(data => {
  data.userAgent
})

getPhoneNumber().then(data => {
  // 只有安卓有希望读取出本机的手机号码，前提是已获得 READ_PHONE_STATE 权限
  data.phoneNumber
})

// 帐号统计
signIn('userId')
// provider 不能以下划线开头，使用大写字母和数字标识
// 如果是上市公司，建议使用股票代码，比如 WB
signIn('userId', 'provider')
signOut()

// 页面统计，注意要配对调用
// 不能连续调用 enterPage，也不能连续调用 leavePage
enterPage('pageName')
leavePage('pageName')

// 自定义事件，eventId 需先在友盟后台注册之后才可以统计
sendEvent('eventId')
sendEventLabel('eventId', 'label')
sendEventData('eventId', { key1: 'value1', key2: 'value2' })
sendEventCounter('eventId', { key1: 'value1', key2: 'value2' }, 1)
```
