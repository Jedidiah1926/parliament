// ===== 맵 프리셋 만들기 — Natural Earth(공개 도메인) 행정구역으로 지역구 지도 10개 =====
// 쓰는 법: node tools/build-map-presets.js <ne_10m_admin_1_states_provinces.geojson>
//   (https://github.com/nvkelso/natural-earth-vector — geojson/ne_10m_admin_1_states_provinces.geojson)
// 결과: presets/maps.js — window.HemiMapPresets = [{ id, name, count, viewBox, districts: [{ key, ko, en, abbr, d }] }]
//   나라마다 앨버스 정적 원추 도법으로 투영 → topojson으로 이웃 경계를 같이 단순화(틈 없이) → 필요하면 행정구역을 묶어(프랑스 레지옹 등)
//   → 가로 1000 viewBox의 SVG 경로(소수 1자리). 멀리 떨어진 섬은 빼거나(오가사와라 등) 옆 상자로 옮김(알래스카 · 하와이 · 오키나와 · 카나리아).
const fs = require('fs');
const path = require('path');
const topojson = Object.assign({}, require('topojson-server'), require('topojson-simplify'), require('topojson-client'));

const SRC = process.argv[2];
if (!SRC) { console.error('Natural Earth admin-1 geojson 경로를 주세요'); process.exit(1); }
const ALL = JSON.parse(fs.readFileSync(SRC, 'utf8')).features;
const W = 1000, PAD = 14;
const R = Math.PI / 180;

// 앨버스 정적 원추 도법 (구면) — [경도, 위도] → [x, y(아래로)]
function albers(p1, p2, lon0, lat0) {
    const n = (Math.sin(p1 * R) + Math.sin(p2 * R)) / 2, C = Math.cos(p1 * R) ** 2 + 2 * n * Math.sin(p1 * R);
    const rho0 = Math.sqrt(C - 2 * n * Math.sin(lat0 * R)) / n;
    return ([lon, lat]) => {
        const rho = Math.sqrt(Math.max(0, C - 2 * n * Math.sin(lat * R))) / n, th = n * (lon - lon0) * R;
        return [rho * Math.sin(th), -(rho0 - rho * Math.cos(th))];
    };
}
const polysOf = g => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const ringArea = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };
const centroid = ring => { let x = 0, y = 0; ring.forEach(p => { x += p[0]; y += p[1]; }); return [x / ring.length, y / ring.length]; };
const bboxOf = pts => pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);

