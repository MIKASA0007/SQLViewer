package com.sqlviewer

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.net.Uri
import android.content.Context
import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader

class FileModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val context: Context = reactContext.applicationContext
    
    override fun getName(): String {
        return "FileModule"
    }
    
    /**
     * 读取 content:// URI 文件内容
     */
    @ReactMethod
    fun readContentUri(uriString: String, promise: Promise) {
        try {
            Log.d("FileModule", "Reading content URI: $uriString")
            val uri = Uri.parse(uriString)
            
            // 检查是否是 content:// URI
            if (uri.scheme != "content") {
                Log.e("FileModule", "Invalid URI scheme: ${uri.scheme}")
                promise.reject("INVALID_URI", "URI scheme must be content://")
                return
            }
            
            val contentResolver = context.contentResolver
            
            // 尝试打开输入流并读取内容
            contentResolver.openInputStream(uri)?.use { inputStream ->
                Log.d("FileModule", "Input stream opened successfully")
                val content = inputStream.bufferedReader().use { it.readText() }
                Log.d("FileModule", "Content read successfully, length: ${content.length}")
                Log.d("FileModule", "Content preview: ${content.take(100)}")
                promise.resolve(content)
            } ?: run {
                Log.e("FileModule", "Failed to open input stream for URI: $uriString")
                promise.reject("READ_ERROR", "Cannot open input stream for URI: $uriString")
            }
            
        } catch (e: SecurityException) {
            Log.e("FileModule", "Security exception: ${e.message}")
            promise.reject("PERMISSION_ERROR", "Permission denied: ${e.message}")
        } catch (e: Exception) {
            Log.e("FileModule", "Exception reading file: ${e.message}")
            e.printStackTrace()
            promise.reject("READ_ERROR", "Failed to read file: ${e.message}")
        }
    }
    
    /**
     * 获取 content:// URI 文件信息
     */
    @ReactMethod
    fun getContentUriInfo(uriString: String, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            
            if (uri.scheme != "content") {
                promise.reject("INVALID_URI", "URI scheme must be content://")
                return
            }
            
            val contentResolver = context.contentResolver
            
            // 查询文件信息
            val cursor = contentResolver.query(uri, null, null, null, null)
            var fileName = "unknown"
            var fileSize = 0L
            
            cursor?.use {
                if (it.moveToFirst()) {
                    // 获取文件名
                    val nameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                    if (nameIndex >= 0) {
                        fileName = it.getString(nameIndex) ?: "unknown"
                    }
                    
                    // 获取文件大小
                    val sizeIndex = it.getColumnIndex(android.provider.OpenableColumns.SIZE)
                    if (sizeIndex >= 0) {
                        fileSize = it.getLong(sizeIndex)
                    }
                }
            }
            
            // 如果 cursor 没有返回大小，尝试通过输入流获取
            if (fileSize == 0L) {
                try {
                    contentResolver.openFileDescriptor(uri, "r")?.use { pfd ->
                        fileSize = pfd.statSize
                    }
                } catch (e: Exception) {
                    // 忽略错误，保持 fileSize = 0
                }
            }
            
            val result = java.util.HashMap<String, Any>()
            result["name"] = fileName
            result["size"] = fileSize
            
            promise.resolve(result)
            
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_ERROR", "Permission denied: ${e.message}")
        } catch (e: Exception) {
            promise.reject("INFO_ERROR", "Failed to get file info: ${e.message}")
        }
    }
    
    /**
     * 检查 URI 是否可读
     */
    @ReactMethod
    fun canReadUri(uriString: String, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            
            if (uri.scheme == "content") {
                val contentResolver = context.contentResolver
                contentResolver.openInputStream(uri)?.close()
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}