# Nook Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turborepo 모노레포 기반으로 NestJS + Next.js + tRPC + Supabase를 연결하고 Google OAuth 로그인/로그아웃이 동작하는 앱 셸을 완성한다.

**Architecture:** NestJS가 tRPC를 Express 어댑터로 노출. Next.js가 tRPC 클라이언트로 소비. Supabase Auth가 JWT를 발급하면 NestJS 미들웨어가 `SUPABASE_JWT_SECRET`으로 직접 검증. 공유 패키지(`@nook/trpc`, `@nook/types`, `@nook/utils`, `@nook/ui`)를 두 앱이 모두 import.

**Tech Stack:** TypeScript 5.8, Turborepo 2, pnpm workspaces, Next.js 15 (App Router), NestJS 10, tRPC v11, TanStack Query v5, Supabase JS v2 (`@supabase/ssr`), Tailwind CSS v4, Zod 3, jsonwebtoken, Vitest (packages), Jest (server)

---

## File Map

```
nook/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx                  ← 루트 레이아웃 + Providers
│   │       │   ├── page.tsx                    ← 홈 플레이스홀더
│   │       │   ├── login/page.tsx              ← Google 로그인 버튼
│   │       │   └── auth/callback/route.ts      ← Supabase OAuth 콜백
│   │       ├── lib/
│   │       │   ├── supabase/client.ts          ← 브라우저 Supabase 클라이언트
│   │       │   └── supabase/server.ts          ← 서버 컴포넌트용 클라이언트
│   │       │   └── trpc.ts                     ← tRPC React 클라이언트
│   │       ├── providers/providers.tsx         ← QueryClient + tRPC Provider
│   │       ├── middleware.ts                   ← 인증 라우트 가드
│   │       └── globals.css
│   └── server/
│       └── src/
│           ├── main.ts                         ← NestJS 부트스트랩 + tRPC 마운트
│           ├── app.module.ts                   ← AppModule
│           ├── index.ts                        ← AppRouter 타입 export
│           ├── auth/jwt.middleware.ts          ← JWT 검증 미들웨어
│           ├── supabase/
│           │   ├── supabase.module.ts
│           │   └── supabase.service.ts         ← Supabase 클라이언트 (service role)
│           ├── trpc/
│           │   ├── trpc.context.ts             ← createContext
│           │   └── trpc.router.ts              ← appRouter 조립
│           └── routers/
│               └── auth.router.ts              ← me, updatePreferences
├── packages/
│   ├── trpc/src/index.ts                       ← initTRPC, procedures
│   ├── types/src/index.ts                      ← 공통 인터페이스
│   ├── utils/src/
│   │   ├── markdown.ts                         ← extractTitle, extractPreview
│   │   ├── date.ts                             ← formatDateHeader
│   │   └── index.ts
│   └── ui/src/index.ts                         ← cn(), 공용 아이콘
└── supabase/migrations/
    ├── 20260402000001_init.sql                 ← 전체 스키마 + RLS
    └── 20260402000002_search_index.sql         ← pg_trgm GIN 인덱스
```

---

## Task 1: 모노레포 스캐폴드

**Files:**
- Create: `turbo.json`
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: 루트 디렉터리 초기화**

```bash
cd nook  # 현재 list/ 디렉터리가 루트
pnpm init -y
```

- [ ] **Step 2: pnpm-workspace.yaml 생성**

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: root package.json 작성**

```json
{
  "name": "nook",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "turbo run format"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.8.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 4: turbo.json 생성**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 5: .gitignore 생성**

```
node_modules/
.next/
dist/
.env
.env.local
.env*.local
*.tsbuildinfo
.turbo/
.superpowers/
coverage/
```

- [ ] **Step 6: .env.example 생성**

```
# apps/web
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# apps/server
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
PORT=3001
WEB_URL=http://localhost:3000
```

- [ ] **Step 7: 디렉터리 구조 생성**

```bash
mkdir -p apps/web apps/server \
  packages/trpc/src packages/types/src \
  packages/utils/src packages/ui/src \
  supabase/migrations
