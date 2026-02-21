# 데이터 구조 및 렌더링 방식

## 1. 데이터 분리 원칙
- **절대 HTML 파일 내부에 문제/용어 텍스트를 하드코딩하지 말 것.**
- 모든 데이터는 `data/` 폴더 내 JSON 파일로 분리하여 관리.
- JavaScript가 로드될 때 이 데이터를 읽어와서 `02_Design_System.md` 스타일에 맞게 동적으로 DOM에 렌더링하도록 작성할 것.

## 2. 파일 구성
- `data/problems.json`: 문제 목록 (배열)
- `data/turtle-soup.json`: 바다거북스프 설정 + 문제 목록
- `data/boardgame.json`: 웨이트/인원별 추천 보드게임 데이터
- `data/boardgame-terms.json`: 보드게임 용어 정리 목록

## 3. 데이터 스키마 (JSON 형태)
### 3-1. `data/problems.json`
배열의 각 객체는 반드시 아래의 필드 구조를 포함해야 함:
- `id`: 문제 고유 번호 (예: 1, 2, 3...)
- `title`: 문제 제목
- `content`: 문제 본문 (줄바꿈이 렌더링에 반영되어야 함)
- `conditions`: (선택) 제약 조건이나 추가 힌트 배열
- `solvers`: 이 문제를 맞춘 사람들의 닉네임 배열 (예: ["홍길동", "김철수"])

### 3-2. `data/turtle-soup.json`
- `password`: 정답 보기 비밀번호
- `passwordPrompt`: 비밀번호 입력 안내 문구
- `passwordFailMessage`: 실패 메시지
- `answerButtonLabel`: 정답 보기 버튼 라벨
- `answerButtonSuccessLabel`: 정답 공개 후 버튼 라벨
- `answerTitle`: 정답 섹션 타이틀
- `emptyMessage`: 비어 있을 때 표시 문구
- `items`: 문제 목록 배열
  - `id`, `label`, `title`, `content`, `answer`

### 3-3. `data/boardgame.json`
- `emptyMessage`: 전체 데이터가 없을 때 표시 문구
- `groupEmptyMessage`: 그룹에 게임이 없을 때 표시 문구
- `weights`: 웨이트 분류 배열
  - `weight`, `description`, `groups`
  - `groups`: `players`, `games`, `note`

### 3-4. `data/boardgame-terms.json`
- `emptyMessage`: 용어 데이터가 없을 때 표시 문구
- `items`: 용어 배열
  - `term`: 용어 제목
  - `definition`: 용어 설명
  - `example`: (선택) 간단한 예시
  - `tags`: (선택) 분류 태그 배열

## 4. 관리자(운영자) 편의성
- 운영자는 HTML이나 CSS를 만질 필요 없이, 오직 JSON 파일에 새로운 문제 객체를 추가하거나 `solvers` 배열에 이름만 추가하면 웹사이트에 즉시 반영되는 구조여야 함.