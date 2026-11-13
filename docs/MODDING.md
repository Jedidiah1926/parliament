# Hemicycle 모딩 — 스크립트 모드

**코드 없이 JSON 파일 하나로** 게임에 이벤트 · 결정 · 국가 변수를 더합니다.
모드는 게임이 정한 형식만 쓰므로 창작마당에 올려도 안전하고, 게임이 업데이트돼도 잘 깨지지 않습니다.

- **이벤트** — 날짜를 넘길 때(또는 총선 결과를 의회에 반영할 때) 조건이 맞으면 창이 뜨고, 고른 선택지의 효과가 일어납니다.
- **결정** — 국가 › 결정 탭에 버튼으로 나옵니다. 보이는 조건 · 쓸 수 있는 조건 · 한 번만 / 다시 쓰기까지 기다릴 날 수를 정합니다.
- **국가 변수 · 플래그** — 모드마다 따로 두는 숫자와 표시입니다 (다른 모드의 같은 이름과 섞이지 않음). 세이브마다 저장됩니다.

예제: [`docs/example-script-mod/`](example-script-mod/) (게임의 국가 › 결정 › 모드 › "예제 모드 넣기"와 같은 내용)

## 시험해 보기

1. **브라우저 · 앱 어디서나** — 국가 › 결정 › 모드 › **모드 파일 불러오기 (.json)** 로 파일을 넣습니다. 넣은 모드는 이 브라우저 · 앱의 모든 세이브에 적용됩니다.
2. **데스크톱 앱 모드 폴더** — `<사용자 데이터>/mods/<폴더>/`에 JSON 파일을 넣고 앱을 다시 엽니다 (국가 › 결정 › 모드 › "모드 폴더 열기").
3. 모드 카드의 **모더 도구** — 이 세이브의 변수 · 플래그, 이벤트마다 조건이 맞는지 · 몇 번 일어났는지, 이벤트를 바로 띄우는 버튼, 상태 초기화.
   모르는 조건 · 효과 이름을 쓰면 카드에 ⚠ 경고가 나옵니다.

## 창작마당에 올리기

폴더 하나 = 창작마당 아이템 하나입니다.

```
my-mod/
  script.json            스크립트 모드 (아래 형식)
  hemicycle-item.json    (선택) { "type": "script", "file": "script.json", "title": "...", "description": "...", "tags": ["Script"] }
  preview.png            (선택) 창작마당 미리보기 그림
```

`node tools/workshop-upload.js my-mod` 으로 올립니다 (Steam 출시 후 · `electron/steam.json`에 App ID 필요).
구독한 사람의 앱은 창작마당 모드를 자동으로 읽습니다.

## 파일 형식

```json
{
  "format": "hemicycle-script@1",
  "id": "my.mod",                 // 영문 · 숫자 · _ . - (모드마다 달라야 함)
  "name": "모드 이름",
  "author": "제작자",
  "version": "1.0",
  "description": "설명",
  "variables": { "stability": 50 },   // 국가 변수와 처음 값
  "events": [ ... ],
  "decisions": [ ... ]
}
```

(위 `//` 주석은 설명용입니다. 실제 JSON에는 주석을 쓸 수 없습니다.)

### 이벤트

| 열쇠 | 뜻 |
|---|---|
| `id` | 이벤트 이름 (모드 안에서 겹치지 않게) |
| `title`, `desc` | 창 제목 · 본문 (`\n`으로 줄바꿈, 아래 "글자 바꾸기" 사용 가능) |
| `trigger` | 조건 — 맞을 때 일어남 |
| `check` | 언제 검사할지: `"date"`(기본, 날짜를 넘길 때) · `"election"`(총선 결과 반영 때) · `"any"` |
| `once` | 기본 `true` — 한 번만. `false`면 조건이 맞을 때마다 |
| `chance` | 검사할 때마다 일어날 확률(%) — 기본 100 |
| `trigger_only` | `true`면 스스로 일어나지 않고 `fire_event` 효과로만 |
| `hidden` | `true`면 창 없이 첫 선택지 효과만 바로 |
| `immediate` | 창이 뜰 때 바로 일어나는 효과 |
| `options` | 선택지 `[{ "text", "trigger"(이 선택지가 보일 조건), "effects" }]` |
| `super` | `true`면 슈퍼 이벤트 — 화면 가운데 큰 창. 함께: `image`(그림 주소 · data:) · `quote` · `quote_author` · `kicker`(제목 위 작은 글) |

### 결정

| 열쇠 | 뜻 |
|---|---|
| `id`, `title`, `desc` | 이름 · 제목 · 설명 |
| `category` | 묶음 이름 (없으면 모드 이름) |
| `visible` | 목록에 보일 조건 |
| `available` | 실행할 수 있는 조건 (안 맞으면 버튼이 잠김) |
| `requirement_text` | 조건이 안 맞을 때 버튼에 보일 글 (기본 "조건 미충족") |
| `once` | 기본 `true` — 한 번만 |
| `cooldown_days` | 다시 쓰기까지 게임 속 날 수 (적으면 여러 번 쓸 수 있음) |
| `effects` | 효과 |

### 조건

조건 객체에 열쇠가 여럿이면 **모두** 맞아야 합니다 (배열도 모두).