```

- [ ] **Step 8: 루트 의존성 설치**

```bash
pnpm install
```

Expected: `node_modules/` 생성, `.pnpm-lock.yaml` 생성.

- [ ] **Step 9: 커밋**

```bash
git add turbo.json pnpm-workspace.yaml package.json .gitignore .env.example apps/ packages/ supabase/
git commit -m "chore: initialize turborepo monorepo scaffold"
```

---

## Task 2: packages/utils — markdown, date 유틸

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/tsconfig.json`
- Create: `packages/utils/src/markdown.ts`
- Create: `packages/utils/src/date.ts`
- Create: `packages/utils/src/index.ts`
- Test: `packages/utils/src/markdown.test.ts`
- Test: `packages/utils/src/date.test.ts`

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "@nook/utils",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: markdown 실패 테스트 작성**

`packages/utils/src/markdown.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { extractTitle, extractPreview } from './markdown';

describe('extractTitle', () => {
  it('첫 번째 줄을 제목으로 반환한다', () => {
    expect(extractTitle('오늘 할 일\n- 장보기\n- 운동')).toBe('오늘 할 일');
  });

  it('마크다운 헤딩 기호를 제거한다', () => {
    expect(extractTitle('# 제목\n본문')).toBe('제목');
    expect(extractTitle('## 소제목\n본문')).toBe('소제목');
  });

  it('빈 content에 빈 문자열을 반환한다', () => {
    expect(extractTitle('')).toBe('');
  });

  it('줄이 하나뿐일 때 그 줄을 반환한다', () => {
    expect(extractTitle('단일 줄')).toBe('단일 줄');
  });
});

describe('extractPreview', () => {
  it('두 번째 줄부터 미리보기를 반환한다', () => {
    expect(extractPreview('제목\n미리보기 내용')).toBe('미리보기 내용');
  });

  it('80자를 초과하면 잘라낸다', () => {
    const preview = extractPreview('제목\n' + 'a'.repeat(100));
    expect(preview.length).toBeLessThanOrEqual(81); // 80자 + '…'
  });

  it('두 번째 줄이 없으면 빈 문자열을 반환한다', () => {
    expect(extractPreview('제목만')).toBe('');
  });
});
```

- [ ] **Step 4: 테스트 실패 확인**

```bash
cd packages/utils && pnpm install && pnpm test
```

Expected: FAIL — `Cannot find module './markdown'`

- [ ] **Step 5: markdown.ts 구현**

`packages/utils/src/markdown.ts`:

```typescript
export function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0] ?? '';
  return firstLine.replace(/^#+\s*/, '').trim();
}

export function extractPreview(content: string): string {
  const lines = content.split('\n');
  const rest = lines.slice(1).join(' ').trim();
  if (!rest) return '';
  return rest.length > 80 ? rest.slice(0, 80) + '…' : rest;
}
```

- [ ] **Step 6: date 실패 테스트 작성**

`packages/utils/src/date.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDateHeader } from './date';

describe('formatDateHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('"오늘"을 반환한다', () => {
    expect(formatDateHeader(new Date('2026-04-02T09:00:00'))).toBe('오늘');
  });

  it('"어제"를 반환한다', () => {
    expect(formatDateHeader(new Date('2026-04-01T09:00:00'))).toBe('어제');
  });

  it('더 오래된 날짜는 "M월 D일" 형식을 반환한다', () => {
    expect(formatDateHeader(new Date('2026-03-15'))).toBe('3월 15일');
  });
});
```

- [ ] **Step 7: date.ts 구현**

`packages/utils/src/date.ts`:

```typescript
export function formatDateHeader(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
```

- [ ] **Step 8: index.ts 생성**

`packages/utils/src/index.ts`:

```typescript
export { extractTitle, extractPreview } from './markdown';
export { formatDateHeader } from './date';
```

- [ ] **Step 9: 테스트 통과 확인**

```bash
pnpm test
```

Expected: PASS — 7 tests passing.

- [ ] **Step 10: 커밋**

```bash
cd ../.. && git add packages/utils
git commit -m "feat(utils): add extractTitle, extractPreview, formatDateHeader"
```

---

## Task 3: packages/types — 공통 TypeScript 인터페이스

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "@nook/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "devDependencies": {
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: index.ts 생성**

`packages/types/src/index.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  lastNotebookId: string | null;
  lastScrollMemoId: string | null;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  userId: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Memo {
  id: string;
  userId: string;
  notebookId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
}

export interface Attachment {
  id: string;
  memoId: string;
  userId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  size: number;
  createdAt: string;
}
```

