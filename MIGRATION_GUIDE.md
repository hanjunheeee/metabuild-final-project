# 🔄 Oracle → MySQL 데이터 마이그레이션 가이드

> DBeaver를 사용한 데이터 이관

---

## 📋 사전 준비

- [ ] DBeaver 설치 완료
- [ ] MySQL 설치 완료
- [ ] MySQL에 `borroweseoul` 스키마 생성 완료
- [ ] Oracle DB 접속 가능 상태

---

## 1. DBeaver에서 DB 연결 설정

### 1-1. Oracle 연결

1. 좌측 **Database Navigator** 우클릭 → **새 연결 생성**
2. **Oracle** 선택 → Next
3. 연결 정보 입력:
   ```
   Host: localhost
   Port: 1521
   Database (SID): XE
   Username: sqlid
   Password: sqlpw
   ```
4. **Test Connection** → 성공 확인 → **완료**

### 1-2. MySQL 연결

1. 좌측 **Database Navigator** 우클릭 → **새 연결 생성**
2. **MySQL** 선택 → Next
3. 연결 정보 입력:
   ```
   Host: localhost
   Port: 3306
   Database: borroweseoul
   Username: bookuser
   Password: bookpass
   ```
4. **Test Connection** → 성공 확인 → **완료**

---

## 2. MySQL에 테이블 구조 생성

> JPA가 자동으로 테이블을 생성하도록 Spring Boot 실행

```bash
cd backend
./mvnw spring-boot:run
```

- 실행 후 콘솔에서 테이블 생성 로그 확인
- `borroweseoul`에 테이블들 생성되면 **Ctrl+C**로 종료

### 테이블 생성 확인

DBeaver에서:
1. MySQL 연결 → `borroweseoul` → **Tables** 새로고침
2. 테이블 목록 확인 (users, book, community 등)

---

## 3. 데이터 이관 순서

> ⚠️ 외래키(FK) 때문에 순서가 중요합니다!

```
순서  테이블명          설명
────────────────────────────────
1    users            회원 (가장 먼저!)
2    book             도서
3    community        게시글
4    comments         댓글
5    follow           팔로우 관계
6    user_title       회원 칭호
7    bookmark         즐겨찾기
8    book_search_log  검색 로그
9    community_like   게시글 좋아요
10   comment_like     댓글 좋아요
11   blocked_keyword  차단 키워드
```

---

## 4. 데이터 이관 방법 (SQL Developer)

### 방법: 익스포트 마법사로 INSERT 문 추출

각 테이블마다 반복:

1. **SQL Developer** → 테이블 우클릭 → **익스포트**
2. **익스포트 마법사 - 단계 1/3 (소스/대상)** 설정:
   ```
   ☐ DDL 익스포트 (체크 해제 - 데이터만 필요)
   ☑ 데이터 익스포트 (체크!)
   
   형식: insert
   ☑ 스키마 표시
   인코딩: UTF8
   
   파일: 저장할 경로 선택 (예: C:\export\users.sql)
   ```
3. **다음** 클릭
4. **단계 2/3**: 내보낼 테이블 확인 → **다음**
5. **단계 3/3**: 요약 확인 → **완료**
6. 생성된 `.sql` 파일 열어서 Oracle 문법 → MySQL 문법 수정:
   ```
   SYSDATE        → NOW()
   SYSTIMESTAMP   → NOW()
   TO_DATE(...)   → STR_TO_DATE(...)
   TO_TIMESTAMP(...)   → STR_TO_DATE(...)
   ```
7. **MySQL Workbench**에서 SQL 파일 실행

### 💡 팁: 한번에 여러 테이블 내보내기

1. 여러 테이블 **Ctrl+클릭**으로 선택
2. 우클릭 → **익스포트**
3. **다른 이름으로 저장** → **단일 파일** 선택하면 하나의 SQL 파일로 생성

---

## 5. 이관 후 검증

각 테이블별로 데이터 수 확인:

### Oracle에서
```sql
SELECT 'users' AS tbl, COUNT(*) FROM users
UNION ALL
SELECT 'book', COUNT(*) FROM book
UNION ALL
SELECT 'community', COUNT(*) FROM community
UNION ALL
SELECT 'comments', COUNT(*) FROM comments;
```

### MySQL에서
```sql
SELECT 'users' AS tbl, COUNT(*) FROM users
UNION ALL
SELECT 'book', COUNT(*) FROM book
UNION ALL
SELECT 'community', COUNT(*) FROM community
UNION ALL
SELECT 'comments', COUNT(*) FROM comments;
```

→ 숫자가 같으면 성공! ✅

---

## 6. 시퀀스(AUTO_INCREMENT) 조정

MySQL에서 ID가 제대로 증가하도록 시퀀스 값 조정:

```sql
-- 각 테이블의 최대 ID + 1로 AUTO_INCREMENT 설정
ALTER TABLE users AUTO_INCREMENT = (SELECT MAX(user_id) + 1 FROM users);
ALTER TABLE book AUTO_INCREMENT = (SELECT MAX(book_id) + 1 FROM book);
ALTER TABLE community AUTO_INCREMENT = (SELECT MAX(community_id) + 1 FROM community);
-- ... 나머지 테이블들
```

또는 간단하게 큰 수로 설정:
```sql
ALTER TABLE users AUTO_INCREMENT = 1000;
ALTER TABLE book AUTO_INCREMENT = 200000;
ALTER TABLE community AUTO_INCREMENT = 1000;
```

---

## 7. Spring Boot 실행 및 테스트

```bash
cd backend
./mvnw spring-boot:run
```

