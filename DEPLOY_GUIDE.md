# 📦 네이버 클라우드 플랫폼(NCP) 배포 가이드

> 백엔드 + DB + 프론트엔드: NCP Server (Micro)

---

## 🔢 전체 순서

1. [NCP 가입 및 결제수단 등록](#1-ncp-가입-및-결제수단-등록)
2. [VPC 및 네트워크 설정](#2-vpc-및-네트워크-설정)
3. [Server 생성](#3-server-생성)
4. [서버 초기 설정](#4-서버-초기-설정)
5. [DB 설치 및 설정 (MySQL)](#5-db-설치-및-설정-mysql)
6. [백엔드 배포](#6-백엔드-배포)
7. [프론트엔드 빌드 및 배포](#7-프론트엔드-빌드-및-배포)
8. [도메인 및 HTTPS 설정](#8-도메인-및-https-설정)
9. [최종 테스트](#9-최종-테스트)

---

## 💰 예상 비용

| 항목 | 스펙 | 월 예상 비용 |
|------|------|-------------|
| Server (Micro) | 1vCPU, 1GB RAM | 약 1~2만원 |
| 공인 IP | 1개 | 약 4,000원 |
| 스토리지 | 50GB SSD | 포함 |
| **총합** | | **약 1.5~2.5만원** |

> 💡 첫 가입 시 크레딧 제공되는 경우도 있음!

---

## 1. NCP 가입 및 결제수단 등록

### 1-1. 회원가입
- [ ] https://www.ncloud.com 접속
- [ ] 네이버 계정으로 회원가입
- [ ] 본인인증 완료

### 1-2. 결제수단 등록
- [ ] 콘솔 접속: https://console.ncloud.com
- [ ] 우측 상단 **[마이페이지]** → **[결제수단]**
- [ ] 신용카드 또는 네이버페이 등록

### 1-3. 크레딧 확인 (선택)
- [ ] 신규 가입 크레딧이 있는지 확인
- [ ] 이벤트 페이지에서 무료 크레딧 받기

---

## 2. VPC 및 네트워크 설정

> ⚠️ NCP는 VPC(가상 사설 클라우드) 안에서 서버를 생성해야 합니다.

### 2-1. VPC 생성
- [ ] 콘솔 → **[Services]** → **[Networking]** → **[VPC]**
- [ ] **[VPC 생성]** 클릭
- [ ] 설정:
  - VPC 이름: `book-vpc`
  - IP 주소 범위: `10.0.0.0/16` (기본값 사용)
- [ ] **[생성]** 클릭

### 2-2. Subnet 생성
- [ ] **[Subnet 관리]** → **[Subnet 생성]**
- [ ] 설정:
  - Subnet 이름: `book-subnet`
  - VPC: `book-vpc` 선택
  - IP 주소 범위: `10.0.1.0/24`
  - Zone: `KR-1` (서울)
  - Subnet 타입: `Public`
  - 용도: `일반`
- [ ] **[생성]** 클릭

### 2-3. Network ACL 확인
- [ ] **[Network ACL]** 메뉴 확인
- [ ] 기본 ACL이 생성되어 있으면 OK
- [ ] 필요시 Inbound 규칙에 22, 80, 443 포트 허용 (7878은 Nginx 프록시 사용시 불필요)

---

## 3. Server 생성

### 3-1. 서버 생성
- [ ] 콘솔 → **[Services]** → **[Compute]** → **[Server]**
- [ ] **[서버 생성]** 클릭

### 3-2. 서버 이미지 선택
- [ ] **[Public 이미지]** 탭
- [ ] OS: **Ubuntu Server 24.04 LTS** (또는 22.04)
- [ ] **[다음]** 클릭

### 3-3. 서버 설정
- [ ] VPC: `book-vpc` 선택
- [ ] Subnet: `book-subnet` 선택
- [ ] 서버 타입: **Micro**
- [ ] 스펙: **mi1-g3 (1vCPU, 1GB RAM)**
  - 💡 메모리 부족 시 나중에 업그레이드 가능 (5분 소요)
- [ ] 요금제: **월요금제** 선택
- [ ] 서버 개수: 1
- [ ] 서버 이름: `book-server`
- [ ] Network Interface: **[+ 추가]** 버튼 클릭! ⚠️
- [ ] 공인 IP: **"새로운 공인 IP 할당"** 선택! ⚠️
- [ ] 물리 배치 그룹: 미사용
- [ ] 반납 보호: 해제
- [ ] Script 선택: 선택없음
- [ ] **[다음]** 클릭

### 3-4. 스토리지 설정
- [ ] 기본 설정 그대로 사용 (50GB)
- [ ] **[다음]** 클릭

### 3-5. 인증키 설정
- [ ] **[새로운 인증키 생성]** 선택
- [ ] 인증키 이름: `book-key`
- [ ] **[인증키 생성 및 다운로드]** 클릭
- [ ] ⚠️ **`.pem` 파일 안전하게 보관!** (재발급 불가)
- [ ] **[다음]** 클릭

### 3-6. 네트워크 접근 설정 (ACG)
- [ ] **[새로운 ACG 생성]** 선택
- [ ] ACG 이름: `book-acg`
- [ ] **[다음]** 클릭

### 3-7. 최종 확인 및 생성
- [ ] 설정 내용 확인
- [ ] **[서버 생성]** 클릭
- [ ] 상태가 **[운영중]**이 될 때까지 대기 (약 5~10분)

---

## 4. 서버 초기 설정

### 4-1. 공인 IP 확인
- [ ] 서버 생성 시 공인 IP 할당했으면 자동 부여됨
- [ ] **[Server]** → 서버 목록에서 공인 IP 확인
- [ ] 📝 공인 IP 메모: `223.130.135.204 (121824538)`

### 4-2. ACG 규칙 추가
- [ ] **[ACG]** 메뉴 이동
- [ ] `book-acg` 선택 → **[ACG 규칙 설정]**
- [ ] **Inbound 규칙 추가**:

| 프로토콜 | 포트 | 소스 | 설명 |
|---------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |
| TCP | 7878 | 0.0.0.0/0 | Spring Boot (테스트용, 운영시 불필요) |
| TCP | 3306 | 내 IP만 | MySQL (선택) |

- [ ] **[적용]** 클릭

### 4-3. 관리자 비밀번호 확인
- [ ] **[Server]** → 서버 선택 → **[서버 관리 및 설정 변경]**
- [ ] **[관리자 비밀번호 확인]** 클릭
- [ ] 다운받은 `.pem` 파일 업로드
- [ ] 📝 root 비밀번호 메모: `N9-hgg7L-UmFr`

### 4-4. SSH 접속
```bash
# Windows (PowerShell)
ssh root@223.130.135.204

# Mac/Linux
# window에서는 바로 서버 접속 가능
chmod 400 book-key.pem
ssh -i book-key.pem root@공인IP
```

### 4-5. 기본 패키지 업데이트
```bash
apt update && apt upgrade -y
```

### 4-6. Java 17 설치
```bash
apt install openjdk-17-jdk -y
java -version  # 확인
```

### 4-7. Nginx 설치
```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### 4-8. Swap 메모리 추가 (1GB RAM 필수!)
> ⚠️ 메모리가 1GB이므로 Swap 추가 필수!

```bash
# 2GB Swap 파일 생성
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 재부팅 후에도 유지
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 확인
free -h
```

---

## 5. DB 설치 및 설정 (MySQL)

### 5-1. MySQL 설치
```bash
apt install mysql-server -y
systemctl enable mysql
systemctl start mysql
```

### 5-2. MySQL 보안 설정
```bash
mysql_secure_installation
# Y → 비밀번호 설정 → Y → Y → Y → Y
```

### 5-3. DB 및 사용자 생성
```bash
mysql -u root -p
```

```sql
CREATE DATABASE borroweseoul CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bookuser'@'localhost' IDENTIFIED BY 'bookpass';
GRANT ALL PRIVILEGES ON borroweseoul.* TO 'bookuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 6. 백엔드 배포

### 6-1. 로컬에서 빌드

> 💻 **로컬 PC (Windows PowerShell)에서 실행** - NCP 서버 아님!

```powershell
cd C:\Users\edu\Desktop\metabuild-final-project\backend
./mvnw clean package -DskipTests
# 결과: target/demo-0.0.1-SNAPSHOT.jar
```

### 6-2. application-prod.properties 생성
`backend/src/main/resources/application-prod.properties`:

```properties
# 서버 설정
spring.application.name=BookApp
server.port=7878

# MySQL DB 설정 (로컬 MySQL)
spring.datasource.url=jdbc:mysql://localhost:3306/borroweseoul?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
spring.datasource.username=bookuser
spring.datasource.password=bookpass
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.show_sql=false

# 파일 업로드
file.upload-dir=/home/app/uploads
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB

# API 키들 (환경변수로 관리 권장)
llm.gemini.api-key=${LLM_GEMINI_API_KEY}
groq.api.key=${GROQ_API_KEY}
tavily.api.key=${TAVILY_API_KEY}
data4library.api-key=346fddca53df75812af46d8b26ce9dbf909382798b9726a088b5924bebd47fb7
kakao.api-key=327b3c03ad4d7c5b4a5033a82fd48b05
aladin.api-key=ttbfirstse7en1159001

# Turnstile
turnstile.enabled=true
turnstile.secret-key=${TURNSTILE_SECRET_KEY}
turnstile.verify-url=https://challenges.cloudflare.com/turnstile/v0/siteverify
```

### 6-3. 서버에 디렉토리 생성

> 🖥️ **NCP 서버에서 실행** (SSH 접속 상태)

```bash
mkdir -p /home/app/uploads
```

### 6-4. 파일 전송

> 💻 **로컬 PC (Windows PowerShell)에서 실행** - NCP 서버 아님!

```powershell
# 프로젝트 폴더로 이동
cd C:\Users\edu\Desktop\metabuild-final-project\backend

# jar 파일 전송
scp target/demo-0.0.1-SNAPSHOT.jar root@공인IP:/home/app/app.jar

# 설정 파일 전송
scp src/main/resources/application-prod.properties root@공인IP:/home/app/

# CSV 데이터 파일 전송
scp src/main/resources/aladin_books_data_delete_html.csv root@공인IP:/home/app/
scp "src/main/resources/서울시_도서관_코드포함.csv" root@공인IP:/home/app/
```

### 6-5. 환경변수 설정

> 🖥️ **NCP 서버에서 실행** (SSH 접속 상태)

```bash
nano /etc/environment
```

아래 내용 추가 (실제 API 키 값 입력):
```
LLM_GEMINI_API_KEY="여기에_실제_GEMINI_API_KEY_입력"
GROQ_API_KEY="여기에_실제_GROQ_API_KEY_입력"
TAVILY_API_KEY="여기에_실제_TAVILY_API_KEY_입력"
TURNSTILE_SECRET_KEY="여기에_실제_TURNSTILE_SECRET_KEY_입력"
```

저장 후 적용:
```bash
source /etc/environment
```

### 6-6. systemd 서비스 등록

> 🖥️ **NCP 서버에서 실행** (SSH 접속 상태)

```bash
nano /etc/systemd/system/bookapp.service
```

```ini
[Unit]
Description=Book Application
After=network.target mysql.service

[Service]
User=root
WorkingDirectory=/home/app
ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar app.jar --spring.profiles.active=prod --spring.config.additional-location=file:/home/app/application-prod.properties
Restart=always
RestartSec=10
EnvironmentFile=/etc/environment

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable bookapp
systemctl start bookapp
systemctl status bookapp
```

### 6-7. 백엔드 확인

> 🖥️ **NCP 서버에서 실행** (SSH 접속 상태)

```bash
# 로그 확인
journalctl -u bookapp -f

# 또는
curl http://localhost:7878/actuator/health
```

---

## 7. 프론트엔드 빌드 및 배포

### 7-1. 환경변수 설정

> 💻 **로컬 PC에서 실행** - `frontend/.env.production` 파일 생성

```
VITE_API_BASE_URL=http://공인IP
```
> 도메인 있으면 `https://도메인.com` 으로 변경

### 7-2. 빌드

> 💻 **로컬 PC (Windows PowerShell)에서 실행**

```powershell
cd C:\Users\edu\Desktop\metabuild-final-project\frontend
npm install
npm run build
# 결과: dist/ 폴더 생성됨
```

### 7-3. 서버로 전송

> 💻 **로컬 PC (Windows PowerShell)에서 실행**

```powershell
# frontend 폴더에서 실행
cd C:\Users\edu\Desktop\metabuild-final-project\frontend

# dist 폴더 압축 (PowerShell)
Compress-Archive -Path dist\* -DestinationPath dist.zip -Force

# 전송
scp dist.zip root@223.130.135.204:/home/app/
```

> 🖥️ **NCP 서버에서 실행** (SSH 접속)

```bash
cd /home/app
apt install unzip -y
unzip -o dist.zip -d frontend
rm dist.zip
```

### 7-4. Nginx 설정

> 🖥️ **NCP 서버에서 실행** (SSH 접속 상태)

```bash
nano /etc/nginx/sites-available/default
```

전체 내용 교체:
```nginx
server {
    listen 80;
    server_name _;  # 도메인 있으면 도메인으로 변경

    # 프론트엔드 (React)
    root /home/app/frontend;
    index index.html;

    # SPA 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API 프록시
    location /api {
        proxy_pass http://localhost:7878;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 업로드된 파일 서빙
    location /uploads {
        alias /home/app/uploads;
    }
}
```

```bash
nginx -t  # 문법 확인
systemctl reload nginx
```

---

## 8. 도메인 및 HTTPS 설정

### 8-1. 도메인 연결 (선택사항 - 없어도 IP로 접속 가능)

> ⚠️ 도메인 없으면 이 단계 건너뛰세요! `http://223.130.135.204` 로 접속 가능

#### 도메인 구매처

| 업체 | 사이트 | .com 가격 (1년) |
|------|--------|----------------|
| 가비아 | https://www.gabia.com | 약 1.5~2만원 |
| 호스팅케이알 | https://www.hosting.kr | 약 1.5만원 |
| 카페24 | https://domain.cafe24.com | 약 1.5만원 |

#### 도메인 구매 후 DNS 설정 방법 (가비아 예시)

1. **가비아 로그인** → **My가비아** → **도메인 관리**
2. 구매한 도메인 선택 → **DNS 관리** 클릭
3. **DNS 설정** 또는 **레코드 수정** 클릭
4. **A 레코드 추가**:

| 타입 | 호스트 | 값/위치 | TTL |
|------|--------|---------|-----|
| A | @ | 223.130.135.204 | 3600 |
| A | www | 223.130.135.204 | 3600 |

> `@` = 도메인 자체 (예: mybook.com)
> `www` = www 붙은 주소 (예: www.mybook.com)

5. **저장/확인** 클릭
6. DNS 반영까지 **최대 24시간** 소요 (보통 10분~1시간)

#### DNS 적용 확인

```bash
# 터미널에서 확인 (Windows PowerShell)
nslookup 도메인.com

# 결과에 223.130.135.204 가 나오면 성공!
```

#### 도메인 적용 후 추가 작업

1. **Nginx 설정 수정** (NCP 서버에서):
```bash
nano /etc/nginx/sites-available/default
```
```nginx
server_name mybook.com www.mybook.com;  # 도메인으로 변경
```

2. **프론트엔드 재빌드** (로컬 PC에서):
`.env.production` 수정:
```
VITE_API_BASE_URL=https://mybook.com
```
다시 빌드 후 배포

### 8-2. SSL 인증서 발급 (Let's Encrypt)
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d 도메인.com
# 이메일 입력 → 약관 동의 → 자동 리다이렉트 선택
```

### 8-3. SSL 자동 갱신 확인
```bash
certbot renew --dry-run
```

### 8-4. (도메인 없을 경우) IP로 접속
- 프론트엔드: `http://공인IP`
- 백엔드 API: `http://공인IP/api`

---

## 9. 최종 테스트

### 체크리스트
- [ ] 프론트엔드 접속: http://공인IP (또는 https://도메인.com)
- [ ] API 헬스체크: http://공인IP/api/actuator/health
- [ ] 회원가입/로그인 테스트
- [ ] 게시글 작성 테스트
- [ ] 이미지 업로드 테스트
- [ ] AI 챗봇 테스트
- [ ] 모바일 접속 테스트

---

## 🛠 문제 해결

> 🖥️ **아래 모든 명령어는 NCP 서버에서 실행** (SSH 접속 상태)

### 백엔드 로그 확인
```bash
journalctl -u bookapp -f
# 또는
journalctl -u bookapp --since "1 hour ago"
```

### Nginx 로그 확인
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### MySQL 접속 확인
```bash
mysql -u bookuser -p -D borroweseoul
```

### 포트 확인
```bash
netstat -tlnp | grep -E '80|443|7878|3306'
```

### 서비스 재시작
```bash
systemctl restart bookapp
systemctl restart nginx
systemctl restart mysql
```

### 디스크 용량 확인
```bash
df -h
```

### CORS 에러 발생 시
- Nginx에서 프록시 처리하므로 보통 발생 안함
- 백엔드 CORS 설정 확인 필요시 WebConfig 수정

---

## 📝 메모

```
[NCP 정보]
공인 IP: _______________
root 비밀번호: _______________
pem 파일 위치: _______________

[DB 정보]
DB명: borroweseoul
사용자: bookuser
비밀번호: bookpass

[도메인 정보]
도메인: _______________
SSL 만료일: _______________

[API 키]
LLM_GEMINI_API_KEY: _______________
GROQ_API_KEY: _______________
TAVILY_API_KEY: _______________
TURNSTILE_SECRET_KEY: _______________
```

---

## 🔄 업데이트 배포 방법

### 백엔드 업데이트

> 💻 **1단계: 로컬 PC (Windows PowerShell)에서 실행**

```powershell
cd C:\Users\edu\Desktop\metabuild-final-project\backend
./mvnw clean package -DskipTests
scp target/demo-0.0.1-SNAPSHOT.jar root@공인IP:/home/app/app.jar
```

> 🖥️ **2단계: NCP 서버에서 실행** (SSH 접속)

```bash
systemctl restart bookapp
```

### 프론트엔드 업데이트

> 💻 **1단계: 로컬 PC (Windows PowerShell)에서 실행**

```powershell
cd C:\Users\edu\Desktop\metabuild-final-project\frontend
npm run build
scp -r dist/* root@공인IP:/home/app/frontend/
```

> 🖥️ **2단계: NCP 서버에서 실행** (SSH 접속)

```bash
systemctl reload nginx
```

---

*마지막 업데이트: 2026-01-20*
