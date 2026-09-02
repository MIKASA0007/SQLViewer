package com.sqlviewer

import android.util.Log
import android.net.Uri
import android.content.ContentResolver

object UriHolder {
    var uri: String? = null
    var type: String? = null
    var fileName: String? = null
    
    fun clear() {
        Log.d("UriHolder", "Clearing URI holder")
        uri = null
        type = null
        fileName = null
    }
    
    fun set(uri: String?, type: String?, fileName: String? = null) {
        Log.d("UriHolder", "Setting URI: $uri, type: $type, fileName: $fileName")
        Log.d("UriHolder", "Current URI in holder: $uri")
        this.uri = uri
        this.type = type
        this.fileName = fileName
    }
    
    fun setWithUri(androidUri: Uri?, type: String?, contentResolver: ContentResolver? = null) {
        if (androidUri == null) {
            clear()
            return
        }
        
        val uriString = androidUri.toString()
        var displayName: String? = null
        
        // Try to get display name from ContentResolver
        contentResolver?.let { resolver ->
            try {
                val cursor = resolver.query(androidUri, null, null, null, null)
                cursor?.use {
                    if (it.moveToFirst()) {
                        val nameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        if (nameIndex >= 0) {
                            displayName = it.getString(nameIndex)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w("UriHolder", "Failed to get display name from ContentResolver", e)
            }
        }
        
        // Fallback to extracting from URI path
        val name = displayName ?: androidUri.lastPathSegment?.split("/")?.lastOrNull()
        
        Log.d("UriHolder", "Setting with androidUri: $uriString, type: $type, extracted name: $name")
        this.uri = uriString
        this.type = type
        this.fileName = name
    }
}