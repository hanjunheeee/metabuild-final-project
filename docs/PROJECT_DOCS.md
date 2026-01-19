# Metabuild Final Project - Documentation Pack

본 문서는 코드베이스를 기반으로 산출물을 정리한 상세 문서입니다.

## 1. 프로젝트 개요
- 서비스 성격: 도서 정보/가격 비교 + 도서관 대출/지도 + 커뮤니티 + 소셜 + 랭킹/칭호 + AI 요약/챗봇
- 주요 모듈: Book, Library, Community, User/Auth, Bookmark, Follow, Title/Ranking, Analytics, AI
- 배포 구조: React(Vite) 프론트 + Spring Boot API + Oracle DB

## 2. 사용기술
- Frontend: React 19, Vite, React Router, TailwindCSS, Leaflet
- Backend: Spring Boot 3.4, Spring Web, Spring Security, JPA, MyBatis, Lombok
- DB: Oracle (JDBC, Hibernate Dialect)
- 외부/연동: Data4Library, Aladin, Kyobo/Yes24 스크래핑, Gemini LLM, Gmail SMTP, Cloudflare Turnstile, Kakao API
- 기타: 파일 업로드(프로필/커뮤니티 이미지), JWT 인증

## 3. 아키텍처
- Client → API → DB 구조
- 프론트: 페이지 라우팅 + API 호출 → 검색/지도/커뮤니티/마이페이지/관리자 UI
- 백엔드: REST API + 인증/인가 + 외부 API 연동 + 실시간 조회
- 데이터 흐름 예시
  - 도서검색: Client → /api/books → DB 검색/외부 API 병합
  - 대출조회: Client → /api/library/check-loan → Data4Library API
  - 커뮤니티: Client → /api/communities, /api/comments → DB
  - 랭킹/칭호: Client → /api/ranking, /api/titles → 집계/보상 로직
  - AI: Client → /api/chat → Gemini 호출
- 정적 파일: 업로드 이미지 경로 uploads/ 저장 후 URL로 제공

## 4. DB 설계 (ERD 명칭)
### 4.1 테이블 목록
- users
- book
- community
- community_like
- comments
- comment_like
- bookmark
- follow
- user_title
- book_search_log
- blocked_keyword

### 4.2 테이블 상세
**users**
- PK: user_id
- email (unique), password, nickname, role, is_active, user_photo, created_at

**book**
- PK: book_id
- isbn, title, author, publisher, published_date, summary(CLOB), image_url, ages(enum)

**community**
- PK: community_id
- FK: user_id → users, book_id → book (nullable)
- content_json, thumbnail_url, community_great, is_notice, community_kind, created_at, updated_at

**community_like**
- PK: like_id
- FK: user_id → users, community_id → community
- Unique: (user_id, community_id)

**comments**
- PK: comment_id
- FK: community_id → community, user_id → users, book_id → book (nullable), parent_id → comments (nullable)
- content(CLOB), like_count, created_at, updated_at

**comment_like**
- PK: comment_like_id
- FK: user_id → users, comment_id → comments
- Unique: (user_id, comment_id)

**bookmark**
- PK: bookmark_id
- FK: user_id → users, book_id → book
- Unique: (user_id, book_id)

**follow**
- PK: follow_id
- FK: follower_id → users, following_id → users
- Unique: (follower_id, following_id)

**user_title**
- PK: title_id
- FK: user_id → users
- title_type(enum), title_level(enum), title_name, title_icon, achieved_at
- Unique: (user_id, title_type, title_level)

**book_search_log**
- PK: log_id
- FK: book_id → book (nullable), user_id → users (nullable)
- keyword, action_type(enum), created_at
- Index: action_type, created_at, keyword

**blocked_keyword**
- PK: blocked_id
- keyword (unique), created_at

## 5. 요구사항 정의서
### 5.1 사용자/인증
- 회원가입/로그인(JWT), 이메일/닉네임 중복 체크
- 이메일 인증 코드 발송/검증
- 비밀번호 재설정(메일 링크) 및 변경
- 프로필 수정(닉네임/사진), 프로필 이미지 업로드
- 계정 활성/비활성(관리자)

### 5.2 도서
- 키워드/ISBN 검색, 상세 조회
- 도서 AI 요약 제공
- 서점 가격 비교(Aladin/Kyobo/Yes24)
- 베스트셀러/대출 랭킹 조회
- 북마크(등록/해제/목록)