// ---- 이름 사전 (묶은 지역 · 고친 이름) ----
const FR = { 'Île-de-France': ['일드프랑스', 'Île-de-France', 'IDF'], 'Hauts-de-France': ['오드프랑스', 'Hauts-de-France', 'HDF'], 'Grand Est': ['그랑테스트', 'Grand Est', 'GES'], 'Normandie': ['노르망디', 'Normandy', 'NOR'], 'Bretagne': ['브르타뉴', 'Brittany', 'BRE'], 'Pays de la Loire': ['페이드라루아르', 'Pays de la Loire', 'PDL'], 'Centre-Val de Loire': ['상트르발드루아르', 'Centre-Val de Loire', 'CVL'], 'Bourgogne-Franche-Comté': ['부르고뉴프랑슈콩테', 'Bourgogne-Franche-Comté', 'BFC'], 'Nouvelle-Aquitaine': ['누벨아키텐', 'Nouvelle-Aquitaine', 'NAQ'], 'Occitanie': ['옥시타니', 'Occitania', 'OCC'], 'Auvergne-Rhône-Alpes': ['오베르뉴론알프', 'Auvergne-Rhône-Alpes', 'ARA'], "Provence-Alpes-Côte-d'Azur": ['프로방스알프코트다쥐르', "Provence-Alpes-Côte d'Azur", 'PAC'], 'Corse': ['코르스', 'Corsica', 'COR'] };
const UK = { 'North East': ['잉글랜드 북동부', 'North East England', 'NE'], 'North West': ['잉글랜드 북서부', 'North West England', 'NW'], 'Yorkshire and the Humber': ['요크셔험버', 'Yorkshire and the Humber', 'YH'], 'East Midlands': ['이스트미들랜즈', 'East Midlands', 'EM'], 'West Midlands': ['웨스트미들랜즈', 'West Midlands', 'WM'], 'East': ['이스트오브잉글랜드', 'East of England', 'EE'], 'Greater London': ['런던', 'London', 'LDN'], 'South East': ['잉글랜드 남동부', 'South East England', 'SE'], 'South West': ['잉글랜드 남서부', 'South West England', 'SW'], 'Scotland': ['스코틀랜드', 'Scotland', 'SCO'], 'Wales': ['웨일스', 'Wales', 'WAL'], 'Northern Ireland': ['북아일랜드', 'Northern Ireland', 'NI'] };
const IT = { "Valle d'Aosta": ['발레다오스타', 'Aosta Valley', 'VDA'], 'Piemonte': ['피에몬테', 'Piedmont', 'PIE'], 'Lombardia': ['롬바르디아', 'Lombardy', 'LOM'], 'Trentino-Alto Adige': ['트렌티노알토아디제', 'Trentino-South Tyrol', 'TAA'], 'Veneto': ['베네토', 'Veneto', 'VEN'], 'Friuli-Venezia Giulia': ['프리울리베네치아줄리아', 'Friuli-Venezia Giulia', 'FVG'], 'Liguria': ['리구리아', 'Liguria', 'LIG'], 'Emilia-Romagna': ['에밀리아로마냐', 'Emilia-Romagna', 'EMR'], 'Toscana': ['토스카나', 'Tuscany', 'TOS'], 'Umbria': ['움브리아', 'Umbria', 'UMB'], 'Marche': ['마르케', 'Marche', 'MAR'], 'Lazio': ['라치오', 'Lazio', 'LAZ'], 'Abruzzo': ['아브루초', 'Abruzzo', 'ABR'], 'Molise': ['몰리세', 'Molise', 'MOL'], 'Campania': ['캄파니아', 'Campania', 'CAM'], 'Apulia': ['풀리아', 'Apulia', 'PUG'], 'Basilicata': ['바실리카타', 'Basilicata', 'BAS'], 'Calabria': ['칼라브리아', 'Calabria', 'CAL'], 'Sicily': ['시칠리아', 'Sicily', 'SIC'], 'Sardegna': ['사르데냐', 'Sardinia', 'SAR'] };
const ES = { 'Andalucía': ['안달루시아', 'Andalusia', 'AN'], 'Aragón': ['아라곤', 'Aragon', 'AR'], 'Asturias': ['아스투리아스', 'Asturias', 'AS'], 'Islas Baleares': ['발레아레스 제도', 'Balearic Islands', 'IB'], 'Canary Is.': ['카나리아 제도', 'Canary Islands', 'CN'], 'Cantabria': ['칸타브리아', 'Cantabria', 'CB'], 'Castilla y León': ['카스티야이레온', 'Castile and León', 'CL'], 'Castilla-La Mancha': ['카스티야라만차', 'Castilla–La Mancha', 'CM'], 'Cataluña': ['카탈루냐', 'Catalonia', 'CT'], 'Valenciana': ['발렌시아', 'Valencian Community', 'VC'], 'Extremadura': ['에스트레마두라', 'Extremadura', 'EX'], 'Galicia': ['갈리시아', 'Galicia', 'GA'], 'Madrid': ['마드리드', 'Madrid', 'MD'], 'Murcia': ['무르시아', 'Murcia', 'MC'], 'Foral de Navarra': ['나바라', 'Navarre', 'NC'], 'País Vasco': ['바스크', 'Basque Country', 'PV'], 'La Rioja': ['라리오하', 'La Rioja', 'RI'], 'Ceuta': ['세우타', 'Ceuta', 'CE'], 'Melilla': ['멜리야', 'Melilla', 'ML'] };
const KR = { '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기', '강원도': '강원', '충청북도': '충북', '충청남도': '충남', '전라북도': '전북', '전라남도': '전남', '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주' };
const KR_RENAME = { '강원도': '강원특별자치도', '전라북도': '전북특별자치도' };
const KR_EN = { '강원도': 'Gangwon State', '전라북도': 'Jeonbuk State' };
// 묶음 이름은 ISO 코드로 (워싱턴 D.C.는 영어 이름이 워싱턴 주와 같은 "Washington"이라 이름으로 묶으면 합쳐짐)
const plain = (p, abbr) => (p.adm0_a3 === 'USA' && p.postal === 'DC'
    ? { group: 'US-DC', ko: '워싱턴 D.C.', en: 'Washington, D.C.', abbr: 'DC' }
    : { group: p.iso_3166_2 || p.name_en || p.name, ko: p.name_ko || p.name, en: p.name_en || p.name, abbr: abbr || p.postal || (p.name_en || p.name).slice(0, 3).toUpperCase() });