### 테스트 체크리스트
- [ ] 회원 로그인 정상
- [ ] 게시글 목록 조회 정상
- [ ] 도서 검색 정상
- [ ] 칭호/명예의 전당 정상
- [ ] 새 데이터 INSERT 정상 (회원가입, 글쓰기 등)

---

## 🛠 문제 해결

### 외래키 오류 발생 시
```sql
-- MySQL에서 외래키 체크 일시 비활성화
SET FOREIGN_KEY_CHECKS = 0;

-- 데이터 이관 ...

-- 다시 활성화
SET FOREIGN_KEY_CHECKS = 1;
```

### 문자 인코딩 깨짐
- MySQL Workbench → Edit → Preferences → SQL Editor
- Default Character Set: `utf8mb4` 확인

### 날짜 형식 오류
Oracle `TO_DATE` → MySQL `STR_TO_DATE` 변환:
```sql
-- Oracle
TO_DATE('2025-01-01', 'YYYY-MM-DD')

-- MySQL
STR_TO_DATE('2025-01-01', '%Y-%m-%d')
```

---

## 📝 테이블별 이관 체크리스트

| 순서 | 테이블 | Oracle 건수 | MySQL 건수 | 완료 |
|------|--------|-------------|------------|------|
| 1 | users | ___ | ___ | [ ] |
| 2 | book | ___ | ___ | [ ] |
| 3 | community | ___ | ___ | [ ] |
| 4 | comments | ___ | ___ | [ ] |
| 5 | follow | ___ | ___ | [ ] |
| 6 | user_title | ___ | ___ | [ ] |
| 7 | bookmark | ___ | ___ | [ ] |
| 8 | book_search_log | ___ | ___ | [ ] |
| 9 | community_like | ___ | ___ | [ ] |
| 10 | comment_like | ___ | ___ | [ ] |
| 11 | blocked_keyword | ___ | ___ | [ ] |

---

## ⏱ 예상 소요 시간

| 데이터 규모 | 예상 시간 |
|-------------|----------|
| 소규모 (1만건 이하) | 30분~1시간 |
| 중규모 (10만건) | 1~2시간 |
| 대규모 (100만건+) | 반나절 |

---

## 🚀 로컬 MySQL → NCP 서버 MySQL 데이터 이전

> 로컬 개발 환경의 데이터를 운영 서버로 복사

---

### 📋 사전 준비

- [ ] 로컬 MySQL에 데이터 있음
- [ ] NCP 서버 MySQL 설치 및 DB 생성 완료
- [ ] NCP 서버에 SSH 접속 가능

---

### 1단계: 로컬에서 데이터 덤프 (내보내기)

> 💻 **로컬 PC (Windows PowerShell)에서 실행**

#### MySQL bin 폴더 찾기
```powershell
# 보통 이 경로에 있음 (버전에 따라 다름)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

#### 데이터 덤프
```powershell
# 전체 데이터베이스 덤프
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u bookuser -p --no-tablespaces borroweseoul > C:\Users\edu\Desktop\db_backup.sql
```
→ 비밀번호 입력 (bookpass)

#### 덤프 파일 확인
```powershell
# 파일 크기 확인
dir C:\Users\edu\Desktop\db_backup.sql
```

---

### 2단계: 덤프 파일을 서버로 전송

> 💻 **로컬 PC (Windows PowerShell)에서 실행**

```powershell
scp C:\Users\edu\Desktop\db_backup.sql root@223.130.135.204:/home/app/
```

---

### 3단계: 서버에서 데이터 복원 (가져오기)

> 🖥️ **NCP 서버에서 실행** (SSH 접속 상태)

```bash
# 외래키 체크 비활성화 후 복원
mysql -u bookuser -p borroweseoul < /home/app/db_backup.sql
```
→ 비밀번호 입력 (bookpass)

#### 외래키 오류 발생 시
```bash
mysql -u root -p
```
```sql
SET FOREIGN_KEY_CHECKS = 0;
SOURCE /home/app/db_backup.sql;
SET FOREIGN_KEY_CHECKS = 1;
EXIT;
```

---

### 4단계: 데이터 확인

> 🖥️ **NCP 서버에서 실행**

```bash
mysql -u bookuser -p -D borroweseoul -e "SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users UNION ALL SELECT 'book', COUNT(*) FROM book UNION ALL SELECT 'community', COUNT(*) FROM community;"
```

→ 로컬과 같은 숫자가 나오면 성공! ✅

---

### 5단계: 백엔드 재시작

```bash
systemctl restart bookapp
systemctl status bookapp
```

---

### 🛠 문제 해결

#### "Access denied" 오류
```bash
# root로 복원 시도
mysql -u root -p borroweseoul < /home/app/db_backup.sql
```

#### 테이블 이미 존재 오류
```bash
# 기존 테이블 삭제 후 복원
mysql -u root -p -D borroweseoul -e "SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS users, book, community, comments, follow, bookmark, user_title, book_search_log, community_like, comment_like, blocked_keyword; SET FOREIGN_KEY_CHECKS=1;"
mysql -u bookuser -p borroweseoul < /home/app/db_backup.sql
```

#### 인코딩 문제
```bash
# UTF-8로 복원
mysql -u bookuser -p --default-character-set=utf8mb4 borroweseoul < /home/app/db_backup.sql
```

---

### 📋 체크리스트

- [ ] 로컬에서 mysqldump 실행
- [ ] scp로 서버에 전송
- [ ] 서버에서 mysql 복원
- [ ] 데이터 수 확인
- [ ] 백엔드 재시작
- [ ] 웹사이트에서 데이터 확인

---

*마지막 업데이트: 2026-01-20*
