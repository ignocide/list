# Nook Core 기능 설계

**날짜:** 2026-04-07  
**범위:** 메모 CRUD + 노트북 관리 (1차 구현)

---

## 1. 구현 범위

- 메모 목록 / 작성 / 수정 / 삭제
- 노트북 생성 / 이름변경 / 삭제
- 미분류 메모 모아보기
- 마지막 노트북 세션 복원

**제외:** 태그, 검색, 파일 첨부, 설정 (2차)

---

## 2. 레이아웃

### 기본 구조
- **2-패널:** 사이드바(노트북 목록) + 메모 목록
- **3-패널:** 메모 선택 시 에디터 패널 추가

### 라우트 구조

```
app/
  layout.tsx                          # 루트 레이아웃 (providers)
  page.tsx                            # / → lastNotebookId로 redirect
  (main)/
    layout.tsx                        # 사이드바 항상 렌더
    notebook/
      [id]/
        layout.tsx                    # 해당 노트북 메모 목록 항상 렌더
        page.tsx                      # 빈 상태: "메모를 선택하세요"
        memo/
          [memoId]/
            page.tsx                  # TipTap 에디터
      unclassified/
        layout.tsx                    # 미분류 메모 목록 항상 렌더
        page.tsx                      # 빈 상태
        memo/
          [memoId]/
            page.tsx                  # TipTap 에디터
```

### URL 예시

| 상황 | URL |
|------|-----|
| 진입 | `/` → redirect |
| 노트북 선택 | `/notebook/abc-123` |
| 메모 열기 | `/notebook/abc-123/memo/def-456` |
| 미분류 | `/notebook/unclassified` |
| 미분류 메모 | `/notebook/unclassified/memo/def-456` |

---

## 3. tRPC API

### notebook 라우터 (`apps/server/src/routers/notebook.router.ts`)

| 프로시저 | 타입 | 입력 | 반환 |
|---------|------|------|------|
| `notebook.list` | query | — | `Notebook[]` |
| `notebook.create` | mutation | `{ name: string, color?: string }` | `Notebook` |
| `notebook.update` | mutation | `{ id: string, name?: string, color?: string }` | `Notebook` |
| `notebook.delete` | mutation | `{ id: string }` | `{ id: string }` |

- 노트북 삭제 시 소속 메모는 `notebook_id = NULL` (DB ON DELETE SET NULL)
- 정렬: `order ASC, created_at ASC`

### memo 라우터 (`apps/server/src/routers/memo.router.ts`)

| 프로시저 | 타입 | 입력 | 반환 |
|---------|------|------|------|
| `memo.list` | query | `{ notebookId: string \| null }` | `Memo[]` |
| `memo.get` | query | `{ id: string }` | `Memo` |
| `memo.create` | mutation | `{ notebookId?: string }` | `Memo` |
| `memo.update` | mutation | `{ id: string, content: string }` | `Memo` |
| `memo.delete` | mutation | `{ id: string }` | `{ id: string }` |

- `memo.list`: `notebookId: null`이면 미분류 (`notebook_id IS NULL`) 조회
- 정렬: `updated_at DESC`
- `memo.create`: content 빈 문자열(`""`)로 생성 후 바로 에디터로 이동

### appRouter 업데이트

```typescript
// apps/server/src/trpc/trpc.router.ts
export function createAppRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    auth: createAuthRouter(supabaseService),
    notebook: createNotebookRouter(supabaseService),
    memo: createMemoRouter(supabaseService),
  });
}
```

---

## 4. 컴포넌트

### 사이드바

| 컴포넌트 | 역할 |
|---------|------|
| `Sidebar` | 노트북 목록, 미분류 링크, + 버튼. `(main)/layout.tsx`에 마운트 |
| `NotebookItem` | 이름, 색상 dot, 활성 상태 표시. 우클릭 시 컨텍스트 메뉴 |
| `NotebookCreateModal` | 이름 + 색상 선택 모달 |
| `NotebookContextMenu` | 이름변경 / 삭제 |

### 메모 목록

| 컴포넌트 | 역할 |
|---------|------|
| `MemoList` | 메모 목록 + 새 메모 버튼. `notebook/[id]/layout.tsx`에 마운트 |
| `MemoItem` | 제목(`extractTitle`), 미리보기(`extractPreview`), 날짜, 활성 상태 |
| `MemoContextMenu` | 삭제 |

### 에디터 패널

| 컴포넌트 | 역할 |
|---------|------|
| `MemoEditor` | TipTap 에디터 래퍼. 자동저장 (debounce 1s) |
| `EditorToolbar` | Bold, Italic, Heading 1-3, BulletList, OrderedList, Code, CodeBlock |
| `SaveIndicator` | "저장 중..." / "저장됨" 상단 우측 표시 |

---

## 5. 에디터

### TipTap 확장 목록
`Document`, `Paragraph`, `Text`, `Bold`, `Italic`, `Heading` (level 1-3), `BulletList`, `OrderedList`, `ListItem`, `Code`, `CodeBlock`, `Placeholder`, `History`

### 저장 포맷
DB `memos.content`에 TipTap JSON 저장:

```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "제목" }] },
    { "type": "paragraph", "content": [{ "type": "text", "text": "내용" }] }
  ]
}
```

### extractTitle / extractPreview 수정
기존 마크다운 파서 → TipTap JSON 파서로 교체:
- `extractTitle`: `doc.content[0]`의 텍스트 노드 추출
- `extractPreview`: 첫 paragraph 텍스트 추출

### 자동저장
- `useEffect` + `setTimeout` debounce 1초
- 저장 중 상태는 `SaveIndicator`로 표시
- 내용 변경 없으면 API 호출 안 함

---

## 6. 세션 복원

`/` 진입 시:
1. `auth.me` 로 `lastNotebookId` 확인
2. 있으면 `/notebook/{lastNotebookId}` redirect
3. 없으면 `/notebook/unclassified` redirect

노트북 전환 시 `auth.updatePreferences({ lastNotebookId })` 호출.

---

## 7. 패키지 추가

### apps/web
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-placeholder`

### apps/server
- 추가 없음 (content는 string으로 저장)