const byDict = (dict, k) => { const v = dict[k]; if (!v) throw new Error('이름 사전에 없음: ' + k); return { group: k, ko: v[0], en: v[1], abbr: v[2] }; };

// ---- 지도 10개 ----
// pick: 이 나라의 행정구역 → { group(묶는 이름), ko, en, abbr } 또는 null(뺌) · proj: 앨버스 매개변수
// dropPoly(p, [lon, lat]): 빼는 섬 · insets: [{ match(p, [lon,lat]), proj?, scale, at(본토 bbox, 상자 bbox) → [dx, dy] }]
const MAPS = [
    { id: 'kr', name: { ko: '대한민국', en: 'South Korea' }, desc: { ko: '17개 시·도', en: '17 provinces & cities' }, iso: 'KOR', proj: [34, 38, 127.7, 36], keepAll: true,
        pick: p => ({ group: p.name_en, ko: KR_RENAME[p.name_ko] || p.name_ko, en: KR_EN[p.name_ko] || p.name_en, abbr: KR[p.name_ko] || p.name_ko.slice(0, 2) }) },
    { id: 'jp', name: { ko: '일본', en: 'Japan' }, desc: { ko: '47개 도도부현', en: '47 prefectures' }, iso: 'JPN', proj: [32, 42, 137, 37],
        pick: p => ({ group: p.name, ko: p.name_ko, en: p.name, abbr: p.name_ko === '도쿄도' ? '도쿄' : p.name_ko.replace(/(현|부)$/, '') }), // name_en은 "Okinawa Prefecture" · "Tokyo"처럼 제각각이라 name(로마자)을 씀
        dropPoly: (p, [lon, lat]) => (p.name === 'Tokyo' && lat < 32) || (p.name === 'Kagoshima' && lat < 29.5) || lat < 24 || lon > 146, // 오가사와라 · 아마미는 뺌 (가고시마가 둘로 갈라지지 않게)
        insets: [{ match: p => p.name === 'Okinawa', scale: 1, at: (m, b, g) => [m[0] + g, m[1] + g] }] },
    { id: 'us', name: { ko: '미국', en: 'United States' }, desc: { ko: '50개 주 + 워싱턴 D.C.', en: '50 states + D.C.' }, iso: 'USA', proj: [29.5, 45.5, -96, 38],
        pick: p => plain(p), dropPoly: (p, [lon, lat]) => (p.name_en === 'Hawaii' && lon < -161) || (p.name_en === 'Alaska' && lon > 0),
        insets: [
            { match: p => p.name_en === 'Alaska', proj: [55, 65, -154, 50], scale: 0.36, at: (m, b) => [m[0], m[3] - b[3]] },
            { match: p => p.name_en === 'Hawaii', proj: [8, 18, -157, 0], scale: 1, at: (m, b) => [m[0] + (m[2] - m[0]) * 0.24, m[3] - b[3]] },
        ] },
    { id: 'de', name: { ko: '독일', en: 'Germany' }, desc: { ko: '16개 주', en: '16 states' }, iso: 'DEU', proj: [48.5, 53.5, 10.5, 51], pick: p => plain(p) },
    { id: 'fr', name: { ko: '프랑스', en: 'France' }, desc: { ko: '본토 13개 레지옹', en: '13 metropolitan regions' }, iso: 'FRA', proj: [44, 49, 2.5, 46.5],
        pick: p => (FR[p.region] ? byDict(FR, p.region) : null) },
    { id: 'gb', name: { ko: '영국', en: 'United Kingdom' }, desc: { ko: '잉글랜드 9개 지방 + 스코틀랜드 · 웨일스 · 북아일랜드', en: '9 English regions + Scotland, Wales, Northern Ireland' }, iso: 'GBR', proj: [51, 57, -3, 54],
        pick: p => byDict(UK, ['Scotland', 'Wales', 'Northern Ireland'].includes(p.geonunit) ? p.geonunit : p.region) },
    { id: 'it', name: { ko: '이탈리아', en: 'Italy' }, desc: { ko: '20개 주', en: '20 regions' }, iso: 'ITA', proj: [38, 46, 12.5, 42], pick: p => byDict(IT, p.region) },
    { id: 'es', name: { ko: '스페인', en: 'Spain' }, desc: { ko: '17개 자치지방 + 세우타 · 멜리야', en: '17 communities + Ceuta, Melilla' }, iso: 'ESP', proj: [37, 43, -3.5, 40],
        pick: p => byDict(ES, p.region),
        insets: [{ match: p => p.region === 'Canary Is.', scale: 1, at: (m, b, g) => [m[0] + g, m[3] - b[3]] }] },
    { id: 'ca', name: { ko: '캐나다', en: 'Canada' }, desc: { ko: '10개 주 + 3개 준주', en: '10 provinces + 3 territories' }, iso: 'CAN', proj: [50, 70, -96, 60], pick: p => plain(p) },
    { id: 'br', name: { ko: '브라질', en: 'Brazil' }, desc: { ko: '26개 주 + 연방구', en: '26 states + Federal District' }, iso: 'BRA', proj: [-2, -22, -54, -12], pick: p => plain(p),
        dropPoly: (p, [lon]) => lon > -33 },
];

