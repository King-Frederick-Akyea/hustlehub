package com.hustlehub.identity.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.uploads")
public class FileStorageProperties {

    private String baseDir = "./uploads";
    private long maxFileSizeBytes = 8 * 1024 * 1024;

    public String getBaseDir() {
        return baseDir;
    }

    public void setBaseDir(String baseDir) {
        this.baseDir = baseDir;
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public void setMaxFileSizeBytes(long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }
}
