package com.sqlviewer

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.os.Bundle
import java.io.File
import java.io.FileOutputStream

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "SQLViewer"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
  
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    Log.d("MainActivity", "onCreate called")
    val intent = getIntent()
    if (intent != null) {
      handleIntent(intent)
    }
  }
  
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    super.setIntent(intent)
    Log.d("MainActivity", "===== onNewIntent called =====")
    handleIntent(intent)
  }
  
  override fun onResume() {
    super.onResume()
    val currentIntent = intent
    if (currentIntent != null) {
      handleIntent(currentIntent)
    }
  }
  
  private fun handleIntent(intent: Intent) {
    Log.d("MainActivity", "===== handleIntent =====")
    Log.d("MainActivity", "Action: ${intent.action}")
    Log.d("MainActivity", "Data: ${intent.data}")
    Log.d("MainActivity", "Type: ${intent.type}")
    
    var fileUri: Uri? = null
    var mimeType: String? = intent.type
    
    // 处理 ACTION_SEND (分享单个文件)
    if (intent.action == Intent.ACTION_SEND) {
      Log.d("MainActivity", "Processing ACTION_SEND")
      fileUri = if (intent.data != null) {
        intent.data
      } else {
        intent.clipData?.getItemAt(0)?.uri
      }
    }
    // 处理 ACTION_SEND_MULTIPLE (分享多个文件)
    else if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
      Log.d("MainActivity", "Processing ACTION_SEND_MULTIPLE")
      intent.clipData?.let { clipData ->
        if (clipData.itemCount > 0) {
          fileUri = clipData.getItemAt(0)?.uri
        }
      }
    }
    // 处理 ACTION_VIEW 和其他
    else {
      fileUri = intent.data
    }
    
    if (fileUri != null) {
      Log.d("MainActivity", "File URI: $fileUri")
      processFileUri(fileUri!!, mimeType)
    } else {
      Log.d("MainActivity", "No file URI in intent")
    }
  }
  
  private fun processFileUri(uri: Uri, mimeType: String?) {
    Log.d("MainActivity", "Processing URI: $uri")
    Log.d("MainActivity", "URI scheme: ${uri.scheme}")
    
    // 获取文件名
    var fileName = "unknown.sql"
    try {
      val cursor = contentResolver.query(uri, null, null, null, null)
      cursor?.use {
        if (it.moveToFirst()) {
          val nameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
          if (nameIndex >= 0) {
            fileName = it.getString(nameIndex)
          }
        }
      }
    } catch (e: Exception) {
      Log.w("MainActivity", "Could not get file name from cursor", e)
      fileName = uri.lastPathSegment?.split("/")?.lastOrNull() ?: "unknown.sql"
    }
    Log.d("MainActivity", "File name: $fileName")
    
    // 立即读取文件内容并保存到缓存目录
    try {
      Log.d("MainActivity", "Trying to open input stream for: $uri")
      val inputStream = contentResolver.openInputStream(uri)
      if (inputStream != null) {
        val cacheDir = getExternalCacheDir()
        val targetDir = if (cacheDir != null) {
          File(cacheDir.absolutePath + "/shared_files")
        } else {
          File(filesDir, "shared_files")
        }
        if (!targetDir.exists()) {
          targetDir.mkdirs()
        }
        
        val tempFileName = "${System.currentTimeMillis()}_$fileName"
        val file = File(targetDir, tempFileName)
        FileOutputStream(file).use { outputStream ->
          inputStream.copyTo(outputStream)
        }
        inputStream.close()
        
        val cachedPath = file.absolutePath
        Log.d("MainActivity", "File copied to cache: $cachedPath")
        
        // 保存到 UriHolder
        UriHolder.set("file://$cachedPath", mimeType, fileName)
        Log.d("MainActivity", "Saved to UriHolder: file://$cachedPath")
        return
      }
    } catch (e: Exception) {
      Log.e("MainActivity", "Error copying file to cache", e)
    }
    
    // 如果复制失败，保存原始 URI
    UriHolder.set(uri.toString(), mimeType, fileName)
    Log.d("MainActivity", "Saved original URI to UriHolder: ${uri}")
  }
}