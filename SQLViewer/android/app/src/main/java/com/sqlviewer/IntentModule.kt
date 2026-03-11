package com.sqlviewer

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import android.app.Activity

class IntentModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "IntentModule"
    }
    
    @ReactMethod
    fun getCallingPackage(promise: Promise) {
        try {
            val activity = getCurrentActivity()
            if (activity == null) {
                promise.resolve(null)
                return
            }
            
            val intent = activity.intent
            var callingPackage: String? = null
            
            if (intent != null) {
                val componentName = intent.component
                if (componentName != null) {
                    callingPackage = componentName.packageName
                }
            }
            
            promise.resolve(callingPackage)
        } catch (e: Exception) {
            val message = e.message ?: "Unknown error"
            promise.reject("INTENT_ERROR", message)
        }
    }
    
    @ReactMethod
    fun getPendingFileUri(promise: Promise) {
        try {
            val uri = UriHolder.uri
            val type = UriHolder.type
            val fileName = UriHolder.fileName
            
            if (uri != null) {
                val result: WritableMap = Arguments.createMap()
                result.putString("uri", uri)
                result.putString("type", type ?: "")
                result.putString("fileName", fileName ?: "unknown.sql")
                promise.resolve(result)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            val message = e.message ?: "Unknown error"
            promise.reject("INTENT_ERROR", message)
        }
    }
    
    @ReactMethod
    fun clearPendingFileUri(promise: Promise) {
        try {
            UriHolder.clear()
            promise.resolve(null)
        } catch (e: Exception) {
            val message = e.message ?: "Unknown error"
            promise.reject("INTENT_ERROR", message)
        }
    }
    
    @ReactMethod
    fun readContentUri(uriString: String, promise: Promise) {
        try {
            val uri = android.net.Uri.parse(uriString)
            val context = reactApplicationContext
            
            val inputStream = context.contentResolver.openInputStream(uri)
            if (inputStream == null) {
                promise.reject("OPEN_ERROR", "Cannot open input stream for URI")
                return
            }
            
            val text = inputStream.bufferedReader().use { it.readText() }
            inputStream.close()
            
            promise.resolve(text)
        } catch (e: Exception) {
            val message = e.message ?: "Unknown error"
            promise.reject("READ_ERROR", message)
        }
    }
}