- [ ] **Step 4: 의존성 설치 + 커밋**

```bash
cd packages/types && pnpm install
cd ../.. && git add packages/types
git commit -m "feat(types): add shared TypeScript interfaces"
```

---

## Task 4: packages/trpc — tRPC 초기화

**Files:**
- Create: `packages/trpc/package.json`
- Create: `packages/trpc/tsconfig.json`
- Create: `packages/trpc/src/index.ts`

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "@nook/trpc",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@trpc/server": "^11.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: index.ts 생성**

`packages/trpc/src/index.ts`:

```typescript
import { initTRPC, TRPCError } from '@trpc/server';

export interface TRPCContext {
  user: { sub: string; email: string } | null;
}

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/** 인증이 필요한 프로시저. 미인증 시 UNAUTHORIZED 에러를 던진다. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});

export { TRPCError };
```

- [ ] **Step 4: 의존성 설치 + 커밋**

```bash
cd packages/trpc && pnpm install
cd ../.. && git add packages/trpc
git commit -m "feat(trpc): add initTRPC with public and protected procedures"
```

---

## Task 5: packages/ui — 공용 UI 패키지

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "@nook/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.1.0",
    "lucide-react": "^0.487.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "typescript": "^5.8.0"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: index.ts 생성**

`packages/ui/src/index.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {
  Plus,
  Search,
  ChevronRight,
  MoreHorizontal,
  Tag,
  Paperclip,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Check,
  Notebook,
} from 'lucide-react';
```

- [ ] **Step 4: 의존성 설치 + 커밋**

```bash
cd packages/ui && pnpm install
cd ../.. && git add packages/ui
git commit -m "feat(ui): add shared UI package with cn() and icon exports"
```

---

## Task 6: Supabase DB 마이그레이션

**Files:**
- Create: `supabase/migrations/20260402000001_init.sql`
- Create: `supabase/migrations/20260402000002_search_index.sql`

Prerequisites: `brew install supabase/tap/supabase`, Supabase 프로젝트 생성 완료.

- [ ] **Step 1: init 마이그레이션 작성**

`supabase/migrations/20260402000001_init.sql`:

```sql
-- users (Supabase Auth 트리거로 동기화)
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- user_preferences (세션 복원용)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id             uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_notebook_id    uuid,
  last_scroll_memo_id uuid,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- notebooks (notebook_id = null 인 메모가 미분류 → is_default 컬럼 불필요)
CREATE TABLE IF NOT EXISTS notebooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#868e96',
  "order"     int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- memos (title 컬럼 없음 — content 첫 줄 파싱)
CREATE TABLE IF NOT EXISTS memos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notebook_id  uuid REFERENCES notebooks(id) ON DELETE SET NULL,
  content      text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- tags
CREATE TABLE IF NOT EXISTS tags (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name     text NOT NULL,
  UNIQUE(user_id, name)
);

-- memo_tags
CREATE TABLE IF NOT EXISTS memo_tags (
  memo_id  uuid NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(memo_id, tag_id)
);

-- attachments
CREATE TABLE IF NOT EXISTS attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id      uuid NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_type    text NOT NULL,
  storage_path text NOT NULL,
  size         int NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (NestJS는 service role key로 RLS 우회; 클라이언트 직접 접근 차단용)
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "preferences_own" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notebooks_own" ON notebooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "memos_own" ON memos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "tags_own" ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "memo_tags_own" ON memo_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM memos WHERE id = memo_id AND user_id = auth.uid()));
CREATE POLICY "attachments_own" ON attachments FOR ALL USING (auth.uid() = user_id);
```

- [ ] **Step 2: pg_trgm 인덱스 마이그레이션 작성**

`supabase/migrations/20260402000002_search_index.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS memos_content_trgm_idx
  ON memos USING GIN (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS tags_name_trgm_idx
  ON tags USING GIN (name gin_trgm_ops);
```

- [ ] **Step 3: 마이그레이션 적용**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Expected:
```
Applying migration 20260402000001_init.sql... done
Applying migration 20260402000002_search_index.sql... done
```

- [ ] **Step 4: Supabase 대시보드에서 테이블 확인**

Supabase > Table Editor에서 `users`, `user_preferences`, `notebooks`, `memos`, `tags`, `memo_tags`, `attachments` 7개 테이블이 보여야 한다.

