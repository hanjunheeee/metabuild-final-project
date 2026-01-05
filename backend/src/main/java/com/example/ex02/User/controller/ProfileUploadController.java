package com.example.ex02.User.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:3001")
public class ProfileUploadController {

    // 업로드 경로 (프로젝트 외부 또는 static 폴더)
    @Value("${file.upload-dir:uploads}")
    private String uploadBaseDir;

    // 프로필 이미지 업로드
    @PostMapping("/upload/profile")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            // 파일이 비어있는지 확인
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "파일이 비어있습니다."
                ));
            }

            // 이미지 파일인지 확인
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이미지 파일만 업로드 가능합니다."
                ));
            }

            // 파일 크기 확인 (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "파일 크기는 5MB 이하여야 합니다."
                ));
            }

            // 업로드 디렉토리 생성
            Path uploadPath = Paths.get(uploadBaseDir, "profile");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 고유한 파일명 생성 (원본파일명_현재시각.확장자)
            String originalFilename = file.getOriginalFilename();
            String baseName = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(0, originalFilename.lastIndexOf(".")) 
                : (originalFilename != null ? originalFilename : "file");
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String timestamp = String.valueOf(System.currentTimeMillis());
            String newFilename = baseName + "_" + timestamp + extension;

            // 파일 저장
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "filename", newFilename,
                "message", "파일 업로드 성공"
            ));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "파일 업로드 실패: " + e.getMessage()
            ));
        }
    }
}

