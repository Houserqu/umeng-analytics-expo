const { withAndroidManifest, withAppBuildGradle, withSettingsGradle, withInfoPlist, withAppDelegate, withProjectBuildGradle, withMainApplication } = require('@expo/config-plugins');

const withUmengAnalytics = (config, { androidAppKey, iosAppKey, channel }) => {
  config = withProjectBuildGradle(config, async (config) => {
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

  config = withMainApplication(config, config => {
    const lines = config.modResults.contents.split('\n')
    const newLines = []

    lines.forEach(line => {
      if (line.includes('class MainApplication')) {
        newLines.push("import com.github.reactnativehero.umenganalytics.RNTUmengAnalyticsModule")
        newLines.push("")
      }

      if (line.includes('onApplicationCreate')) {
        newLines.push(`    RNTUmengAnalyticsModule.init(this, "${androidAppKey}", "", "${channel}", false)`)
      }
      newLines.push(line)
    })

    config.modResults.contents = newLines.join('\n')
    return config;
  })

  config = withAppDelegate(config, config => {
    let contents = config.modResults.contents || '';

    // 添加推送初始化代码
    const lines = contents.split('\n')
    const newLines = []
    lines.forEach(line => {
      if (line.includes('#import <React/RCTLinkingManager.h>')) {
        newLines.push('#import "RNTUmengAnalytics.h"')
      }

      if (line.includes('return [super application:application didFinishLaunchingWithOptions:launchOptions]')) {
        newLines.push(`  [RNTUmengAnalytics init:@"${iosAppKey}" channel:@"${channel}" debug:false];`)
      }
      
      newLines.push(line)
    })

    config.modResults.contents = newLines.join('\n')
    return config
  })

  return config;
};

module.exports = withUmengAnalytics