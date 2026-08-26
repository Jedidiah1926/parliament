// ⏱ 점검 기간 설정
// index.html이 이 파일을 읽어서 아래 기간에는 자동으로 점검중 페이지를,
// 그 외의 시간에는 자동으로 REDIRECT_URL(dno.main.html)로 이동시킵니다.
//
// 형식: "YYYY-MM-DDTHH:mm:ss"  (24시간제, 이 컴퓨터/브라우저의 로컬 시간 기준)
// end를 null로 비워두면 start 이후 종료 시각 없이 점검 상태가 계속됩니다.
// start를 null로 비워두면 이미 점검이 시작된 것으로 취급합니다.
const MAINTENANCE_WINDOW = {
    start: "2026-08-26T00:00:00",
    end:   null
};
