# 📦 카페24 배포 가이드

> 백엔드: 카페24 VPS | 프론트엔드: 카페24 웹호스팅

---

## 🔢 전체 순서

1. [카페24 서비스 신청](#1-카페24-서비스-신청)
2. [VPS 초기 설정](#2-vps-초기-설정)
3. [DB 설치 및 설정](#3-db-설치-및-설정)
4. [백엔드 배포](#4-백엔드-배포)
5. [프론트엔드 빌드 및 배포](#5-프론트엔드-빌드-및-배포)
6. [도메인 및 HTTPS 설정](#6-도메인-및-https-설정)
7. [최종 테스트](#7-최종-테스트)

---

## 1. 카페24 서비스 신청

### VPS (백엔드용)
- [ ] 카페24 VPS(Virtual Private Server/가상서버호스팅) 신청: https://hosting.cafe24.com/
- [ ] 추천 사양: **RAM 2GB** (MySQL 사용 - 가벼움!)
- [ ] OS 선택: **Ubuntu 22.04 LTS**
- [ ] SSH 접속 정보 메모 (IP, 포트, 비밀번호)

### 웹호스팅 (프론트엔드용)
- [ ] 카페24 웹호스팅 신청 (리눅스 호스팅)
- [ ] FTP 접속 정보 메모 (호스트, 아이디, 비밀번호)

---

## 2. VPS 초기 설정

### SSH 접속
```bash
ssh root@VPS_IP주소 -p 포트번호
```

### 기본 패키지 업데이트
```bash
sudo apt update && sudo apt upgrade -y
```

### Java 17 설치
```bash
sudo apt install openjdk-17-jdk -y
java -version  # 확인
```

### 방화벽 설정
```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 8080    # Spring Boot
sudo ufw enable
```

---

## 3. DB 설치 및 설정 (MySQL)

> ✅ 프로젝트가 MySQL로 마이그레이션 완료됨

```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation

# DB 생성
sudo mysql -u root -p
```

```sql
CREATE DATABASE bookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bookuser'@'%' IDENTIFIED BY 'bookpass';
GRANT ALL PRIVILEGES ON bookdb.* TO 'bookuser'@'%';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 외부 접속 허용 (필요시)
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# bind-address = 0.0.0.0 으로 변경
sudo systemctl restart mysql
```

---

## 4. 백엔드 배포

### 4-1. 로컬에서 빌드
```bash
cd backend
./mvnw clean package -DskipTests
# 결과: target/demo-0.0.1-SNAPSHOT.jar
```

### 4-2. application-prod.properties 생성
```properties
# 서버 설정
server.port=8080

# MySQL DB 설정
spring.datasource.url=jdbc:mysql://localhost:3306/bookdb?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
spring.datasource.username=bookuser
spring.datasource.password=bookpass
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

# JPA
spring.jpa.hibernate.ddl-auto=update

# CORS (프론트엔드 도메인)
cors.allowed-origins=https://프론트도메인.cafe24.com

# 기타 API 키들
llm.gemini.api-key=키값
data4library.api-key=키값
kakao.api-key=키값
# ... 나머지 키들
```

### 4-3. VPS로 파일 전송
```bash
# jar 파일 전송
scp -P 포트 target/demo-0.0.1-SNAPSHOT.jar root@VPS_IP:/home/app/

# 설정 파일 전송
scp -P 포트 src/main/resources/application-prod.properties root@VPS_IP:/home/app/
```

### 4-4. VPS에서 실행
```bash
ssh root@VPS_IP -p 포트

cd /home/app

# 실행 (백그라운드)
nohup java -jar demo-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  > app.log 2>&1 &

# 로그 확인
tail -f app.log

# 프로세스 확인
ps aux | grep java
```

### 4-5. 서비스로 등록 (선택)
```bash
sudo nano /etc/systemd/system/bookapp.service
```

```ini
[Unit]
Description=Book Application
After=network.target

[Service]
User=root
WorkingDirectory=/home/app
ExecStart=/usr/bin/java -jar demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable bookapp
sudo systemctl start bookapp
sudo systemctl status bookapp
```

---

## 5. 프론트엔드 빌드 및 배포

### 5-1. 환경변수 설정
```bash
# frontend/.env.production 파일 생성
VITE_API_BASE_URL=http://VPS_IP:8080
# 또는 도메인 있으면
VITE_API_BASE_URL=https://api.도메인.com
```

### 5-2. 빌드
```bash
cd frontend
npm install
npm run build
# 결과: dist/ 폴더 생성
```

### 5-3. FTP 업로드
- FileZilla 등 FTP 클라이언트 사용
- 카페24 웹호스팅 접속
- `public_html` 폴더에 `dist/` 내용물 전체 업로드

### 5-4. SPA 라우팅 설정
`public_html/.htaccess` 파일 생성:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 6. 도메인 및 HTTPS 설정

### VPS에 SSL 적용 (Let's Encrypt)
```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d api.도메인.com

# Nginx 사용 시
sudo apt install nginx -y
# Nginx 설정에서 SSL 인증서 연결
```

### 웹호스팅 SSL
- 카페24 관리자 페이지에서 무료 SSL 신청

---

## 7. 최종 테스트

- [ ] 프론트엔드 접속 확인: https://도메인.cafe24.com
- [ ] 백엔드 API 확인: https://api.도메인.com/api/health
- [ ] 로그인/회원가입 테스트
- [ ] 주요 기능 테스트
- [ ] 모바일 접속 테스트

---

## 🛠 문제 해결

### 백엔드 로그 확인
```bash
tail -f /home/app/app.log
```

### 포트 사용 확인
```bash
sudo netstat -tlnp | grep 8080
```

### 프로세스 종료
```bash
pkill -f demo-0.0.1-SNAPSHOT.jar
```

### CORS 에러 발생 시
- `application-prod.properties`의 `cors.allowed-origins` 확인
- 프론트엔드 도메인이 정확히 등록되어 있는지 확인

---

## 📝 메모

```
VPS IP: _______________
VPS SSH 포트: _______________
VPS 비밀번호: _______________

웹호스팅 FTP 호스트: _______________
웹호스팅 FTP 아이디: _______________
웹호스팅 FTP 비밀번호: _______________

DB 사용자: _______________
DB 비밀번호: _______________

프론트 도메인: _______________
백엔드 도메인: _______________
```

---

*마지막 업데이트: 2026-01-19*