function build(cfg) {
    const feats = ALL.filter(f => f.properties.adm0_a3 === cfg.iso);
    const main = albers(...cfg.proj);
    // 1) 행정구역 → 묶음 · 다각형별 투영 (섬 빼기 · 옆 상자 표시)
    const groups = new Map(), parts = [];
    for (const f of feats) {
        const info = cfg.pick(f.properties);
        if (!info) continue;
        if (!groups.has(info.group)) groups.set(info.group, info);
        for (const poly of polysOf(f.geometry)) {
            const c = centroid(poly[0]);
            if (cfg.dropPoly && cfg.dropPoly(f.properties, c)) continue;
            const inset = (cfg.insets || []).findIndex(s => s.match(f.properties, c));
            parts.push({ group: info.group, inset, poly });
        }
    }
    // 2) 투영 — 옆 상자는 따로 투영 · 축척한 뒤, 본토 bbox를 기준으로 옮긴다
    const proj = (pt, inset) => (inset >= 0 && cfg.insets[inset].proj ? albers(...cfg.insets[inset].proj) : main)(pt);
    const projected = parts.map(p => ({ ...p, rings: p.poly.map(r => r.map(pt => proj(pt, p.inset))) }));
    const mainPts = projected.filter(p => p.inset < 0).flatMap(p => p.rings[0]);
    const mb = bboxOf(mainPts), mainSpan = Math.max(mb[2] - mb[0], mb[3] - mb[1]);
    (cfg.insets || []).forEach((s, i) => {
        const mine = projected.filter(p => p.inset === i);
        if (!mine.length) return;
        // 모든 투영이 같은 단위(구 반지름 1)라 scale만큼 줄이고(알래스카 0.36 등), 왼쪽 위를 0으로 맞춘 뒤 상자 위치로
        const pts = mine.flatMap(p => p.rings[0]), b0 = bboxOf(pts), k = s.scale;
        mine.forEach(p => { p.rings = p.rings.map(r => r.map(([x, y]) => [(x - b0[0]) * k, (y - b0[1]) * k])); });
        const b = bboxOf(mine.flatMap(p => p.rings[0]));
        const [dx, dy] = s.at(mb, b, mainSpan * 0.012);
        mine.forEach(p => { p.rings = p.rings.map(r => r.map(([x, y]) => [x + dx, y + dy])); });
    });
    // 3) topojson — 이웃 경계를 같이 단순화하고 묶음별로 합친다
    const fc = { type: 'FeatureCollection', features: projected.map((p, i) => ({ type: 'Feature', id: i, properties: { group: p.group }, geometry: { type: 'Polygon', coordinates: p.rings } })) };
    let topo = topojson.topology({ f: fc }, 1e5);
    topo = topojson.presimplify(topo);
    // 나라 크기와 상관없이 비슷한 정밀도로 — 점을 목표 개수(기본 9000)만큼 남긴다
    const total = topo.arcs.reduce((n, a) => n + a.length, 0);
    topo = topojson.simplify(topo, topojson.quantile(topo, Math.min(1, (cfg.points || 9000) / total)));
    const geoms = topo.objects.f.geometries;
    const out = [];
    for (const [g, info] of groups) {
        const merged = topojson.merge(topo, geoms.filter(x => x.properties.group === g));
        let polys = polysOf(merged).filter(pl => pl[0] && pl[0].length >= 4);
        // 너무 작아 단순화로 사라진 지역(워싱턴 D.C. 등)은 원래 모양 그대로
        if (!polys.length) polys = projected.filter(p => p.group === g).map(p => p.rings);
        if (!polys.length) continue;
        // 아주 작은 섬은 뺀다 (가장 큰 덩어리는 남김) — 한국은 섬을 모두 둠
        if (!cfg.keepAll) {
            const areas = polys.map(pl => ringArea(pl[0])), max = Math.max(...areas);
            polys = polys.filter((pl, i) => areas[i] >= max * 0.002 || areas[i] === max);
        }
        out.push({ info, polys });
    }
    // 4) 가로 1000에 맞추기 → SVG 경로
    const all = out.flatMap(o => o.polys.flatMap(pl => pl[0]));
    const b = bboxOf(all), s = (W - PAD * 2) / (b[2] - b[0]), H = Math.round((b[3] - b[1]) * s + PAD * 2);
    const fx = v => +((v - b[0]) * s + PAD).toFixed(1), fy = v => +((v - b[1]) * s + PAD).toFixed(1);
    const districts = out.map(({ info, polys }) => ({
        key: info.en, ko: info.ko, en: info.en, abbr: info.abbr,
        d: polys.map(pl => pl.map(r => { const pts = r.slice(0, -1).map(([x, y]) => `${fx(x)} ${fy(y)}`); return 'M' + pts.join('L') + 'Z'; }).join('')).join(''),
    })).sort((a, b2) => a.ko.localeCompare(b2.ko, 'ko'));
    const keys = new Set();
    districts.forEach(d => { let k = d.key; for (let i = 2; keys.has(k); i++) k = `${d.key} ${i}`; keys.add(k); d.key = k; });
    return { id: cfg.id, name: cfg.name, desc: cfg.desc, count: districts.length, viewBox: `0 0 ${W} ${H}`, districts };
}

const maps = MAPS.map(build);
const header = `// 맵 프리셋 — tools/build-map-presets.js가 Natural Earth 1:10m 행정구역(공개 도메인, naturalearthdata.com)으로 만든 파일. 손으로 고치지 마세요.\n`;
fs.writeFileSync(path.join(__dirname, '..', 'presets', 'maps.js'), header + 'window.HemiMapPresets = ' + JSON.stringify(maps) + ';\n');
maps.forEach(m => console.log(`${m.id} ${m.name.ko}: ${m.count}개 · ${m.viewBox} · ${(JSON.stringify(m).length / 1024).toFixed(0)}KB`));
console.log(`presets/maps.js ${(fs.statSync(path.join(__dirname, '..', 'presets', 'maps.js')).size / 1024).toFixed(0)}KB`);
