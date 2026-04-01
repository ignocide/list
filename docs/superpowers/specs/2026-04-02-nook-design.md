# Nook 디자인 문서

**날짜:** 2026-04-02
**버전:** MVP (웹)
**스택:** Next.js 15 + NestJS + tRPC + Supabase + Turborepo

---

## 1. 제품 개요

| 항목 | 내용 |
|------|------|
| 제품명 | Nook |
| 콘셉트 | 나만의 아늑한 메모 공간 |
| 타겟 | 일반 소비자 (B2C) |
| 플랫폼 | 웹 MVP → 모바일·데스크탑 (v2) |
| 핵심 가치 | 빠른 캡처, 노트북으로 분류, 앱 안에서 완결 |

---

## 2. 아키텍처

### 모노레포 구조 (Turborepo + pnpm workspace)

```
nook/
├── apps/
│   ├── web/        ← Next.js 15 App Router (Vercel 배포)
│   └── server/     ← NestJS (Railway 배포)
├── packages/
│   ├── trpc/       ← AppRouter 타입 정의 (web + server 공유)
│   ├── types/      ← 공통 TypeScript 타입
│   ├── ui/         ← shadcn 공통 컴포넌트
│   └── utils/      ← markdown 파싱, 날짜 포맷 등
├── turbo.json
└── pnpm-workspace.yaml
```

### 요청 흐름

```
Next.js (tRPC Client)
  → NestJS (tRPC HTTP Adapter)
    → Supabase (PostgreSQL + Storage)
```

- **인증**: Supabase Auth가 JWT 발급 → NestJS에서 `SUPABASE_JWT_SECRET`으로 직접 검증 (DB 조회 없음)
- **tRPC 라우터 타입**: `packages/trpc`에서 export → web(클라이언트)과 server(구현) 모두 import
- **DB 접근**: NestJS에서 Supabase JS 클라이언트 (service role key) 사용

### 환경변수

**web (`.env.local`)**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SERVER_URL
```

**server (`.env`)**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
PORT
```

---

## 3. 데이터 레이어

### DB 스키마

```sql
-- 사용자
users
  id          uuid PK  (Supabase Auth)
  email       text
  created_at  timestamptz

-- 사용자 설정 (세션 복원용)
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
  order       int
  created_at  timestamptz
  updated_at  timestamptz

-- 메모 (title 컬럼 없음 — content 첫 줄을 제목으로 사용)
-- notebook_id = null → 미분류 (별도 is_default 컬럼 불필요)
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
  file_type    text        -- image/jpeg 등
  storage_path text        -- Supabase Storage 경로
  size         int         -- bytes
  created_at   timestamptz
```

### 검색 인덱스 (pg_trgm)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX memos_content_trgm_idx
  ON memos USING GIN (content gin_trgm_ops);

CREATE INDEX tags_name_trgm_idx
  ON tags USING GIN (name gin_trgm_ops);
```

### tRPC 라우터

```
appRouter
├── auth
│   ├── me                  → 현재 유저 정보
│   └── updatePreferences   → lastNotebookId / lastScrollMemoId 저장
├── notebook
│   ├── list / create / update / delete
├── memo
│   ├── list                → notebookId?, tagId?, cursor (무한스크롤)
│   ├── get / create / update / delete
│   └── search              → query, notebookId? (pg_trgm)
├── tag
│   └── list / upsert / delete
└── attachment
    ├── getUploadUrl        → Supabase Storage signed URL 발급
    └── delete