| 조건 | 예 | 뜻 |
|---|---|---|
| `all` / `any` / `not` | `{ "any": [ {...}, {...} ] }` | 모두 · 하나라도 · 아님 |
| `date_after` / `date_before` | `"1990-01-01"` (`"1990"`도 됨) | 게임 속 날짜가 그날 이후 · 이전 |
| `flag` / `not_flag` | `"crisis_done"` | 플래그가 있음 · 없음 |
| `var` | `{ "name": "stability", "lt": 30 }` | 국가 변수 비교 |
| `chance` | `25` | 25% 확률 |
| `event_fired` / `decision_taken` | `"minority_crisis"` | 이벤트가 일어났음 · 결정을 했음 |
| `party_exists` | `"녹색당"` | 그 정당이 있고 해산되지 않음 |
| `ruling` | `"녹색당"` | 그 정당이 집권 세력(여당 · 연정)에 듦 |
| `party_status` | `{ "party": "...", "is": "banned" }` | `active` · `banned` · `dissolved` |
| `party_seats` | `{ "party": "ruling", "chamber": "house", "share": true, "gte": 50 }` | 의석 수 (share면 %) |
| `party_support` | `{ "party": "largest", "gt": 30 }` | 지지율(%) |
| `ruling_seats` | `{ "share": true, "lt": 50 }` | 집권 세력 의석 합 (share면 %) |
| `economy` | `{ "indicator": "infl", "gt": 10 }` | 경제 지표 (경제가 시작된 세이브만) |
| `approval` | `{ "of": "cabinet", "lt": 30 }` | 국정 지지율(%) — `of`: `cabinet` 내각 · `president` 대통령 · `pm` 총리 · `chair` 집단지도체제 의장 (여론 › 국정 지지율) |

비교: `gt`(초과) · `gte`(이상) · `lt`(미만) · `lte`(이하) · `eq`(같음) · `ne`(다름) — 여러 개 적으면 모두.
원(`chamber`): `house` · `senate` · `third` (안 적으면 `house`).
경제 지표: `growth` 성장률 · `infl` 인플레이션 · `unemp` 실업률 · `rate` 기준금리 · `yield` 국채금리 · `debt` 부채비율 · `balance` 재정수지 · `mood` 민심 · `conf` 신뢰도 · `cur` 통화가치.

**정당 가리키기** (`party`): 정당 번호(id) · 정당 이름 · 약칭, 또는 `"ruling"`(집권 세력 최대 정당) · `"largest"`(하원 최대 정당) · `"opposition"`(야당 최대 정당).

### 효과

효과는 배열에 차례로 적습니다: `"effects": [ { "set_flag": "a" }, { "add_var": { "name": "x", "value": 5 } } ]`

| 효과 | 예 | 뜻 |
|---|---|---|
| `set_flag` / `clear_flag` | `"crisis_done"` | 플래그 켜기 · 끄기 |
| `set_var` / `add_var` | `{ "name": "stability", "value": 10 }` | 변수 바꾸기 · 더하기 |
| `support` | `{ "party": "ruling", "add": -3 }` · `{ ..., "set": 20, "chamber": "house" }` | 지지율 더하기 · 바꾸기 (원을 안 적으면 모든 원) |
| `party_status` | `{ "party": "...", "to": "banned" }` | 활동 금지 · 해산 · 활동중 |
| `rename_party` | `{ "party": "...", "name": "새 이름", "abbr": "약칭" }` | 당명 바꾸기 |
| `party_color` | `{ "party": "...", "color": "#ff0000" }` | 정당 색 |
| `economy` | `{ "indicator": "mood", "add": -5 }` | 경제 지표 더하기 · 바꾸기 |
| `approval` | `{ "of": "cabinet", "add": -5 }` · `{ "of": "president", "set": 40 }` | 국정 지지율 더하기 · 바꾸기 |
| `article` | `{ "title": "...", "body": "...", "outlet": "헤미일보", "type": "politics", "effects": [{ "party": "ruling", "add": -2 }, { "approval": "cabinet", "add": -3 }] }` | 기사를 바로 발행 (여론 › 기사에 남고, 효과가 들어감). `type`: `politics` · `economy` · `society` · `world` · `editorial` · `breaking` |
| `nation_name` | `"새 국호"` | 국가명 |
| `message` | `{ "title": "...", "text": "..." }` | 알림 창 |
| `toast` | `"..."` | 화면 아래 짧은 알림 |
| `fire_event` | `"other_event"` | 이 모드의 다른 이벤트 띄우기 |
| `if` | `{ "condition": {...}, "then": [...], "else": [...] }` | 조건에 따라 |
| `random_list` | `[ { "weight": 70, "effects": [...] }, { "weight": 30, "effects": [...] } ]` | 무게대로 하나를 골라 |

**세계지도 조건 · 효과** (v1.7.1 개발 중): `owns_regions` · `in_economic_region` 조건과 `transfer_regions` · `assign_economic_region` 효과는 나라 연결이 있는 **시나리오 안에서만** 동작합니다([시나리오 › 세계지도 연동](CAMPAIGN.md#세계지도-연동-개발-중--v171--032)). 일반 스크립트 모드에서는 조건은 거짓, 효과는 건너뛰고 모드 기록에 이유가 남습니다. 이벤트의 `"check"`에는 `"date"`(기본) · `"election"` 말고도 `"world"`(지도가 바뀔 때)와 `"any"`(모든 때)를 쓸 수 있습니다.

### 글자 바꾸기

제목 · 본문 · 선택지 · 알림 글 · 기사(`article`)의 제목 · 부제 · 본문에서:
`{var:stability}` 변수 값 · `{party:ruling}` 정당 이름 · `{date}` 게임 속 날짜.

## 앞으로

- 고급 모드(정해 둔 API만 쓰는 JavaScript 확장 — 새 탭 · 새 시스템, 설치할 때 경고)는 다음 단계로 준비 중입니다.
- 조건 · 효과는 계속 늘어납니다. 필요한 게 있으면 알려 주세요.
