package com.example.ex02.Community.controller;

import com.example.ex02.Community.service.CommunityImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/community-images")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class CommunityImageController {

    private final CommunityImageService communityImageService;

    // 업로드 경로
    @Value("${file.upload-dir:uploads}")
    private String uploadBaseDir;

    /**
     * Base64 이미지를 파일로 저장
     * 요청 본문: { "imageData": "data:image/png;base64,..." }
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadBase64Image(@RequestBody Map<String, String> request) {
        try {
            String imageData = request.get("imageData");
            
            if (imageData == null || imageData.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이미지 데이터가 없습니다."
                ));
            }

            // Base64 데이터 파싱 (data:image/png;base64,xxxxx 형식)
            String[] parts = imageData.split(",");
            if (parts.length != 2) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "잘못된 이미지 데이터 형식입니다."
                ));
            }

            // MIME 타입 추출 (data:image/png;base64)
            String mimeType = parts[0].split(":")[1].split(";")[0];
            if (!mimeType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이미지 파일만 업로드 가능합니다."
                ));
            }

            // 확장자 결정
            String extension = switch (mimeType) {
                case "image/png" -> ".png";
                case "image/gif" -> ".gif";
                case "image/webp" -> ".webp";
                default -> ".jpg";
            };

            // Base64 디코딩
            byte[] imageBytes = Base64.getDecoder().decode(parts[1]);

            // 파일 크기 확인 (5MB)
            if (imageBytes.length > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "파일 크기는 5MB 이하여야 합니다."
                ));
            }

            // 업로드 디렉토리 생성
            Path uploadPath = Paths.get(uploadBaseDir, "community");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 고유 파일명 생성
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);

            // 파일 저장
            Files.write(filePath, imageBytes);

            // 클라이언트에서 접근 가능한 URL 반환
            String imageUrl = "/uploads/community/" + filename;

            return ResponseEntity.ok(Map.of(
                "success", true,
                "imageUrl", imageUrl,
                "message", "이미지 업로드 성공"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Base64 디코딩 실패: " + e.getMessage()
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "파일 저장 실패: " + e.getMessage()
            ));
        }
    }

    /**
     * MultipartFile 이미지 업로드 (대안)
     */
    @PostMapping("/upload/file")
    public ResponseEntity<?> uploadMultipartImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "파일이 비어있습니다."
                ));
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이미지 파일만 업로드 가능합니다."
                ));
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "파일 크기는 5MB 이하여야 합니다."
                ));
            }

            Path uploadPath = Paths.get(uploadBaseDir, "community");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;
            
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            String imageUrl = "/uploads/community/" + filename;

            return ResponseEntity.ok(Map.of(
                "success", true,
                "imageUrl", imageUrl,
                "message", "이미지 업로드 성공"
            ));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "파일 업로드 실패: " + e.getMessage()
            ));
        }
    }
}