```

### 클라이언트 상태 관리

- **서버 상태**: tRPC + TanStack Query (캐싱, 낙관적 업데이트)
- **UI 상태**: React 로컬 state (선택된 메모, 패널 상태 등) — Zustand 불필요

---

## 4. UI 구조

### 반응형 전략

| 뷰포트 | 레이아웃 |
|--------|----------|
| ≥ 768px | 3패널 (사이드바 192px 고정 / 목록 가변 / 상세 264px 고정) |
| < 768px | 3뎁스 네비게이션 (홈 → 메모 목록 → 상세) |

### 라우팅

| 화면 | 경로 | 비고 |
|------|------|------|
| 로그인 | `/login` | |
| 전체 메모 | `/` | |
| 노트북 상세 | `/notebook/[id]` | |
| 미분류 | `/notebook/unclassified` | |
| 메모 상세 | `/memo/[id]` | 모바일 전용 (데스크탑은 패널 3) |
| 태그 뷰 | `/tag/[name]` | |
| 검색 결과 | `/search` | |
| 설정 | `/settings` | |

### 정보 구조

```
앱
├── 전체 메모 (모든 메모 시간순)
├── 노트북 목록
│   ├── 노트북 A
│   ├── 노트북 B
│   └── 미분류 (notebook_id = null 메모)
└── 태그 뷰
```

- 깊이 2단계 고정 (노트북 → 메모), 하위 노트북 없음
- 미분류는 노트북과 동일 레벨로 취급

---

## 5. 핵심 기능 구현

### 인증

1. `/login` → "Google로 계속하기" 버튼
2. Supabase Auth → Google OAuth 2.0 → JWT 발급
3. Next.js: Supabase 클라이언트로 세션 유지 (쿠키)
4. NestJS: 모든 tRPC 요청에서 `Authorization` 헤더 JWT 검증 (`SUPABASE_JWT_SECRET`으로 직접 verify)
5. 로그인 성공 → `user_preferences` 조회 → 마지막 위치 복원

### 마크다운 에디터

- **편집**: raw 마크다운 입력 (`@uiw/react-md-editor` 또는 `react-simplemde-editor`)
- **뷰**: `react-markdown`으로 렌더링
- **제목 추출**: `content.split('\n')[0].replace(/^#+\s*/, '')` — 클라이언트 파싱
- **미리보기**: 두 번째 줄부터 80자 truncate

### 자동저장

- 타이핑 후 **1초 debounce** → `memo.update` mutation
- TanStack Query 캐시 낙관적 업데이트
- 저장 상태 표시: "저장 중…" / "저장됨"

### 세션 복원

```
앱 진입
  └─ 로그인 여부 확인
       ├─ 비로그인 → /login
       └─ 로그인 → user_preferences 조회
            ├─ lastNotebookId 있음 → 해당 노트북으로 이동
            │    └─ 메모 로딩 완료 → lastScrollMemoId로 scrollIntoView()
            └─ lastNotebookId 없음 → 전체 메모 (최상단)
```

- 노트북 이동 시 즉시 저장
- 스크롤 멈춤 후 **300ms debounce** → `auth.updatePreferences`

### 검색 (pg_trgm)

```sql
SELECT m.* FROM memos m
LEFT JOIN memo_tags mt ON m.id = mt.memo_id
LEFT JOIN tags t ON mt.tag_id = t.id
WHERE m.user_id = $userId
  AND (m.content % $query OR t.name % $query)
  AND ($notebookId IS NULL OR m.notebook_id = $notebookId)
ORDER BY similarity(m.content, $query) DESC
```

- 검색어 하이라이트: 클라이언트에서 `mark` 태그로 처리
- 노트북 범위 내 검색 / 전체 검색 전환 가능

### 이미지 첨부

1. 클라이언트 → `attachment.getUploadUrl` → Supabase Storage signed URL 발급
2. 클라이언트 → signed URL로 직접 PUT 업로드 (NestJS 거치지 않음)
3. 업로드 완료 → `attachments` 행 INSERT
4. 표시: 2열 썸네일 그리드, 마지막 칸 항상 추가 버튼
5. 지원 형식: jpg, png, webp, heic (PDF는 v2)

### 노트북

- 생성 / 이름 변경 / 색상 변경 (hex) / 삭제
- 삭제 시 소속 메모는 미분류로 이동 (영구 삭제 아님)
- 노트북 간 메모 이동: 배지 탭/클릭 → 드롭다운

---

## 6. MVP 범위

### 포함 (1차 출시)

- Google 로그인 / 로그아웃
- 메모 작성 / 편집 (마크다운) / 삭제
- 빠른 메모 (미분류 저장 + 상세 직행)
- 노트북 생성 / 색상 변경 / 삭제
- 미분류 inbox
- 태그 (기본)
- 전문 검색 (pg_trgm)
- 이미지 첨부
- 마지막 위치 세션 복원
- 반응형 (모바일 웹 + 데스크탑 3패널)

### 제외 (v2 이후)

- Apple / Kakao 로그인
- PDF 첨부
- 태그 관리 페이지
- 노트북 순서 드래그 변경
- PWA, 공유, React Native, Tauri

---

## 7. 배포

| 서비스 | 플랫폼 | 비고 |
|--------|--------|------|
| web (Next.js) | Vercel | |
| server (NestJS) | Railway | |
| DB + Auth + Storage | Supabase | |