### 5.3 도서관/지도
- 서울 구 목록 및 도서관 데이터 조회
- ISBN 기반 대출 가능 조회
- 검색 결과 지도 표시/길찾기 연결

### 5.4 커뮤니티
- 게시글 CRUD, 카테고리(질문/자유/리뷰), 공지 설정
- 게시글 좋아요 토글, 주간 HOT
- 댓글/대댓글 CRUD, 댓글 좋아요
- 커뮤니티 이미지 업로드

### 5.5 소셜/칭호/랭킹
- 팔로우/언팔로우, 팔로워/팔로잉 목록 및 카운트
- 칭호 지급(환영/좋아요/팔로워 기반), 상위 칭호 조회
- 좋아요/팔로워 랭킹, 명예의 전당

### 5.6 분석/관리
- 검색/구매조회/도서관조회/AI요약 로그 기록
- 키워드/구매/대출 트렌드 조회
- 차단 키워드 등록/해제
- 관리자: 도서/게시글/사용자/트렌드 관리

## 6. 유스케이스
### 6.1 비회원
- 도서 검색/상세/베스트셀러/대출랭킹 조회
- 커뮤니티 목록/상세 보기
- 도서관 지도 탐색

### 6.2 회원
- 북마크 등록/해제
- 커뮤니티 글/댓글 작성, 좋아요
- 팔로우, 칭호/랭킹 확인
- 프로필/비밀번호 관리

### 6.3 관리자
- 도서/게시글/유저 상태 관리
- 트렌드/차단 키워드 관리

### 6.4 시스템
- 검색/행동 로그 자동 적재
- 칭호 자동 지급

## 7. WBS (상세)
1) 기획
- 요구사항 수집, 사용자 페르소나 정의, 기능 우선순위
- 데이터 소스(도서 API/도서관 API/가격 스크래핑) 확정

2) 설계
- DB/ERD 설계 및 테이블/제약 정의
- API 명세 및 인증/권한 정책 설계
- UI 정보 구조/라우팅 설계

3) 개발
- Backend: 인증/회원/도서/도서관/커뮤니티/소셜/칭호/분석 API 구현
- Frontend: 도서/지도/커뮤니티/마이페이지/관리자 UI 구현
- 외부 연동: Data4Library, Aladin/Yes24/Kyobo, Gemini

4) 테스트
- API 통합 테스트, 권한/에러 처리 점검
- UI 동작/상태/반응형 점검

5) 배포/운영
- 빌드/배포 파이프라인 구성
- 운영 환경 설정/모니터링

## 8. 백로그 (우선순위)
### P1
- 회원가입/로그인/프로필 관리
- 도서 검색/상세/가격 비교
- 도서관 대출 조회 + 지도 시각화
- 커뮤니티 게시글/댓글/좋아요

### P2
- 북마크/팔로우 기능
- 랭킹/칭호 지급 및 조회
- AI 요약/챗봇 기능

### P3
- 관리자 도구(도서/사용자/트렌드 관리)
- 차단 키워드/트렌드 분석 고도화

## 9. 릴리즈 계획
- R0 (MVP): 도서 검색/상세/베스트셀러, 도서관 지도, 회원가입/로그인
- R1: 커뮤니티/댓글/좋아요, 북마크, 프로필
- R2: 팔로우/칭호/랭킹, 트렌드 로그/조회
- R3: AI 요약/챗봇, 관리자 트렌드/차단 키워드 관리

## 10. 린 캔버스
- 문제: 책 검색/가격 비교/대출 가능 여부 확인이 분산되어 번거로움
- 고객군: 독서/도서관 이용자, 중고/신간 구매 비교 사용자
- 가치제안: “검색부터 구매·대출·커뮤니티까지 한 번에”
- 해결책: 통합 검색 + 가격 비교 + 대출 지도 + 커뮤니티
- 채널: 커뮤니티 공유, 학교/도서관 제휴, SNS
- 수익: 제휴 링크/광고, 프리미엄 분석(향후)
- 핵심지표: 검색수, 북마크/대출조회 수, 커뮤니티 참여율
- 경쟁우위: 통합 워크플로우 + 로컬 커뮤니티 + 트렌드 분석
