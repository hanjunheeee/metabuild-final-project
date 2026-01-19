# 🔄 Oracle → MySQL 데이터 마이그레이션 가이드

> DBeaver를 사용한 데이터 이관

---

## 📋 사전 준비

- [ ] DBeaver 설치 완료
- [ ] MySQL 설치 완료
- [ ] MySQL에 `bookdb` 스키마 생성 완료
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
   Database (SID): orcl
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
   Database: bookdb
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
- `bookdb`에 테이블들 생성되면 **Ctrl+C**로 종료

### 테이블 생성 확인

DBeaver에서:
1. MySQL 연결 → `bookdb` → **Tables** 새로고침
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
8    search_log       검색 로그
9    community_great  게시글 좋아요
10   comment_like     댓글 좋아요
... (나머지 테이블들)
```

---

## 4. 데이터 이관 방법

### 방법 A: Export Data 기능 사용 (권장)

각 테이블마다 반복:

1. **Oracle** 연결 → 스키마 → **Tables** 펼치기
2. 이관할 테이블 **우클릭** → **데이터 내보내기 (Export Data)**
3. **Transfer** 선택:
   - Format: `Database`
   - 다음 클릭
4. **Target**:
   - Target container: MySQL의 `bookdb` 선택
   - Target: 같은 이름의 테이블 선택
5. **Data load settings**:
   - ✅ Truncate target table (기존 데이터 삭제)
   - ✅ Disable batches (안전하게)
6. **Proceed** → 완료 대기

### 방법 B: SQL INSERT 문 추출 후 실행

1. **Oracle** 테이블 우클릭 → **데이터 내보내기**
2. Format: **SQL** 선택
3. 설정:
   - ✅ Include column names
   - ✅ INSERT 문 형식
4. 파일로 저장 (예: `users_data.sql`)
5. 파일 열어서 Oracle 문법 → MySQL 문법 수정:
   ```
   SYSDATE        → NOW()
   SYSTIMESTAMP   → NOW()
   TO_DATE(...)   → STR_TO_DATE(...)
   ```
6. **MySQL Workbench**에서 SQL 파일 실행

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
| 8 | search_log | ___ | ___ | [ ] |
| 9 | community_great | ___ | ___ | [ ] |
| 10 | comment_like | ___ | ___ | [ ] |

---

## ⏱ 예상 소요 시간

| 데이터 규모 | 예상 시간 |
|-------------|----------|
| 소규모 (1만건 이하) | 30분~1시간 |
| 중규모 (10만건) | 1~2시간 |
| 대규모 (100만건+) | 반나절 |

---

*마지막 업데이트: 2026-01-19*

