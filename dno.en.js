        const IND_IDEOLOGY_ID = 9999;

        let ideologies = [
            { id:101, name:"Revolutionary Socialism" }, { id:102, name:"Socialism" },
            { id:103, name:"Progressivism" }, { id:104, name:"Liberalism" },
            { id:105, name:"Conservatism" }, { id:106, name:"Authoritarianism" },
            { id:107, name:"National Socialism" }, { id:IND_IDEOLOGY_ID, name:"Independent" }
        ];
        let parties = [
            { id:1, name:"National Reconstruction Party", color:"#2E2E2E", seatsHouse:140, seatsSenate:60, ideologyId:101, isRuling:true,  inHouse:true, inSenate:true },
            { id:2, name:"Reform Group",                  color:"#5D6D7E", seatsHouse:50,  seatsSenate:20, ideologyId:102, isRuling:false, inHouse:true, inSenate:true },
            { id:3, name:"Democratic Party",              color:"#3498DB", seatsHouse:60,  seatsSenate:10, ideologyId:105, isRuling:false, inHouse:true, inSenate:true },
            { id:4, name:"Socialist Party",               color:"#E74C3C", seatsHouse:40,  seatsSenate:5,  ideologyId:106, isRuling:false, inHouse:true, inSenate:true },
            { id:5, name:"Independent",                   color:"#F1C40F", seatsHouse:10,  seatsSenate:5,  ideologyId:IND_IDEOLOGY_ID, isRuling:false, inHouse:true, inSenate:true }
        ];
        let coalitions = [
            { id:'c1', name:"National Front", color:"#2E2E2E", members:[1], isRuling:true }
        ];

        // ===== BILL STATE =====
        let bills = [
            { id:'b1', title:'National Reconstruction Act §1',
              content:'All necessary measures for national reconstruction may be taken.\nThe executive may issue emergency decrees without parliamentary approval.',
              houseStatus:'pending', senateStatus:'pending', houseVote:null, senateVote:null }
        ];
        let activeBillId = null;
        let activeBillTagFilter = null;
        let activeArchiveTagFilter = null;
        let voteState = { house:{}, senate:{} };
        let currentVoteMode = 'none';
        let dotCache = { house:[], senate:[] };
        let manualSort = false;
        let currentMainTab = 'setup';
        let currentSubTab = { setup:'ideology', legislation:'bill' };

        // ===== INIT =====
        window.addEventListener('resize', () => simulate());
        window.onload = function() { toggleSystem(); refreshUI(); simulate(); renderBillList(); renderArchiveList(); syncBillSelect(); };

        // ===== BILL FUNCTIONS =====
        function toggleCustomThreshold() {
            const sel = document.getElementById('newBillThreshold');
            const wrap = document.getElementById('customThresholdWrap');
            const isCustom = sel.value === 'custom';
            wrap.style.display = isCustom ? 'flex' : 'none';
            if(isCustom) {
                const numer = document.getElementById('customNumer');
                const denom = document.getElementById('customDenom');
                const update = () => {
                    const n = parseInt(numer.value)||0, d = parseInt(denom.value)||1;
                    document.getElementById('customThresholdPreview').textContent = n&&d ? `= ${(n/d*100).toFixed(1)}%` : '';
                };
                numer.oninput = update; denom.oninput = update;
            }
        }

        function getThresholdValue() {
            const sel = document.getElementById('newBillThreshold');
            if(!sel || sel.value !== 'custom') return parseFloat(sel?.value) || 0.5;
            const n = parseInt(document.getElementById('customNumer').value);
            const d = parseInt(document.getElementById('customDenom').value);
            return (!n || !d) ? 0.5 : n / d;
        }

        function addBill() {
            const title = document.getElementById('newBillTitle').value.trim();
            const content = document.getElementById('newBillContent').value.trim();
            const threshold = getThresholdValue();
            const sel = document.getElementById('newBillThreshold');
            const isCustom = sel?.value === 'custom';
            const numer = isCustom ? parseInt(document.getElementById('customNumer').value)||null : null;
            const denom = isCustom ? parseInt(document.getElementById('customDenom').value)||null : null;
            const tagsRaw = document.getElementById('newBillTags')?.value || '';
            const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);
            if(!title) { alert('Please enter a bill title.'); return; }
            bills.push({ id:'b'+Date.now(), title, content, threshold, numer, denom, tags, houseStatus:'pending', senateStatus:'pending', houseVote:null, senateVote:null });
            document.getElementById('newBillTitle').value = '';
            document.getElementById('newBillContent').value = '';
            if(document.getElementById('newBillTags')) document.getElementById('newBillTags').value = '';
            renderBillList(); syncBillSelect();
        }

        // ===== TAG HELPERS =====
        function getAllTags(billSet) {
            const set = new Set();
            billSet.forEach(b => (b.tags||[]).forEach(t => set.add(t)));
            return [...set].sort();
        }

        function renderTagFilter(containerId, tags, activeTag, onToggle) {
            const el = document.getElementById(containerId);
            if(!el) return;
            if(tags.length === 0) { el.innerHTML = ''; return; }
            el.innerHTML = tags.map(t =>
                `<span class="tag-badge ${activeTag===t?'active':''}" onclick="(${onToggle})('${t}')"># ${t}</span>`
            ).join('');
        }

        function billMatchesFilter(bill, query, tagFilter) {
            const q = query?.toLowerCase() || '';
            if(tagFilter && !(bill.tags||[]).includes(tagFilter)) return false;
            if(q) return bill.title.toLowerCase().includes(q) || (bill.content||'').toLowerCase().includes(q) || (bill.tags||[]).some(t => t.toLowerCase().includes(q));
            return true;
        }

        function buildTagHtml(bill) {
            if(!bill.tags || bill.tags.length === 0) return '';
            return bill.tags.map(t => `<span class="tag-badge" style="cursor:default;"># ${t}</span>`).join('');
        }

        function getThresholdLabelEn(threshold, numer, denom) {
            if(threshold >= 1.0) return 'Unanimous';
            if(Math.abs(threshold - 0.5) < 0.01) return 'Majority';
            if(Math.abs(threshold - 0.667) < 0.01) return 'Supermajority (2/3)';
            if(numer && denom) return `${numer}/${denom}`;
            return `${Math.round(threshold*100)}%`;
        }

        function removeBill(id) {
            bills = bills.filter(b => b.id !== id);
            if(activeBillId === id) { activeBillId = null; voteState = {house:{}, senate:{}}; redrawAll(); updateVoteResults(); }
            renderBillList(); renderArchiveList(); syncBillSelect();
        }

        function selectBillForVote(id) {
            activeBillId = id;
            voteState = { house:{}, senate:{} };
            renderBillList(); renderActiveBillDisplay(); redrawAll();
            updateVoteResults(); updateConfirmButtons(); renderBulkPartyList();
        }

        function renderActiveBillDisplay() {
            const el = document.getElementById('voteActiveBillDisplay');
            const sel = document.getElementById('voteSelectBill');
            if(!activeBillId || !bills.find(b=>b.id===activeBillId)) {
                el.innerHTML = '<span style="color:#444;font-size:0.9rem;">Select a bill to debate...</span>';
                sel.value = ''; return;
            }
            const bill = bills.find(b=>b.id===activeBillId);
            el.innerHTML = `<div style="color:var(--tno-gold);font-size:1.1rem;margin-bottom:3px;">${bill.title}</div>
                ${bill.content ? `<div style="color:#666;font-size:0.85rem;white-space:pre-wrap;max-height:50px;overflow:hidden;">${bill.content}</div>` : ''}`;
            sel.value = activeBillId;
        }

        function syncBillSelect() {
            const sel = document.getElementById('voteSelectBill');
            if(!sel) return;
            sel.innerHTML = '<option value="">-- SELECT BILL --</option>';
            bills.filter(b => getBillOverallStatus(b) === 'pending').forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.title + getBillStatusSuffix(b);
                sel.appendChild(opt);
            });
            sel.value = activeBillId || '';
            renderActiveBillDisplay();
        }

        function getBillStatusSuffix(b) {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const parts = [];
            if(b.houseStatus !== 'pending') parts.push(b.houseStatus==='pass' ? hName+'✔' : hName+'✘');
            if(isBi && b.senateStatus !== 'pending') parts.push(b.senateStatus==='pass' ? sName+'✔' : sName+'✘');
            return parts.length ? ' ['+parts.join(' ')+']' : '';
        }

        function getBillOverallStatus(bill) {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            if(isBi) {
                if(bill.houseStatus==='fail' || bill.senateStatus==='skip') return 'failed';
                if(bill.houseStatus==='pass' && bill.senateStatus==='pass') return 'passed';
                if(bill.senateStatus==='fail') return 'failed';
            } else {
                if(bill.houseStatus==='pass') return 'passed';
                if(bill.houseStatus==='fail') return 'failed';
            }
            return 'pending';
        }

        function buildBillBadges(bill) {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            const overall = getBillOverallStatus(bill);
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const overallCfg = { passed:['passed','✔ PASSED'], failed:['failed','✘ FAILED'], pending:['pending','PENDING'] };
            const [oc, ol] = overallCfg[overall];
            let badges = `<span class="bill-status-badge ${oc}">${ol}</span>`;
            if(bill.houseStatus !== 'pending') {
                badges += `<span class="bill-status-badge ${bill.houseStatus==='pass'?'house-pass':'house-fail'}">${hName} ${bill.houseStatus==='pass'?'✔PASS':'✘FAIL'}</span>`;
                if(bill.houseVote) badges += `<span style="color:#555;font-size:0.8rem;">(Y${bill.houseVote.yea}/N${bill.houseVote.nay}/A${bill.houseVote.abs})</span>`;
            }
            if(isBi && bill.senateStatus !== 'pending' && bill.senateStatus !== 'skip') {
                badges += `<span class="bill-status-badge ${bill.senateStatus==='pass'?'senate-pass':'senate-fail'}">${sName} ${bill.senateStatus==='pass'?'✔PASS':'✘FAIL'}</span>`;
                if(bill.senateVote) badges += `<span style="color:#555;font-size:0.8rem;">(Y${bill.senateVote.yea}/N${bill.senateVote.nay}/A${bill.senateVote.abs})</span>`;
            }
            if(isBi && bill.senateStatus === 'skip') {
                badges += `<span class="bill-status-badge senate-fail">${sName} NOT TABLED</span>`;
            }
            return badges;
        }

        function renderBillList() {
            const container = document.getElementById('billList');
            if(!container) return;
            const query = document.getElementById('billSearchInput')?.value || '';
            const pending = bills.filter(b => getBillOverallStatus(b) === 'pending');

            const allTags = getAllTags(pending);
            renderTagFilter('billTagFilter', allTags, activeBillTagFilter, (t) => {
                activeBillTagFilter = activeBillTagFilter === t ? null : t;
                renderBillList();
            });

            const filtered = pending.filter(b => billMatchesFilter(b, query, activeBillTagFilter));

            if(pending.length === 0) {
                container.innerHTML = '<div style="color:#333;text-align:center;padding:20px;border:1px dashed #222;">No pending bills</div>';
                return;
            }
            if(filtered.length === 0) {
                container.innerHTML = '<div style="color:#444;text-align:center;padding:16px;border:1px dashed #222;">No results found</div>';
                return;
            }
            container.innerHTML = '';
            filtered.forEach(bill => {
                const isActive = bill.id === activeBillId;
                const thLabel = getThresholdLabelEn(bill.threshold || 0.5, bill.numer, bill.denom);
                const div = document.createElement('div');
                div.className = 'bill-card' + (isActive ? ' selected' : '');
                div.innerHTML = `
                    <div class="bill-card-title">
                        ${isActive ? '<span style="color:var(--tno-neon);font-size:0.85rem;">[IN DEBATE]</span>' : ''}
                        ${bill.title}
                    </div>
                    ${bill.content ? `<div class="bill-card-body">${bill.content}</div>` : ''}
                    <div style="margin-top:4px;">${buildTagHtml(bill)}</div>
                    <div class="bill-card-footer">
                        ${buildBillBadges(bill)}
                        <span style="color:#555;font-size:0.78rem;margin-left:4px;">[${thLabel}]</span>
                        <div style="margin-left:auto;display:flex;gap:5px;">
                            ${!isActive ? `<button class="bill-select-btn" onclick="selectBillForVote('${bill.id}'); switchTab('vote');">DEBATE</button>` : ''}
                            <button class="bill-remove-btn" onclick="removeBill('${bill.id}')">DEL</button>
                        </div>
                    </div>`;
                container.appendChild(div);
            });
        }

        function renderArchiveList() {
            const container = document.getElementById('archiveList');
            if(!container) return;
            const query = document.getElementById('archiveSearchInput')?.value || '';
            const done = [...bills.filter(b => getBillOverallStatus(b) !== 'pending')].reverse();

            const allTags = getAllTags(done);
            renderTagFilter('archiveTagFilter', allTags, activeArchiveTagFilter, (t) => {
                activeArchiveTagFilter = activeArchiveTagFilter === t ? null : t;
                renderArchiveList();
            });

            const filtered = done.filter(b => billMatchesFilter(b, query, activeArchiveTagFilter));

            if(done.length === 0) {
                container.innerHTML = '<div style="color:#333;text-align:center;padding:20px;border:1px dashed #222;">No completed bills</div>';
                return;
            }
            if(filtered.length === 0) {
                container.innerHTML = '<div style="color:#444;text-align:center;padding:16px;border:1px dashed #222;">No results found</div>';
                return;
            }
            container.innerHTML = '';
            filtered.forEach(bill => {
                const overall = getBillOverallStatus(bill);
                const thLabel = getThresholdLabelEn(bill.threshold || 0.5, bill.numer, bill.denom);
                const div = document.createElement('div');
                div.className = 'bill-card';
                div.style.borderLeftColor = overall === 'passed' ? 'var(--vote-yea)' : 'var(--vote-nay)';
                div.innerHTML = `
                    <div class="bill-card-title">${bill.title}</div>
                    ${bill.content ? `<div class="bill-card-body">${bill.content}</div>` : ''}
                    <div style="margin-top:4px;">${buildTagHtml(bill)}</div>
                    <div class="bill-card-footer">
                        ${buildBillBadges(bill)}
                        <span style="color:#555;font-size:0.78rem;margin-left:4px;">[${thLabel}]</span>
                        <div style="margin-left:auto;">
                            <button class="bill-remove-btn" onclick="removeBill('${bill.id}')">DEL</button>
                        </div>
                    </div>`;
                container.appendChild(div);
            });
        }

        // ===== CONFIRM CHAMBER VOTE =====
        function confirmChamberVote(chamber) {
            if(!activeBillId) { alert('Please select a bill first.'); return; }
            const bill = bills.find(b=>b.id===activeBillId);
            if(!bill) return;
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            if(chamber === 'senate') {
                if(bill.houseStatus === 'pending') { alert(`Please confirm the ${hName} vote first.`); return; }
                if(bill.houseStatus === 'fail') { alert(`Bills rejected by the ${hName} cannot be tabled in the Senate.`); return; }
            }
            const dots = dotCache[chamber];
            let yea=0, nay=0, abs=0;
            dots.forEach((d,i) => {
                if(d.partyName==='Vacant') return;
                const v = voteState[chamber][i]||'none';
                if(v==='yea') yea++; else if(v==='nay') nay++; else if(v==='abs') abs++;
            });
            const validSeats = dots.filter(d=>d.partyName!=='Vacant').length;
            const threshold = bill.threshold || 0.5;
            const required = threshold >= 1.0 ? validSeats : Math.floor(validSeats * threshold) + 1;
            const result = yea >= required ? 'pass' : 'fail';
            if(chamber==='house') {
                bill.houseStatus = result; bill.houseVote = {yea,nay,abs};
                if(isBi && result==='fail') { bill.senateStatus='skip'; bill.senateVote=null; }
            } else { bill.senateStatus=result; bill.senateVote={yea,nay,abs}; }
            renderBillList(); renderArchiveList(); syncBillSelect();
            updateVoteResults(); updateConfirmButtons();
            voteState[chamber] = {}; redrawAll(); renderBulkPartyList();
        }

        function updateConfirmButtons() {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            const bill = activeBillId ? bills.find(b=>b.id===activeBillId) : null;
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const hBtn = document.getElementById('hConfirmBtn');
            const sBtn = document.getElementById('sConfirmBtn');
            if(!hBtn || !sBtn) return;
            const hDone = bill && bill.houseStatus !== 'pending';
            hBtn.disabled = !!hDone;
            hBtn.style.opacity = hDone ? '0.35' : '1';
            hBtn.style.cursor = hDone ? 'not-allowed' : 'pointer';
            hBtn.textContent = hDone
                ? (bill.houseStatus==='pass' ? `✔ ${hName} VOTE CONFIRMED (PASSED)` : `✘ ${hName} VOTE CONFIRMED (FAILED)`)
                : `▶ CONFIRM ${hName} VOTE`;
            if(isBi) {
                const hPassed = bill && bill.houseStatus === 'pass';
                const sDone   = bill && bill.senateStatus !== 'pending' && bill.senateStatus !== 'skip';
                const sSkip   = bill && bill.senateStatus === 'skip';
                sBtn.disabled = !hPassed || sDone || sSkip;
                sBtn.style.opacity = (!hPassed || sDone || sSkip) ? '0.35' : '1';
                sBtn.style.cursor = (!hPassed || sDone || sSkip) ? 'not-allowed' : 'pointer';
                if(sSkip)         sBtn.textContent = `✘ ${hName} FAILED — ${sName} NOT TABLED`;
                else if(sDone)    sBtn.textContent = bill.senateStatus==='pass' ? `✔ ${sName} VOTE CONFIRMED (PASSED)` : `✘ ${sName} VOTE CONFIRMED (FAILED)`;
                else if(!hPassed) sBtn.textContent = `[##] UNLOCKS AFTER ${hName} PASSES`;
                else              sBtn.textContent = `▶ CONFIRM ${sName} VOTE`;
            }
        }

        function setVoteMode(mode) {
            currentVoteMode = mode;
            const labels = { yea:'▲ YEA (GREEN)', nay:'▼ NAY (RED)', abs:'— ABSTAIN (GREY)', none:'✕ CLEAR' };
            const colors  = { yea:'#00ff88', nay:'#ff2244', abs:'#888888', none:'#888' };
            const el = document.getElementById('currentModeLabel');
            el.textContent = labels[mode] || 'NONE';
            el.style.color = colors[mode] || '#888';
        }

        function clearAllVotes() {
            voteState = { house:{}, senate:{} };
            redrawAll(); updateVoteResults(); renderBulkPartyList();
        }

        // ===== BULK PARTY VOTE =====
        function getBulkChamber() { return document.querySelector('input[name="bulkChamber"]:checked')?.value || 'house'; }

        function applyPartyVote(partyName, vote) {
            const chamber = getBulkChamber();
            const chambers = chamber === 'both' ? ['house','senate'] : [chamber];
            chambers.forEach(ch => {
                dotCache[ch].forEach((d,i) => {
                    if(d.partyName === partyName && d.partyName !== 'Vacant') {
                        if(vote === 'none') delete voteState[ch][i];
                        else voteState[ch][i] = vote;
                    }
                });
            });
            redrawAll(); updateVoteResults(); renderBulkPartyList();
        }

        function getPartyDominantVote(partyName) {
            const ch = getBulkChamber() === 'both' ? 'house' : getBulkChamber();
            const counts = { yea:0, nay:0, abs:0, none:0 };
            dotCache[ch].forEach((d,i) => { if(d.partyName===partyName) counts[voteState[ch][i]||'none']++; });
            const max = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
            return max[1] > 0 ? max[0] : 'none';
        }

        function renderBulkPartyList() {
            const container = document.getElementById('bulkPartyList');
            if(!container) return;
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            const senateWrap = document.getElementById('bulkSenateRadioWrap');
            if(senateWrap) senateWrap.style.opacity = isBi ? '1' : '0.3';
            const chamber = getBulkChamber();
            const refCh = chamber === 'both' ? 'house' : chamber;
            const seen = new Set(), partyOrder = [];
            dotCache[refCh].forEach(d => { if(d.partyName!=='Vacant' && !seen.has(d.partyName)) { seen.add(d.partyName); partyOrder.push(d); } });
            if(partyOrder.length === 0) {
                container.innerHTML = '<div style="color:#444;font-size:0.9rem;text-align:center;padding:8px;">Run simulation first</div>';
                return;
            }
            container.innerHTML = '';
            partyOrder.forEach(d => {
                const dominant = getPartyDominantVote(d.partyName);
                const row = document.createElement('div');
                row.className = 'bulk-party-row';
                row.innerHTML = `
                    <div class="bulk-party-dot" style="background:${d.color};"></div>
                    <span class="bulk-party-name" title="${d.partyName}">${d.partyName}</span>
                    <button class="bulk-vote-btn yea ${dominant==='yea'?'active-yea':''}" onclick="applyPartyVote('${d.partyName}','yea')">▲YEA</button>
                    <button class="bulk-vote-btn nay ${dominant==='nay'?'active-nay':''}" onclick="applyPartyVote('${d.partyName}','nay')">▼NAY</button>
                    <button class="bulk-vote-btn abs ${dominant==='abs'?'active-abs':''}" onclick="applyPartyVote('${d.partyName}','abs')">—ABS</button>
                    <button class="bulk-vote-btn clr" onclick="applyPartyVote('${d.partyName}','none')">✕</button>`;
                container.appendChild(row);
            });
        }

        function getVoteColor(v) {
            if(v==='yea') return '#00ff88';
            if(v==='nay') return '#ff2244';
            if(v==='abs') return '#888888';
            return null;
        }

        // ===== CANVAS CLICK =====
        function handleCanvasClick(e, chamber) {
            const cvs = e.target, rect = cvs.getBoundingClientRect();
            const dpr = window.devicePixelRatio||1;
            const mx = (e.clientX-rect.left)*(cvs.width/dpr/rect.width);
            const my = (e.clientY-rect.top)*(cvs.height/dpr/rect.height);
            let hit=-1, minDist=Infinity;
            dotCache[chamber].forEach((d,i) => { const dist=Math.hypot(mx-d.x,my-d.y); if(dist<=d.r*1.5&&dist<minDist){minDist=dist;hit=i;} });
            if(hit===-1) return;
            const prev = voteState[chamber][hit]||'none';
            if(currentVoteMode==='none'||currentVoteMode===prev) delete voteState[chamber][hit];
            else voteState[chamber][hit] = currentVoteMode;
            redrawAll(); updateVoteResults();
        }

        // ===== TOOLTIP =====
        function handleCanvasMouseMove(e, chamber) {
            const cvs = e.target, rect = cvs.getBoundingClientRect();
            const dpr = window.devicePixelRatio||1;
            const mx = (e.clientX-rect.left)*(cvs.width/dpr/rect.width);
            const my = (e.clientY-rect.top)*(cvs.height/dpr/rect.height);
            const tip = document.getElementById('tooltipBox');
            let hit=-1;
            dotCache[chamber].forEach((d,i) => { if(Math.hypot(mx-d.x,my-d.y)<=d.r*1.5) hit=i; });
            if(hit !== -1) {
                const d = dotCache[chamber][hit];
                const voteLabels = { yea:'YEA', nay:'NAY', abs:'ABSTAIN', none:'NOT VOTED' };
                const vs = voteState[chamber][hit]||'none';
                tip.style.display='block';
                tip.style.left=(e.clientX+14)+'px';
                tip.style.top=(e.clientY-8)+'px';
                tip.textContent = `${d.partyName} | ${d.ideology} | ${voteLabels[vs]}`;
            } else { tip.style.display='none'; }
        }

        function handleCanvasMouseLeave() { document.getElementById('tooltipBox').style.display='none'; }

        // ===== VOTE RESULTS =====
        function updateVoteResults() {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            calcAndRenderResult('house', parseInt(document.getElementById('houseTotal').value)||300, 'h');
            if(isBi) calcAndRenderResult('senate', parseInt(document.getElementById('senateTotal').value)||100, 's');
        }

        function calcAndRenderResult(chamber, total, prefix) {
            let yea=0,nay=0,abs=0;
            const dots = dotCache[chamber];
            dots.forEach((d,i) => {
                if(d.partyName==='Vacant') return;
                const v = voteState[chamber][i]||'none';
                if(v==='yea') yea++; else if(v==='nay') nay++; else if(v==='abs') abs++;
            });
            const validSeats = dots.filter(d=>d.partyName!=='Vacant').length;
            const none = validSeats-yea-nay-abs, t=validSeats||1;
            const bill = activeBillId ? bills.find(b=>b.id===activeBillId) : null;
            const threshold = bill?.threshold || 0.5;
            const required = threshold >= 1.0 ? validSeats : Math.floor(validSeats * threshold) + 1;

            document.getElementById(prefix+'CntYea').textContent=yea;
            document.getElementById(prefix+'CntNay').textContent=nay;
            document.getElementById(prefix+'CntAbs').textContent=abs;
            document.getElementById(prefix+'CntNone').textContent=none;
            document.getElementById(prefix+'BarYea').style.width=(yea/t*100).toFixed(1)+'%';
            document.getElementById(prefix+'BarNay').style.width=(nay/t*100).toFixed(1)+'%';
            document.getElementById(prefix+'BarAbs').style.width=(abs/t*100).toFixed(1)+'%';
            document.getElementById(prefix+'BarNone').style.width=(none/t*100).toFixed(1)+'%';

            // Threshold marker on bar
            const barOuter = document.getElementById(prefix+'BarYea')?.parentElement;
            if(barOuter) {
                barOuter.style.position='relative'; barOuter.style.overflow='visible';
                let marker = barOuter.querySelector('.threshold-marker');
                if(!marker) { marker=document.createElement('div'); marker.className='threshold-marker'; barOuter.appendChild(marker); }
                let labelEl = barOuter.querySelector('.threshold-label');
                if(!labelEl) { labelEl=document.createElement('div'); labelEl.className='threshold-label'; barOuter.appendChild(labelEl); }
                const pct = Math.min(threshold*100, 100).toFixed(1);
                const thLabel = threshold>=1.0?'Unanimous':Math.abs(threshold-0.5)<0.01?'Majority':Math.abs(threshold-0.667)<0.01?'2/3':(bill?.numer&&bill?.denom?`${bill.numer}/${bill.denom}`:`${Math.round(threshold*100)}%`);
                marker.style.cssText=`position:absolute;left:${pct}%;top:0;bottom:0;width:2px;background:var(--tno-gold);box-shadow:0 0 5px var(--tno-gold);z-index:2;pointer-events:none;`;
                labelEl.style.cssText=`position:absolute;left:${pct}%;top:-18px;transform:translateX(-50%);font-size:0.75rem;color:var(--tno-gold);white-space:nowrap;pointer-events:none;font-family:'VT323',monospace;`;
                labelEl.textContent=`${thLabel} (${required})`;
            }

            // Info line
            const infoEl = document.getElementById(prefix+'VoteInfo');
            const thLabel2 = threshold>=1.0?'Unanimous':Math.abs(threshold-0.5)<0.01?'Majority':Math.abs(threshold-0.667)<0.01?'2/3':(bill?.numer&&bill?.denom?`${bill.numer}/${bill.denom}`:`${Math.round(threshold*100)}%`);
            if(infoEl) {
                if(yea+nay+abs===0)  infoEl.textContent=`Required: ${required} seats (${thLabel2})`;
                else if(yea>=required) infoEl.textContent=`${yea} / ${required} (${thLabel2})`;
                else                   infoEl.textContent=`${yea} / ${required} (${thLabel2}, ${required-yea} short)`;
            }

            // Verdict
            const vEl = document.getElementById(prefix+'Verdict');
            vEl.className='vote-verdict';
            const billTitle = activeBillId ? (bills.find(b=>b.id===activeBillId)?.title||'Bill') : 'Bill';
            if(yea+nay+abs===0) { vEl.textContent='-- AWAITING VOTE --'; vEl.classList.add('verdict-pending'); }
            else if(yea>=required) { vEl.textContent=`✔ PASSED (${billTitle})`; vEl.classList.add('verdict-pass'); }
            else                   { vEl.textContent=`✘ FAILED (${billTitle})`; vEl.classList.add('verdict-fail'); }
        }

        // ===== REDRAW =====
        function redrawAll() {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            if(isBi) redrawChamber('senateCanvas','senate');
            redrawChamber('houseCanvas','house');
        }

        function redrawChamber(cvsId, chamber) {
            const dots = dotCache[chamber];
            if(!dots||dots.length===0) return;
            const cvs = document.getElementById(cvsId);
            const dpr = window.devicePixelRatio||1;
            const ctx = cvs.getContext('2d');
            const W=cvs.width/dpr, H=cvs.height/dpr;
            ctx.clearRect(0,0,W,H);
            const highlightGov = document.getElementById('chkGovHighlight').checked;
            dots.forEach((d,i) => {
                const vote=voteState[chamber][i]||'none', voteColor=getVoteColor(vote);
                ctx.beginPath(); ctx.arc(d.x,d.y,d.r*0.85,0,Math.PI*2);
                ctx.fillStyle=voteColor||d.color; ctx.fill();
                if(d.isRuling&&highlightGov) { ctx.shadowColor="rgba(255,215,0,.8)"; ctx.shadowBlur=10; ctx.strokeStyle="#ffd700"; ctx.lineWidth=2; ctx.stroke(); ctx.shadowBlur=0; }
                else if(d.strokeColor) { ctx.strokeStyle=d.strokeColor; ctx.lineWidth=1; ctx.stroke(); }
                if(voteColor) { ctx.beginPath(); ctx.arc(d.x,d.y,d.r*0.85,0,Math.PI*2); ctx.strokeStyle=d.color; ctx.lineWidth=2.5; ctx.stroke(); }
            });
            const CX=dots[0]?.cx??W/2, CY=dots[0]?.cy??H-40;
            ctx.fillStyle="#fff"; ctx.font="30px 'VT323'"; ctx.textAlign="center"; ctx.fillText(dots.length,CX,CY);
            ctx.font="16px 'VT323'"; ctx.fillStyle="var(--tno-neon)"; ctx.fillText("SEATS",CX,CY+25);
        }

        // ===== SAVE / LOAD =====
        function getAppState() {
            const systemType = document.querySelector('input[name="systemType"]:checked')?.value||'bicameral';
            return {
                meta: { app:"DATANET_PARLIAMENT_SIM", version:3, savedAt:new Date().toISOString() },
                ui: { currentMainTab, currentSubTab },
                config: {
                    systemType,
                    highlightGov: document.getElementById('chkGovHighlight')?.checked??true,
                    senateName: document.getElementById('senateNameInput')?.value??"Senate",
                    houseName:  document.getElementById('houseNameInput')?.value??"House",
                    senateTotal: parseInt(document.getElementById('senateTotal')?.value)||100,
                    houseTotal:  parseInt(document.getElementById('houseTotal')?.value)||300
                },
                parliament: { ideologies, parties, coalitions, manualSort },
                legislation: {
                    bills,
                    activeBillId,
                    voteState,
                    activeBillTagFilter,
                    activeArchiveTagFilter
                }
            };
        }

        function setAppState(state) {
            if(!state||typeof state!=="object") throw new Error("Invalid state");
            const parl = state.parliament||state.data;
            if(!parl||!Array.isArray(parl.parties)||!Array.isArray(parl.ideologies)||!Array.isArray(parl.coalitions)) throw new Error("Invalid parliament data");
            ideologies=parl.ideologies; parties=parl.parties; coalitions=parl.coalitions; manualSort=parl.manualSort??false;
            const leg=state.legislation||{};
            bills=(Array.isArray(leg.bills)?leg.bills:(Array.isArray(state.data?.bills)?state.data.bills:[]))
                .map(b=>({ tags:[], threshold:0.5, numer:null, denom:null, ...b }));
            activeBillId=leg.activeBillId??null;
            voteState=leg.voteState??{house:{},senate:{}};
            activeBillTagFilter    = leg.activeBillTagFilter    ?? null;
            activeArchiveTagFilter = leg.activeArchiveTagFilter ?? null;
            const cfg=state.config||{};
            const radio=document.querySelector(`input[name="systemType"][value="${cfg.systemType||'bicameral'}"]`);
            if(radio) radio.checked=true;
            const $=id=>document.getElementById(id);
            if($('senateNameInput')) $('senateNameInput').value=cfg.senateName??"Senate";
            if($('houseNameInput'))  $('houseNameInput').value=cfg.houseName??"House";
            if($('senateTotal'))     $('senateTotal').value=cfg.senateTotal??100;
            if($('houseTotal'))      $('houseTotal').value=cfg.houseTotal??300;
            if($('chkGovHighlight')) $('chkGovHighlight').checked=cfg.highlightGov??true;
            const uiMain=state.ui?.currentMainTab||'setup';
            const uiSub=state.ui?.currentSubTab||{setup:'ideology',legislation:'bill'};
            currentSubTab=uiSub;
            toggleSystem(); updateNames(); refreshUI(); simulate();
            renderBillList(); renderArchiveList(); syncBillSelect(); renderActiveBillDisplay(); updateConfirmButtons(); renderBulkPartyList();
            switchMainTab(uiMain);
            switchSubTab(uiMain,uiSub[uiMain]||(uiMain==='setup'?'ideology':'bill'),false);
        }

        function downloadJSON(filename, obj) {
            const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
            const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
        }

        window.addEventListener("load", () => {
            const btnSave=document.getElementById("btnSaveJson");
            const btnLoad=document.getElementById("btnLoadJson");
            const fileInput=document.getElementById("fileLoadJson");
            if(btnSave) btnSave.addEventListener("click", () => { downloadJSON(`parliament-save-en-${new Date().toISOString().replace(/[:.]/g,"-")}.json`, getAppState()); });
            if(btnLoad&&fileInput) {
                btnLoad.addEventListener("click", () => fileInput.click());
                fileInput.addEventListener("change", async () => {
                    const file=fileInput.files?.[0]; if(!file) return;
                    try { setAppState(JSON.parse(await file.text())); }
                    catch(e) { alert("LOAD FAILED: File corrupted or wrong format."); }
                    finally { fileInput.value=""; }
                });
            }
            document.getElementById('houseCanvas').addEventListener('click', e=>handleCanvasClick(e,'house'));
            document.getElementById('senateCanvas').addEventListener('click', e=>handleCanvasClick(e,'senate'));
            document.getElementById('houseCanvas').addEventListener('mousemove', e=>handleCanvasMouseMove(e,'house'));
            document.getElementById('senateCanvas').addEventListener('mousemove', e=>handleCanvasMouseMove(e,'senate'));
            document.getElementById('houseCanvas').addEventListener('mouseleave', handleCanvasMouseLeave);
            document.getElementById('senateCanvas').addEventListener('mouseleave', handleCanvasMouseLeave);
        });

        // ===== 2-LEVEL TAB SWITCHING =====
        function switchMainTab(main) {
            currentMainTab=main;
            document.querySelectorAll('.main-tab-btn').forEach(b=>b.classList.remove('active'));
            document.getElementById('mainTab'+main.charAt(0).toUpperCase()+main.slice(1)).classList.add('active');
            document.querySelectorAll('.main-tab-content').forEach(c=>c.classList.remove('active'));
            document.getElementById('mainContent'+main.charAt(0).toUpperCase()+main.slice(1)).classList.add('active');
            switchSubTab(main,currentSubTab[main],false);
        }

        function switchSubTab(main, sub, doMainSwitch=true) {
            if(doMainSwitch&&currentMainTab!==main) switchMainTab(main);
            currentSubTab[main]=sub;
            const groupEl=document.getElementById('mainContent'+main.charAt(0).toUpperCase()+main.slice(1));
            groupEl.querySelectorAll('.sub-tab-btn').forEach(b=>b.classList.remove('active'));
            groupEl.querySelectorAll('.sub-tab-content').forEach(c=>c.classList.remove('active'));
            const btn=document.getElementById('subTab'+sub.charAt(0).toUpperCase()+sub.slice(1));
            const content=document.getElementById('content'+sub.charAt(0).toUpperCase()+sub.slice(1));
            if(btn) btn.classList.add('active');
            if(content) content.classList.add('active');
            refreshUI();
            if(sub==='vote') { renderBulkPartyList(); syncBillSelect(); renderActiveBillDisplay(); updateConfirmButtons(); }
            if(sub==='bill') renderBillList();
            if(sub==='archive') renderArchiveList();
        }

        function switchTab(tabName) {
            if(['ideology','house','senate','coalition'].includes(tabName)) switchSubTab('setup',tabName);
            else if(['bill','vote','archive'].includes(tabName)) switchSubTab('legislation',tabName);
        }

        function toggleSystem() {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            document.getElementById('senateSection').style.display = isBi ? 'block' : 'none';
            document.getElementById('subTabSenate').style.display  = isBi ? '' : 'none';
            document.getElementById('senateVoteResult').style.display = isBi ? 'block' : 'none';
            if(!isBi&&currentSubTab['setup']==='senate') switchSubTab('setup','ideology');
            renderBillList(); renderArchiveList(); syncBillSelect(); updateNames();
        }

        function updateNames() {
            const sName=document.getElementById('senateNameInput').value;
            const hName=document.getElementById('houseNameInput').value;
            document.getElementById('senateTitle').innerText="> "+sName;
            document.getElementById('houseTitle').innerText="> "+hName;
            document.getElementById('houseVoteResultTitle').textContent=`[ ${hName} VOTE RESULT ]`;
            document.getElementById('senateVoteResultTitle').textContent=`[ ${sName} VOTE RESULT ]`;
            document.getElementById('subTabHouse').innerText=hName;
            document.getElementById('subTabSenate').innerText=sName;
            const bulkH=document.getElementById('bulkHouseLabel');
            const bulkS=document.getElementById('bulkSenateLabel');
            if(bulkH) bulkH.textContent=hName;
            if(bulkS) bulkS.textContent=sName;
            updateConfirmButtons();
        }

        function refreshUI() { renderIdeologyList(); renderPartyList('house'); renderPartyList('senate'); renderCoalitions(); }

        function isValidHex(hex) { return /^#[0-9A-F]{6}$/i.test(hex); }

        // ===== PARTY SORT =====
        function autoSortParties() {
            manualSort=false;
            parties.sort((a,b) => {
                const ia=ideologies.findIndex(i=>i.id===a.ideologyId);
                const ib=ideologies.findIndex(i=>i.id===b.ideologyId);
                if(a.ideologyId===IND_IDEOLOGY_ID&&b.ideologyId!==IND_IDEOLOGY_ID) return 1;
                if(b.ideologyId===IND_IDEOLOGY_ID&&a.ideologyId!==IND_IDEOLOGY_ID) return -1;
                return ia-ib;
            });
            refreshUI(); simulate();
        }

        function moveParty(idx, dir) {
            manualSort=true;
            const target=idx+dir;
            if(target<0||target>=parties.length) return;
            [parties[idx],parties[target]]=[parties[target],parties[idx]];
            refreshUI(); simulate();
        }

        function renderIdeologyList() {
            const container=document.getElementById('ideologyList');
            container.innerHTML='';
            ideologies.forEach((ide,index) => {
                const div=document.createElement('div');
                div.style.display='flex'; div.style.gap='5px'; div.style.marginBottom='5px';
                div.innerHTML=`<div style="display:flex;flex-direction:column;">
                    <button class="order-btn" onclick="moveIdeology(${index},-1)">▲</button>
                    <button class="order-btn" onclick="moveIdeology(${index},1)">▼</button></div>
                    <input type="text" value="${ide.name}" onchange="updateIdeology(${index},'name',this.value)">
                    <button class="remove-btn" onclick="removeIdeology(${index})">X</button>`;
                container.appendChild(div);
            });
        }

        function renderPartyList(type) {
            const container=document.getElementById(type==='house'?'partyListHouse':'partyListSenate');
            container.innerHTML='';
            const sortBar=document.createElement('div');
            sortBar.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:5px 8px;background:#0a0c10;border:1px solid #222;font-size:0.85rem;';
            sortBar.innerHTML=`<span style="color:${manualSort?'var(--tno-gold)':'#555'};">${manualSort?'⚠ MANUAL ORDER':'✦ AUTO-SORTED BY IDEOLOGY'}</span>
                <button onclick="autoSortParties()" style="background:transparent;border:1px solid ${manualSort?'var(--tno-gold)':'#333'};color:${manualSort?'var(--tno-gold)':'#444'};font-family:'VT323',monospace;font-size:0.85rem;padding:2px 8px;cursor:pointer;">↺ AUTO-SORT</button>`;
            container.appendChild(sortBar);
            const visibleParties=parties.map((p,idx)=>({...p,originalIdx:idx})).filter(p=>type==='house'?p.inHouse:p.inSenate);
            if(visibleParties.length===0){ container.insertAdjacentHTML('beforeend','<div style="text-align:center;color:#555;">[NO DATA]</div>'); return; }
            visibleParties.forEach((p,visIdx) => {
                const idx=p.originalIdx;
                const div=document.createElement('div');
                div.className=`card-item ${p.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor=p.color;
                const seatKey=type==='house'?'seatsHouse':'seatsSenate';
                const isFirst=visIdx===0, isLast=visIdx===visibleParties.length-1;
                div.innerHTML=`<div class="card-header">
                    <div style="display:flex;flex-direction:column;flex-shrink:0;">
                        <button class="order-btn" onclick="moveParty(${idx},-1)" ${isFirst?'disabled style="opacity:0.2"':''}>▲</button>
                        <button class="order-btn" onclick="moveParty(${idx},1)" ${isLast?'disabled style="opacity:0.2"':''}>▼</button>
                    </div>
                    <input type="text" value="${p.name}" onchange="updateParty(${idx},'name',this.value)" placeholder="Party name">
                    <div class="color-input-group">
                        <input type="text" class="hex-input" value="${p.color}" onchange="updatePartyColorText(this,${idx})">
                        <input type="color" value="${p.color}" oninput="updatePartyColorPicker(this,${idx})">
                    </div>
                    <button class="remove-btn" onclick="removeParty(${idx})">X</button></div>
                    <div style="display:grid;grid-template-columns:2fr 1fr;gap:5px;">
                        <select onchange="updateParty(${idx},'ideologyId',parseInt(this.value))">
                            ${ideologies.map(ide=>`<option value="${ide.id}" ${p.ideologyId===ide.id?'selected':''}>${ide.name}</option>`).join('')}
                        </select>
                        <input type="number" value="${p[seatKey]}" min="0" onchange="updateParty(${idx},'${seatKey}',parseInt(this.value)||0)">
                    </div>
                    <div style="margin-top:5px;font-size:0.9rem;">
                        <input type="checkbox" id="lnk_${type}_${idx}" ${type==='house'?(p.inSenate?'checked':''):(p.inHouse?'checked':'')}
                            onchange="togglePartyParticipation(${idx},'${type==='house'?'inSenate':'inHouse'}',this.checked)">
                        <label for="lnk_${type}_${idx}" style="display:inline;cursor:pointer;">SYNC ${type==='house'?'SENATE':'HOUSE'}</label>
                    </div>`;
                container.appendChild(div);
            });
        }

        function renderCoalitions() {
            const container=document.getElementById('coalitionList');
            container.innerHTML='';
            coalitions.forEach((coal,cIdx) => {
                const div=document.createElement('div');
                div.className=`card-item ${coal.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor=coal.color;
                const memberChecks=parties.map(p=>`<div style="display:flex;align-items:center;border-bottom:1px solid #222;">
                    <span style="width:10px;height:10px;background:${p.color};display:inline-block;margin-right:5px;"></span>
                    <label style="flex:1;margin:0;cursor:pointer;" for="c${cIdx}_p${p.id}">${p.name}</label>
                    <input type="checkbox" id="c${cIdx}_p${p.id}" ${coal.members.includes(p.id)?'checked':''} onchange="toggleCoalitionMember('${coal.id}',${p.id},this.checked)">
                    </div>`).join('');
                div.innerHTML=`<div class="card-header">
                    <input type="text" value="${coal.name}" onchange="updateCoalition('${coal.id}','name',this.value)">
                    <div class="color-input-group">
                        <input type="text" class="hex-input" value="${coal.color}" onchange="updateCoalitionColorText(this,'${coal.id}')">
                        <input type="color" value="${coal.color}" oninput="updateCoalitionColorPicker(this,'${coal.id}')">
                    </div>
                    <button class="remove-btn" onclick="removeCoalition('${coal.id}')">X</button></div>
                    <div class="ruling-selector ${coal.isRuling?'active':''}" onclick="setRuling('coalition','${coal.id}')">
                        [ ${coal.isRuling?'ACTIVE GOVERNMENT':'SET AS GOVERNMENT'} ]
                    </div>
                    <div class="coalition-members">${memberChecks}</div>`;
                container.appendChild(div);
            });
            const hdr=document.createElement('div');
            hdr.style.marginTop="20px"; hdr.style.borderTop="1px dashed #444"; hdr.innerText="SINGLE PARTY RULE"; hdr.style.color="#666";
            container.appendChild(hdr);
            parties.forEach(p => {
                const div=document.createElement('div');
                div.className=`ruling-selector ${p.isRuling?'active':''}`;
                div.onclick=()=>setRuling('party',p.id);
                div.innerHTML=`<span style="background:${p.color};width:8px;height:8px;"></span> ${p.name}`;
                container.appendChild(div);
            });
        }

        function addIdeology() { ideologies.push({id:Date.now(),name:"New Ideology"}); refreshUI(); }
        function addIndependentIdeology() { if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) ideologies.push({id:IND_IDEOLOGY_ID,name:"Independent"}); refreshUI(); simulate(); }
        function removeIdeology(idx) { if(ideologies.length>1){const id=ideologies[idx].id;ideologies.splice(idx,1);parties.forEach(p=>{if(p.ideologyId===id)p.ideologyId=ideologies[0].id;});refreshUI();simulate();} }
        function updateIdeology(i,k,v) { ideologies[i][k]=v; refreshUI(); simulate(); }
        function moveIdeology(i,d) { if((d===-1&&i>0)||(d===1&&i<ideologies.length-1)){[ideologies[i],ideologies[i+d]]=[ideologies[i+d],ideologies[i]];refreshUI();simulate();} }
        function addParty() { parties.push({id:Date.now(),name:"New Party",color:"#555555",seatsHouse:0,seatsSenate:0,ideologyId:ideologies[ideologies.length-1].id,isRuling:false,inHouse:true,inSenate:true}); refreshUI(); }
        function addIndependentParty() { if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) addIndependentIdeology(); parties.push({id:Date.now(),name:"Independent",color:"#999999",seatsHouse:1,seatsSenate:0,ideologyId:IND_IDEOLOGY_ID,isRuling:false,inHouse:true,inSenate:true}); refreshUI(); simulate(); }
        function removeParty(i) { const pid=parties[i].id; parties.splice(i,1); coalitions.forEach(c=>c.members=c.members.filter(x=>x!==pid)); refreshUI(); simulate(); }
        function updateParty(i,k,v) { parties[i][k]=v; if(k==='name')refreshUI(); simulate(); }
        function togglePartyParticipation(i,f,v) { parties[i][f]=v; refreshUI(); simulate(); }
        function updatePartyColorText(e,i) { if(isValidHex(e.value)){parties[i].color=e.value.toUpperCase();e.nextElementSibling.value=parties[i].color;refreshUI();simulate();} }
        function updatePartyColorPicker(e,i) { parties[i].color=e.value.toUpperCase();e.previousElementSibling.value=parties[i].color;simulate(); }
        function addCoalition() { coalitions.push({id:'c'+Date.now(),name:"New Coalition",color:"#ffffff",members:[],isRuling:false}); refreshUI(); }
        function removeCoalition(id) { coalitions=coalitions.filter(c=>c.id!==id); refreshUI(); simulate(); }
        function updateCoalition(id,k,v) { const c=coalitions.find(x=>x.id===id); if(c){c[k]=v;simulate();} }
        function updateCoalitionColorText(e,id) { if(isValidHex(e.value)){const c=coalitions.find(x=>x.id===id);if(c){c.color=e.value.toUpperCase();e.nextElementSibling.value=c.color;simulate();}} }
        function updateCoalitionColorPicker(e,id) { const c=coalitions.find(x=>x.id===id);if(c){c.color=e.value.toUpperCase();e.previousElementSibling.value=c.color;simulate();} }
        function toggleCoalitionMember(cid,pid,chk) { if(chk){coalitions.forEach(c=>c.members=c.members.filter(x=>x!==pid));coalitions.find(c=>c.id===cid).members.push(pid);}else{const c=coalitions.find(x=>x.id===cid);c.members=c.members.filter(x=>x!==pid);} refreshUI(); simulate(); }
        function setRuling(t,id) { parties.forEach(p=>p.isRuling=false);coalitions.forEach(c=>c.isRuling=false);if(t==='party')parties.find(p=>p.id===id).isRuling=true;else coalitions.find(c=>c.id===id).isRuling=true;refreshUI();simulate(); }

        // ===== SIMULATE & DRAW =====
        function simulate() {
            const isBi = document.querySelector('input[name="systemType"]:checked').value === 'bicameral';
            const highlightGov = document.getElementById('chkGovHighlight').checked;
            const sTotal = parseInt(document.getElementById('senateTotal').value)||100;
            const hTotal = parseInt(document.getElementById('houseTotal').value)||300;

            if(!manualSort) {
                parties.sort((a,b) => {
                    const ia=ideologies.findIndex(i=>i.id===a.ideologyId);
                    const ib=ideologies.findIndex(i=>i.id===b.ideologyId);
                    if(a.ideologyId===IND_IDEOLOGY_ID&&b.ideologyId!==IND_IDEOLOGY_ID) return 1;
                    if(b.ideologyId===IND_IDEOLOGY_ID&&a.ideologyId!==IND_IDEOLOGY_ID) return -1;
                    return ia-ib;
                });
            }

            const getMap = (targetTotal, chamberKey, checkKey) => {
                let map=[];
                parties.filter(p=>p[checkKey]).forEach(p => {
                    const coal=coalitions.find(c=>c.members.includes(p.id));
                    const isGov=(coal&&coal.isRuling)||p.isRuling;
                    const stroke = highlightGov&&isGov ? "var(--tno-gold)" : (coal?coal.color:null);
                    for(let k=0;k<p[chamberKey];k++) {
                        if(map.length>=targetTotal) break;
                        map.push({color:p.color,partyName:p.name,ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||"?",coalitionName:coal?.name,strokeColor:stroke,isRuling:isGov});
                    }
                });
                while(map.length<targetTotal) map.push({color:'#222',partyName:'Vacant',ideology:'-',strokeColor:'#333',isRuling:false});
                return map;
            };

            const hMap=getMap(hTotal,'seatsHouse','inHouse');
            drawChamber('houseCanvas',hMap,hTotal,'house'); updateStats('houseStats',hMap,hTotal);
            if(isBi) {
                const sMap=getMap(sTotal,'seatsSenate','inSenate');
                drawChamber('senateCanvas',sMap,sTotal,'senate'); updateStats('senateStats',sMap,sTotal);
            }
            updateVoteResults(); renderBulkPartyList(); syncBillSelect();
        }

        function drawChamber(cvsId, map, total, chamber) {
            const cvs=document.getElementById(cvsId), parent=cvs.parentElement;
            const width=parent.clientWidth-34, dpr=window.devicePixelRatio||1, heightBuffer=120;
            cvs.width=width*dpr; cvs.height=(width/2+heightBuffer)*dpr;
            cvs.style.width=width+"px"; cvs.style.height=(width/2+heightBuffer)+"px";
            const ctx=cvs.getContext('2d'); ctx.scale(dpr,dpr);
            const CX=width/2, CY=(width/2+heightBuffer)-40;
            ctx.clearRect(0,0,width,cvs.height/dpr); if(total<=0) return;
            const minR=width*0.15, maxR=(width/2)-10;
            const calc=(rows)=>{ const dR=(maxR-minR)/rows/2.2; let cap=0,rRows=[]; for(let i=0;i<rows;i++){const r=minR+i*(dR*2.2)+dR;const c=Math.floor((Math.PI*r)/(dR*2.2));rRows.push({r,c});cap+=c;} return{cap,rows,dotR:dR,rRows}; };
            let best=null; for(let r=3;r<30;r++){let res=calc(r);if(res.cap>=total){best=res;break;}} if(!best) best=calc(30);
            const {dotR,rRows}=best; let pts=[],totalCap=rRows.reduce((a,b)=>a+b.c,0),curP=0;
            rRows.forEach((row,rI)=>{
                let count=Math.round(total*(row.c/totalCap));
                if(rI===rRows.length-1) count=total-curP; curP+=count;
                for(let i=0;i<count;i++){let ang=Math.PI-(Math.PI/(count>1?count-1:1))*i;if(count===1)ang=Math.PI/2;pts.push({x:CX+row.r*Math.cos(ang),y:CY-row.r*Math.sin(ang)});}
            });
            pts.forEach(p=>{p.angle=Math.atan2(CY-p.y,p.x-CX);}); pts.sort((a,b)=>b.angle-a.angle);
            dotCache[chamber]=pts.map((pt,i)=>({x:pt.x,y:pt.y,r:dotR,cx:CX,cy:CY,color:map[i]?.color||'#222',strokeColor:map[i]?.strokeColor||null,isRuling:map[i]?.isRuling||false,partyName:map[i]?.partyName||'Vacant',ideology:map[i]?.ideology||'-'}));
            const highlightGov=document.getElementById('chkGovHighlight').checked;
            pts.forEach((pt,i)=>{
                if(i>=map.length) return; const d=map[i];
                const vote=voteState[chamber][i]||'none', voteColor=getVoteColor(vote);
                ctx.beginPath(); ctx.arc(pt.x,pt.y,dotR*0.85,0,Math.PI*2);
                ctx.fillStyle=voteColor||d.color; ctx.fill();
                if(d.isRuling&&highlightGov){ctx.shadowColor="rgba(255,215,0,.8)";ctx.shadowBlur=10;ctx.strokeStyle="#ffd700";ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;}
                else if(d.strokeColor){ctx.strokeStyle=d.strokeColor;ctx.lineWidth=1;ctx.stroke();}
                if(voteColor){ctx.beginPath();ctx.arc(pt.x,pt.y,dotR*0.85,0,Math.PI*2);ctx.strokeStyle=d.color;ctx.lineWidth=2.5;ctx.stroke();}
            });
            ctx.fillStyle="#fff"; ctx.font="30px 'VT323'"; ctx.textAlign="center"; ctx.fillText(total,CX,CY);
            ctx.font="16px 'VT323'"; ctx.fillStyle="var(--tno-neon)"; ctx.fillText("SEATS",CX,CY+25);
        }

        function updateStats(id, map, total) {
            const el=document.getElementById(id); if(total===0){el.innerHTML="";return;}
            let stats={};
            const vac=map.filter(x=>x.partyName==='Vacant').length, valid=total-vac, maj=Math.floor(valid/2)+1;
            map.forEach(m=>{
                if(m.partyName==='Vacant') return;
                let k=m.coalitionName?'c_'+m.coalitionName:'p_'+m.partyName;
                if(!stats[k]) stats[k]={name:m.coalitionName||m.partyName,count:0,color:m.strokeColor||m.color,isRuling:m.isRuling,parties:{}};
                stats[k].count++;
                if(!stats[k].parties[m.partyName]) stats[k].parties[m.partyName]={n:0,c:m.color,i:m.ideology};
                stats[k].parties[m.partyName].n++;
            });
            let html="";
            Object.values(stats).sort((a,b)=>b.isRuling-a.isRuling||b.count-a.count).forEach(s=>{
                let status="";
                if(s.isRuling){status=`<span style="color:var(--tno-gold);font-weight:bold;">[GOV]</span>`;if(s.count>=maj)status+=` <span style="color:#0f0;">[MAJ]</span>`;else status+=` <span style="color:#f00;">[MIN]</span>`;}
                else if(s.count>=maj) status=`<span style="color:#f00;">[OPP MAJ]</span>`;
                const subs=Object.entries(s.parties).map(([n,d])=>`<span class="legend-pill"><span style="background:${d.c};width:8px;height:8px;display:inline-block;"></span>${n}(${d.n})</span>`).join('');
                html+=`<div class="stat-block" style="border-left-color:${s.isRuling?'var(--tno-gold)':s.color};">
                    <div style="display:flex;justify-content:space-between;font-size:1.1rem;"><span>${s.name} : ${s.count} (${((s.count/total)*100).toFixed(1)}%)</span><span>${status}</span></div>
                    <div style="margin-top:5px;opacity:0.8;">${subs}</div></div>`;
            });
            el.innerHTML=html;
        }
    
