# 예제 시나리오 — 국경 협정

세계지도와 시나리오를 잇는 가장 작은 예제입니다 (v1.7.1 / 시나리오 0.3.2 — [사용법](../CAMPAIGN.md#세계지도-연동-v171--032) · [설계](../design/SCENARIO_WORLD_INTEGRATION.md)).

| 파일 | 내용 |
|---|---|
| `border-agreement.hemicmp` | 시나리오. 시작 세이브(서독 튜토리얼 나라 + 세 구역 지도)가 들어 있어 바로 시험 플레이할 수 있습니다 |
| `border-map.hemimap` | 예제에 쓴 세 구역 지도(수도 · 강변 · 섬)와 처음 영토. 세계 › 지도에서 불러와 볼 수 있습니다 |

## 해 보기

1. 메인 화면 › 만들기 › 시나리오 메이커에서 `border-agreement.hemicmp`를 불러옵니다.
2. **시작 나라** 탭의 **세계지도 연결**에서 `republic` → 공화국, `federation` → 연방 연결을 확인합니다.
3. **▶ 시험 플레이** → 방향성 **국경 협상 개시**를 시작하고 이틀(턴제는 두 턴)을 보냅니다.
4. 협상 이벤트에서
   - **협정을 수락한다** → 강변이 공화국 영토로 바뀌고(수도 · 섬은 그대로), 날짜를 넘기지 않고 **새로운 국경** 이벤트와 기사 **강변, 공화국 품으로**가 이어집니다. 방향성 **강변 통합**이 열리고 결말은 **강 건너의 평화**.
   - **협정을 거절한다** → 지도는 그대로. 방향성 **국경 요새화**가 열리고 결말은 **지켜 낸 옛 국경**.

이야기에 쓰인 것: `world.countries` · `starts[].worldBindings`(나라 연결), `transfer_regions`(영토 변경), `owns_regions`(구역 소유 조건 — 방향성 · 기사 · 이벤트), `check: "world"`(지도 변경 시 이벤트).

## 다시 만들기 · 검증

이야기 원본은 `tests/fixtures/border-agreement.cjs`입니다. 파일은 실제 게임과 제작기를 거쳐 만듭니다.

```bash
python3 -m http.server 8000 &
node tests/fixtures/build-border-example.cjs      # 이 폴더의 두 파일을 다시 만든다
node --test tests/world-rules.test.cjs            # 예제가 검사를 통과하는지
node tests/world-scenario.browser.cjs             # 턴제 · 실시간에서 수락 / 거절 두 경로를 끝까지
```
