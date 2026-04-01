# Nook 기획서 v2 (최종)

---

## 1. 제품 개요

| 항목 | 내용 |
|------|------|
| 제품명 | Nook |
| 콘셉트 | 나만의 아늑한 메모 공간 |
| 타겟 | 일반 소비자 (B2C) |
| 플랫폼 | 웹 (MVP) → 모바일·데스크탑 (v2) |
| 핵심 가치 | 빠른 캡처, 노트북으로 분류, 앱 안에서 완결 |

---

## 2. 기술 스택

| 영역 | 스택 | 비고 |
|------|------|------|
| 언어 | TypeScript | 서버·클라이언트 공통 |
| API 통신 | tRPC + Zod | end-to-end 타입 안전. 입력값 검증 서버·클라이언트 공유 |
| 클라이언트 | Next.js 15 (App Router) | 웹 MVP |
| 서버 | NestJS | REST API → tRPC 미들웨어로 노출 |
| 스타일링 | shadcn/ui + Tailwind CSS | |
| 인증 | Supabase Auth | Google OAuth 단일 지원 |
| DB | Supabase (PostgreSQL) | |
| 파일 저장 | Supabase Storage | 이미지, PDF |
| 모노레포 | Turborepo + pnpm workspace | |
| 클라이언트 배포 | Vercel | |
| 서버 배포 | Railway | |

### 모노레포 구조

```
nook/
├── apps/
│   ├── web/              ← Next.js 15 (MVP)
│   ├── server/           ← NestJS
│   ├── mobile/           ← React Native (v2)
│   └── desktop/          ← Tauri (v2)
├── packages/
│   ├── ui/               ← shadcn 공통 컴포넌트
│   ├── types/            ← 공통 TypeScript 타입
│   ├── trpc/             ← tRPC 라우터 타입 (모든 앱 공유)
│   └── utils/            ← 공통 유틸
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 3. 인증

### Google OAuth 플로우
1. 로그인 페이지 → "Google로 계속하기" 버튼
2. Supabase Auth → Google OAuth 2.0
3. 로그인 성공 → 마지막 상태 복원

### 세션 복원
- 재진입 시 `lastNotebookId` + `lastScrollMemoId` 복원
- 저장 위치: Supabase DB `user_preferences` 테이블
- 저장 시점: 노트북 이동 시 / 스크롤 멈춘 후 300ms (debounce)
- 복원 시점: 메모 목록 렌더링 완료 직후 `scrollIntoView()`

```
앱 진입
  └─ 로그인 여부 확인
       ├─ 비로그인 → /login
       └─ 로그인 → user_preferences 조회
            ├─ lastNotebookId 있음 → 해당 노트북으로 이동
            │    └─ 메모 로딩 완료 → lastScrollMemoId로 scrollIntoView()
            └─ lastNotebookId 없음 → 전체 메모 (최상단)
```

---

## 4. 정보 구조 (IA)

```
앱
├── 전체 메모 (모든 메모 시간순)
├── 노트북 목록
│   ├── 노트북 A
│   │   └── 메모 (텍스트, 태그, 첨부파일)
│   ├── 노트북 B
│   └── 미분류 (노트북 미지정 메모 자동 저장)
└── 태그 뷰
    └── 태그별 메모 필터
