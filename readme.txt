# node.js 설치
https://nodejs.org/ko

# 백엔드 파일구조(Spring Boot) : 도메인 별로 분리.
src/
 ├─ main/
 │   └─ java/com/example/ex02/
 │   		└─ Products/
 │   			└─ controller/
 │   			└─ dto/
 │   			└─ service/
 │   			└─ entity/
 │   			└─ repository/
 │   		└─ User/
 │   			└─ controller/
 │   			└─ dto/
 │   			└─ service/
 │   			└─ entity/
 │   			└─ repository/
 │   		└─ .../
--------------------------------------------------------------------------------------------------------------------------
# 프론트엔드 파일구조 : 리액트 feature-based 구조 활용.
/src
├─ App.jsx             # 전체 앱 엔트리포인트(진입점),App 초기화 코드,로그인(인증) 상태 확인
├─ index.jsx              # 공통 레이아웃(헤더,풋터 등) 모듈화해서 export
├── public/                # 동적 자산
│   ├── agreement
│   ├── image
├── assets/             # 이미지, 폰트 등 정적 자산
│   ├── image
│   ├── font
├── app/                  # 전체 앱 레이아웃 및 라우팅
│   ├── layouts/         # Header, Footer 등 공통 레이아웃
│   └── routes/          # 페이지별 라우터 설정
│         ├── privateRoutes.jsx          # 로그인해야 이동 가능한 페이지
│         ├── privateRoutes.jsx          # 비로그인시에도 이동 가능한 페이지지
├── features/            # 도메인별 페이지, 훅
│   ├── User/
│   │   ├── components/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── pages/
│   ├── Products/
│   └── Cart/
│   └── .../
├── shared/           # 공통 컴포넌트 (도메인 무관)
│   ├── api/        
│   └── components/    # 전역적으로 사용되는 재사용 가능한 UI 컴포넌트 (버튼, 입력창 등)
│   └── pages/error/     # 브라우저 
│   └── services/          # apiService
--------------------------------------------------------------------------------------------------------------------------
# (jdk 17 환경변수 설정 후)백엔드 서버 실행 방법: 7878 port 
cd backend
.\mvnw.cmd spring-boot:run

# 프론트엔드 서버 실행 방법: 3000 port
cd frontend
npm run dev
