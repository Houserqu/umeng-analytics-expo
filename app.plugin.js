const { withInfoPlist, withProjectBuildGradle, withMainApplication } = require('@expo/config-plugins');

const withUmengAnalytics = (config, { androidAppKey, iosAppKey, channel, debug = false }) => {
  config = withProjectBuildGradle(config, async (config) => {
    // 幂等：已注入过友盟仓库则跳过
    if (config.modResults.contents.includes('repo1.maven.org/maven2')) {
      return config
    }
    const lines = config.modResults.contents.split('\n')
    const newLines = []
    let isAllprojects = false
    lines.forEach(line => {
      if (line.includes('allprojects')) {
        isAllprojects = true
      }

      if (isAllprojects && line.includes('repositories')) {
        newLines.push(line)
        newLines.push(`        maven { url 'https://repo1.maven.org/maven2/' }`)
        isAllprojects = false
      } else {
        newLines.push(line)
      }
    })

    config.modResults.contents = newLines.join('\n')

    return config;
  })

  // Android：在 MainApplication.onCreate 中注入友盟 preInit。
  // 锚点用必然存在的 super.onCreate()，并做幂等判断，避免重复 prebuild 重复注入，
  // 也不再依赖 Expo 内部的 onApplicationCreate 行。
  config = withMainApplication(config, config => {
    let contents = config.modResults.contents

    const importLine = 'import com.github.reactnativehero.umenganalytics.RNTUmengAnalyticsModule'
    const preInitLine = `    RNTUmengAnalyticsModule.preInit(this, "${androidAppKey}", "", "${channel}", ${debug})`

    // 1) 注入 import（紧跟 package 声明，幂等）
    if (!contents.includes(importLine)) {
      contents = contents.replace(/(^package .*$)/m, `$1\n\n${importLine}`)
    }

    // 2) 在 super.onCreate() 之后注入 preInit（幂等）
    if (!contents.includes('RNTUmengAnalyticsModule.preInit(')) {
      contents = contents.replace(/(super\.onCreate\(\);?\s*\n)/, `$1${preInitLine}\n`)
    }

    config.modResults.contents = contents
    return config;
  })

  // iOS 通过 Info.plist 传递配置，原生模块在 init() 时读取并初始化。
  // 不再向 AppDelegate 注入代码，兼容 Swift / ObjC 各版本 Expo AppDelegate。
  config = withInfoPlist(config, config => {
    config.modResults.UmengAppKey = iosAppKey
    config.modResults.UmengChannel = channel
    config.modResults.UmengDebug = debug
    return config
  })

  return config;
};

module.exports = withUmengAnalytics