```

### 구조 원칙
- 깊이 2단계 고정 (노트북 → 메모). 하위 노트북 없음
- 노트북 미지정 메모 → 자동으로 미분류에 저장
- 미분류는 노트북과 동일한 레벨로 취급
- 노트북 색상 커스텀 가능 (컬러 도트로 구분)

---

## 5. 화면 구조

### 5-1. 모바일 (3뎁스)

#### 1뎁스 — 홈
- 상단: 큰 타이틀 "Nook" + 우상단 검색 아이콘
- 빠른 메모 입력창 (탭하면 포커스, 저장 시 미분류 저장 + 3뎁스 직행)
- 노트북 목록 (색상 아이콘 + 이름 + 메모 개수 + 화살표)
- 미분류 (노트북과 동일 레벨)
- 하단: "노트북 N개" 카운트 + FAB(+) → 노트북 추가

#### 2뎁스 — 노트북 내 메모 목록
- 상단: 뒤로가기("Nook") + 노트북 이름
- 메모 카드 목록 (제목 + 날짜 + 미리보기 한 줄 + 첨부파일 dot 표시)
- 하단: "메모 N개" 카운트 + 작성 버튼(펜 아이콘)

#### 3뎁스 — 메모 상세
- 상단: 뒤로가기 + 더보기(···)
- 노트북 배지 (탭하면 노트북 변경 가능)
- 날짜/시간 자동 표시
- 본문 (편집 가능)
- 태그 섹션 (추가/삭제)
- 첨부파일 그리드 (사진 썸네일 2열, 마지막 칸 항상 추가 버튼)
- 하단 툴바: 태그 추가 / 파일 첨부 / 더보기

#### 빠른 메모 플로우
```
1뎁스 입력창 탭
  → 포커스 + 키보드 올라옴
  → 내용 입력
  → 저장
  → 미분류에 자동 저장
  → 3뎁스(메모 상세) 직행
  → 뒤로가기 → 1뎁스
```

---

### 5-2. 데스크탑 (3패널)

#### 패널 1 — 사이드바 (192px 고정)
- 상단: "Nook" 로고 + 우상단 (+) 노트북 추가 버튼
- 검색창
- 보기 섹션: 전체 메모
- 노트북·미분류 섹션 (동일 레벨, 색상 도트 + 이름 + 개수)
- 태그 섹션

#### 패널 2 — 메모 목록 (가변 너비)
- 상단: 검색창 (현재 노트북 범위)
- 노트북 헤더 (색상 도트 + 이름 + 개수)
- 목록 최상단 고정: "새로운 메모" 항목
    - 클릭하면 선택 상태 + 패널 3이 작성 모드로 전환
    - 타이핑 시작하면 목록 아이템 제목 실시간 반영
- 메모 목록 (날짜 헤더 자동 + 제목 + 미리보기 + 첨부 dot)
- 선택된 메모: 왼쪽 보더 강조

#### 패널 3 — 메모 상세 / 작성 (264px 고정)
- 상단: "메모 상세" or "새 메모" 타이틀 + 편집/삭제/더보기 아이콘
- 노트북 배지 (클릭하면 드롭다운으로 노트북 변경)
- 날짜/시간
- 본문 (편집 가능)
- 태그 섹션
- 첨부파일 그리드
- 하단 툴바: 태그 / 파일 첨부 / PDF 저장 키 힌트(⌘↵)

---

## 6. 핵심 기능 정의

### 6-1. 메모 작성
- 자동 저장 (타이핑 멈춘 후 1초)
- 단축키: `⌘↵` 저장 / `ESC` 취소 (데스크탑)
- 노트북 지정 가능 (미지정 시 미분류)
- 작성 중 노트북 배지 클릭 → 노트북 변경

### 6-2. 메모 목록
- 시간 역순 정렬 (최신이 위)
- 날짜 헤더 자동 생성 (오늘 / 어제 / M월 D일)
- 첨부파일 있으면 dot(•) 표시
- 모바일: 노트북 배지 표시

### 6-3. 노트북
- 생성 / 이름 변경 / 색상 변경 / 삭제
- 삭제 시 메모는 미분류로 이동 (영구 삭제 아님)
- 노트북 간 메모 이동 (배지 탭/클릭 → 드롭다운)

### 6-4. 태그
- 메모에 복수 태그 가능
- 태그 클릭 → 해당 태그 메모 필터 뷰
- 사이드바(데스크탑) / 탭바(모바일)에서 태그 목록 접근

### 6-5. 검색
- 전문 검색 (메모 본문 + 태그)
- 노트북 범위 내 검색 / 전체 검색 전환
- 검색어 하이라이트

### 6-6. 첨부파일
- 지원 형식: 이미지 (jpg, png, webp, heic), PDF
- 이미지: 2열 썸네일 그리드
- PDF: 파일명 + 아이콘
- 저장: Supabase Storage
- 드래그앤드롭 지원 (데스크탑)

---

## 7. DB 스키마 (안)

```sql
-- 사용자
users
  id          uuid PK (Supabase Auth)
  email       text
  created_at  timestamptz

