# 04. 디렉토리 및 파일 아키텍처 (Directory Architecture)

## 1. 물리적 폴더 구조 (Tree)
프로젝트 루트 폴더 내부는 반드시 아래의 구조를 엄격하게 유지해야 한다. 임의로 새로운 폴더 깊이(Depth)를 만들거나 파일을 흩뿌리지 마라.

📦 Project_Root
 ┣ 📜 index.html          (진입점: 웹사이트의 뼈대가 되는 유일한 HTML 파일)
 ┣ 📜 .cursorrules        (AI 행동 지침: 00_System_Rules.md의 내용을 담은 숨김 파일)
 ┣ 📂 css
 ┃ ┗ 📜 style.css         (디자인 시스템: 02_Design_System.md가 반영된 스타일시트)
 ┣ 📂 js
 ┃ ┗ 📜 app.js            (렌더링 로직: JSON 데이터를 불러와 HTML에 뿌려주는 바닐라 자바스크립트)
 ┣ 📂 data
 ┃ ┗ 📜 problems.json     (데이터베이스 역할: 03_Data_Structure.md를 따르는 문제 데이터)
 ┗ 📂 assets
   ┣ 📂 icons             (UI에 사용될 SVG 아이콘 등)
   ┗ 📂 images            (문제에 필요한 참고 이미지가 있을 경우 저장하는 곳)

## 2. 파일별 역할 및 제한 사항
- **`index.html`:** 본문 내에 하드코딩된 문제 데이터가 없어야 한다. 오직 빈 컨테이너(`<div id="problem-list"></div>` 등)만 존재하며, 스크립트(`app.js`)를 로드하는 역할만 수행한다.
- **`style.css`:** 모든 시각적 요소는 이 파일 하나에서 통제한다. 유지보수를 위해 변수(`:root`)를 활용하여 컬러 팔레트와 폰트를 최상단에 정의해 두어라.
- **`app.js`:** 페이지가 로드되면 `fetch()` API를 통해 `data/problems.json`을 읽어온 뒤, 각 문제 카드의 HTML 요소를 동적으로 생성(DOM Manipulation)하여 `index.html`에 삽입한다.
- **`problems.json`:** 순수한 데이터 포맷만을 유지하며, 관리자가 텍스트 에디터로 쉽게 수정할 수 있도록 정렬된(formatted) 상태를 유지해라.