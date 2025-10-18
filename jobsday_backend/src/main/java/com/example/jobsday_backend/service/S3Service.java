package com.example.jobsday_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class S3Service {
    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String uploadFileWithCustomName(MultipartFile file, String folder, String fileName) {
        try {
            String key = folder + "/" + fileName;
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return getPublicUrl(key);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi upload file lên S3", e);
        }
    }

    public ResponseInputStream<GetObjectResponse> downloadFile(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        return s3Client.getObject(getObjectRequest);
    }

    public void copyFile(String sourceKey, String targetKey) {
        s3Client.copyObject(builder -> builder
                .sourceBucket(bucketName)
                .sourceKey(sourceKey)
                .destinationBucket(bucketName)
                .destinationKey(targetKey)
        );
    }

    public String getPublicUrl(String key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucketName,
                s3Client.serviceClientConfiguration().region().id(),
                key);
    }

    public void deleteFile(String key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }

    public String extractKeyFromUrl(String urlOrKey) {
        if (urlOrKey.contains(".amazonaws.com/")) {
            return urlOrKey.substring(urlOrKey.indexOf(".com/") + 5);
        }
        return urlOrKey;
    }

    public String extractFileNameFromUrl(String urlOrKey) {
        String path;
        if (urlOrKey.contains(".amazonaws.com/")) {
            path = urlOrKey.substring(urlOrKey.indexOf(".com/") + 5);
        } else {
            path = urlOrKey;
        }

        int lastSlashIndex = path.lastIndexOf('/');
        if (lastSlashIndex != -1) {
            return path.substring(lastSlashIndex + 1);
        }
        return path;
    }

    public void deleteAllByPrefix(String prefix) {
        ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(prefix)
                .build();

        ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);

        if (listResponse.hasContents()) {
            List<ObjectIdentifier> keys = listResponse.contents().stream()
                    .map(s3Object -> ObjectIdentifier.builder().key(s3Object.key()).build())
                    .collect(Collectors.toList());

            DeleteObjectsRequest deleteObjectsRequest = DeleteObjectsRequest.builder()
                    .bucket(bucketName)
                    .delete(Delete.builder().objects(keys).build())
                    .build();

            s3Client.deleteObjects(deleteObjectsRequest);
        }
    }

}