-- 사용자 설정 (상태 복원용)
user_preferences
  user_id             uuid FK → users.id
  last_notebook_id    uuid FK → notebooks.id (nullable)
  last_scroll_memo_id uuid FK → memos.id (nullable)
  updated_at          timestamptz

-- 노트북
notebooks
  id          uuid PK
  user_id     uuid FK → users.id
  name        text
  color       text        -- hex 코드
  is_default  boolean     -- 미분류 여부
  order       int         -- 사이드바 순서
  created_at  timestamptz
  updated_at  timestamptz

-- 메모
memos
  id           uuid PK
  user_id      uuid FK → users.id
  notebook_id  uuid FK → notebooks.id (nullable → 미분류)
  content      text
  created_at   timestamptz
  updated_at   timestamptz

-- 태그
tags
  id       uuid PK
  user_id  uuid FK → users.id
  name     text
  UNIQUE(user_id, name)

-- 메모-태그 연결
memo_tags
  memo_id  uuid FK → memos.id
  tag_id   uuid FK → tags.id
  PRIMARY KEY(memo_id, tag_id)

-- 첨부파일
attachments
  id           uuid PK
  memo_id      uuid FK → memos.id
  user_id      uuid FK → users.id
  file_name    text
  file_type    text        -- image/jpeg, application/pdf 등
  storage_path text        -- Supabase Storage 경로
  size         int         -- bytes
  created_at   timestamptz
```

---

## 8. tRPC 라우터 구조 (안)

```
appRouter
├── auth
│   ├── me               → 현재 유저 정보
│   └── updatePreferences → 마지막 노트북/스크롤 저장
├── notebook
│   ├── list             → 노트북 목록
│   ├── create           → 노트북 생성
│   ├── update           → 이름/색상 변경
│   └── delete           → 삭제 (메모 미분류로 이동)
├── memo
│   ├── list             → 메모 목록 (notebookId 옵션)
│   ├── get              → 메모 단건
│   ├── create           → 메모 생성
│   ├── update           → 내용/노트북 변경
│   └── delete           → 삭제
├── tag
│   ├── list             → 태그 목록
│   ├── create           → 태그 생성
│   └── delete           → 태그 삭제
└── attachment
    ├── upload            → 파일 업로드 URL 발급
    └── delete            → 첨부파일 삭제
```

---

## 9. MVP 범위

### 포함 (1차 출시)
- Google 로그인 / 로그아웃
- 메모 작성 / 편집 / 삭제
- 빠른 메모 (미분류 저장 + 상세 직행)
- 노트북 생성 / 색상 변경 / 삭제
- 미분류 inbox
- 태그 (기본)
- 전문 검색
- 이미지 첨부
- 마지막 위치 상태 복원
- 반응형 (모바일 웹 + 데스크탑)

### 제외 (v2 이후)
- Apple / Kakao 로그인
- PDF 첨부
- 태그 관리 페이지 (병합, 정리)
- 노트북 순서 드래그 변경
- 날짜별 회고 뷰
- PWA 설치
- 공유 기능
- React Native 모바일 앱
- Tauri 데스크탑 앱

---

## 10. 화면 목록

| 화면 | 경로 | 설명 |
|------|------|------|
| 로그인 | `/login` | Google 로그인 버튼 |
| 전체 메모 | `/` | 모든 메모 시간순 |
| 노트북 상세 | `/notebook/[id]` | 노트북 내 메모 목록 |
| 미분류 | `/notebook/unclassified` | 미분류 메모 목록 |
| 메모 상세 | `/memo/[id]` | 메모 상세 (모바일만 별도 페이지, 데스크탑은 패널) |
| 태그 뷰 | `/tag/[name]` | 태그별 메모 필터 |
| 검색 결과 | `/search` | 검색어 기준 메모 목록 |
| 설정 | `/settings` | 프로필, 로그아웃, 계정 삭제 |