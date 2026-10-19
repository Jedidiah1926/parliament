# 할 일 (개발 메모)

## 1.6.1 업데이트 전에 할 일

- [x] **원마다 원내대표** (완료) — 양원제 · 삼원제일 때 정당마다 각 원(하원 · 상원 · 삼원)에 원내대표를 따로 둘 수 있게
  - 지금은 정당에 원내대표가 하나뿐 (`p.floorLeaderName` · `p.floorLeaderPhoto`)
  - 정당 › 정보 카드의 원내대표 칸을 그 정당이 참여하는 원마다 하나씩 (단원제면 지금처럼 하나)
  - 예전 세이브의 `floorLeaderName` · `floorLeaderPhoto`는 하원 원내대표로 옮겨 읽기
  - 함께 고칠 곳 (js/main.js): 원내대표 사진 올리기 · 지우기, 의석 연결(`pasteFloorLeaderToSeat` · `writeLinkedSeatInfo`), 의석 통계 카드에 보이는 원내대표 이름(그 원의 원내대표로), 화면 번역용 이름 모으기
  - 1.6.1 사람 탭(js/teaser61.js)의 자리 목록 "○○당 원내대표"도 원마다 (`pf:` 자리 키에 원 붙이기)
  - 영어 번역 (lang/en.js)