- [ ] **Step 5: 커밋**

```bash
git add supabase/
git commit -m "feat(db): add initial schema migrations with RLS and pg_trgm index"
```

---

## Task 7: NestJS 앱 부트스트랩 + SupabaseService

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/tsconfig.build.json`
- Create: `apps/server/nest-cli.json`
- Create: `apps/server/src/supabase/supabase.service.ts`
- Create: `apps/server/src/supabase/supabase.module.ts`
- Create: `apps/server/src/app.module.ts`
- Create: `apps/server/src/main.ts`
- Create: `apps/server/src/index.ts`

- [ ] **Step 1: package.json 생성**

`apps/server/package.json`:

```json
{
  "name": "@nook/server",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "dev": "nest start --watch",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch"
  },
  "exports": {
    ".": {
      "types": "./src/index.ts"
    }
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@supabase/supabase-js": "^2.49.0",
    "@trpc/server": "^11.0.0",
    "@nook/trpc": "workspace:*",
    "@nook/types": "workspace:*",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.24.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "@nestjs/testing": "^10.4.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^22.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "typescript": "^5.8.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "moduleNameMapper": {
      "^@nook/trpc$": "<rootDir>/../../packages/trpc/src/index.ts",
      "^@nook/types$": "<rootDir>/../../packages/types/src/index.ts"
    },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

`apps/server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@nook/trpc": ["../../packages/trpc/src/index.ts"],
      "@nook/types": ["../../packages/types/src/index.ts"]
    }
  }
}
```

- [ ] **Step 3: tsconfig.build.json, nest-cli.json 생성**

`apps/server/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

`apps/server/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [ ] **Step 4: SupabaseService 작성**

`apps/server/src/supabase/supabase.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
}
```

`apps/server/src/supabase/supabase.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

- [ ] **Step 5: AppModule 작성 (JwtMiddleware는 Task 8 이후 추가)**

`apps/server/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
})
export class AppModule {}
```

- [ ] **Step 6: main.ts 작성 (tRPC는 Task 9에서 마운트)**

`apps/server/src/main.ts`:

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
  });
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Server running on port ${process.env.PORT ?? 3001}`);
}

bootstrap();
```

- [ ] **Step 7: AppRouter 타입 export 파일 작성**

`apps/server/src/index.ts`:

```typescript
// 타입 전용 export — web 앱이 tRPC 클라이언트 타입 추론에 사용
export type { AppRouter } from './trpc/trpc.router';
```

- [ ] **Step 8: 의존성 설치 + 서버 기동 확인**

```bash
cd apps/server && pnpm install
cp ../../.env.example .env
# .env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET 채우기
pnpm dev
```

Expected: `Server running on port 3001` 출력, 오류 없음.

- [ ] **Step 9: 커밋**

```bash
cd ../.. && git add apps/server
git commit -m "feat(server): bootstrap NestJS with SupabaseService"
```

---

## Task 8: NestJS JWT 미들웨어

**Files:**
- Create: `apps/server/src/auth/jwt.middleware.ts`
- Test: `apps/server/src/auth/jwt.middleware.spec.ts`

- [ ] **Step 1: 실패 테스트 작성**

`apps/server/src/auth/jwt.middleware.spec.ts`:

```typescript
import { JwtMiddleware } from './jwt.middleware';
import * as jwt from 'jsonwebtoken';

const SECRET = 'test-secret';

