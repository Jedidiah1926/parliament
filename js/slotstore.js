// ===== 세이브 목록 압축 저장 — 브라우저 저장소(localStorage) 공간 아끼기 =====
// 세이브 목록(dnoParliamentSaveSlots · 티저 · 로고 저장 공간)은 세이브마다 상태 JSON을 그대로 담아 저장소 한도(약 5MB)를
// 금방 채운다. 이 파일은 저장소 읽기 · 쓰기에 끼어들어, 세이브의 상태를 gzip으로 압축해 "stateZ"에 담아 두고
// 읽을 때 다시 풀어 준다 — 게임 코드(js/main.js · 시작 화면 · js/official.js · js/desktopsaves.js)는 그대로 압축 전 목록을 본다.
//   - 무손실: 사진 · 지도 등 내용은 한 글자도 바뀌지 않는다 (풀면 압축 전과 똑같은 JSON)
//   - 쓰기는 먼저 압축 전 그대로 바로 저장하고(바로 꺼져도 남게), 바뀐 세이브만 뒤에서 압축해 다시 쓴다
//     (압축은 브라우저 내장 CompressionStream — 화면이 멈추지 않음, 풀기는 아래의 작은 inflate로 바로)
//   - 압축 글자: gzip 바이트를 한 글자에 15비트씩 담음 ("Z1:<바이트 수>:<글자>", 모든 글자가 U+0020 ~ U+801F)
//   - 압축 기능이 없는 브라우저에서는 압축하지 않고, 압축된 세이브는 어디서든 풀 수 있다
// 다른 게임 스크립트보다 먼저 읽어야 한다 (js/desktopsaves.js보다도 먼저).
(function () {
    'use strict';
    let ls;
    try { ls = window.localStorage; if (!ls) return; } catch (e) { return; }
    const KEY_RE = /^(hemicycleTeaserV2-\d{2}:|hemicycleLogo:)?dnoParliamentSaveSlots$/;
    const MIN_CHARS = 4096; // 이보다 작은 상태는 압축하지 않음
    const canZip = typeof CompressionStream === 'function';
    const origGet = Storage.prototype.getItem, origSet = Storage.prototype.setItem;

    // ---------- 15비트 글자 ↔ 바이트 ----------
    function pack(bytes) {
        const out = new Uint16Array(Math.ceil(bytes.length * 8 / 15));
        let acc = 0, n = 0, o = 0;
        for (let i = 0; i < bytes.length; i++) {
            acc = (acc << 8) | bytes[i]; n += 8;
            if (n >= 15) { n -= 15; out[o++] = ((acc >>> n) & 0x7fff) + 0x20; acc &= (1 << n) - 1; }
        }
        if (n > 0) out[o++] = ((acc << (15 - n)) & 0x7fff) + 0x20;
        let s = '';
        for (let i = 0; i < o; i += 8192) s += String.fromCharCode.apply(null, out.subarray(i, Math.min(o, i + 8192)));
        return `Z1:${bytes.length}:${s}`;
    }
    function unpack(str) {
        const m = /^Z1:(\d+):/.exec(str);
        if (!m) throw new Error('압축 형식이 아님');
        const len = +m[1], start = m[0].length, bytes = new Uint8Array(len);
        let acc = 0, n = 0, o = 0;
        for (let i = start; i < str.length && o < len; i++) {
            acc = (acc << 15) | ((str.charCodeAt(i) - 0x20) & 0x7fff); n += 15;
            while (n >= 8 && o < len) { n -= 8; bytes[o++] = (acc >>> n) & 0xff; }
            acc &= (1 << n) - 1;
        }
        return bytes;
    }

    // ---------- inflate (RFC 1951) — 바로 풀기 위해 ----------
    const LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
    const LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
    const DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
    const DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
    const CLORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    // 허프만 표: 9비트 바로 찾기 표 + 긴 부호는 한 비트씩
    function huff(lengths, n) {
        const count = new Uint16Array(16), offs = new Uint16Array(16), sym = new Uint16Array(n);
        for (let i = 0; i < n; i++) count[lengths[i]]++;
        count[0] = 0;
        for (let i = 1; i < 16; i++) offs[i] = offs[i - 1] + count[i - 1];
        for (let i = 0; i < n; i++) if (lengths[i]) sym[offs[lengths[i]]++] = i;
        // 빠른 표: 9비트를 뒤집은 값 → (길이 << 9 | 기호), 0이면 느린 길
        const FAST = 9, fast = new Uint16Array(1 << FAST);
        let code = 0, k = 0;
        for (let len = 1; len <= FAST; len++) {
            for (let c = 0; c < count[len]; c++, code++, k++) {
                let rev = 0; for (let b = 0; b < len; b++) rev |= ((code >> b) & 1) << (len - 1 - b);
                for (let f = rev; f < (1 << FAST); f += 1 << len) fast[f] = (len << 9) | sym[k];
            }
            code <<= 1;
        }
        return { count, sym, fast };
    }
    function inflate(src) {
        let pos = 0;
        // gzip 머리 건너뛰기
        if (src[0] === 0x1f && src[1] === 0x8b) {
            const flg = src[3]; pos = 10;
            if (flg & 4) pos += 2 + (src[pos] | (src[pos + 1] << 8));
            if (flg & 8) { while (src[pos++]); }
            if (flg & 16) { while (src[pos++]); }
            if (flg & 2) pos += 2;
        }
        let out = new Uint8Array(Math.max(1024, src.length * 4)), op = 0;
        let bitbuf = 0, bitcnt = 0;
        const need = n => { while (bitcnt < n) { bitbuf |= (src[pos++] | 0) << bitcnt; bitcnt += 8; } };
        const bits = n => { need(n); const v = bitbuf & ((1 << n) - 1); bitbuf >>>= n; bitcnt -= n; return v; };
        const grow = n => { if (op + n <= out.length) return; let m = out.length * 2; while (m < op + n) m *= 2; const o = new Uint8Array(m); o.set(out.subarray(0, op)); out = o; };
        const decode = h => {
            need(9);
            const e = h.fast[bitbuf & 511];
            if (e) { const len = e >> 9; bitbuf >>>= len; bitcnt -= len; return e & 511; }
            let code = 0, first = 0, index = 0;
            for (let len = 1; len < 16; len++) {
                code |= bits(1);
                const c = h.count[len];
                if (code - c < first) return h.sym[index + (code - first)];
                index += c; first += c; first <<= 1; code <<= 1;
            }
            throw new Error('잘못된 허프만 부호');
        };
        let fixedL = null, fixedD = null;
        for (;;) {
            const final = bits(1), type = bits(2);
            if (type === 0) {
                pos -= bitcnt >> 3; bitbuf = 0; bitcnt = 0; // 미리 읽어 둔 바이트는 되돌리고, 쓰다 만 바이트는 버림
                const len = src[pos] | (src[pos + 1] << 8); pos += 4;
                grow(len); out.set(src.subarray(pos, pos + len), op); op += len; pos += len;
            } else if (type === 1 || type === 2) {
                let L, D;
                if (type === 1) {
                    if (!fixedL) {
                        const l = new Uint8Array(288); l.fill(8, 0, 144); l.fill(9, 144, 256); l.fill(7, 256, 280); l.fill(8, 280, 288);
                        fixedL = huff(l, 288); const d = new Uint8Array(30); d.fill(5); fixedD = huff(d, 30);
                    }
                    L = fixedL; D = fixedD;
                } else {
                    const hlit = bits(5) + 257, hdist = bits(5) + 1, hclen = bits(4) + 4;
                    const cl = new Uint8Array(19);
                    for (let i = 0; i < hclen; i++) cl[CLORDER[i]] = bits(3);
                    const ch = huff(cl, 19), lens = new Uint8Array(hlit + hdist);
                    for (let i = 0; i < hlit + hdist;) {
                        const s = decode(ch);
                        if (s < 16) lens[i++] = s;
                        else if (s === 16) { const p = lens[i - 1], r = 3 + bits(2); for (let k = 0; k < r; k++) lens[i++] = p; }
                        else if (s === 17) i += 3 + bits(3);
                        else i += 11 + bits(7);
                    }
                    L = huff(lens.subarray(0, hlit), hlit); D = huff(lens.subarray(hlit), hdist);
                }
                for (;;) {
                    const s = decode(L);
                    if (s < 256) { if (op >= out.length) grow(1); out[op++] = s; }
                    else if (s === 256) break;
                    else {
                        const li = s - 257, len = LBASE[li] + bits(LEXT[li]);
                        const di = decode(D), dist = DBASE[di] + bits(DEXT[di]);
                        if (dist > op) throw new Error('잘못된 거리');
                        grow(len);
                        for (let k = 0; k < len; k++, op++) out[op] = out[op - dist];
                    }
                }
            } else throw new Error('잘못된 블록');
            if (final) break;
        }
        return out.subarray(0, op);
    }
    // ---------- deflate (고정 허프만 + LZ77) — 저장 공간이 모자랄 때만 바로 압축하는 용도 ----------
    // 내장 압축(gzip)보다 조금 덜 줄지만 기다리지 않고 바로 끝난다. 나중에 뒤에서 내장 압축으로 다시 줄인다.
    const FIX = (() => {
        const code = new Uint16Array(288), len = new Uint8Array(288);
        const rev = (c, n) => { let r = 0; for (let i = 0; i < n; i++) r |= ((c >> i) & 1) << (n - 1 - i); return r; };
        for (let i = 0; i < 288; i++) {
            const [c, n] = i < 144 ? [0x30 + i, 8] : i < 256 ? [0x190 + i - 144, 9] : i < 280 ? [i - 256, 7] : [0xc0 + i - 280, 8];
            code[i] = rev(c, n); len[i] = n;
        }
        const dcode = new Uint8Array(30); for (let i = 0; i < 30; i++) dcode[i] = rev(i, 5);
        const lsym = new Uint16Array(259); // 길이 → 기호 번호(0~28)
        for (let i = 0; i < 29; i++) for (let l = LBASE[i]; l < (i < 28 ? LBASE[i + 1] : 259); l++) lsym[l] = i;
        lsym[258] = 28;
        return { code, len, dcode, lsym };
    })();
    function deflateSync(src) {
        let out = new Uint8Array(Math.max(1024, (src.length >> 1) + 64)), op = 0, acc = 0, n = 0;
        const put = (v, k) => {
            acc |= v << n; n += k;
            while (n >= 8) {
                if (op >= out.length) { const o = new Uint8Array(out.length * 2); o.set(out); out = o; }
                out[op++] = acc & 0xff; acc >>>= 8; n -= 8;
            }
        };
        const lit = s2 => put(FIX.code[s2], FIX.len[s2]);
        put(1, 1); put(1, 2); // 마지막 블록 · 고정 허프만
        const HB = 15, head = new Int32Array(1 << HB).fill(-1), prev = new Int32Array(32768);
        const hash = i => ((src[i] << 10) ^ (src[i + 1] << 5) ^ src[i + 2]) & ((1 << HB) - 1);
        const insert = i => { const h = hash(i); prev[i & 32767] = head[h]; head[h] = i; };
        const L = src.length;
        for (let i = 0; i < L;) {
            let best = 0, bdist = 0;
            if (i + 2 < L) {
                const h = hash(i);
                let c = head[h], chain = 48;
                while (c >= 0 && i - c <= 32768 && chain-- > 0) {
                    if (src[c + best] === src[i + best]) {
                        let k = 0; const max = Math.min(258, L - i);
                        while (k < max && src[c + k] === src[i + k]) k++;
                        if (k > best) { best = k; bdist = i - c; if (k === max) break; }
                    }
                    c = prev[c & 32767];
                }
                prev[i & 32767] = head[h]; head[h] = i;
            }
            if (best >= 3) {
                const li = FIX.lsym[best]; lit(257 + li);
                if (LEXT[li]) put(best - LBASE[li], LEXT[li]);
                let di = 29; while (DBASE[di] > bdist) di--;
                put(FIX.dcode[di], 5);
                if (DEXT[di]) put(bdist - DBASE[di], DEXT[di]);
                for (let k = 1; k < best; k++) if (i + k + 2 < L) insert(i + k);
                i += best;
            } else { lit(src[i]); i++; }
        }
        lit(256);
        if (n > 0) put(0, 8 - n);
        return out.subarray(0, op);
    }
    const utf8 = new TextDecoder('utf-8'), enc8 = new TextEncoder();
    const unzipText = packed => utf8.decode(inflate(unpack(packed)));
    async function zipText(text) {
        const s = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
        return pack(new Uint8Array(await new Response(s).arrayBuffer()));
    }

    // ---------- 세이브 목록 읽기 · 쓰기 ----------
    const byId = new Map();      // "공간|세이브 id" → { json, packed } — 같은 내용은 다시 압축 · 풀기 하지 않게
    const lastRaw = new Map(), lastOut = new Map(); // 키 → 마지막으로 저장소에 있던 글자 / 그걸 푼 글자
    const nsOf = key => key.slice(0, key.length - 'dnoParliamentSaveSlots'.length);
    // 세이브 정보(state 빼고) + 상태 JSON 글자를 이어 붙여 한 세이브의 JSON을 만든다 (상태를 두 번 직렬화하지 않게)
    function joinSlot(rest, field, valueJson) {
        const head = JSON.stringify(rest);
        return head === '{}' ? `{"${field}":${valueJson}}` : `${head.slice(0, -1)},"${field}":${valueJson}}`;
    }

    // 저장소 글자 → 압축 전 목록 글자
    function readSlots(key, raw) {
        if (raw == null) return raw;
        if (lastRaw.get(key) === raw) return lastOut.get(key);
        let out = raw;
        if (raw.indexOf('"stateZ"') >= 0) {
            let slots = null;
            try { slots = JSON.parse(raw); } catch (e) { /* 그대로 */ }
            if (Array.isArray(slots)) {
                const ns = nsOf(key);
                out = '[' + slots.map(s => {
                    if (!s || typeof s !== 'object' || typeof s.stateZ !== 'string') return JSON.stringify(s);
                    const { stateZ, ...rest } = s;
                    const k = ns + '|' + rest.id, e = byId.get(k);
                    let json = e && e.packed === stateZ ? e.json : null;
                    if (json == null) {
                        try { json = unzipText(stateZ); byId.set(k, { json, packed: stateZ }); }
                        catch (err) { console.error('[세이브 압축] 풀지 못함:', rest.name, err); return JSON.stringify(s); }
                    }
                    return joinSlot(rest, 'state', json);
                }).join(',') + ']';
            }
        }
        lastRaw.set(key, raw); lastOut.set(key, out);
        return out;
    }

    // 압축 전 목록 글자 → 저장소 (이미 압축해 둔 같은 내용은 압축본으로, 새로 바뀐 것은 일단 그대로 쓰고 뒤에서 압축)
    const gen = new Map(); // 키 → 쓰기 번호 (뒤에서 압축하는 동안 새로 쓴 게 있으면 그걸 덮지 않게)
    function writeSlots(key, value, now) {
        gen.set(key, (gen.get(key) || 0) + 1);
        let slots = null;
        try { slots = JSON.parse(value); } catch (e) { /* 목록이 아님 */ }
        if (!Array.isArray(slots)) { origSet.call(ls, key, value); lastRaw.delete(key); return; }
        const ns = nsOf(key), live = new Set();
        let pending = false;
        const stored = '[' + slots.map(s => {
            if (!s || typeof s !== 'object' || !s.state || typeof s.state !== 'object') return JSON.stringify(s);
            const { state, ...rest } = s;
            const json = JSON.stringify(state), k = ns + '|' + rest.id;
            live.add(k);
            let e = byId.get(k);
            if (!e || e.json !== json) { e = { json, packed: null }; byId.set(k, e); }
            if (!e.packed && now && json.length >= MIN_CHARS) { e.packed = pack(deflateSync(enc8.encode(json))); e.weak = true; }
            if (e.packed) { if (e.weak && canZip) pending = true; return joinSlot(rest, 'stateZ', JSON.stringify(e.packed)); }
            if (canZip && json.length >= MIN_CHARS) pending = true;
            return joinSlot(rest, 'state', json);
        }).join(',') + ']';
        // 지운 세이브의 기억은 버림
        [...byId.keys()].forEach(k => { if (k.startsWith(ns + '|') && !live.has(k)) byId.delete(k); });
        if (pending) schedule(key, value);
        origSet.call(ls, key, stored); // 저장 공간이 모자라면 여기서 오류 — 게임 코드가 받아서 안내 (뒤에서 압축해 다시 시도)
        lastRaw.set(key, stored); lastOut.set(key, value);
    }

    // 뒤에서 압축 — 끝나면 저장소가 그새 바뀌지 않았을 때만 압축본으로 다시 쓴다
    const timers = new Map();
    function schedule(key, value) {
        clearTimeout(timers.get(key));
        const g = gen.get(key);
        timers.set(key, setTimeout(() => compressNow(key, value, g), 400));
    }
    async function compressNow(key, value, g) {
        timers.delete(key);
        const ns = nsOf(key);
        const jobs = [...byId.entries()].filter(([k, e]) => k.startsWith(ns + '|') && (!e.packed || e.weak) && e.json.length >= MIN_CHARS);
        for (const [, e] of jobs) {
            try { e.packed = await zipText(e.json); e.weak = false; }
            catch (err) { console.warn('[세이브 압축] 압축 실패:', err); return; }
        }
        // 그동안 새로 쓴 게 없으면 같은 목록을 압축본으로 다시 쓴다 (공간이 모자라 실패했던 쓰기도 이때 다시)
        if (gen.get(key) !== g) return;
        try { writeSlots(key, value); }
        catch (err) { console.warn('[세이브 압축] 다시 쓰기 실패:', err); }
    }

    Storage.prototype.getItem = function (k) {
        const raw = origGet.call(this, k);
        if (this !== ls || !KEY_RE.test(String(k))) return raw;
        return readSlots(String(k), raw);
    };
    Storage.prototype.setItem = function (k, v) {
        if (this !== ls || !KEY_RE.test(String(k))) return origSet.call(this, k, v);
        try { writeSlots(String(k), String(v)); }
        catch (err) {
            // 공간이 모자라면 바뀐 세이브도 바로 압축해 다시 써 본다 — 그래도 안 들어가면 오류를 그대로 알려 저장 실패 안내가 뜨게
            const full = err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
            if (!full) throw err;
            writeSlots(String(k), String(v), true);
        }
    };

    // 예전(압축 전) 세이브도 열 때 한 번 압축해 둔다 — 첫 화면이 다 뜬 뒤에
    setTimeout(() => {
        if (!canZip) return;
        const keys = [];
        for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && KEY_RE.test(k)) keys.push(k); }
        for (const k of keys) {
            const raw = origGet.call(ls, k);
            if (!raw || raw.length < MIN_CHARS) continue;
            try { writeSlots(k, readSlots(k, raw)); } catch (e) { /* 다음에 */ }
        }
    }, 2500);

    window.HemiSlotStore = {
        // 저장소에 실제로 쓰인 글자 수 (압축 뒤)
        storedLength: key => { try { const r = origGet.call(ls, key); return r ? r.length : 0; } catch (e) { return 0; } },
        unzipText, zipText, inflate, deflateSync,
    };
})();
