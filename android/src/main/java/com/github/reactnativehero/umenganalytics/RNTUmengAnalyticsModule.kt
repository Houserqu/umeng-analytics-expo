package com.github.reactnativehero.umenganalytics

import android.Manifest
import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings.Secure
import android.telephony.TelephonyManager
import android.webkit.WebSettings
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.umeng.analytics.MobclickAgent
import com.umeng.commonsdk.UMConfigure
import com.umeng.commonsdk.statistics.common.DeviceConfig
import java.util.*
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.collections.HashMap


class RNTUmengAnalyticsModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var appKey = ""
        private var pushSecret = ""
        private var channel = ""

        // 在 Application.onCreate 中调用：预初始化友盟基础库（不采集设备信息、不上报数据）
        // 真正的初始化在用户同意隐私政策后，由 JS 调用 init() 完成
        @JvmStatic
        fun preInit(app: Application, umengAppKey: String, umengPushSecret: String, umengChannel: String, debug: Boolean) {
            appKey = umengAppKey
            pushSecret = umengPushSecret
            channel = umengChannel

            // 标记当前为 react-native 封装，和官方 flutter 插件保持一致
            setWraperType()

            UMConfigure.setLogEnabled(debug)
            UMConfigure.preInit(app, appKey, channel)
        }

        // 通过反射设置 wraper 类型（官方各端封装库都会调用此私有接口）
        private fun setWraperType() {
            try {
                val config = Class.forName("com.umeng.commonsdk.UMConfigure")
                val method = config.getDeclaredMethod("setWraperType", String::class.java, String::class.java)
                method.isAccessible = true
                method.invoke(null, "react-native", "1.0")
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private var isReady = false

    override fun getName(): String {
        return "RNTUmengAnalytics"
    }

    override fun getConstants(): Map<String, Any>? {
        val constants: MutableMap<String, Any> = HashMap()
        constants["CHANNEL"] = channel
        return constants
    }

    @ReactMethod
    fun init(promise: Promise) {
        UMConfigure.submitPolicyGrantResult(reactContext, true)
        UMConfigure.init(reactContext, appKey, channel, UMConfigure.DEVICE_TYPE_PHONE, pushSecret)

        // 手动采集
        MobclickAgent.setPageCollectionMode(MobclickAgent.PageMode.MANUAL)

        isReady = true

        promise.resolve(Arguments.createMap())
    }

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        if (!checkReady(promise)) {
            return
        }

        fun tryDeviceInfo() {
            val map = this.getDeviceInfoMap()
            if (map.getString("deviceId").isNullOrEmpty()) {
                Executors.newSingleThreadScheduledExecutor().schedule({
                    tryDeviceInfo()
                }, 50, TimeUnit.MILLISECONDS)
            } else {
                promise.resolve(map)
            }
        }

        tryDeviceInfo()
    }

    @ReactMethod
    fun getUserAgent(promise: Promise) {
        if (!checkReady(promise)) {
            return
        }

        val map = Arguments.createMap()

        try {
            val userAgent = WebSettings.getDefaultUserAgent(reactContext)
            map.putString("userAgent", userAgent)
        } catch (e: RuntimeException) {
            val userAgent = System.getProperty("http.agent")
            if (userAgent != null && userAgent.isNotEmpty()) {
                map.putString("userAgent", userAgent)
            } else {
                map.putString("error", e.localizedMessage)
            }
        }

        promise.resolve(map)
    }

    @ReactMethod
    fun getPhoneNumber(promise: Promise) {
        if (!checkReady(promise)) {
            return
        }

        var hasPermission = true

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val readPhoneStatePermission: Int = ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE)
            if (readPhoneStatePermission != PackageManager.PERMISSION_GRANTED) {
                hasPermission = false
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val readPhoneNumbersPermission: Int = ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_NUMBERS)
            if (readPhoneNumbersPermission != PackageManager.PERMISSION_GRANTED) {
                hasPermission = false
            }
        }

        val map = Arguments.createMap()

        if (hasPermission) {
            try {
                val manager = reactContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                    map.putString("phoneNumber", manager.line1Number)
                } else {
                    map.putString("error", "Permission not granted")
                }
            } catch (e: Exception) {
                map.putString("error", e.localizedMessage)
            }
        } else {
            map.putString("error", "no permission")
        }

        promise.resolve(map)
    }

    @ReactMethod
    fun exitApp() {
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    @ReactMethod
    fun signIn(name: String, provider: String?) {
        if (!checkReady(null)) {
            return
        }

        val hasProvider = provider?.isNotEmpty() ?: false
        if (hasProvider) {
            MobclickAgent.onProfileSignIn(provider, name)
        } else {
            MobclickAgent.onProfileSignIn(name)
        }
    }

    @ReactMethod
    fun signOut() {
        if (!checkReady(null)) {
            return
        }
        MobclickAgent.onProfileSignOff()
    }

    @ReactMethod
    fun enterPage(pageName: String) {
        if (!checkReady(null)) {
            return
        }
        MobclickAgent.onPageStart(pageName)
    }

    @ReactMethod
    fun leavePage(pageName: String) {
        if (!checkReady(null)) {
            return
        }
        MobclickAgent.onPageEnd(pageName)
    }

    @ReactMethod
    fun sendEvent(eventId: String) {
        if (!checkReady(null)) {
            return
        }
        MobclickAgent.onEvent(reactContext, eventId)
    }

    @ReactMethod
    fun sendEventLabel(eventId: String, label: String) {
        if (!checkReady(null)) {
            return
        }
        MobclickAgent.onEvent(reactContext, eventId, label)
    }

    @ReactMethod
    fun sendEventData(eventId: String, data: ReadableMap) {
        if (!checkReady(null)) {
            return
        }
        val map = data.toHashMap()
        MobclickAgent.onEventObject(reactContext, eventId, map)
    }

    @ReactMethod
    fun sendEventCounter(eventId: String, data: ReadableMap, counter: Int) {
        if (!checkReady(null)) {
            return
        }
        val map = HashMap<String, String>()
        for ((key, value) in data.toHashMap()) {
            map[key] = value as String
        }
        MobclickAgent.onEventValue(reactContext, eventId, map, counter)
    }

    @ReactMethod
    fun sendError(error: String) {
        if (!checkReady(null)) {
            return
        }
        MobclickAgent.reportError(reactContext, error)
    }

    private fun checkReady(promise: Promise?): Boolean {
        if (!isReady) {
            promise?.reject("-1", "umeng sdk is not ready.")
            return false
        }
        return true
    }

    private fun getDeviceInfoMap(): WritableMap {
        // 获取 deviceId 改为三次尝试
        var deviceId = DeviceConfig.getDeviceIdForGeneral(reactContext)
        if (deviceId.isEmpty()) {
            deviceId = Secure.getString(reactContext.contentResolver, Secure.ANDROID_ID)
        }
        if (deviceId.isEmpty()) {
            deviceId = getUUID()
        }
        val deviceType = DeviceConfig.getDeviceType(reactContext)
        val brand = Build.BRAND
        val bundleId = DeviceConfig.getPackageName(reactContext)

        val map = Arguments.createMap()
        map.putString("deviceId", deviceId.lowercase(Locale.ROOT)) // 使用 lowercase()
        map.putString("deviceType", deviceType.lowercase(Locale.ROOT))
        map.putString("brand", brand.lowercase(Locale.ROOT))
        map.putString("bundleId", bundleId)

        return map
    }

    private fun getUUID(): String {
        val sharedPref = reactContext.currentActivity?.getPreferences(Context.MODE_PRIVATE)
                ?: return ""

        val key = "umeng_analytics_uuid"

        var uuid = sharedPref.getString(key, "")
        if (uuid.isNullOrEmpty()) {
            uuid = UUID.randomUUID().toString()
            with (sharedPref.edit()) {
                putString(key, uuid)
                apply()
            }
        }

        return uuid
    }

    // 说明：新版友盟 common SDK 会在初始化时自动注册 ActivityLifecycleCallbacks 来统计会话/时长，
    // 不再需要手动调用 MobclickAgent.onResume / onPause。
    // 旧实现里手动调用这一套会和「手动页面采集模式(MANUAL)」冲突，导致 enterPage/leavePage 的
    // 页面数据无法正确归集上报，因此这里予以移除，与官方 flutter 插件保持一致。
}

       