describe('JwtMiddleware', () => {
  let middleware: JwtMiddleware;
  const mockNext = jest.fn();

  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
    middleware = new JwtMiddleware();
    mockNext.mockClear();
  });

  it('유효한 토큰이면 user를 req에 붙인다', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'test@test.com' }, SECRET);
    const req: any = { headers: { authorization: `Bearer ${token}` } };

    middleware.use(req, {} as any, mockNext);

    expect(req.user).toMatchObject({ sub: 'user-1', email: 'test@test.com' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('유효하지 않은 토큰이면 user를 null로 설정한다', () => {
    const req: any = { headers: { authorization: 'Bearer invalid.token.here' } };

    middleware.use(req, {} as any, mockNext);

    expect(req.user).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });

  it('Authorization 헤더가 없으면 user를 null로 설정한다', () => {
    const req: any = { headers: {} };

    middleware.use(req, {} as any, mockNext);

    expect(req.user).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/server && pnpm test
```

Expected: FAIL — `Cannot find module './jwt.middleware'`

- [ ] **Step 3: JwtMiddleware 구현**

`apps/server/src/auth/jwt.middleware.ts`:

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
        (req as any).user = decoded as { sub: string; email: string };
      } catch {
        (req as any).user = null;
      }
    } else {
      (req as any).user = null;
    }

    next();
  }
}
```

- [ ] **Step 4: AppModule에 미들웨어 등록**

`apps/server/src/app.module.ts` 업데이트:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { JwtMiddleware } from './auth/jwt.middleware';

@Module({
  imports: [SupabaseModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd apps/server && pnpm test
```

Expected: PASS — 3 tests passing.

- [ ] **Step 6: 커밋**

```bash
cd ../.. && git add apps/server/src/auth apps/server/src/app.module.ts
git commit -m "feat(server): add JWT verification middleware"
```

---

## Task 9: NestJS auth 라우터

**Files:**
- Create: `apps/server/src/routers/auth.router.ts`
- Test: `apps/server/src/routers/auth.router.spec.ts`

- [ ] **Step 1: 실패 테스트 작성**

`apps/server/src/routers/auth.router.spec.ts`:

```typescript
import { createTRPCRouter } from '@nook/trpc';
import { createAuthRouter } from './auth.router';

// Supabase 클라이언트 모킹
function makeMockSupabase(overrides: Record<string, any> = {}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
  return { client: { from: jest.fn().mockReturnValue(chain), ...chain } };
}

function makeTestRouter(mockSupabase: any) {
  return createTRPCRouter({ auth: createAuthRouter(mockSupabase as any) });
}

describe('auth.me', () => {
  it('인증된 유저의 정보를 반환한다', async () => {
    const mock = makeMockSupabase();
    mock.client.from('users').single.mockResolvedValueOnce({
      data: { id: 'user-1', email: 'a@b.com', created_at: '2026-01-01' },
      error: null,
    });

    const caller = makeTestRouter(mock).createCaller({
      user: { sub: 'user-1', email: 'a@b.com' },
    });

    const result = await caller.auth.me();
    expect(result).toEqual({ id: 'user-1', email: 'a@b.com', createdAt: '2026-01-01' });
  });

  it('user가 null이면 UNAUTHORIZED를 던진다', async () => {
    const caller = makeTestRouter(makeMockSupabase()).createCaller({ user: null });
    await expect(caller.auth.me()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('auth.updatePreferences', () => {
  it('lastNotebookId와 lastScrollMemoId를 upsert한다', async () => {
    const mock = makeMockSupabase();

    const caller = makeTestRouter(mock).createCaller({
      user: { sub: 'user-1', email: 'a@b.com' },
    });

    const result = await caller.auth.updatePreferences({
      lastNotebookId: 'nb-1',
      lastScrollMemoId: 'memo-1',
    });

    expect(result).toEqual({ success: true });
    expect(mock.client.from).toHaveBeenCalledWith('user_preferences');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/server && pnpm test routers/auth.router.spec.ts
```

Expected: FAIL — `Cannot find module './auth.router'`

- [ ] **Step 3: auth.router.ts 구현**

`apps/server/src/routers/auth.router.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, TRPCError } from '@nook/trpc';
import { SupabaseService } from '../supabase/supabase.service';

export function createAuthRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    me: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await supabaseService.client
        .from('users')
        .select('id, email, created_at')
        .eq('id', ctx.user.sub)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return {
        id: data.id as string,
        email: data.email as string,
        createdAt: data.created_at as string,
      };
    }),

    updatePreferences: protectedProcedure
      .input(
        z.object({
          lastNotebookId: z.string().uuid().nullable().optional(),
          lastScrollMemoId: z.string().uuid().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseService.client
          .from('user_preferences')
          .upsert({
            user_id: ctx.user.sub,
            last_notebook_id: input.lastNotebookId ?? null,
            last_scroll_memo_id: input.lastScrollMemoId ?? null,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }

        return { success: true };
      }),
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/server && pnpm test
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: 커밋**

```bash
cd ../.. && git add apps/server/src/routers
git commit -m "feat(server): add auth tRPC router (me, updatePreferences)"
```

---

## Task 10: tRPC 라우터 조립 + NestJS에 마운트

**Files:**
- Create: `apps/server/src/trpc/trpc.context.ts`
- Create: `apps/server/src/trpc/trpc.router.ts`
- Modify: `apps/server/src/main.ts`

- [ ] **Step 1: createContext 작성**

`apps/server/src/trpc/trpc.context.ts`:

```typescript
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export function createContext({ req }: CreateExpressContextOptions) {
  return {
    user: (req as any).user as { sub: string; email: string } | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

- [ ] **Step 2: appRouter 조립**

`apps/server/src/trpc/trpc.router.ts`:

```typescript
import { createTRPCRouter } from '@nook/trpc';
import { SupabaseService } from '../supabase/supabase.service';
import { createAuthRouter } from '../routers/auth.router';

export function createAppRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    auth: createAuthRouter(supabaseService),
  });
}

// 타입 추론용 — 런타임에 사용되지 않음
export type AppRouter = ReturnType<typeof createAppRouter>;
```

- [ ] **Step 3: main.ts에 tRPC 마운트**

`apps/server/src/main.ts` 전체 교체:

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createAppRouter } from './trpc/trpc.router';
import { createContext } from './trpc/trpc.context';
import { SupabaseService } from './supabase/supabase.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
  });

  const supabaseService = app.get(SupabaseService);
  const appRouter = createAppRouter(supabaseService);

  app.use(
    '/trpc',
    createExpressMiddleware({ router: appRouter, createContext }),
  );

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Server running on port ${process.env.PORT ?? 3001}`);
}

bootstrap();
```

- [ ] **Step 4: 서버 기동 + tRPC 엔드포인트 확인**

```bash
cd apps/server && pnpm dev
```

새 터미널에서:

```bash
curl http://localhost:3001/trpc/auth.me \
  -H "Authorization: Bearer invalid-token"
```

Expected:
```json
{"error":{"message":"UNAUTHORIZED","code":-32001,"data":{"code":"UNAUTHORIZED","httpStatus":401}}}
```

- [ ] **Step 5: 커밋**

```bash
cd ../.. && git add apps/server/src/trpc apps/server/src/main.ts
git commit -m "feat(server): assemble appRouter and mount tRPC on /trpc"
```

---

## Task 11: Next.js 앱 부트스트랩 + Supabase 클라이언트

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: package.json 생성**

`apps/web/package.json`:

```json
{
  "name": "@nook/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev --port 3000",
    "start": "next start"
  },
  "dependencies": {
    "@nook/server": "workspace:*",
    "@nook/trpc": "workspace:*",
    "@nook/types": "workspace:*",
    "@nook/utils": "workspace:*",
    "@nook/ui": "workspace:*",
    "@supabase/ssr": "^0.6.0",
    "@supabase/supabase-js": "^2.49.0",
    "@tanstack/react-query": "^5.72.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

`apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@nook/server": ["../server/src/index.ts"],
      "@nook/trpc": ["../../packages/trpc/src/index.ts"],
      "@nook/types": ["../../packages/types/src/index.ts"],
      "@nook/utils": ["../../packages/utils/src/index.ts"],
      "@nook/ui": ["../../packages/ui/src/index.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: next.config.ts 생성**

`apps/web/next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@nook/trpc',
    '@nook/types',
    '@nook/utils',
    '@nook/ui',
    '@nook/server',
  ],
};

export default nextConfig;
```

- [ ] **Step 4: Supabase 브라우저 클라이언트 작성**

`apps/web/src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 5: Supabase 서버 클라이언트 작성**

`apps/web/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 set은 무시 가능
          }
        },
      },
    },
  );
}
```

- [ ] **Step 6: globals.css + root layout 생성**

`apps/web/src/app/globals.css`:

```css
@import "tailwindcss";
```

`apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nook',
  description: '나만의 아늑한 메모 공간',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: postcss.config.mjs 생성 (Tailwind v4 필수)**

`apps/web/postcss.config.mjs`:

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 8: 의존성 설치**

```bash
cd apps/web && pnpm install
```

- [ ] **Step 9: 커밋**

```bash
cd ../.. && git add apps/web
git commit -m "feat(web): bootstrap Next.js app with Supabase clients"
```

---

## Task 12: Next.js 인증 미들웨어 + OAuth 콜백

**Files:**
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/app/auth/callback/route.ts`

- [ ] **Step 1: 인증 미들웨어 작성**

`apps/web/src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath =
    pathname.startsWith('/login') || pathname.startsWith('/auth/');

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 2: OAuth 콜백 라우트 작성**

`apps/web/src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
```

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/middleware.ts apps/web/src/app/auth
git commit -m "feat(web): add auth middleware and OAuth callback route"
```

---

## Task 13: tRPC 클라이언트 + 프로바이더 + 로그인 페이지

**Files:**
- Create: `apps/web/src/lib/trpc.ts`
- Create: `apps/web/src/providers/providers.tsx`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: tRPC 클라이언트 작성**

`apps/web/src/lib/trpc.ts`:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@nook/server';
import { createClient } from './supabase/client';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClientConfig() {
  return {
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc`,
        async headers() {
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  };
}
```

- [ ] **Step 2: Providers 작성**

`apps/web/src/providers/providers.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClientConfig } from '@/lib/trpc';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000 } },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient(createTRPCClientConfig()),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

- [ ] **Step 3: root layout에 Providers 추가**

`apps/web/src/app/layout.tsx` 전체 교체:

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/providers';

export const metadata: Metadata = {
  title: 'Nook',
  description: '나만의 아늑한 메모 공간',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 로그인 페이지 작성**

`apps/web/src/app/login/page.tsx`:

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">Nook</h1>
        <p className="text-gray-500 mb-8 text-sm">나만의 아늑한 메모 공간</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 홈 플레이스홀더 페이지 작성**

`apps/web/src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Nook</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Core 플랜에서 메모 기능이 추가됩니다.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Supabase 대시보드에서 Google OAuth 설정**

1. Supabase > Authentication > Providers > Google 활성화
2. Google Cloud Console에서 OAuth 2.0 클라이언트 생성
3. 승인된 리디렉션 URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Client ID / Client Secret을 Supabase에 입력

- [ ] **Step 7: 커밋**

```bash
git add apps/web/src
git commit -m "feat(web): add tRPC client, providers, login page, home placeholder"
```

---

## Task 14: Foundation 통합 연기 확인

- [ ] **Step 1: 전체 테스트 실행 (모노레포 루트에서)**

```bash
pnpm test
```

Expected: All tests pass — jwt.middleware (3), auth.router (3), utils (7).

- [ ] **Step 2: 서버 기동**

터미널 1:
```bash
cd apps/server && pnpm dev
```

Expected: `Server running on port 3001`

- [ ] **Step 3: 웹 기동**

터미널 2:
```bash
cd apps/web && pnpm dev
```

Expected: `Local: http://localhost:3000`

- [ ] **Step 4: 인증 흐름 확인**

1. http://localhost:3000 접속 → `/login`으로 리디렉트
2. "Google로 계속하기" 클릭 → Google OAuth 진행
3. 완료 후 `/` 리디렉트 → "Nook — Core 플랜에서 메모 기능이 추가됩니다." 표시

- [ ] **Step 5: tRPC 연결 확인**

로그인한 상태에서 브라우저 콘솔:

```javascript
// 로그인 세션 토큰 확인
const { data } = await (await import('@/lib/supabase/client')).createClient().auth.getSession()
console.log('token:', data.session?.access_token?.slice(0, 20) + '...')

// curl로 auth.me 호출
// (터미널에서 실제 토큰으로 교체)
curl http://localhost:3001/trpc/auth.me \
  -H "Authorization: Bearer <access_token>"
```

Expected: `{"result":{"data":{"id":"...","email":"...","createdAt":"..."}}}`

- [ ] **Step 6: 최종 커밋**

```bash
git add .
git commit -m "feat: Foundation complete — monorepo, NestJS+tRPC, Next.js, Supabase Auth connected"
```

---

## 다음 단계

Foundation 완료 후 **Core 플랜**을 작성합니다. Core 플랜 범위:

- NestJS: notebook, memo, tag, attachment 라우터
- Next.js: 3패널 데스크탑 + 3뎁스 모바일 레이아웃
- 마크다운 에디터 + 자동저장 (1초 debounce)
- 노트북 생성/수정/삭제 UI
