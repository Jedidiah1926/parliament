        const IND_IDEOLOGY_ID = 9999;

        // ── Independent member data ──────────────
        let independents = []; // { id, chamber, seatIndex, name, photo, ideologyId }

        function getIndependentParty() {
            let p = parties.find(p => p.ideologyId === IND_IDEOLOGY_ID);
            if(!p) {
                // Auto-create the independent ideology slot if missing (fallback for older save files, etc.)
                if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) {
                    ideologies.push({ id: IND_IDEOLOGY_ID, name: "Independent" });
                }
                p = { id: 'ind_auto_'+Date.now(), name: "Independent", color: "#999999",
                    seatsHouse: 10, seatsSenate: 5, seatsThird: 0, ideologyId: IND_IDEOLOGY_ID,
                    isRuling: false, inHouse: true, inSenate: true, inThird: true,
                    leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false,
                    description: "", factions: [], abbr: "" };
                parties.push(p);
            }
            return p;
        }

        // Auto-sync the independents array to match changes in the independent party's seat count
        function syncIndependents() {
            const indParty = getIndependentParty();
            const valid = chamberList();
            if(!indParty) { independents = []; return; }
            valid.forEach(ch => {
                const seatKey = seatKeyFor(ch);
                const total = indParty[seatKey] || 0;
                let list = independents.filter(x=>x.chamber===ch).sort((a,b)=>a.seatIndex-b.seatIndex);
                if(list.length < total) {
                    for(let i=list.length+1; i<=total; i++) {
                        independents.push({ id:'ind_'+ch+'_'+Date.now()+'_'+i, chamber:ch, seatIndex:i, name:'', photo:'', ideologyId:null });
                    }
                } else if(list.length > total) {
                    const removeIds = list.slice(total).map(x=>x.id);
                    independents = independents.filter(x=>!removeIds.includes(x.id));
                }
                // Renumber seat indices
                independents.filter(x=>x.chamber===ch).sort((a,b)=>a.seatIndex-b.seatIndex).forEach((x,i)=>{ x.seatIndex = i+1; });
            });
            // Remove leftover data for chambers that no longer exist (e.g. after switching to unicameral)
            independents = independents.filter(x => valid.includes(x.chamber));
        }

        // ── Parliament configuration helpers (unicameral/bicameral/tricameral) ──────────
        function getSystemType() { return document.querySelector('input[name="systemType"]:checked')?.value || 'bicameral'; }
        function hasSenateChamber() { return getSystemType() !== 'unicameral'; }
        function hasThirdChamber()  { return getSystemType() === 'tricameral'; }
        function seatKeyFor(chamber) { return 'seats' + chamber.charAt(0).toUpperCase() + chamber.slice(1); }
        function inKeyFor(chamber)   { return 'in'    + chamber.charAt(0).toUpperCase() + chamber.slice(1); }
        function chamberList() {
            const list = ['house'];
            if(hasSenateChamber()) list.push('senate');
            if(hasThirdChamber())  list.push('third');
            return list;
        }

        let ideologies = [
            { id: 101, name: "Revolutionary Socialism" },
            { id: 102, name: "Socialism" },
            { id: 103, name: "Progressivism" },
            { id: 104, name: "Liberalism" },
            { id: 105, name: "Conservatism" },
            { id: 106, name: "Authoritarianism" },
            { id: 107, name: "National Socialism" }
        ];

        let parties = [
            { id: 1, name: "National Reconstruction Party", color: "#2E2E2E", seatsHouse: 140, seatsSenate: 60, seatsThird: 0, ideologyId: 101, isRuling: true,  inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, description: "", factions: [] },
            { id: 2, name: "Reform Group",   color: "#5D6D7E", seatsHouse: 50,  seatsSenate: 20, seatsThird: 0, ideologyId: 102, isRuling: false, inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, description: "", factions: [] },
            { id: 3, name: "Democratic Party",     color: "#3498DB", seatsHouse: 60,  seatsSenate: 10, seatsThird: 0, ideologyId: 105, isRuling: false, inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, description: "", factions: [] },
            { id: 4, name: "Socialist Party",     color: "#E74C3C", seatsHouse: 40,  seatsSenate: 5, seatsThird: 0,  ideologyId: 106, isRuling: false, inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, description: "", factions: [] }
        ];

        let coalitions = [
            { id: 'c1', name: "National Front", color: "#2E2E2E", members: [1], isRuling: true , leaderName: "", leaderPhoto: "", leadPartyId: null, externalSupporters: [], externalSupportLabel: "External Support", syncWithLeadParty: false },
        ];

        let currentTab = 'house';

        // ===== BILL STATE =====
        // bill: { id, title, content, houseStatus: 'pending'|'pass'|'fail', senateStatus: 'pending'|'pass'|'fail',
        //         houseVote: {yea,nay,abs}, senateVote: {yea,nay,abs},
        //         version, parentBillId, isAmendment, voteHistory: [{chamber,result,date,yea,nay,abs,total,required,at}] }
        let bills = [
            { id: 'b1', title: 'National Reconstruction Special Act, Article 1', threshold: 0.5, tags: ['Reconstruction', 'Emergency'],
              content: 'All measures necessary for national reconstruction may be taken.\nThe executive may issue emergency decrees without the consent of Parliament.',
              houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
              version: 1, parentBillId: null, isAmendment: false, voteHistory: [] }
        ];
        let activeBillId = null;
        let amendmentSourceId = null;

        // ===== Tag filter state =====
        let activeBillTagFilter = null;
        let activeArchiveTagFilter = null;

        // ===== VOTE STATE =====
        let voteState = { house: {}, senate: {}, third: {} };
        let currentVoteMode = 'none';
        let dotCache = { house: [], senate: [], third: [], _elec: [] };

        // ===== BILL FUNCTIONS =====
        function toggleCustomThreshold() {
            const sel = document.getElementById('newBillThreshold');
            const wrap = document.getElementById('customThresholdWrap');
            const isCustom = sel.value === 'custom';
            wrap.style.display = isCustom ? 'flex' : 'none';
            if(isCustom) {
                const numer = document.getElementById('customNumer');
                const denom = document.getElementById('customDenom');
                const updatePreview = () => {
                    const n = parseInt(numer.value) || 0;
                    const d = parseInt(denom.value) || 1;
                    document.getElementById('customThresholdPreview').textContent =
                        n && d ? `= ${(n/d*100).toFixed(1)}%` : '';
                };
                numer.oninput = updatePreview;
                denom.oninput = updatePreview;
            }
        }

        function getThresholdValue() {
            const sel = document.getElementById('newBillThreshold');
            if(sel.value !== 'custom') return parseFloat(sel.value) || 0.5;
            const n = parseInt(document.getElementById('customNumer').value);
            const d = parseInt(document.getElementById('customDenom').value);
            if(!n || !d || d === 0) return 0.5;
            return n / d;
        }

        function getThresholdLabel(threshold, numer, denom) {
            if(threshold >= 1.0) return 'Unanimous';
            if(Math.abs(threshold - 0.5) < 0.01) return 'Majority';
            if(Math.abs(threshold - 0.667) < 0.01) return 'Supermajority (2/3)';
            if(numer && denom) return `${numer}/${denom}`;
            return `${Math.round(threshold*100)}%`;
        }

        function addBill() {
            const title = document.getElementById('newBillTitle').value.trim();
            const content = document.getElementById('newBillContent').value.trim();
            const threshold = getThresholdValue();
            const sel = document.getElementById('newBillThreshold');
            const isCustom = sel.value === 'custom';
            const numer = isCustom ? parseInt(document.getElementById('customNumer').value) || null : null;
            const denom = isCustom ? parseInt(document.getElementById('customDenom').value) || null : null;
            const tagsRaw = document.getElementById('newBillTags')?.value || '';
            const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);
            if(!title) { alert('Please enter a bill title.'); return; }
            const amendedBill = amendmentSourceId ? bills.find(b => b.id === amendmentSourceId) : null;
            const version = amendedBill ? (amendedBill.version || 1) + 1 : 1;
            bills.push({ id: 'b'+Date.now(), title, content, threshold, numer, denom, tags,
                houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
                version, parentBillId: amendedBill ? amendedBill.id : null, isAmendment: !!amendedBill, voteHistory: [] });
            document.getElementById('newBillTitle').value = '';
            document.getElementById('newBillContent').value = '';
            document.getElementById('newBillTags').value = '';
            amendmentSourceId = null;
            renderAmendmentBanner();
            renderBillList(); syncBillSelect();
        }

        // ── Propose an amendment ──────────────────
        function startAmendment(id) {
            const orig = bills.find(b => b.id === id);
            if(!orig) return;
            if(getBillOverallStatus(orig) !== 'passed') { alert('Only passed bills can have an amendment proposed.'); return; }
            amendmentSourceId = id;
            switchMainTab('legislation');
            switchSubTab('legislation', 'bill');
            document.getElementById('newBillTitle').value = orig.title + ' (Amendment)';
            document.getElementById('newBillContent').value = orig.content || '';
            document.getElementById('newBillTags').value = (orig.tags || []).join(', ');
            renderAmendmentBanner();
        }

        function cancelAmendment() {
            amendmentSourceId = null;
            renderAmendmentBanner();
        }

        function renderAmendmentBanner() {
            const banner = document.getElementById('amendmentBanner');
            const text = document.getElementById('amendmentBannerText');
            if(!banner || !text) return;
            const orig = amendmentSourceId ? bills.find(b => b.id === amendmentSourceId) : null;
            if(!orig) { banner.classList.remove('show'); return; }
            text.innerHTML = `📝 Amending:<br>${orig.title} (v${orig.version || 1})`;
            banner.classList.add('show');
        }

        function getAmendmentsOf(id) {
            return bills.filter(b => b.parentBillId === id);
        }

        function removeBill(id) {
            bills = bills.filter(b => b.id !== id);
            if(activeBillId === id) { activeBillId = null; voteState = {house:{}, senate:{}, third:{}}; redrawAll(); updateVoteResults(); }
            renderBillList();
            syncBillSelect();
        }

        function selectBillForVote(id) {
            activeBillId = id;
            voteState = { house: {}, senate: {}, third: {} };
            renderBillList();
            renderActiveBillDisplay();
            redrawAll();
            updateVoteResults();
            elecUpdateLabels();
            updateConfirmButtons();
            renderBulkPartyList();
            const dateInput = document.getElementById('voteDateInput');
            if(dateInput) {
                const bill = bills.find(b=>b.id===id);
                dateInput.value = bill?.voteDate || '';
            }
        }

        function updateVoteDate(val) {
            if(!activeBillId) return;
            const bill = bills.find(b=>b.id===activeBillId);
            if(bill) { bill.voteDate = val.trim(); renderBillList(); renderArchiveList(); }
        }

        function renderActiveBillDisplay() {
            const el = document.getElementById('voteActiveBillDisplay');
            const sel = document.getElementById('voteSelectBill');
            if(!activeBillId || !bills.find(b=>b.id===activeBillId)) {
                el.innerHTML = '<span style="color:#444; font-size:0.9rem;">Select a bill...</span>';
                sel.value = '';
                return;
            }
            const bill = bills.find(b=>b.id===activeBillId);
            el.innerHTML = `
                <div style="color:var(--tno-gold); font-size:1rem; margin-bottom:3px;">${bill.title}</div>
                ${bill.content ? `<div style="color:#666; font-size:0.8rem; white-space:pre-wrap; max-height:50px; overflow:hidden;">${bill.content}</div>` : ''}
            `;
            sel.value = activeBillId;
        }

        function syncBillSelect() {
            const sel = document.getElementById('voteSelectBill');
            if(sel) {
                sel.innerHTML = '<option value="">-- Select Bill --</option>';
                bills.filter(b => getBillOverallStatus(b) === 'pending').forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.id;
                    opt.textContent = b.title + getBillStatusSuffix(b);
                    sel.appendChild(opt);
                });
                sel.value = activeBillId || '';
                renderActiveBillDisplay();
            }
            // Also sync the "Edit Existing Bill" dropdown in the Submit tab (only pending bills can be edited)
            const editSel = document.getElementById('editBillSelect');
            if(editSel) {
                const prevEdit = editSel.value;
                editSel.innerHTML = '<option value="">-- Select bill to edit --</option>';
                bills.filter(b => getBillOverallStatus(b) === 'pending').forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.id;
                    opt.textContent = b.title + getBillStatusSuffix(b);
                    editSel.appendChild(opt);
                });
                if(bills.find(b=>b.id===prevEdit)) editSel.value = prevEdit;
            }
        }

        // ── Edit existing bill (Submit tab) ──────────────
        let editingBillId = null;
        function selectBillForEdit(id) {
            editingBillId = id || null;
            const form = document.getElementById('editBillForm');
            if(!editingBillId) { form.style.display = 'none'; return; }
            const bill = bills.find(b=>b.id===editingBillId);
            if(!bill) { form.style.display = 'none'; return; }
            form.style.display = 'block';
            document.getElementById('editBillTitle').value = bill.title || '';
            document.getElementById('editBillContent').value = bill.content || '';
            document.getElementById('editBillTags').value = (bill.tags||[]).join(', ');
            const isCustom = bill.numer && bill.denom;
            const threshSel = document.getElementById('editBillThreshold');
            threshSel.value = isCustom ? 'custom' : String(bill.threshold ?? 0.5);
            toggleEditCustomThreshold();
            if(isCustom) {
                document.getElementById('editCustomNumer').value = bill.numer;
                document.getElementById('editCustomDenom').value = bill.denom;
                const preview = document.getElementById('editCustomThresholdPreview');
                if(preview) preview.textContent = `= ${(bill.numer/bill.denom*100).toFixed(1)}%`;
            }
        }

        function toggleEditCustomThreshold() {
            const sel = document.getElementById('editBillThreshold');
            const wrap = document.getElementById('editCustomThresholdWrap');
            const isCustom = sel.value === 'custom';
            wrap.style.display = isCustom ? 'flex' : 'none';
            if(isCustom) {
                const numer = document.getElementById('editCustomNumer');
                const denom = document.getElementById('editCustomDenom');
                const updatePreview = () => {
                    const n = parseInt(numer.value) || 0;
                    const d = parseInt(denom.value) || 1;
                    document.getElementById('editCustomThresholdPreview').textContent =
                        n && d ? `= ${(n/d*100).toFixed(1)}%` : '';
                };
                numer.oninput = updatePreview;
                denom.oninput = updatePreview;
            }
        }

        function saveEditBill() {
            if(!editingBillId) return;
            const bill = bills.find(b=>b.id===editingBillId);
            if(!bill) return;
            const title = document.getElementById('editBillTitle').value.trim();
            if(!title) { alert('Please enter a bill title.'); return; }
            bill.title = title;
            bill.content = document.getElementById('editBillContent').value.trim();
            const tagsRaw = document.getElementById('editBillTags')?.value || '';
            bill.tags = tagsRaw.split(',').map(t=>t.trim()).filter(t=>t.length>0);
            const threshSel = document.getElementById('editBillThreshold');
            const isCustom = threshSel.value === 'custom';
            if(isCustom) {
                const n = parseInt(document.getElementById('editCustomNumer').value);
                const d = parseInt(document.getElementById('editCustomDenom').value);
                if(n && d) { bill.threshold = n/d; bill.numer = n; bill.denom = d; }
            } else {
                bill.threshold = parseFloat(threshSel.value) || 0.5;
                bill.numer = null; bill.denom = null;
            }
            renderBillList(); renderArchiveList(); syncBillSelect(); renderActiveBillDisplay();
            // Reset to "-- Select bill to edit --" after saving
            editingBillId = null;
            const editSel = document.getElementById('editBillSelect');
            if(editSel) editSel.value = '';
            const editForm = document.getElementById('editBillForm');
            if(editForm) editForm.style.display = 'none';
            alert('Bill updated.');
        }

        function getBillStatusSuffix(b) {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const parts = [];
            if(b.houseStatus !== 'pending') parts.push(b.houseStatus === 'pass' ? 'House✔' : 'House✘');
            if(isBi && b.senateStatus !== 'pending' && b.senateStatus !== 'skip') parts.push(b.senateStatus === 'pass' ? 'Senate✔' : 'Senate✘');
            if(isTri && b.thirdStatus !== 'pending' && b.thirdStatus !== 'skip') parts.push(b.thirdStatus === 'pass' ? 'Third✔' : 'Third✘');
            return parts.length ? ' [' + parts.join(' ') + ']' : '';
        }

        function getBillOverallStatus(bill) {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            if(bill.houseStatus === 'fail') return 'failed';
            if(isBi) {
                if(bill.senateStatus === 'skip' || bill.senateStatus === 'fail') return 'failed';
            }
            if(isTri) {
                if(bill.thirdStatus === 'skip' || bill.thirdStatus === 'fail') return 'failed';
            }
            const lastGate = isTri ? bill.thirdStatus : (isBi ? bill.senateStatus : bill.houseStatus);
            if(bill.houseStatus === 'pass' && (!isBi || bill.senateStatus === 'pass') && (!isTri || bill.thirdStatus === 'pass')) return 'passed';
            return 'pending';
        }

        // Generate common bill-card badges
        function buildBillBadges(bill) {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const overall = getBillOverallStatus(bill);
            const overallCfg = {
                passed: ['passed', '✔ Finally Passed'],
                failed: ['failed', '✘ Finally Failed'],
                pending: ['pending', 'Pending'],
            };
            const [oc, ol] = overallCfg[overall];

            // Each line (overall status / per-chamber status) is stacked as its own row so wrapping is always clean
            const rows = [];

            let overallRow = `<span class="bill-status-badge ${oc}">${ol}</span>`;
            if(bill.voteDate) overallRow += `<span style="color:#666;font-size:0.75rem;">📅 ${bill.voteDate}</span>`;
            rows.push(overallRow);

            if(bill.houseStatus !== 'pending') {
                const hName = document.getElementById('houseNameInput')?.value || 'House';
                let row = `<span class="bill-status-badge ${bill.houseStatus==='pass'?'house-pass':'house-fail'}">${hName} ${bill.houseStatus==='pass'?'✔Passed':'✘Failed'}</span>`;
                if(bill.houseVote) row += `<span style="color:#555; font-size:0.75rem;">(Yea ${bill.houseVote.yea}/Nay ${bill.houseVote.nay}/Abs ${bill.houseVote.abs})</span>`;
                rows.push(row);
            }
            if(isBi && bill.senateStatus !== 'pending' && bill.senateStatus !== 'skip') {
                const sName = document.getElementById('senateNameInput')?.value || 'Senate';
                let row = `<span class="bill-status-badge ${bill.senateStatus==='pass'?'senate-pass':'senate-fail'}">${sName} ${bill.senateStatus==='pass'?'✔Passed':'✘Failed'}</span>`;
                if(bill.senateVote) row += `<span style="color:#555; font-size:0.75rem;">(Yea ${bill.senateVote.yea}/Nay ${bill.senateVote.nay}/Abs ${bill.senateVote.abs})</span>`;
                rows.push(row);
            }
            if(isBi && bill.senateStatus === 'skip') {
                const sName = document.getElementById('senateNameInput')?.value || 'Senate';
                rows.push(`<span class="bill-status-badge senate-fail">${sName} Not Tabled</span>`);
            }
            if(isTri && bill.thirdStatus !== 'pending' && bill.thirdStatus !== 'skip') {
                const tName = document.getElementById('thirdNameInput')?.value || 'Third';
                let row = `<span class="bill-status-badge ${bill.thirdStatus==='pass'?'third-pass':'third-fail'}">${tName} ${bill.thirdStatus==='pass'?'✔Passed':'✘Failed'}</span>`;
                if(bill.thirdVote) row += `<span style="color:#555; font-size:0.75rem;">(Yea ${bill.thirdVote.yea}/Nay ${bill.thirdVote.nay}/Abs ${bill.thirdVote.abs})</span>`;
                rows.push(row);
            }
            if(isTri && bill.thirdStatus === 'skip') {
                const tName = document.getElementById('thirdNameInput')?.value || 'Third';
                rows.push(`<span class="bill-status-badge third-fail">${tName} Not Tabled</span>`);
            }
            if((bill.version || 1) > 1 || bill.isAmendment) {
                let row = '';
                if((bill.version || 1) > 1) row += `<span class="bill-version-badge">v${bill.version}</span>`;
                if(bill.isAmendment) {
                    const orig = bills.find(b => b.id === bill.parentBillId);
                    row += `<span class="bill-version-badge" title="Original bill being amended">↩ Amends: ${orig ? orig.title : '(deleted bill)'}</span>`;
                }
                rows.push(row);
            }

            return rows.map(r => `<div style="display:flex; align-items:center; gap:6px; width:100%;">${r}</div>`).join('');
        }

        // Bill detailed vote timeline + amendment list HTML — rendered as the same bar graph as the live vote-result panel
        function buildBillHistoryHtml(bill) {
            const chamberLabel = ch => ch === 'senate' ? (document.getElementById('senateNameInput')?.value || 'Senate')
                : ch === 'third' ? (document.getElementById('thirdNameInput')?.value || 'Third')
                : (document.getElementById('houseNameInput')?.value || 'House');
            const history = bill.voteHistory || [];
            const historyRows = history.length === 0
                ? '<div style="color:#444;">No vote history</div>'
                : history.map(h => {
                    if(h.result === 'skip') return `<div class="vote-verdict verdict-pending" style="margin:6px 0;">⊘ ${chamberLabel(h.chamber)} Not Tabled</div>`;
                    const total = h.total || 1;
                    const none = Math.max(0, total - h.yea - h.nay - h.abs);
                    const threshold = h.threshold ?? 0.5;
                    const threshPct = Math.min(threshold * 100, 100).toFixed(1);
                    const threshLabel = getThresholdLabel(threshold, h.numer, h.denom);
                    const dateStr = h.date ? ` · ${h.date}` : '';
                    return `
                        <div class="vote-result-wrap" style="margin-top:8px; padding:8px;">
                            <div class="vote-result-title">[ ${chamberLabel(h.chamber)} Vote Result ]${dateStr}</div>
                            <div class="vote-bar-outer">
                                <div class="vote-bar-yea" style="width:${(h.yea/total*100).toFixed(1)}%"></div>
                                <div class="vote-bar-nay" style="width:${(h.nay/total*100).toFixed(1)}%"></div>
                                <div class="vote-bar-abs" style="width:${(h.abs/total*100).toFixed(1)}%"></div>
                                <div class="vote-bar-none" style="width:${(none/total*100).toFixed(1)}%"></div>
                                <div style="position:absolute; left:${threshPct}%; top:0; bottom:0; width:2px; background:var(--tno-gold); box-shadow:0 0 5px var(--tno-gold); z-index:2;"></div>
                                <div style="position:absolute; left:${threshPct}%; top:-18px; transform:translateX(-50%); font-size:0.72rem; color:var(--tno-gold); white-space:nowrap; font-family:'NeoDunggeunmo','VT323',monospace;">${threshLabel} (${h.required} seats)</div>
                            </div>
                            <div class="vote-counts">
                                <span class="vc-yea">Yea <b>${h.yea}</b></span>
                                <span class="vc-nay">Nay <b>${h.nay}</b></span>
                                <span class="vc-abs">Abs <b>${h.abs}</b></span>
                                <span class="vc-none">No Vote <b>${none}</b></span>
                            </div>
                            <div class="vote-verdict ${h.result==='pass'?'verdict-pass':'verdict-fail'}">${h.result==='pass'?'✔ Passed':'✘ Failed'}</div>
                        </div>`;
                }).join('');

            const amendments = getAmendmentsOf(bill.id);
            const amendmentRows = amendments.length === 0 ? '' : `
                <div style="margin-top:6px; padding-top:6px; border-top:1px dotted #1a1a1a;">
                    <div style="color:#666; margin-bottom:2px;">Amendments (${amendments.length})</div>
                    ${amendments.map(a => `<div class="bill-history-entry">v${a.version} — ${a.title} [${buildBillBadges(a).replace(/<[^>]+>/g,' ').trim() || 'Pending'}]</div>`).join('')}
                </div>`;

            return `<div class="bill-history" id="billHistory-${bill.id}">${historyRows}${amendmentRows}</div>`;
        }

        function toggleBillHistory(id) {
            const el = document.getElementById('billHistory-' + id);
            if(el) el.classList.toggle('open');
        }

        // ===== Tag helpers =====
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
            if(q) {
                return bill.title.toLowerCase().includes(q)
                    || (bill.content||'').toLowerCase().includes(q)
                    || (bill.tags||[]).some(t => t.toLowerCase().includes(q));
            }
            return true;
        }

        function buildTagHtml(bill) {
            if(!bill.tags || bill.tags.length === 0) return '';
            return bill.tags.map(t => `<span class="tag-badge" style="cursor:default;"># ${t}</span>`).join('');
        }

        // Bill submit tab — pending bills only + search/tag filter
        function renderBillList() {
            const container = document.getElementById('billList');
            if(!container) return;
            const query = document.getElementById('billSearchInput')?.value || '';
            const pending = bills.filter(b => getBillOverallStatus(b) === 'pending');

            // Render tag filter bar
            const allTags = getAllTags(pending);
            renderTagFilter('billTagFilter', allTags, activeBillTagFilter, (t) => {
                activeBillTagFilter = activeBillTagFilter === t ? null : t;
                renderBillList();
            });

            const filtered = pending.filter(b => billMatchesFilter(b, query, activeBillTagFilter));

            if(pending.length === 0) {
                container.innerHTML = '<div style="color:#333; text-align:center; padding:20px; border:1px dashed #222;">No pending bills</div>';
                return;
            }
            if(filtered.length === 0) {
                container.innerHTML = '<div style="color:#444; text-align:center; padding:16px; border:1px dashed #222;">No search results</div>';
                return;
            }

            container.innerHTML = '';
            filtered.forEach(bill => {
                const isActive = bill.id === activeBillId;
                const thLabel = getThresholdLabel(bill.threshold || 0.5, bill.numer, bill.denom);
                const div = document.createElement('div');
                div.className = 'bill-card' + (isActive ? ' selected' : '');
                div.innerHTML = `
                    <div class="bill-card-title">
                        ${isActive ? '<span style="color:var(--tno-neon); font-size:0.8rem;">[Under Review]</span>' : ''}
                        ${bill.title}
                    </div>
                    ${bill.content ? `<div class="bill-card-body">${bill.content}</div>` : ''}
                    <div style="margin-top:4px;">${buildTagHtml(bill)}</div>
                    <div class="bill-card-footer">
                        ${buildBillBadges(bill)}
                        <span style="color:#555; font-size:0.75rem; margin-left:4px;">[${thLabel}]</span>
                        ${(bill.voteHistory||[]).length > 0 ? `<span class="bill-history-toggle" onclick="event.stopPropagation(); toggleBillHistory('${bill.id}')">▾ Details</span>` : ''}
                        <div style="margin-left:auto; display:flex; gap:5px;">
                            ${!isActive ? `<button class="bill-select-btn" onclick="selectBillForVote('${bill.id}'); switchTab('vote');">Select for Review</button>` : ''}
                            <button class="bill-remove-btn" onclick="removeBill('${bill.id}')">Delete</button>
                        </div>
                    </div>
                    ${(bill.voteHistory||[]).length > 0 ? buildBillHistoryHtml(bill) : ''}
                `;
                container.appendChild(div);
            });
        }

        // Archive tab — passed/failed bills only + search/tag filter
        function renderArchiveList() {
            const container = document.getElementById('archiveList');
            if(!container) return;
            const query = document.getElementById('archiveSearchInput')?.value || '';
            const done = [...bills.filter(b => getBillOverallStatus(b) !== 'pending')].reverse();

            // Render tag filter bar
            const allTags = getAllTags(done);
            renderTagFilter('archiveTagFilter', allTags, activeArchiveTagFilter, (t) => {
                activeArchiveTagFilter = activeArchiveTagFilter === t ? null : t;
                renderArchiveList();
            });

            const filtered = done.filter(b => billMatchesFilter(b, query, activeArchiveTagFilter));

            if(done.length === 0) {
                container.innerHTML = '<div style="color:#333; text-align:center; padding:20px; border:1px dashed #222;">No completed bills</div>';
                return;
            }
            if(filtered.length === 0) {
                container.innerHTML = '<div style="color:#444; text-align:center; padding:16px; border:1px dashed #222;">No search results</div>';
                return;
            }

            container.innerHTML = '';
            filtered.forEach(bill => {
                const overall = getBillOverallStatus(bill);
                const thLabel = getThresholdLabel(bill.threshold || 0.5, bill.numer, bill.denom);
                const div = document.createElement('div');
                div.className = 'bill-card';
                div.style.borderLeftColor = overall === 'passed' ? 'var(--vote-yea)' : 'var(--vote-nay)';
                div.innerHTML = `
                    <div class="bill-card-title">${bill.title}</div>
                    ${bill.content ? `<div class="bill-card-body">${bill.content}</div>` : ''}
                    <div style="margin-top:4px;">${buildTagHtml(bill)}</div>
                    <div class="bill-card-footer">
                        ${buildBillBadges(bill)}
                        <span style="color:#555; font-size:0.75rem; margin-left:4px;">[${thLabel}]</span>
                        <span class="bill-history-toggle" onclick="event.stopPropagation(); toggleBillHistory('${bill.id}')">▾ Details</span>
                        <div style="display:flex; gap:5px;">
                            ${overall === 'passed' ? `<button class="bill-amend-btn" onclick="startAmendment('${bill.id}')">📝 Propose Amendment</button>` : ''}
                            <button class="bill-remove-btn" onclick="removeBill('${bill.id}')">Delete</button>
                        </div>
                    </div>
                    ${buildBillHistoryHtml(bill)}
                `;
                container.appendChild(div);
            });
        }

        // ===== CONFIRM CHAMBER VOTE =====
        function confirmChamberVote(chamber) {
            if(!activeBillId) { alert('Please select a bill for review first.'); return; }
            const bill = bills.find(b=>b.id===activeBillId);
            if(!bill) return;

            const isBi  = hasSenateChamber();
            const isTri = hasThirdChamber();
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';

            // Senate only after House passage; Third only after Senate (or House) passage
            if(chamber === 'senate') {
                if(bill.houseStatus === 'pending') { alert(`${hName} Please confirm the vote first.`); return; }
                if(bill.houseStatus === 'fail') { alert(`Bills that failed in ${hName} are not tabled in ${document.getElementById('senateNameInput')?.value||'Senate'}.`); return; }
            }
            if(chamber === 'third') {
                const prevStatus = isBi ? bill.senateStatus : bill.houseStatus;
                const prevName = isBi ? sName : hName;
                if(prevStatus === 'pending') { alert(`Please confirm the ${prevName} vote first.`); return; }
                if(prevStatus === 'fail') { alert(`Bills that failed in ${prevName} are not tabled in Third.`); return; }
            }

            const dots = dotCache[chamber];
            let yea=0, nay=0, abs=0;
            dots.forEach((d,i) => {
                if(d.partyName==='Vacant') return;
                const v = voteState[chamber][i]||'none';
                if(v==='yea') yea++;
                else if(v==='nay') nay++;
                else if(v==='abs') abs++;
            });
            const validSeats = dots.filter(d=>d.partyName!=='Vacant').length;
            const threshold = bill.threshold || 0.5;
            const required = threshold >= 1.0 ? validSeats : Math.floor(validSeats * threshold) + 1;
            const result = yea >= required ? 'pass' : 'fail';

            if(!bill.voteHistory) bill.voteHistory = [];
            const nowISO = new Date().toISOString();
            const logVote = (ch, res) => bill.voteHistory.push({ chamber: ch, result: res, date: bill.voteDate || '', yea, nay, abs, total: validSeats, required, threshold, numer: bill.numer, denom: bill.denom, at: nowISO });
            const logSkip = (ch) => bill.voteHistory.push({ chamber: ch, result: 'skip', date: '', at: nowISO });

            if(chamber==='house') {
                bill.houseStatus = result;
                bill.houseVote = {yea, nay, abs, total: validSeats, required};
                logVote('house', result);
                // House failure → automatically fails subsequent stages (Senate/Third)
                if(result === 'fail') {
                    if(isBi) { bill.senateStatus = 'skip'; bill.senateVote = null; logSkip('senate'); }
                    if(isTri) { bill.thirdStatus = 'skip'; bill.thirdVote = null; logSkip('third'); }
                }
            } else if(chamber==='senate') {
                bill.senateStatus = result;
                bill.senateVote = {yea, nay, abs, total: validSeats, required};
                logVote('senate', result);
                if(result === 'fail' && isTri) { bill.thirdStatus = 'skip'; bill.thirdVote = null; logSkip('third'); }
            } else {
                bill.thirdStatus = result;
                bill.thirdVote = {yea, nay, abs, total: validSeats, required};
                logVote('third', result);
            }

            renderBillList();
            renderArchiveList();
            syncBillSelect();
            updateVoteResults();
            updateConfirmButtons();

            voteState[chamber] = {};
            redrawAll();
            renderBulkPartyList();
        }

        // Update confirm-button lock/unlock state
        function updateConfirmButtons() {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const bill = activeBillId ? bills.find(b=>b.id===activeBillId) : null;
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const tName = document.getElementById('thirdNameInput')?.value || 'Third';

            const hBtn = document.getElementById('hConfirmBtn');
            const sBtn = document.getElementById('sConfirmBtn');
            const tBtn = document.getElementById('tConfirmBtn');
            if(!hBtn || !sBtn) return;

            const hDone = bill && bill.houseStatus !== 'pending';
            hBtn.disabled = !!hDone;
            hBtn.style.opacity = hDone ? '0.35' : '1';
            hBtn.style.cursor = hDone ? 'not-allowed' : 'pointer';
            hBtn.textContent = hDone
                ? (bill.houseStatus === 'pass' ? `✔ ${hName} Passage Confirmed` : `✘ ${hName} Failure Confirmed`)
                : `▶ Confirm ${hName} Vote`;

            if(isBi) {
                const hPassed = bill && bill.houseStatus === 'pass';
                const sDone   = bill && bill.senateStatus !== 'pending' && bill.senateStatus !== 'skip';
                const sSkip   = bill && bill.senateStatus === 'skip';

                sBtn.disabled = !hPassed || sDone || sSkip;
                sBtn.style.opacity = (!hPassed || sDone || sSkip) ? '0.35' : '1';
                sBtn.style.cursor = (!hPassed || sDone || sSkip) ? 'not-allowed' : 'pointer';

                if(sSkip)         sBtn.textContent = `✘ ${hName} Failed — ${sName} Not Tabled`;
                else if(sDone)    sBtn.textContent = bill.senateStatus === 'pass' ? `✔ ${sName} Passage Confirmed` : `✘ ${sName} Failure Confirmed`;
                else if(!hPassed) sBtn.textContent = `[##] Opens After ${hName} Passes`;
                else              sBtn.textContent = `▶ Confirm ${sName} Vote`;
            }

            if(isTri && tBtn) {
                const prevStatus = isBi ? bill?.senateStatus : bill?.houseStatus;
                const prevName   = isBi ? sName : hName;
                const prevPassed = bill && prevStatus === 'pass';
                const tDone      = bill && bill.thirdStatus !== 'pending' && bill.thirdStatus !== 'skip';
                const tSkip      = bill && bill.thirdStatus === 'skip';

                tBtn.disabled = !prevPassed || tDone || tSkip;
                tBtn.style.opacity = (!prevPassed || tDone || tSkip) ? '0.35' : '1';
                tBtn.style.cursor = (!prevPassed || tDone || tSkip) ? 'not-allowed' : 'pointer';

                if(tSkip)         tBtn.textContent = `✘ ${prevName} Failed — ${tName} Not Tabled`;
                else if(tDone)    tBtn.textContent = bill.thirdStatus === 'pass' ? `✔ ${tName} Passage Confirmed` : `✘ ${tName} Failure Confirmed`;
                else if(!prevPassed) tBtn.textContent = `[##] Opens After ${prevName} Passes`;
                else              tBtn.textContent = `▶ Confirm ${tName} Vote`;
            }
        }

        function setVoteMode(mode) {
            currentVoteMode = mode;
            const labels = { yea: '▲ Yea (green)', nay: '▼ Nay (red)', abs: '— Abstain (gray)', none: '✕ Clear' };
            const colors  = { yea: '#00ff88', nay: '#ff2244', abs: '#888888', none: '#888' };
            const el = document.getElementById('currentModeLabel');
            el.textContent = labels[mode] || 'None';
            el.style.color = colors[mode] || '#888';
        }

        function clearAllVotes() {
            voteState = { house: {}, senate: {}, third: {} };
            redrawAll();
            updateVoteResults();
            renderBulkPartyList();
        }

        // ===== BULK PARTY VOTE =====
        // Return the list of checked chambers (multi-select)
        function getBulkChambers() {
            const checked = Array.from(document.querySelectorAll('input[name="bulkChamber"]:checked')).map(el=>el.value);
            return checked.length > 0 ? checked : ['house'];
        }
        // Backward compatibility: a single reference chamber (for the representative row display)
        function getBulkChamber() {
            return getBulkChambers()[0];
        }
        // On individual checkbox change: sync the "all" checkbox state
        function onBulkChamberChange() {
            const all = chamberList();
            const checked = getBulkChambers();
            const allChecked = all.every(c => checked.includes(c));
            const allBox = document.getElementById('bulkChamberAll');
            if(allBox) allBox.checked = allChecked;
            renderBulkPartyList();
        }
        // On "all" checkbox change: sync all chamber checkboxes
        function onBulkChamberAllChange(checked) {
            document.querySelectorAll('input[name="bulkChamber"]').forEach(el => {
                const wrap = el.closest('label');
                if(wrap && wrap.style.display === 'none') return; // Skip chambers that don't exist
                el.checked = checked;
            });
            renderBulkPartyList();
        }

        function applyPartyVote(partyName, vote) {
            const chambers = getBulkChambers();
            chambers.forEach(ch => {
                dotCache[ch].forEach((d, i) => {
                    if(d.partyName === partyName && d.partyName !== 'Vacant') {
                        if(vote === 'none') delete voteState[ch][i];
                        else voteState[ch][i] = vote;
                    }
                });
            });
            redrawAll();
            updateVoteResults();
            renderBulkPartyList();
        }

        function getPartyDominantVote(partyName) {
            // Aggregate checked chambers and return that party's majority vote state
            const chambers = getBulkChambers();
            const counts = { yea: 0, nay: 0, abs: 0, none: 0 };
            chambers.forEach(ch => {
                dotCache[ch].forEach((d, i) => {
                    if(d.partyName === partyName) {
                        const v = voteState[ch][i] || 'none';
                        counts[v]++;
                    }
                });
            });
            const max = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
            return max[1] > 0 ? max[0] : 'none';
        }

        function renderBulkPartyList() {
            const container = document.getElementById('bulkPartyList');
            if(!container) return;
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();

            const senateWrap = document.getElementById('bulkSenateRadioWrap');
            if(senateWrap) senateWrap.style.display = isBi ? '' : 'none';
            const thirdWrap = document.getElementById('bulkThirdRadioWrap');
            if(thirdWrap) thirdWrap.style.display = isTri ? '' : 'none';
            // Unicameral: hide the bulk-vote target selection group entirely (nothing to choose)
            const bulkGroup = document.getElementById('bulkChamberSelectGroup');
            if(bulkGroup) bulkGroup.style.display = isBi ? '' : 'none';
            if(!isBi) {
                document.querySelector('input[name="bulkChamber"][value="house"]').checked = true;
                const senateChk = document.querySelector('input[name="bulkChamber"][value="senate"]');
                if(senateChk) senateChk.checked = false;
                const thirdChk = document.querySelector('input[name="bulkChamber"][value="third"]');
                if(thirdChk) thirdChk.checked = false;
                const allChk = document.getElementById('bulkChamberAll');
                if(allChk) allChk.checked = false;
            }

            const refCh = getBulkChamber();
            const seen = new Set();
            const partyOrder = [];
            dotCache[refCh].forEach(d => {
                if(d.partyName !== 'Vacant' && !seen.has(d.partyName)) {
                    seen.add(d.partyName);
                    partyOrder.push(d);
                }
            });

            if(partyOrder.length === 0) {
                container.innerHTML = '<div style="color:#444;font-size:0.85rem;text-align:center;padding:8px;">Run the simulation first</div>';
                return;
            }

            container.innerHTML = '';
            partyOrder.forEach(d => {
                const party = parties.find(p => p.name === d.partyName);
                const hasFactions = party?.factions?.length > 0;
                const dominant = getPartyDominantVote(d.partyName);

                // Party row
                const row = document.createElement('div');
                row.className = 'bulk-party-row';
                row.style.cssText = hasFactions ? 'border-bottom:none;padding-bottom:2px;' : '';
                row.innerHTML = `
                    <div class="bulk-party-dot" style="background:${d.color};"></div>
                    <span class="bulk-party-name" title="${d.partyName}">${d.partyName}</span>
                    <button class="bulk-vote-btn yea ${dominant==='yea'?'active-yea':''}" onclick="applyPartyVote('${d.partyName}','yea')">▲Yea</button>
                    <button class="bulk-vote-btn nay ${dominant==='nay'?'active-nay':''}" onclick="applyPartyVote('${d.partyName}','nay')">▼Nay</button>
                    <button class="bulk-vote-btn abs ${dominant==='abs'?'active-abs':''}" onclick="applyPartyVote('${d.partyName}','abs')">—Abs</button>
                    <button class="bulk-vote-btn clr" onclick="applyPartyVote('${d.partyName}','none')">✕</button>
                `;
                container.appendChild(row);

                // Faction sub-row
                if(hasFactions) {
                    party.factions.forEach(f => {
                        const fDominant = getFactionDominantVote(d.partyName, f, refCh);
                        const fRow = document.createElement('div');
                        fRow.className = 'bulk-party-row';
                        fRow.style.cssText = 'padding-left:18px;background:#080a0e;border-top:none;';
                        fRow.innerHTML = `
                            <div class="bulk-party-dot" style="background:${f.color};width:7px;height:7px;"></div>
                            <span class="bulk-party-name" style="color:#888;font-size:0.82rem;" title="${f.name}">${f.name}</span>
                            <button class="bulk-vote-btn yea ${fDominant==='yea'?'active-yea':''}" onclick="applyFactionVote('${d.partyName}','${f.id}','yea')">▲Yea</button>
                            <button class="bulk-vote-btn nay ${fDominant==='nay'?'active-nay':''}" onclick="applyFactionVote('${d.partyName}','${f.id}','nay')">▼Nay</button>
                            <button class="bulk-vote-btn abs ${fDominant==='abs'?'active-abs':''}" onclick="applyFactionVote('${d.partyName}','${f.id}','abs')">—Abs</button>
                            <button class="bulk-vote-btn clr" onclick="applyFactionVote('${d.partyName}','${f.id}','none')">✕</button>
                        `;
                        container.appendChild(fRow);
                    });
                }
            });
        }

        function getVoteColor(v) {
            if(v === 'yea') return '#00ff88';
            if(v === 'nay') return '#ff2244';
            if(v === 'abs') return '#888888';
            return null;
        }

        // Faction's dominant vote state
        function getFactionDominantVote(partyName, faction, chamber) {
            // Determine faction seat count: seats within this chamber
            const seatKey = seatKeyFor(chamber);
            const fSeats = faction[seatKey] || 0;
            if(fSeats === 0) return 'none';
            // Need to find the dot indices assigned to the faction, but dots don't currently carry faction info,
            // so approximate: treat a proportional share of the party's dots (by faction ratio) as the faction's share when deriving vote state
            // Simplification: manage a dedicated voteState key per faction
            const key = `__faction__${partyName}__${faction.id}`;
            return voteState[chamber]?.[key] || 'none';
        }

        function applyFactionVote(partyName, factionId, vote) {
            const key = `__faction__${partyName}__${factionId}`;
            const chs = getBulkChambers();
            chs.forEach(ch => {
                if(!voteState[ch]) voteState[ch] = {};
                // Store faction meta key
                if(vote === 'none') delete voteState[ch][key];
                else voteState[ch][key] = vote;

                // Apply to actual dots: assign from the front of this party's dots, up to the faction's seat count
                const party = parties.find(p => p.name === partyName);
                if(!party) return;
                const faction = party.factions?.find(f => f.id === factionId);
                if(!faction) return;

                const seatKey = seatKeyFor(ch);
                // Collect all dot indices for this party
                const dots = dotCache[ch] || [];
                const partyDots = [];
                dots.forEach((d, i) => { if(d.partyName === partyName) partyDots.push(i); });

                // Faction order: offset = sum of seats of factions before this one in the faction list
                let offset = 0;
                for(const f of (party.factions || [])) {
                    if(f.id === factionId) break;
                    offset += f[seatKey] || 0;
                }
                const fSeats = Math.min(faction[seatKey] || 0, partyDots.length - offset);
                for(let i = offset; i < offset + fSeats; i++) {
                    if(i >= partyDots.length) break;
                    const dotIdx = partyDots[i];
                    if(vote === 'none') delete voteState[ch][dotIdx];
                    else voteState[ch][dotIdx] = vote;
                }
            });
            simulate();
            renderBulkPartyList();
            updateConfirmButtons();
        }

        // ===== CANVAS CLICK HANDLER =====
        function handleCanvasClick(e, chamber) {
            const cvs = e.target;
            const rect = cvs.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const scaleX = cvs.width / dpr / rect.width;
            const scaleY = cvs.height / dpr / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            const dots = dotCache[chamber];
            let hit = -1;
            let minDist = Infinity;
            dots.forEach((d, i) => {
                const dist = Math.hypot(mx - d.x, my - d.y);
                if(dist <= d.r * 1.5 && dist < minDist) { minDist = dist; hit = i; }
            });

            if(hit === -1) return;

            const prev = voteState[chamber][hit] || 'none';
            if(currentVoteMode === 'none') {
                // Reset mode: reset only this dot
                delete voteState[chamber][hit];
            } else if(currentVoteMode === prev) {
                // Clicking the same mode again → reset
                delete voteState[chamber][hit];
            } else {
                voteState[chamber][hit] = currentVoteMode;
            }

            redrawAll();
            updateVoteResults();
        }

        // ===== TOOLTIP =====
        // Measure actual rendered size and clamp so it never gets clipped at the screen edge (e.g. the rightmost seat)
        function positionTooltip(tip, text, clientX, clientY) {
            tip.textContent = text;
            tip.style.display = 'block';
            const margin = 8;
            const w = tip.offsetWidth;
            const h = tip.offsetHeight;
            let left = clientX + 14;
            let top = clientY - 8;
            if(left + w > window.innerWidth - margin) left = clientX - w - 14;
            if(left < margin) left = margin;
            if(top + h > window.innerHeight - margin) top = window.innerHeight - h - margin;
            if(top < margin) top = margin;
            tip.style.left = left + 'px';
            tip.style.top = top + 'px';
        }

        function handleCanvasMouseMove(e, chamber) {
            const cvs = e.target;
            const rect = cvs.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const scaleX = cvs.width / dpr / rect.width;
            const scaleY = cvs.height / dpr / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            const dots = dotCache[chamber];
            const tip = document.getElementById('tooltipBox');
            let hit = -1;
            dots.forEach((d, i) => {
                if(Math.hypot(mx - d.x, my - d.y) <= d.r * 1.5) hit = i;
            });

            if(hit !== -1) {
                const d = dots[hit];
                const voteLabels = { yea:'Yea', nay:'Nay', abs:'Abstain', none:'No Vote' };
                const vs = voteState[chamber][hit] || 'none';
                const nameLabel = d.independentName ? d.independentName : d.partyName;
                const seatLabel = d.independentSeatIndex
                    ? `#${computeIndependentOffset(chamber) + d.independentSeatIndex}`
                    : `#${hit+1}`;
                positionTooltip(tip, `${seatLabel} | ${nameLabel} | ${d.ideology} | ${voteLabels[vs]}`, e.clientX, e.clientY);
            } else {
                tip.style.display = 'none';
            }
        }

        function handleCanvasMouseLeave() {
            document.getElementById('tooltipBox').style.display = 'none';
        }

        // ===== VOTE RESULT UPDATER =====
        function updateVoteResults() {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const hTotal = parseInt(document.getElementById('houseTotal').value) || 300;
            const sTotal = parseInt(document.getElementById('senateTotal').value) || 100;
            const tTotalEl = document.getElementById('thirdTotal');
            const tTotal = tTotalEl ? (parseInt(tTotalEl.value) || 100) : 100;

            calcAndRenderResult('house', hTotal, 'h');
            if(isBi) calcAndRenderResult('senate', sTotal, 's');
            if(isTri) calcAndRenderResult('third', tTotal, 't');
        }

        function calcAndRenderResult(chamber, total, prefix) {
            const bill = activeBillId ? bills.find(b=>b.id===activeBillId) : null;
            const statusKey = chamber+'Status'; // houseStatus / senateStatus / thirdStatus
            const voteKey = chamber+'Vote';     // houseVote / senateVote / thirdVote
            const isConfirmed = bill && bill[statusKey] && bill[statusKey] !== 'pending' && bill[statusKey] !== 'skip' && bill[voteKey];

            let yea, nay, abs, validSeats;
            if(isConfirmed) {
                // Bill whose vote is already confirmed: use the values frozen at confirmation time (the chart stays fixed even if party composition changes later)
                yea = bill[voteKey].yea; nay = bill[voteKey].nay; abs = bill[voteKey].abs;
                validSeats = bill[voteKey].total ?? total; // Backward compat with older save files: fall back to the current value if total is missing
            } else {
                yea=0; nay=0; abs=0;
                const dots = dotCache[chamber];
                dots.forEach((d, i) => {
                    if(d.partyName === 'Vacant') return;
                    const v = voteState[chamber][i] || 'none';
                    if(v==='yea') yea++;
                    else if(v==='nay') nay++;
                    else if(v==='abs') abs++;
                });
                validSeats = dots.filter(d=>d.partyName!=='Vacant').length;
            }
            const none = validSeats - yea - nay - abs;
            const t = validSeats || 1;

            // Apply the current bill's passage threshold (if the vote is confirmed, also use the required value frozen at confirmation)
            const threshold = bill?.threshold || 0.5;
            const required = isConfirmed ? (bill[voteKey].required ?? Math.floor(validSeats * threshold) + 1) : (threshold >= 1.0 ? validSeats : Math.floor(validSeats * threshold) + 1);

            document.getElementById(prefix+'CntYea').textContent = yea;
            document.getElementById(prefix+'CntNay').textContent = nay;
            document.getElementById(prefix+'CntAbs').textContent = abs;
            document.getElementById(prefix+'CntNone').textContent = none;

            document.getElementById(prefix+'BarYea').style.width = (yea/t*100).toFixed(1)+'%';
            document.getElementById(prefix+'BarNay').style.width = (nay/t*100).toFixed(1)+'%';
            document.getElementById(prefix+'BarAbs').style.width = (abs/t*100).toFixed(1)+'%';
            document.getElementById(prefix+'BarNone').style.width = (none/t*100).toFixed(1)+'%';

            // Threshold marker (vote bar only)
            const barOuter = document.getElementById(prefix+'BarYea')?.parentElement;
            if(barOuter) {
                let marker = barOuter.querySelector('.threshold-marker');
                if(!marker) {
                    marker = document.createElement('div');
                    marker.className = 'threshold-marker';
                    barOuter.appendChild(marker);
                }
                let labelEl = barOuter.querySelector('.threshold-label');
                if(!labelEl) {
                    labelEl = document.createElement('div');
                    labelEl.className = 'threshold-label';
                    barOuter.appendChild(labelEl);
                }
                barOuter.style.position = 'relative';
                const pct = Math.min(threshold * 100, 100).toFixed(1);
                marker.style.cssText = `position:absolute; left:${pct}%; top:0; bottom:0; width:2px; background:var(--tno-gold); box-shadow:0 0 5px var(--tno-gold); z-index:2; pointer-events:none;`;
                const thLabel = getThresholdLabel(threshold, bill?.numer, bill?.denom);
                labelEl.style.cssText = `position:absolute; left:${pct}%; top:-18px; transform:translateX(-50%); font-size:0.75rem; color:var(--tno-gold); white-space:nowrap; pointer-events:none; font-family:'NeoDunggeunmo','VT323',monospace;`;
                labelEl.textContent = `${thLabel} (${required} seats)`;
            }

            const thresholdLabels = { 0.5:'Majority', 0.667:'2/3', 0.75:'3/4', 1.0:'Unanimous' };
            const thLabel = getThresholdLabel(threshold, bill?.numer, bill?.denom);

            // Additional info (yea count/threshold, threshold name, seats short)
            const infoEl = document.getElementById(prefix+'VoteInfo');
            if(infoEl) {
                if(yea + nay + abs === 0) {
                    infoEl.textContent = `Threshold: ${thLabel}, ${required} seats required`;
                } else if(yea >= required) {
                    infoEl.textContent = `${yea} / ${required} (${thLabel})`;
                } else {
                    infoEl.textContent = `${yea} / ${required} (${thLabel}, ${required - yea} seats short)`;
                }
            }

            // Verdict text (original format)
            const vEl = document.getElementById(prefix+'Verdict');
            vEl.className = 'vote-verdict';
            const billTitle = activeBillId ? (bills.find(b=>b.id===activeBillId)?.title || 'Bill') : 'Bill';
            if(yea + nay + abs === 0) {
                vEl.textContent = '-- Awaiting Vote --';
                vEl.classList.add('verdict-pending');
            } else if(yea >= required) {
                vEl.textContent = `✔ Passed (${billTitle})`;
                vEl.classList.add('verdict-pass');
            } else {
                vEl.textContent = `✘ Failed (${billTitle})`;
                vEl.classList.add('verdict-fail');
            }
        }

        // ===== REDRAW (vote state aware) =====
        function redrawAll() {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            if(isBi) redrawChamber('senateCanvas', 'senate');
            if(isTri) redrawChamber('thirdCanvas', 'third');
            redrawChamber('houseCanvas', 'house');
        }

        function redrawChamber(cvsId, chamber) {
            const dots = dotCache[chamber];
            if(!dots || dots.length === 0) return;
            const cvs = document.getElementById(cvsId);
            const dpr = window.devicePixelRatio || 1;
            const ctx = cvs.getContext('2d');
            const W = cvs.width / dpr;
            const H = cvs.height / dpr;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = 'transparent';

            const highlightGov = document.getElementById('chkGovHighlight').checked;

            dots.forEach((d, i) => {
                const vote = voteState[chamber][i] || 'none';
                const voteColor = getVoteColor(vote);

                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r * 0.85, 0, Math.PI*2);

                // Fill: vote color if voted, else party color
                if(voteColor) {
                    ctx.fillStyle = voteColor;
                } else {
                    ctx.fillStyle = d.color;
                }
                ctx.fill();

                // Stroke: always party/coalition/gov color
                if(d.isRuling && highlightGov) {
                    ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = "#ffd700";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                } else if(d.strokeColor) {
                    ctx.strokeStyle = d.strokeColor;
                    ctx.lineWidth = d.strokeDashed ? 1.5 : 1;
                    if(d.strokeDashed) ctx.setLineDash([2,2]);
                    ctx.stroke();
                    if(d.strokeDashed) ctx.setLineDash([]);
                }

                // If voted, draw inner border using party color so border stays visible
                if(voteColor) {
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r * 0.85, 0, Math.PI*2);
                    ctx.strokeStyle = d.color;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }
            });

            // Center text
            const total = dots.length;
            const CX = dots[0]?.cx ?? W/2;
            const CY = dots[0]?.cy ?? H - 40;
            ctx.fillStyle = "#fff";
            ctx.font = `30px 'NeoDunggeunmo'`;
            ctx.textAlign = "center";
            ctx.fillText(total, CX, CY);
            ctx.font = `16px 'NeoDunggeunmo'`;
            ctx.fillStyle = "var(--tno-neon)";
            ctx.fillText("SEATS", CX, CY + 25);
        }

        // ===== MAIN SIMULATE =====
        window.addEventListener('resize', () => { simulate(); });

        window.onload = function() { toggleSystem(); refreshUI(); simulate(); renderBillList(); renderArchiveList(); syncBillSelect(); elecRenderList(); elecRenderRecords(); };

        // ===== SAVE / LOAD (v5) =====
        function getAppState() {
            const systemType = document.querySelector('input[name="systemType"]:checked')?.value || 'bicameral';
            return {
                meta: { app: "DATANET_PARLIAMENT_SIM", version: 13, savedAt: new Date().toISOString() },
                ui: { currentMainTab, currentSubTab },
                config: {
                    systemType,
                    highlightGov:  document.getElementById('chkGovHighlight')?.checked ?? true,
                    senateName:    document.getElementById('senateNameInput')?.value   ?? "Senate",
                    houseName:     document.getElementById('houseNameInput')?.value    ?? "National Assembly",
                    thirdName:     document.getElementById('thirdNameInput')?.value    ?? "Third",
                    senateTotal:   parseInt(document.getElementById('senateTotal')?.value)  || 100,
                    houseTotal:    parseInt(document.getElementById('houseTotal')?.value)   || 300,
                    thirdTotal:    parseInt(document.getElementById('thirdTotal')?.value)   || 100
                },
                parliament: { ideologies, parties, coalitions, manualSort, independents },
                legislation: {
                    bills,
                    activeBillId,
                    voteState,
                    activeBillTagFilter,
                    activeArchiveTagFilter
                },
                election: {
                    elecStore:      JSON.parse(JSON.stringify(elecStore)),
                    elecRecords:    JSON.parse(JSON.stringify(elecRecords)),
                    elecLastResult: elecLastResult ? JSON.parse(JSON.stringify(elecLastResult)) : null,
                    elecTitle:      document.getElementById('elecTitle')?.value  || '',
                    elecYear:       document.getElementById('elecYear')?.value   || '',
                    district: {
                        grid: JSON.parse(JSON.stringify(districtGrid)),
                        view: { ...districtView },
                        names: JSON.parse(JSON.stringify(districtNames)),
                        order: JSON.parse(JSON.stringify(districtOrder)),
                        members: JSON.parse(JSON.stringify(districtMembers))
                    },
                    tendency: {
                        data:     JSON.parse(JSON.stringify(tendencyData)),
                        strength: tendencyStrength
                    }
                }
            };
        }

        function saveJSON() {
            const includePhotos = document.getElementById('chkSavePhoto')?.checked ?? false;
            const state = getAppState();
            if(!includePhotos) {
                state.parliament.parties       = state.parliament.parties.map(p => ({ ...p, leaderPhoto: '', logoPhoto: '' }));
                state.parliament.coalitions    = state.parliament.coalitions.map(c => ({ ...c, leaderPhoto: '' }));
                state.parliament.independents  = state.parliament.independents.map(x => ({ ...x, photo: '' }));
            }
            const ts = new Date().toISOString().replace(/[:.]/g, "-");
            downloadJSON(`parliament-save-v13-${ts}.json`, state);
        }

        function setAppState(state) {
            if(!state || typeof state !== "object") throw new Error("Invalid state");

            // ── Restore parliament settings (v5/v4/v3 common, v2 backward compat) ──
            const parl = state.parliament || state.data;
            if(!parl || !Array.isArray(parl.parties) || !Array.isArray(parl.ideologies) || !Array.isArray(parl.coalitions))
                throw new Error("Invalid parliament data");

            ideologies = parl.ideologies;
            parties    = parl.parties.map(p => ({ leaderName:'', leaderPhoto:'', logoPhoto:'', showLogoInStats:false, description:'', factions:[], seatsThird:0, inThird:false, abbr:'', ...p, factions:(p.factions||[]).map(f=>({leaderName:'',leaderPhoto:'',logoPhoto:'',usePartyColor:false,seatsThird:0,...f})) }));
            coalitions = parl.coalitions.map(c => ({ leaderName:'', leaderPhoto:'', leadPartyId:null, externalSupporters:[], externalSupportLabel:'External Support', syncWithLeadParty:false, ...c }));
            manualSort = parl.manualSort ?? false;
            independents = Array.isArray(parl.independents) ? parl.independents : [];

            // ── Restore legislative process ──
            const leg = state.legislation || {};
            bills = (Array.isArray(leg.bills) ? leg.bills : (Array.isArray(state.data?.bills) ? state.data.bills : []))
                // v12: adds version/parentBillId/isAmendment/voteHistory (amendments, versioning, detailed vote log)
                .map(b => ({ tags:[], threshold:0.5, numer:null, denom:null, thirdStatus:'pending', thirdVote:null, voteDate:'', version:1, parentBillId:null, isAmendment:false, voteHistory:[], ...b }));
            activeBillId           = leg.activeBillId           ?? null;
            voteState              = leg.voteState              ?? { house:{}, senate:{}, third:{} };
            if(!voteState.third) voteState.third = {};
            activeBillTagFilter    = leg.activeBillTagFilter    ?? null;
            activeArchiveTagFilter = leg.activeArchiveTagFilter ?? null;

            // ── Restore election data ──
            const elec = state.election || {};
            // Restore support-rate store (v13: split per chamber { house:{}, senate:{}, third:{} } /
            // v12 and earlier: a single flat list → applied to every chamber the same way)
            ['house','senate','third'].forEach(c => { elecStore[c] = {}; });
            if(elec.elecStore && typeof elec.elecStore === 'object') {
                const loaded = elec.elecStore;
                const isPerChamber = ['house','senate','third'].some(c => loaded[c] && typeof loaded[c] === 'object');
                if(isPerChamber) {
                    ['house','senate','third'].forEach(c => { elecStore[c] = loaded[c] ? JSON.parse(JSON.stringify(loaded[c])) : {}; });
                } else {
                    ['house','senate','third'].forEach(c => { elecStore[c] = JSON.parse(JSON.stringify(loaded)); });
                }
            }
            elecRecords    = Array.isArray(elec.elecRecords) ? elec.elecRecords : [];
            elecLastResult = elec.elecLastResult ?? null;
            const ge = id => document.getElementById(id);
            if(ge('elecTitle')) ge('elecTitle').value = elec.elecTitle || '';
            if(ge('elecYear'))  ge('elecYear').value  = elec.elecYear  || '';
            // Districts (v6 and below: house/senate only; v9: includes third; v11: includes names/order; v12: includes elected-member info)
            if(elec.district?.grid) {
                const g = elec.district.grid;
                if(g.house !== undefined) districtGrid = { house:g.house||{}, senate:g.senate||{}, third:g.third||{} };
                else districtGrid = { house: g, senate: {}, third: {} };
            }
            if(elec.district?.view) Object.assign(districtView, elec.district.view);
            districtNames = elec.district?.names ? { house:{}, senate:{}, third:{}, ...elec.district.names } : { house:{}, senate:{}, third:{} };
            districtOrder = elec.district?.order ? { house:[], senate:[], third:[], ...elec.district.order } : { house:[], senate:[], third:[] };
            districtMembers = elec.district?.members ? { house:{}, senate:{}, third:{}, ...elec.district.members } : { house:{}, senate:{}, third:{} };
            ['house','senate','third'].forEach(ch => districtOrderSync(ch)); // Older save files have no order array, so auto-generate it from coordinate appearance order
            selectedDistrictKey = null;
            // Tendency
            if(elec.tendency?.data) tendencyData = elec.tendency.data;
            if(typeof elec.tendency?.strength === 'number') { tendencyStrength = elec.tendency.strength; tendencySetStrength(tendencyStrength); }

            // ── Restore UI settings ──
            const cfg = state.config || {};
            const radio = document.querySelector(`input[name="systemType"][value="${cfg.systemType || 'bicameral'}"]`);
            if(radio) radio.checked = true;
            const gd = id => document.getElementById(id);
            if(gd('senateNameInput')) gd('senateNameInput').value = cfg.senateName  ?? "Senate";
            if(gd('houseNameInput'))  gd('houseNameInput').value  = cfg.houseName   ?? "National Assembly";
            if(gd('thirdNameInput'))  gd('thirdNameInput').value  = cfg.thirdName   ?? "Third";
            if(gd('senateTotal'))     gd('senateTotal').value     = cfg.senateTotal ?? 100;
            if(gd('houseTotal'))      gd('houseTotal').value      = cfg.houseTotal  ?? 300;
            if(gd('thirdTotal'))      gd('thirdTotal').value      = cfg.thirdTotal  ?? 100;
            if(gd('chkGovHighlight')) gd('chkGovHighlight').checked = cfg.highlightGov ?? true;

            // ── Full render ──
            toggleSystem();
            updateNames();
            refreshUI();
            simulate();
            renderBillList();
            renderArchiveList();
            syncBillSelect();
            renderActiveBillDisplay();
            updateConfirmButtons();
            renderBulkPartyList();
            elecRenderList();
            elecRenderRecords();

            // ── Restore tabs (last) ──
            const uiMain = state.ui?.currentMainTab || 'party';
            const uiSub  = state.ui?.currentSubTab  || { party:'ideology', setup:'settings', legislation:'bill' };
            currentSubTab = { party:'ideology', setup:'settings', legislation:'bill', ...uiSub };
            // Backward compat with older save files: map the old setup sub-tab (house/senate/third/leader) to the new structure
            if(['house','senate','third'].includes(currentSubTab.setup)) currentSubTab.setup = 'settings';
            if(currentSubTab.party === 'leader') currentSubTab.party = 'partyInfo';
            switchMainTab(uiMain);
            if(uiMain !== 'election') {
                const fallback = uiMain==='party' ? 'ideology' : uiMain==='setup' ? 'settings' : 'bill';
                switchSubTab(uiMain, currentSubTab[uiMain] || fallback, false);
            }
        }

        function downloadJSON(filename, obj) {
            const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(a.href);
        }

        async function loadJSONFromFile(file) {
            const text = await file.text();
            const obj = JSON.parse(text);
            setAppState(obj);
        }

        window.addEventListener("load", () => {
            const btnSave = document.getElementById("btnSaveJson");
            const btnLoad = document.getElementById("btnLoadJson");
            const fileInput = document.getElementById("fileLoadJson");
            if(btnSave) btnSave.addEventListener("click", saveJSON);
            if(btnLoad && fileInput) {
                btnLoad.addEventListener("click", () => fileInput.click());
                fileInput.addEventListener("change", async () => {
                    const file = fileInput.files?.[0];
                    if(!file) return;
                    try { await loadJSONFromFile(file); }
                    catch(e) { alert("Load failed: the save file is corrupted or in an unrecognized format."); }
                    finally { fileInput.value = ""; }
                });
            }

            // Canvas event binding
            document.getElementById('houseCanvas').addEventListener('click', e => handleCanvasClick(e, 'house'));
            document.getElementById('senateCanvas').addEventListener('click', e => handleCanvasClick(e, 'senate'));
            document.getElementById('thirdCanvas').addEventListener('click', e => handleCanvasClick(e, 'third'));
            document.getElementById('houseCanvas').addEventListener('mousemove', e => handleCanvasMouseMove(e, 'house'));
            document.getElementById('senateCanvas').addEventListener('mousemove', e => handleCanvasMouseMove(e, 'senate'));
            document.getElementById('thirdCanvas').addEventListener('mousemove', e => handleCanvasMouseMove(e, 'third'));
            document.getElementById('houseCanvas').addEventListener('mouseleave', handleCanvasMouseLeave);
            document.getElementById('senateCanvas').addEventListener('mouseleave', handleCanvasMouseLeave);
            document.getElementById('thirdCanvas').addEventListener('mouseleave', handleCanvasMouseLeave);
        });

        // ===== 2nd-level tab switching =====
        let currentMainTab = 'party';
        let currentSubTab = { party: 'ideology', setup: 'settings', legislation: 'bill' };

        // When leaving the Vote tab, reset the selection if the selected bill has fully concluded (passed/failed)
        function checkResetVoteSelectionOnLeave() {
            if(currentMainTab === 'legislation' && currentSubTab['legislation'] === 'vote' && activeBillId) {
                const bill = bills.find(b=>b.id===activeBillId);
                if(bill && getBillOverallStatus(bill) !== 'pending') {
                    activeBillId = null;
                }
            }
        }

        function switchMainTab(main) {
            checkResetVoteSelectionOnLeave();
            currentMainTab = main;
            document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('mainTab' + main.charAt(0).toUpperCase() + main.slice(1)).classList.add('active');
            document.querySelectorAll('.main-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('mainContent' + main.charAt(0).toUpperCase() + main.slice(1)).classList.add('active');
            if(main === 'election') { elecRenderList(); elecRenderRecords(); return; }
            if(main === 'party') {
                switchSubTab('party', currentSubTab['party'] || 'ideology', false);
                return;
            }
            switchSubTab(main, currentSubTab[main] || (main === 'setup' ? 'settings' : 'bill'), false);
        }

        function switchSubTab(main, sub, doMainSwitch = true) {
            if(main === 'legislation' && sub !== 'vote') checkResetVoteSelectionOnLeave();
            if(doMainSwitch && currentMainTab !== main) switchMainTab(main);
            currentSubTab[main] = sub;
            const groupEl = document.getElementById('mainContent' + main.charAt(0).toUpperCase() + main.slice(1));
            if(!groupEl) return;
            groupEl.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            groupEl.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
            const btn = document.getElementById('subTab' + sub.charAt(0).toUpperCase() + sub.slice(1));
            const content = document.getElementById('content' + sub.charAt(0).toUpperCase() + sub.slice(1));
            if(btn) btn.classList.add('active');
            if(content) content.classList.add('active');
            refreshUI();
            if(sub === 'vote') { renderBulkPartyList(); syncBillSelect(); renderActiveBillDisplay(); updateConfirmButtons(); }
            if(sub === 'bill') renderBillList();
            if(sub === 'table') renderBillList();
            if(sub === 'archive') renderArchiveList();
            if(sub === 'partyInfo') { switchPartyInnerTab('info'); }
            if(sub === 'ideology') renderIdeologyList();
            if(sub === 'coalitionLeader') renderCoalitionLeaderList();
            if(sub === 'independent') { independentInnerTab = 'house'; renderIndependentList(); }
            if(sub === 'settings') { switchSetupInnerTab('house'); }
            if(sub === 'coalition') { renderCoalitions(); }
            if(sub === 'indMember') { indMemberInnerTab = 'house'; switchIndMemberInnerTab('house'); }
            if(sub === 'members') { membersInnerTab = 'house'; switchMembersInnerTab('house'); }
        }

        // Switch nested Party/Leader tabs inside the Party tab
        function switchPartyInnerTab(inner) {
            document.getElementById('innerTabPartyInfo').classList.toggle('active', inner==='info');
            document.getElementById('innerTabPartyLeader').classList.toggle('active', inner==='leader');
            document.getElementById('innerContentPartyInfo').classList.toggle('active', inner==='info');
            document.getElementById('innerContentPartyLeader').classList.toggle('active', inner==='leader');
            if(inner==='info') renderPartyInfoList();
            else renderLeaderList();
        }

        // Backward compat for the old switchTab
        function switchTab(tabName) {
            if(['ideology','house','senate','coalition'].includes(tabName)) switchSubTab('setup', tabName==='house'||tabName==='senate'?'settings':tabName);
            else if(['bill','vote','archive'].includes(tabName)) switchSubTab('legislation', tabName);
        }

        // Parliament > Settings inner tabs (House/Senate/Third)
        let setupInnerTab = 'house';
        function switchSetupInnerTab(ch) {
            setupInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabSetup'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
                document.getElementById('content'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
        }


        function toggleSystem() {
            const hasSenate = hasSenateChamber();
            const hasThird  = hasThirdChamber();
            document.getElementById('senateSection').style.display = hasSenate ? 'block' : 'none';
            document.getElementById('innerTabSetupSenate').style.display = hasSenate ? '' : 'none';
            document.getElementById('senateVoteResult').style.display = hasSenate ? 'block' : 'none';
            const thirdSection = document.getElementById('thirdSection');
            if(thirdSection) thirdSection.style.display = hasThird ? 'block' : 'none';
            const innerTabThird = document.getElementById('innerTabSetupThird');
            if(innerTabThird) innerTabThird.style.display = hasThird ? '' : 'none';
            const thirdVoteResult = document.getElementById('thirdVoteResult');
            if(thirdVoteResult) thirdVoteResult.style.display = hasThird ? 'block' : 'none';
            // If we were viewing a chamber inside the Settings tab (House/Senate/Third) that no longer exists, switch to House
            if(!hasSenate && setupInnerTab === 'senate') switchSetupInnerTab('house');
            if(!hasThird && setupInnerTab === 'third') switchSetupInnerTab('house');
            // Also sync the inner tabs of the Independent participation tab
            const indMemSenateBtn = document.getElementById('innerTabIndMemSenate');
            if(indMemSenateBtn) indMemSenateBtn.style.display = hasSenate ? '' : 'none';
            const indMemThirdBtn = document.getElementById('innerTabIndMemThird');
            if(indMemThirdBtn) indMemThirdBtn.style.display = hasThird ? '' : 'none';
            // Hide display tabs
            const dispSenate = document.getElementById('dispTabSenate');
            if(dispSenate) dispSenate.style.display = hasSenate ? '' : 'none';
            const dispThird = document.getElementById('dispTabThird');
            if(dispThird) dispThird.style.display = hasThird ? '' : 'none';
            if(!hasSenate && document.querySelector('.disp-panel.active')?.id === 'dispPanelSenate') switchDispTab('house');
            if(!hasThird && document.querySelector('.disp-panel.active')?.id === 'dispPanelThird') switchDispTab('house');
            // Hide the district selector buttons and automatically switch to House district mode
            const senDistBtn = document.getElementById('districtChamberSenateBtn');
            if(senDistBtn) senDistBtn.style.display = hasSenate ? '' : 'none';
            const thirdDistBtn = document.getElementById('districtChamberThirdBtn');
            if(thirdDistBtn) thirdDistBtn.style.display = hasThird ? '' : 'none';
            if(!hasSenate && districtChamber === 'senate') districtSetChamber('house');
            if(!hasThird && districtChamber === 'third') districtSetChamber('house');
            // Delete district data for chambers that no longer exist
            if(!hasSenate && districtGrid.senate && Object.keys(districtGrid.senate).length > 0) {
                districtGrid.senate = {};
                districtDrawCanvas();
                elecUpdateDistrictInfo();
            }
            if(!hasThird && districtGrid.third && Object.keys(districtGrid.third).length > 0) {
                districtGrid.third = {};
                districtDrawCanvas();
                elecUpdateDistrictInfo();
            }
            renderBillList(); renderArchiveList(); syncBillSelect(); updateNames();
            elecUpdateLabels();
            elecUpdateDistrictInfo();
        }

        function updateNames() {
            const sName = document.getElementById('senateNameInput').value;
            const hName = document.getElementById('houseNameInput').value;
            const tNameEl = document.getElementById('thirdNameInput');
            const tName = tNameEl ? tNameEl.value : 'Third';
            document.getElementById('senateTitle').innerText = "> " + sName;
            document.getElementById('houseTitle').innerText = "> " + hName;
            const thirdTitleEl = document.getElementById('thirdTitle');
            if(thirdTitleEl) thirdTitleEl.innerText = "> " + tName;
            document.getElementById('houseVoteResultTitle').textContent = `[ ${hName} Vote Result ]`;
            document.getElementById('senateVoteResultTitle').textContent = `[ ${sName} Vote Result ]`;
            const thirdVoteResultTitle = document.getElementById('thirdVoteResultTitle');
            if(thirdVoteResultTitle) thirdVoteResultTitle.textContent = `[ ${tName} Vote Result ]`;
            const innerSetupH = document.getElementById('innerTabSetupHouse');
            if(innerSetupH) innerSetupH.innerText = hName;
            const innerSetupS = document.getElementById('innerTabSetupSenate');
            if(innerSetupS) innerSetupS.innerText = sName;
            const innerSetupT = document.getElementById('innerTabSetupThird');
            if(innerSetupT) innerSetupT.innerText = tName;
            // Display tab names
            const dispH = document.getElementById('dispTabHouse');
            const dispS = document.getElementById('dispTabSenate');
            const dispT = document.getElementById('dispTabThird');
            if(dispH) dispH.textContent = hName;
            if(dispS) dispS.textContent = sName;
            if(dispT) dispT.textContent = tName;
            const bulkH = document.getElementById('bulkHouseLabel');
            const bulkS = document.getElementById('bulkSenateLabel');
            const bulkT = document.getElementById('bulkThirdLabel');
            if(bulkH) bulkH.textContent = hName;
            if(bulkS) bulkS.textContent = sName;
            if(bulkT) bulkT.textContent = tName;
            const elecH = document.getElementById('elecHouseLabel');
            const elecS = document.getElementById('elecSenateLabel');
            const elecT = document.getElementById('elecThirdLabel');
            if(elecH) elecH.textContent = hName;
            if(elecS) elecS.textContent = sName;
            if(elecT) elecT.textContent = tName;
            const dcH = document.getElementById('districtChamberHouseLabel');
            const dcS = document.getElementById('districtChamberSenateLabel');
            const dcT = document.getElementById('districtChamberThirdLabel');
            if(dcH) dcH.textContent = hName;
            if(dcS) dcS.textContent = sName;
            if(dcT) dcT.textContent = tName;
            // Also refresh the seat label inside the card (excluded from renderCoalitions to prevent an infinite loop)
            renderIdeologyList();
            renderPartyList('house');
            renderPartyList('senate');
            renderPartyList('third');
            renderPartyInfoList();
            updateConfirmButtons();
        }

        function refreshUI() {
            syncIndependents();
            renderIdeologyList();
            renderPartyList('house');
            renderPartyList('senate');
            renderPartyList('third');
            renderCoalitions();
            renderPartyInfoList();
            renderLeaderList();
            renderCoalitionLeaderList();
            renderIndependentList();
            renderMembersList();
        }

        function isValidHex(hex) { return /^#[0-9A-F]{6}$/i.test(hex); }

        // ── Common drag-sort utility ──────────────
        // handleEl: drag start point (⋮⋮ icon), containerId: id of the container holding the cards,
        // cardSelector: card class selector, arr: array to reorder, renderFn: function to redraw after reordering
        function startDragReorder(handleEl, containerId, cardSelector, arr, renderFn) {
            handleEl.addEventListener('mousedown', e => {
                e.preventDefault();
                const card = handleEl.closest(cardSelector);
                if(!card) return;
                let idx = Array.from(card.parentElement.querySelectorAll(cardSelector)).indexOf(card);
                card.classList.add('drag-lifted');

                function onMove(ev) {
                    const container = document.getElementById(containerId);
                    if(!container) return;
                    const cards = Array.from(container.querySelectorAll(cardSelector));
                    const mouseY = ev.clientY;
                    let newIdx = idx;
                    for(let i=0; i<cards.length; i++) {
                        const rect = cards[i].getBoundingClientRect();
                        const mid = rect.top + rect.height/2;
                        if(mouseY < mid) { newIdx = i; break; }
                        newIdx = i+1;
                    }
                    newIdx = Math.max(0, Math.min(newIdx, arr.length-1));
                    if(newIdx !== idx) {
                        const [moved] = arr.splice(idx, 1);
                        arr.splice(newIdx, 0, moved);
                        idx = newIdx;
                        renderFn();
                        requestAnimationFrame(() => {
                            const newCards = document.getElementById(containerId)?.querySelectorAll(cardSelector);
                            if(newCards && newCards[idx]) newCards[idx].classList.add('drag-lifted');
                        });
                    }
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => el.classList.remove('drag-lifted'));
                    renderFn();
                    if(typeof simulate === 'function') simulate();
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }


        // ===== Party order =====
        let manualSort = false; // false: auto-sort by ideology, true: manual sort

        function autoSortParties() {
            manualSort = false;
            parties.sort((a,b) => {
                const ia = ideologies.findIndex(i=>i.id===a.ideologyId);
                const ib = ideologies.findIndex(i=>i.id===b.ideologyId);
                if(a.ideologyId===IND_IDEOLOGY_ID && b.ideologyId!==IND_IDEOLOGY_ID) return 1;
                if(b.ideologyId===IND_IDEOLOGY_ID && a.ideologyId!==IND_IDEOLOGY_ID) return -1;
                return ia - ib;
            });
            refreshUI(); simulate();
        }

        function moveParty(idx, dir) {
            manualSort = true;
            const target = idx + dir;
            if(target < 0 || target >= parties.length) return;
            [parties[idx], parties[target]] = [parties[target], parties[idx]];
            refreshUI(); simulate();
        }

        function togglePartyCollapse(pid) {
            const p = parties.find(x=>x.id===pid);
            if(!p) return;
            p._collapsed = !p._collapsed;
            renderPartyInfoList();
        }

        function renderIdeologyList() {
            const container = document.getElementById('ideologyList');
            container.innerHTML = '';
            ideologies.forEach((ide, index) => {
                const div = document.createElement('div');
                div.className = 'drag-card-ideology';
                div.style.display='flex'; div.style.gap='5px'; div.style.marginBottom='5px'; div.style.alignItems='center';
                div.innerHTML = `
                    <span class="drag-handle">⋮⋮</span>
                    <input type="text" value="${ide.name}" onchange="updateIdeology(${index}, 'name', this.value)">
                    ${ide.id===IND_IDEOLOGY_ID ? '' : `<button class="remove-btn" onclick="removeIdeology(${index})">X</button>`}
                `;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'ideologyList', '.drag-card-ideology', ideologies, renderIdeologyList);
            });
        }

        function renderPartyList(type) {
            const containerId = type==='house' ? 'partyListHouse' : type==='senate' ? 'partyListSenate' : 'partyListThird';
            const container = document.getElementById(containerId);
            if(!container) return;
            container.innerHTML = '';

            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const tNameEl = document.getElementById('thirdNameInput');
            const tName = tNameEl ? tNameEl.value : 'Third';
            const thisChamberName = type === 'house' ? hName : type === 'senate' ? sName : tName;
            const inKey = inKeyFor(type);

            const visibleParties = parties.map((p,idx)=>({...p,originalIdx:idx}))
                .filter(p => p[inKey]);

            if(visibleParties.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[No parties assigned]</div>';
                return;
            }
            visibleParties.forEach(p => {
                const idx = p.originalIdx;
                const seatKey = seatKeyFor(type);
                const photo = p.logoPhoto || '';
                const ideologyName = ideologies.find(i => i.id === p.ideologyId)?.name || '';
                const div = document.createElement('div');
                div.className = `card-item drag-card-partylist-${type} ${p.isRuling?'is-ruling':''}`;
                div.dataset.pid = p.id;
                div.style.borderLeftColor = p.color;
                div.innerHTML = `
                    <div style="display:grid;grid-template-columns:auto auto 1fr auto;gap:8px;align-items:center;">
                        <span class="drag-handle">⋮⋮</span>
                        <!-- Party logo (square, uploadable) -->
                        <div class="leader-photo-box" title="Upload party logo" style="width:45px;height:45px;flex-shrink:0;">
                            ${photo
                                ? `<img src="${photo}" alt="logo" style="width:100%;height:100%;object-fit:cover;display:block;">`
                                : `<div style="width:100%;height:100%;background:${p.color}22;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:${p.color}88;">⚑</div>`
                            }
                            <input type="file" accept="image/*" onchange="uploadLogoPhoto(this,${p.id})">
                        </div>
                        <!-- Name + ideology (read-only) -->
                        <div style="min-width:0;">
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span style="width:9px;height:9px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="font-size:1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
                            </div>
                            ${ideologyName?`<div style="color:#666;font-size:0.8rem;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ideologyName}</div>`:''}
                        </div>
                        <!-- Seat count input -->
                        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                            <label style="color:#555;font-size:0.8rem;white-space:nowrap;">${thisChamberName} Seats</label>
                            <input type="number" value="${p[seatKey]}" min="0"
                                onchange="updateParty(${idx},'${seatKey}',parseInt(this.value)||0)"
                                style="width:65px;">
                        </div>
                    </div>
                    ${(p.factions||[]).length>0?`
                    <div style="margin-top:6px;border-top:1px solid #1a1d22;padding-top:5px;">
                        ${(p.factions||[]).map((f,fi)=>{
                            const fSeatKey = seatKeyFor(type);
                            return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #111;">
                                <span style="width:6px;height:6px;background:${f.usePartyColor?p.color:f.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="flex:1;font-size:0.8rem;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span>
                                <input type="number" value="${f[fSeatKey]||0}" min="0" style="width:55px;font-size:0.8rem;"
                                    onchange="updateFactionById(${p.id},'${f.id}','${fSeatKey}',parseInt(this.value)||0)">
                            </div>`;
                        }).join('')}
                        ${(()=>{
                            const fSeatKey = seatKeyFor(type);
                            const sum = (p.factions||[]).reduce((s,f)=>s+(f[fSeatKey]||0),0);
                            const ok = sum===p[seatKey];
                            return `<div data-faction-sum data-party-id="${p.id}" data-seat-key="${fSeatKey}"
                                style="text-align:right;font-size:0.75rem;margin-top:3px;color:${ok?'#00cc66':'#cc3333'};">Total ${sum}/${p[seatKey]} ${ok?'✓':'✗'}</div>`;
                        })()}
                    </div>`:''}
                    `;
                container.appendChild(div);
                startPartyListDragReorder(div.querySelector('.drag-handle'), containerId, `.drag-card-partylist-${type}`, type);
            });
        }

        // The Parliament > Settings House/Senate/Third lists show only a filtered subset of all parties,
        // so this dedicated drag utility maps the on-screen order accurately back onto the global parties array
        function reorderGlobalPartiesForChamber(type, newOrderIds) {
            const inKey = inKeyFor(type);
            let insertAt = -1;
            const remaining = [];
            parties.forEach(p => {
                if(p[inKey]) {
                    if(insertAt === -1) insertAt = remaining.length;
                } else {
                    remaining.push(p);
                }
            });
            if(insertAt === -1) insertAt = remaining.length;
            const reordered = newOrderIds.map(id => parties.find(p=>p.id===id)).filter(Boolean);
            remaining.splice(insertAt, 0, ...reordered);
            parties = remaining;
            manualSort = true;
        }

        // Reorder independent members: reassign seatIndex rather than array position (getMap assigns seats sorted by seatIndex)
        function startIndependentDragReorder(handleEl, containerId, cardSelector, chamber, renderFn) {
            if(!handleEl) return;
            handleEl.addEventListener('mousedown', e => {
                e.preventDefault();
                const container = document.getElementById(containerId);
                if(!container) return;
                const card = handleEl.closest(cardSelector);
                if(!card) return;
                let idList = Array.from(container.querySelectorAll(cardSelector)).map(c => c.dataset.indId);
                let idx = idList.indexOf(card.dataset.indId);
                card.classList.add('drag-lifted');

                function applyOrder() {
                    idList.forEach((id, i) => {
                        const ind = independents.find(x=>x.id===id);
                        if(ind) ind.seatIndex = i+1;
                    });
                }
                function onMove(ev) {
                    const cards = Array.from(document.getElementById(containerId)?.querySelectorAll(cardSelector) || []);
                    const mouseY = ev.clientY;
                    let newIdx = idx;
                    for(let i=0; i<cards.length; i++) {
                        const rect = cards[i].getBoundingClientRect();
                        const mid = rect.top + rect.height/2;
                        if(mouseY < mid) { newIdx = i; break; }
                        newIdx = i+1;
                    }
                    newIdx = Math.max(0, Math.min(newIdx, idList.length-1));
                    if(newIdx !== idx) {
                        const [moved] = idList.splice(idx, 1);
                        idList.splice(newIdx, 0, moved);
                        idx = newIdx;
                        applyOrder();
                        renderFn();
                        requestAnimationFrame(() => {
                            const newCards = document.getElementById(containerId)?.querySelectorAll(cardSelector);
                            if(newCards && newCards[idx]) newCards[idx].classList.add('drag-lifted');
                        });
                    }
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => el.classList.remove('drag-lifted'));
                    applyOrder();
                    renderFn();
                    simulate();
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }

        function startPartyListDragReorder(handleEl, containerId, cardSelector, type) {
            if(!handleEl) return;
            handleEl.addEventListener('mousedown', e => {
                e.preventDefault();
                const container = document.getElementById(containerId);
                if(!container) return;
                const card = handleEl.closest(cardSelector);
                if(!card) return;
                let idList = Array.from(container.querySelectorAll(cardSelector)).map(c => parseInt(c.dataset.pid));
                let idx = idList.indexOf(parseInt(card.dataset.pid));
                card.classList.add('drag-lifted');

                function onMove(ev) {
                    const cards = Array.from(document.getElementById(containerId)?.querySelectorAll(cardSelector) || []);
                    const mouseY = ev.clientY;
                    let newIdx = idx;
                    for(let i=0; i<cards.length; i++) {
                        const rect = cards[i].getBoundingClientRect();
                        const mid = rect.top + rect.height/2;
                        if(mouseY < mid) { newIdx = i; break; }
                        newIdx = i+1;
                    }
                    newIdx = Math.max(0, Math.min(newIdx, idList.length-1));
                    if(newIdx !== idx) {
                        const [moved] = idList.splice(idx, 1);
                        idList.splice(newIdx, 0, moved);
                        idx = newIdx;
                        reorderGlobalPartiesForChamber(type, idList);
                        renderPartyList(type);
                        requestAnimationFrame(() => {
                            const newCards = document.getElementById(containerId)?.querySelectorAll(cardSelector);
                            if(newCards && newCards[idx]) newCards[idx].classList.add('drag-lifted');
                        });
                    }
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => el.classList.remove('drag-lifted'));
                    renderPartyList(type);
                    simulate();
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }

        function moveCoalition(idx, dir) {
            const target = idx + dir;
            if(target < 0 || target >= coalitions.length) return;
            [coalitions[idx], coalitions[target]] = [coalitions[target], coalitions[idx]];
            renderCoalitions();
        }

        function toggleCoalitionSection(cid, section) {
            const coal = coalitions.find(c=>c.id===cid);
            if(!coal) return;
            if(section === 'members') coal._membersCollapsed = !(coal._membersCollapsed ?? false);
            else coal._extCollapsed = !(coal._extCollapsed ?? true);
            renderCoalitions();
        }

        function renderCoalitions() {
            const container = document.getElementById('coalitionList');
            container.innerHTML = '';
            coalitions.forEach((coal, cIdx) => {
                const div = document.createElement('div');
                div.className = `card-item drag-card-coalition ${coal.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor = coal.color;
                const memberParties = parties.filter(p=>coal.members.includes(p.id));
                let memberChecks = parties.map(p=>{
                    const hasFactions = (p.factions||[]).length > 0;
                    const partyCheck = `
                    <div style="display:flex;align-items:center;border-bottom:1px solid #222;padding:3px 0;">
                        <span style="width:9px;height:9px;background:${p.color};border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0;"></span>
                        <label style="flex:1;margin:0;cursor:pointer;font-size:0.9rem;" for="c${cIdx}_p${p.id}">${p.name}</label>
                        <input type="checkbox" id="c${cIdx}_p${p.id}" ${coal.members.includes(p.id)?'checked':''} onchange="toggleCoalitionMember('${coal.id}',${p.id},this.checked)">
                    </div>`;
                    const factionChecks = hasFactions ? (p.factions||[]).map(f=>{
                        const fKey = `${p.id}__${f.id}`;
                        const fColor = f.usePartyColor ? p.color : f.color;
                        return `<div style="display:flex;align-items:center;padding:2px 0 2px 16px;border-bottom:1px solid #111;">
                            <span style="width:6px;height:6px;background:${fColor};border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0;"></span>
                            <label style="flex:1;margin:0;cursor:pointer;font-size:0.82rem;color:#888;" for="c${cIdx}_f${fKey}">${p.name} — ${f.name}</label>
                            <input type="checkbox" id="c${cIdx}_f${fKey}" ${coal.members.includes(fKey)?'checked':''} onchange="toggleCoalitionMember('${coal.id}','${fKey}',this.checked)">
                        </div>`;
                    }).join('') : '';
                    return partyCheck + factionChecks;
                }).join('');
                if(!coal.externalSupporters) coal.externalSupporters = [];
                const extChecks = parties
                    .filter(p => !coal.members.includes(p.id))
                    .map(p => `
                    <div style="display:flex;align-items:center;border-bottom:1px solid #222;padding:3px 0;">
                        <span style="width:9px;height:9px;background:${p.color};border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0;"></span>
                        <label style="flex:1;margin:0;cursor:pointer;font-size:0.9rem;color:#aaa;" for="c${cIdx}_ext${p.id}">${p.name}</label>
                        <input type="checkbox" id="c${cIdx}_ext${p.id}" ${coal.externalSupporters.includes(p.id)?'checked':''} onchange="toggleCoalitionExternalSupport('${coal.id}',${p.id},this.checked)">
                    </div>`).join('');
                const membersCollapsed = coal._membersCollapsed ?? false;
                const extCollapsed = coal._extCollapsed ?? true; // External support is collapsed by default
                div.innerHTML = `
                    <div style="display:flex;gap:8px;align-items:center;">
                        <!-- Hamburger drag handle -->
                        <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                        <!-- Coalition name color X -->
                        <div style="flex:1;display:flex;gap:4px;align-items:center;min-width:0;">
                            <input type="text" value="${coal.name}" onchange="updateCoalition('${coal.id}','name',this.value)" style="flex:1;min-width:0;">
                            <div class="color-input-group" style="flex-shrink:0;">
                                <input type="text" class="hex-input" value="${coal.color}" onchange="updateCoalitionColorText(this,'${coal.id}')">
                                <input type="color" value="${coal.color}" oninput="updateCoalitionColorPicker(this,'${coal.id}')">
                            </div>
                            <button class="remove-btn" onclick="removeCoalition('${coal.id}')">X</button>
                        </div>
                    </div>
                    <!-- Lead party + ruling -->
                    <div style="display:flex;gap:6px;align-items:center;margin-top:6px;">
                        ${memberParties.length>0?`<select onchange="updateCoalition('${coal.id}','leadPartyId',parseInt(this.value)||null)"
                            style="flex:1;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:3px;min-width:0;">
                            <option value="">-- Lead party unassigned --</option>
                            ${memberParties.map(p=>`<option value="${p.id}" ${coal.leadPartyId===p.id?'selected':''}>${p.name}</option>`).join('')}
                        </select>`:'<span style="flex:1;color:#444;font-size:0.8rem;">No members</span>'}
                        <div class="ruling-selector ${coal.isRuling?'active':''}" onclick="setRuling('coalition','${coal.id}')" style="padding:3px 8px;white-space:nowrap;flex-shrink:0;font-size:0.85rem;">
                            ${coal.isRuling?'★ Ruling':'Set as Ruling'}
                        </div>
                    </div>
                    <!-- Member parties (collapsible) -->
                    <div onclick="toggleCoalitionSection('${coal.id}','members')" style="display:flex;align-items:center;gap:6px;margin-top:10px;cursor:pointer;user-select:none;">
                        <span style="color:#888;font-size:0.8rem;">${membersCollapsed?'▶':'▼'}</span>
                        <span style="color:#555;font-size:0.78rem;letter-spacing:1px;">▌ Member Parties (${memberParties.length})</span>
                    </div>
                    <div class="coalition-members" style="display:${membersCollapsed?'none':'block'};">${memberChecks}</div>
                    <!-- External support (collapsible) -->
                    <div onclick="toggleCoalitionSection('${coal.id}','ext')" style="display:flex;align-items:center;gap:6px;margin-top:10px;cursor:pointer;user-select:none;">
                        <span style="color:#888;font-size:0.8rem;">${extCollapsed?'▶':'▼'}</span>
                        <span style="color:#555;font-size:0.78rem;letter-spacing:1px;" title="Party that has not formally joined the coalition but supports the government in confidence votes, budgets, etc.">▌ ${coal.externalSupportLabel ?? 'External Support'} (${coal.externalSupporters.length})</span>
                    </div>
                    <div style="display:${extCollapsed?'none':'block'};">
                        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;" onclick="event.stopPropagation()">
                            <span style="color:#555;font-size:0.78rem;letter-spacing:1px;white-space:nowrap;">▌ Label</span>
                            <input type="text" value="${coal.externalSupportLabel ?? 'External Support'}" placeholder="External Support"
                                style="flex:1;background:#000;border:1px solid #443300;color:#cc9900;font-family:inherit;font-size:0.78rem;padding:2px 6px;"
                                title="Customize the label (e.g. Confidence and Supply, Supply and Confidence, etc.)"
                                onchange="updateCoalition('${coal.id}','externalSupportLabel',this.value.trim()||'External Support')">
                        </div>
                        <div class="coalition-members" style="border-color:#443300;margin-top:6px;">${extChecks || '<div style="color:#333;font-size:0.8rem;padding:4px 0;">No non-member parties</div>'}</div>
                    </div>`;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'coalitionList', '.drag-card-coalition', coalitions, renderCoalitions);
            });
            const singleHeader = document.createElement('div');
            singleHeader.style.cssText = 'margin-top:20px;border-top:1px dashed #444;color:#666;padding-top:8px;';
            singleHeader.innerText = "SINGLE PARTY RULE";
            container.appendChild(singleHeader);
            parties.forEach(p => {
                const div = document.createElement('div');
                div.className = `ruling-selector ${p.isRuling?'active':''}`;
                div.onclick = () => setRuling('party', p.id);
                div.innerHTML = `<span style="background:${p.color};width:8px;height:8px;display:inline-block;border-radius:50%;"></span> ${p.name}`;
                container.appendChild(div);
            });
            fitDynPhotos(container);
        }

        // Photo upload
        function uploadLogoPhoto(input, pid) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const p = parties.find(x=>x.id===pid);
                if(p){ p.logoPhoto = e.target.result; refreshUI(); simulate(); }
            };
            reader.readAsDataURL(file);
        }

        // ─────────────────────────────────────────
        // House/Senate tab - Arc/District view switching
        // ─────────────────────────────────────────
        function chamberSetView(chamber, view) {
            const arcWrap  = document.getElementById(chamber+'ViewArcWrap');
            const distWrap = document.getElementById(chamber+'ViewDistrictWrap');
            const arcBtn   = document.getElementById(chamber+'ViewArcBtn');
            const distBtn  = document.getElementById(chamber+'ViewDistrictBtn');
            if(!arcWrap) return;
            if(view === 'arc') {
                arcWrap.style.display=''; distWrap.style.display='none';
                arcBtn.style.background='var(--tno-neon)'; arcBtn.style.color='#000'; arcBtn.style.borderColor='var(--tno-neon)';
                distBtn.style.background='transparent'; distBtn.style.color='#555'; distBtn.style.borderColor='#333';
            } else {
                arcWrap.style.display='none'; distWrap.style.display='';
                distBtn.style.background='var(--tno-neon)'; distBtn.style.color='#000'; distBtn.style.borderColor='var(--tno-neon)';
                arcBtn.style.background='transparent'; arcBtn.style.color='#555'; arcBtn.style.borderColor='#333';
                drawChamberDistrict(chamber);
            }
        }

        function drawChamberDistrict(chamber) {
            const cvs = document.getElementById(chamber+'DistrictCanvas');
            if(!cvs) return;
            const w = cvs.offsetWidth;
            const h = cvs.offsetHeight;
            if(!w || !h) {
                requestAnimationFrame(() => drawChamberDistrict(chamber));
                return;
            }
            cvs.width = w; cvs.height = h;
            const ctx = cvs.getContext('2d');
            ctx.clearRect(0,0,w,h);

            const grid = districtGrid[chamber] || {};
            const keys = Object.keys(grid);
            if(keys.length === 0) {
                ctx.fillStyle = '#444';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('No districts configured', w/2, h/2);
                return;
            }

            // Find this chamber's most recent district election result
            const lastRecord = [...elecRecords].reverse().find(r => r.chamberType===chamber && r.districtResults?.length>0);
            const resultMap = {};
            if(lastRecord) lastRecord.districtResults.forEach(d => { resultMap[d.key] = d.partyId; });

            let minQ=Infinity,maxQ=-Infinity,minR=Infinity,maxR=-Infinity;
            keys.forEach(k=>{ const [q,r]=k.split(',').map(Number); if(q<minQ)minQ=q; if(q>maxQ)maxQ=q; if(r<minR)minR=r; if(r>maxR)maxR=r; });
            const spanQ=(maxQ-minQ+1)+2, spanR=(maxR-minR+1)+2;
            const sizeByW = w/(spanQ*1.5+0.5);
            const sizeByH = h/(spanR*Math.sqrt(3)+Math.sqrt(3)/2+1);
            const size = Math.min(sizeByW, sizeByH, 30);
            const cq=(minQ+maxQ)/2, cr=(minR+maxR)/2;
            const offX = w/2 - size*(3/2*cq);
            const offY = h/2 - size*(Math.sqrt(3)/2*cq + Math.sqrt(3)*cr);

            const highlightGov = document.getElementById('chkGovHighlight')?.checked;
            const rulingCoal = coalitions.find(c=>c.isRuling);

            keys.forEach(key => {
                const [q,r] = key.split(',').map(Number);
                const [cx,cy] = districtAxialToPixel(q, r, size, offX, offY);
                const corners = districtHexCorners(cx, cy, size*0.93);
                const pid = resultMap[key];
                const p = pid ? parties.find(x=>x.id===pid) : null;
                ctx.beginPath();
                ctx.moveTo(...corners[0]);
                corners.slice(1).forEach(c=>ctx.lineTo(...c));
                ctx.closePath();
                ctx.fillStyle = p ? p.color : '#111';
                ctx.fill();
                ctx.strokeStyle = p ? p.color : '#333';
                ctx.lineWidth = p ? 1.2 : 0.8;
                ctx.stroke();

                // Highlight ruling power: government (party/coalition member) gets a gold solid line + glow, external support gets a gold dashed line
                if(p && highlightGov) {
                    const coal = coalitions.find(c=>c.members.includes(p.id));
                    const isGov = p.isRuling || (coal && coal.isRuling);
                    const isExtSupport = !isGov && !coal && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                    if(isGov) {
                        ctx.save();
                        ctx.shadowColor = 'rgba(255,215,0,0.8)';
                        ctx.shadowBlur = 6;
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();
                    } else if(isExtSupport) {
                        ctx.save();
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 1.5;
                        ctx.setLineDash([2,2]);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.restore();
                    }
                }
            });

            if(!lastRecord) {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(0, h-26, w, 26);
                ctx.fillStyle = '#888';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('No district election record — showing background only', w/2, h-9);
            }
        }

        // Set the photo box size to the measured height of the reference element (dyn-ref) directly in px via JS
        // (CSS align-items:stretch + aspect-ratio combo fails to render in some environments, so JS is used instead)
        function fitDynPhotos(scopeEl) {
            if(!scopeEl) return;
            scopeEl.querySelectorAll('.dyn-row').forEach(row => {
                const ref = row.querySelector('.dyn-ref');
                if(!ref) return;
                const h = ref.offsetHeight || 0;
                if(h <= 0) return;

                // Stacked group (several photos stacked vertically share the reference height)
                row.querySelectorAll('.dyn-stack').forEach(stack => {
                    const photos = stack.querySelectorAll('.dyn-photo');
                    const n = photos.length;
                    if(n === 0) return;
                    const gap = parseFloat(stack.dataset.gap) || 0;
                    const per = Math.max(20, (h - gap * (n - 1)) / n);
                    photos.forEach(box => {
                        const ratio = parseFloat(box.dataset.ratio) || 1;
                        box.style.height = per + 'px';
                        box.style.width  = Math.round(per * ratio) + 'px';
                    });
                });

                // Single photo not part of a stack: uses the full reference height
                row.querySelectorAll('.dyn-photo').forEach(box => {
                    if(box.closest('.dyn-stack')) return; // Already handled
                    const ratio = parseFloat(box.dataset.ratio) || 1;
                    box.style.height = h + 'px';
                    box.style.width  = Math.round(h * ratio) + 'px';
                });
            });
        }

        function uploadLeaderPhoto(input, type, entityId) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const b64 = e.target.result;
                if(type==='party') {
                    const p = parties.find(x=>x.id===entityId);
                    if(p){ p.leaderPhoto=b64; refreshUI(); simulate(); }
                } else {
                    const coal = coalitions.find(x=>x.id===entityId);
                    if(coal){ coal.leaderPhoto=b64; renderCoalitions(); simulate(); }
                }
            };
            reader.readAsDataURL(file);
        }

        function updateLeaderField(type, entityId, field, val) {
            if(type==='party') {
                const p = parties.find(x=>x.id===entityId);
                if(p){ p[field]=val; simulate(); }
            } else {
                const c = coalitions.find(x=>x.id===entityId);
                if(c){ c[field]=val; simulate(); }
            }
        }

        function addIdeology() { ideologies.push({ id: Date.now(), name: "New Ideology" }); refreshUI(); }
        function addIndependentIdeology() {
            if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) ideologies.push({id:IND_IDEOLOGY_ID, name:"Independent"});
            refreshUI(); simulate();
        }
        function removeIdeology(idx) { if(ideologies.length>1) { const id=ideologies[idx].id; ideologies.splice(idx,1); parties.forEach(p=>{if(p.ideologyId===id)p.ideologyId=ideologies[0].id;}); refreshUI(); simulate(); }}
        function updateIdeology(i,k,v) { ideologies[i][k]=v; refreshUI(); simulate(); }
        function moveIdeology(i,d) { if((d===-1&&i>0)||(d===1&&i<ideologies.length-1)){ [ideologies[i], ideologies[i+d]] = [ideologies[i+d], ideologies[i]]; refreshUI(); simulate(); }}
        function addParty(chamber) {
            const flags = { inHouse:false, inSenate:false, inThird:false };
            if(chamber === 'house') flags.inHouse = true;
            else if(chamber === 'senate') flags.inSenate = true;
            else if(chamber === 'third') flags.inThird = true;
            else flags.inHouse = true; // Default when there's no context such as the Party tab
            // Default ideology for a new party: use the last regular ideology, excluding the independent ideology (which is auto-appended at the end of the list)
            const nonIndIdeologies = ideologies.filter(i => i.id !== IND_IDEOLOGY_ID);
            const defaultIdeologyId = nonIndIdeologies.length > 0 ? nonIndIdeologies[nonIndIdeologies.length - 1].id : ideologies[0]?.id;
            parties.push({id:Date.now(), name:"New Party", color:"#555555", seatsHouse:0, seatsSenate:0, seatsThird:0, ideologyId:defaultIdeologyId, isRuling:false, ...flags, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, factions: [] }); refreshUI(); }
        function addIndependentParty() {
            if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) addIndependentIdeology();
            parties.push({id:Date.now(), name:"Independent", color:"#999999", seatsHouse:1, seatsSenate:0, seatsThird:0, ideologyId:IND_IDEOLOGY_ID, isRuling:false, inHouse:true, inSenate:true, inThird:false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, factions: [] });
            refreshUI(); simulate();
        }
        function removeParty(i) { const pid=parties[i].id; parties.splice(i,1); coalitions.forEach(c=>c.members=c.members.filter(x=>x!==pid)); refreshUI(); simulate(); }
        function updateParty(i,k,v) { parties[i][k]=v; if(k==='name')refreshUI(); simulate(); }
        function togglePartyParticipation(i,f,v) { parties[i][f]=v; refreshUI(); simulate(); }
        function updatePartyColorText(e,i) { if(isValidHex(e.value)){ parties[i].color=e.value.toUpperCase(); e.nextElementSibling.value=parties[i].color; refreshUI(); simulate(); }}
        function updatePartyColorPicker(e,i) { parties[i].color=e.value.toUpperCase(); e.previousElementSibling.value=parties[i].color; simulate(); }

        function addCoalition() { coalitions.push({id:'c'+Date.now(), name:"New Coalition", color:"#ffffff", members:[], isRuling:false, leaderName: "", leaderPhoto: "", leadPartyId: null, externalSupporters: [], externalSupportLabel: "External Support", syncWithLeadParty: false }); refreshUI(); }
        function removeCoalition(id) { coalitions=coalitions.filter(c=>c.id!==id); refreshUI(); simulate(); }
        function updateCoalition(id,k,v) { const c=coalitions.find(x=>x.id===id); if(c){c[k]=v; simulate();} }
        function updateCoalitionColorText(e,id) { if(isValidHex(e.value)) { const c=coalitions.find(x=>x.id===id); if(c){ c.color=e.value.toUpperCase(); e.nextElementSibling.value=c.color; simulate(); }}}
        function updateCoalitionColorPicker(e,id) { const c=coalitions.find(x=>x.id===id); if(c){ c.color=e.value.toUpperCase(); e.previousElementSibling.value=c.color; simulate(); }}
        function toggleCoalitionMember(cid,pid,chk) {
            if(chk) { coalitions.forEach(c=>c.members=c.members.filter(x=>x!==pid)); coalitions.find(c=>c.id===cid).members.push(pid); }
            else { const c=coalitions.find(x=>x.id===cid); c.members=c.members.filter(x=>x!==pid); }
            refreshUI(); simulate();
        }
        // External support (confidence-and-supply) — a party that hasn't formally joined the coalition but supports the government only on confidence/budget votes, etc.
        function toggleCoalitionExternalSupport(cid,pid,chk) {
            const c = coalitions.find(x=>x.id===cid); if(!c) return;
            if(!c.externalSupporters) c.externalSupporters = [];
            if(chk) { if(!c.externalSupporters.includes(pid)) c.externalSupporters.push(pid); }
            else c.externalSupporters = c.externalSupporters.filter(x=>x!==pid);
            refreshUI(); simulate();
        }
        function setRuling(t,id) {
            parties.forEach(p=>p.isRuling=false); coalitions.forEach(c=>c.isRuling=false);
            if(t==='party') parties.find(p=>p.id===id).isRuling=true;
            else coalitions.find(c=>c.id===id).isRuling=true;
            refreshUI(); simulate();
        }

        function setNoRuling() {
            parties.forEach(p=>p.isRuling=false);
            coalitions.forEach(c=>c.isRuling=false);
            refreshUI(); simulate();
        }

        // ===== Faction functions =====
        function addFaction(partyId) {
            const p = parties.find(x=>x.id===partyId); if(!p) return;
            if(!p.factions) p.factions = [];
            p.factions.push({ id:'f'+Date.now(), name:'New Faction', color:'#808080', ideologyId:p.ideologyId, seatsHouse:0, seatsSenate:0, seatsThird:0, leaderName:'', leaderPhoto:'', logoPhoto:'', usePartyColor:false });
            renderPartyInfoList();
        }
        function removeFaction(partyId, factionId) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            p.factions = p.factions.filter(f=>f.id!==factionId);
            refreshUI();
        }
        function updateFactionById(partyId, factionId, key, val) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const f = p.factions.find(x=>x.id===factionId); if(!f) return;
            f[key] = val;
            simulate();
            const sum = p.factions.reduce((s,x)=>s+(x[key]||0),0);
            const ok = sum === p[key];
            document.querySelectorAll(`[data-faction-sum][data-party-id="${partyId}"][data-seat-key="${key}"]`).forEach(el => {
                el.textContent = `Total ${sum}/${p[key]} ${ok?'✓':'✗'}`;
                el.style.color = ok ? '#00cc66' : '#cc3333';
            });
        }
        function updateFaction(partyId, factionId, key, val) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const f = p.factions.find(f=>f.id===factionId); if(!f) return;
            f[key] = val;
            renderPartyInfoList(); simulate();
        }
        function updateFactionColorText(input, partyId, factionId) {
            if(!/^#[0-9A-Fa-f]{6}$/.test(input.value.trim())) return;
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const f = p.factions.find(f=>f.id===factionId);
            if(f){ f.color=input.value.trim(); renderPartyInfoList(); }
        }
        function updateFactionColorPicker(input, partyId, factionId) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const f = p.factions.find(f=>f.id===factionId);
            if(f){ f.color=input.value; renderPartyInfoList(); }
        }
        function splitFaction(partyId, factionId) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const f = p.factions.find(x=>x.id===factionId); if(!f) return;
            if(!confirm(`Split the "${f.name}" faction into a new party?\n\nNew party: ${f.name}\nSeats: House ${f.seatsHouse}, Senate ${f.seatsSenate}`)) return;
            p.seatsHouse  = Math.max(0, p.seatsHouse  - f.seatsHouse);
            p.seatsSenate = Math.max(0, p.seatsSenate - f.seatsSenate);
            p.factions = p.factions.filter(x=>x.id!==factionId);
            parties.push({ id:Date.now(), name:f.name, color:f.color, seatsHouse:f.seatsHouse, seatsSenate:f.seatsSenate,
                ideologyId:f.ideologyId||p.ideologyId, isRuling:false, inHouse:p.inHouse, inSenate:p.inSenate,
                leaderName:f.leaderName||'', leaderPhoto:f.leaderPhoto||'', logoPhoto:f.logoPhoto||'',
                showLogoInStats:false, description:'', factions:[] });
            refreshUI(); simulate();
        }
        function moveFaction(partyId, factionId, dir) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const fs = p.factions;
            const fi = fs.findIndex(f=>f.id===factionId); if(fi<0) return;
            const ni = fi + dir;
            if(ni < 0 || ni >= fs.length) return;
            [fs[fi], fs[ni]] = [fs[ni], fs[fi]];
            renderPartyInfoList(); renderLeaderList();
        }

        function uploadFactionPhoto(input, partyIdx, factionId, field) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const p = parties[partyIdx];
                const f = p?.factions?.find(x=>x.id===factionId);
                if(f){ f[field]=e.target.result; renderLeaderList(); }
            };
            reader.readAsDataURL(file);
        }

        function renderFactionSection(p, partyIdx, chamberType) {
            // chamberType: 'house' | 'senate' | undefined (Party tab = both)
            if(!p.factions) p.factions = [];
            const isBi = hasSenateChamber();
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';

            // Total validation — if chamberType is set, only that chamber
            const showH = !chamberType || chamberType === 'house';
            const showS = isBi && (!chamberType || chamberType === 'senate');
            const sumH = p.factions.reduce((s,f)=>s+(f.seatsHouse||0),0);
            const sumS = p.factions.reduce((s,f)=>s+(f.seatsSenate||0),0);
            const okH = sumH === p.seatsHouse, okS = sumS === p.seatsSenate;
            const hasF = p.factions.length > 0;
            const sumHtml = ''; // Total validation is shown only in the Parliament tab

            const factionCards = p.factions.map((f,fi)=>`
                <div class="faction-card" style="border-left-color:${f.usePartyColor?p.color:f.color};">
                    <!-- Row 1: order + color + name + X -->
                    <div style="display:flex;gap:4px;align-items:center;margin-bottom:5px;">
                        <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;">
                            <button class="order-btn" onclick="moveFaction(${p.id},'${f.id}',-1)" ${fi===0?'disabled style="opacity:0.2"':''}>▲</button>
                            <button class="order-btn" onclick="moveFaction(${p.id},'${f.id}',1)"  ${fi===p.factions.length-1?'disabled style="opacity:0.2"':''}>▼</button>
                        </div>
                        ${f.usePartyColor
                            ? `<div style="width:28px;height:20px;background:${p.color};border:1px solid #444;flex-shrink:0;" title="Using party color"></div>`
                            : `<div class="color-input-group" style="flex-shrink:0;">
                                <input type="text" class="hex-input" value="${f.color}" onchange="updateFactionColorText(this,${p.id},'${f.id}')">
                                <input type="color" value="${f.color}" oninput="updateFactionColorPicker(this,${p.id},'${f.id}')">
                               </div>`
                        }
                        <input type="text" value="${f.name}" placeholder="Faction name" style="flex:1;font-size:0.9rem;"
                            onchange="updateFaction(${p.id},'${f.id}','name',this.value)">
                        <button class="remove-btn" style="font-size:0.8rem;padding:2px 6px;" onclick="removeFaction(${p.id},'${f.id}')">X</button>
                    </div>
                    <!-- Row 2: ideology only (seats are in the Parliament tab) -->
                    <div style="display:flex;gap:5px;align-items:center;margin-bottom:5px;">
                        <select style="flex:1;font-size:0.8rem;" onchange="updateFaction(${p.id},'${f.id}','ideologyId',parseInt(this.value))">
                            ${ideologies.map(ide=>`<option value="${ide.id}" ${f.ideologyId===ide.id?'selected':''}>${ide.name}</option>`).join('')}
                        </select>
                    </div>
                    <!-- Row 3: color option + split into new party -->
                    <div style="display:flex;gap:5px;">
                        <label style="flex:1;display:flex;align-items:center;gap:5px;cursor:pointer;padding:3px 6px;background:#0a0c10;border:1px solid #222;font-size:0.78rem;color:#888;">
                            <input type="checkbox" ${f.usePartyColor?'checked':''}
                                onchange="updateFaction(${p.id},'${f.id}','usePartyColor',this.checked)"> Use Party Color
                        </label>
                        <button onclick="splitFaction(${p.id},'${f.id}')"
                            style="flex:1;background:transparent;border:1px solid #444;color:#888;font-family:inherit;font-size:0.78rem;padding:3px 6px;cursor:pointer;">↗ Split Into New Party</button>
                    </div>
                </div>`).join('');

            return `<div style="margin-top:8px;border-top:1px dashed #222;padding-top:8px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <span style="color:#555;font-size:0.8rem;letter-spacing:1px;">▌ Factions</span>
                    <button onclick="addFaction(${p.id})" style="background:transparent;border:1px solid #333;color:#666;font-family:inherit;font-size:0.78rem;padding:2px 8px;cursor:pointer;">+ Add Faction</button>
                </div>
                ${factionCards}${sumHtml}
            </div>`;
        }

        // ===== Party tab: party info =====
        function renderPartyInfoList() {
            const container = document.getElementById('partyInfoList');
            if(!container) return;
            container.innerHTML = '';
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const isBi  = hasSenateChamber();
            const isTri = hasThirdChamber();
            const tName = document.getElementById('thirdNameInput')?.value || 'Third';
            const sortBar = document.createElement('div');
            sortBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:5px 8px;background:#0a0c10;border:1px solid #222;font-size:0.8rem;';
            sortBar.innerHTML = `
                <span style="color:${manualSort?'var(--tno-gold)':'#555'};">${manualSort?'⚠ Manually Sorting':'✦ Auto-sorted by Ideology'}</span>
                <button onclick="autoSortParties()" style="background:transparent;border:1px solid ${manualSort?'var(--tno-gold)':'#333'};color:${manualSort?'var(--tno-gold)':'#444'};font-family:'NeoDunggeunmo','VT323',monospace;font-size:0.75rem;padding:2px 8px;cursor:pointer;">↺ Auto-sort</button>
            `;
            container.appendChild(sortBar);
            parties.forEach((p, idx) => {
                if(p.ideologyId === IND_IDEOLOGY_ID) return; // Independents are managed separately in the Party > Independent tab
                const div = document.createElement('div');
                div.className = `card-item drag-card-party ${p.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor = p.color;
                const collapsed = p._collapsed ?? false;
                const bodyId = `partyBody_${p.id}`;
                div.innerHTML = `
                    <!-- Row 1: drag handle + collapse toggle + color + abbreviation + X (always visible) -->
                    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
                        <span class="drag-handle">⋮⋮</span>
                        <span onclick="togglePartyCollapse(${p.id})" style="cursor:pointer;color:#888;font-size:0.85rem;user-select:none;flex-shrink:0;">${collapsed?'▶':'▼'}</span>
                        <div class="color-input-group" style="flex-shrink:0;">
                            <input type="text" class="hex-input" value="${p.color}" onchange="updatePartyColorText(this,${idx})">
                            <input type="color" value="${p.color}" oninput="updatePartyColorPicker(this,${idx})">
                        </div>
                        <input type="text" value="${p.abbr||''}" onchange="updateParty(${idx},'abbr',this.value)" placeholder="Abbr." title="Party abbreviation (e.g. SPD)"
                            style="flex:1;min-width:0;font-size:0.85rem;text-align:center;color:var(--tno-gold);">
                        <button class="remove-btn" onclick="removeParty(${idx})">X</button>
                    </div>
                    <!-- Row 2: party name (always visible) -->
                    <div style="margin-bottom:6px;">
                        <input type="text" value="${p.name}" onchange="updateParty(${idx},'name',this.value)" placeholder="Party name" style="width:100%;font-size:1rem;box-sizing:border-box;">
                    </div>
                    <!-- Row 3: ideology (always visible) -->
                    <div style="margin-bottom:6px;">
                        <select onchange="updateParty(${idx},'ideologyId',parseInt(this.value))" style="width:100%;">
                            ${ideologies.map(ide=>`<option value="${ide.id}" ${p.ideologyId===ide.id?'selected':''}>${ide.name}</option>`).join('')}
                        </select>
                    </div>
                    <!-- Everything below is collapsible -->
                    <div id="${bodyId}" style="display:${collapsed?'none':'block'};">
                    <!-- Chambers this party belongs to (vertical list, doesn't break with long names) — hidden entirely for unicameral since there's nothing to choose -->
                    ${isBi?`<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px;">
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:#aaa;font-size:0.85rem;padding:4px 6px;background:#0a0c10;border:1px solid #222;">
                            <input type="checkbox" ${p.inHouse?'checked':''} onchange="togglePartyParticipation(${idx},'inHouse',this.checked);syncPartyChamberAll(${idx})"> ${hName}
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:#aaa;font-size:0.85rem;padding:4px 6px;background:#0a0c10;border:1px solid #222;">
                            <input type="checkbox" ${p.inSenate?'checked':''} onchange="togglePartyParticipation(${idx},'inSenate',this.checked);syncPartyChamberAll(${idx})"> ${sName}
                        </label>
                        ${isTri?`<label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:#aaa;font-size:0.85rem;padding:4px 6px;background:#0a0c10;border:1px solid #222;">
                            <input type="checkbox" ${p.inThird?'checked':''} onchange="togglePartyParticipation(${idx},'inThird',this.checked);syncPartyChamberAll(${idx})"> ${tName}
                        </label>`:''}
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--tno-neon);font-size:0.85rem;padding:4px 6px;background:#0a1a1a;border:1px solid #1a3a3a;">
                            <input type="checkbox" id="partyChamberAll_${idx}" onchange="setAllPartyChambers(${idx},this.checked)"> All
                        </label>
                    </div>`:''}
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;padding:5px 8px;background:#0a0c10;border:1px solid #222;">
                        <span style="color:#555;font-size:0.8rem;white-space:nowrap;">Show in Stats</span>
                        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;color:#aaa;font-size:0.85rem;">
                            <input type="radio" name="statsPhoto_${p.id}" value="leader" ${!p.showLogoInStats?'checked':''}
                                onchange="updateParty(${idx},'showLogoInStats',false);simulate();"> Leader Photo
                        </label>
                        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;color:#aaa;font-size:0.85rem;">
                            <input type="radio" name="statsPhoto_${p.id}" value="logo" ${p.showLogoInStats?'checked':''}
                                onchange="updateParty(${idx},'showLogoInStats',true);simulate();"> Party Logo
                        </label>
                    </div>
                    <textarea placeholder="Enter a description of the party..."
                        style="width:100%;box-sizing:border-box;background:#000;border:1px solid #2a2a2a;color:#bbb;font-family:'NeoDunggeunmo','VT323',monospace;font-size:0.85rem;padding:6px;resize:vertical;min-height:60px;outline:none;line-height:1.5;"
                        onchange="updateParty(${idx},'description',this.value)">${p.description||''}</textarea>
                    ${renderFactionSection(p, idx)}
                    </div>
                `;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'partyInfoList', '.drag-card-party', parties, renderPartyInfoList);
            });
            // Initial sync of the "all" checkbox
            parties.forEach((p, idx) => syncPartyChamberAll(idx));
        }

        // Sync the "All" checkbox for a party's chamber membership
        function syncPartyChamberAll(idx) {
            const p = parties[idx];
            if(!p) return;
            const chambers = chamberList();
            const allBox = document.getElementById('partyChamberAll_'+idx);
            if(!allBox) return;
            const inKeys = { house:'inHouse', senate:'inSenate', third:'inThird' };
            allBox.checked = chambers.every(c => p[inKeys[c]]);
        }
        function setAllPartyChambers(idx, checked) {
            const p = parties[idx];
            if(!p) return;
            chamberList().forEach(c => {
                const key = inKeyFor(c);
                p[key] = checked;
            });
            refreshUI(); simulate();
        }

        // ===== Party tab: leader =====
        function renderLeaderList() {
            const container = document.getElementById('leaderList');
            if(!container) return;
            container.innerHTML = '';
            parties.forEach((p, idx) => {
                const div = document.createElement('div');
                div.className = `card-item ${p.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor = p.color;
                const photo = p.leaderPhoto||'';
                const hasFactions = (p.factions||[]).length > 0;

                // Faction section HTML
                let factionHtml = '';
                if(hasFactions) {
                    const pIdx = idx;
                    const fCards = (p.factions||[]).map(f => {
                        const fPhoto = f.leaderPhoto||'';
                        const fLogo  = f.logoPhoto||'';
                        const fc = f.usePartyColor ? p.color : f.color;
                        return `<div class="dyn-row" style="display:flex;gap:8px;align-items:stretch;margin-bottom:8px;padding:8px;background:#060810;border:1px solid #1e2030;border-left:3px solid ${fc};">
                            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;">
                                <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:44px;height:55px;">
                                    ${fPhoto?`<img src="${fPhoto}" alt="">`:'<div class="photo-ph" style="font-size:0.9rem;">👤</div>'}
                                    <input type="file" accept="image/*" onchange="uploadFactionPhoto(this,${pIdx},'${f.id}','leaderPhoto')">
                                </div>
                                <span style="font-size:0.65rem;color:#444;flex-shrink:0;">Leader</span>
                            </div>
                            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;">
                                <div class="leader-photo-box dyn-photo" data-ratio="1" style="width:44px;height:44px;">
                                    ${fLogo?`<img src="${fLogo}" alt="" style="width:100%;height:100%;object-fit:cover;">`:'<div class="photo-ph" style="font-size:0.9rem;">⚑</div>'}
                                    <input type="file" accept="image/*" onchange="uploadFactionPhoto(this,${pIdx},'${f.id}','logoPhoto')">
                                </div>
                                <span style="font-size:0.65rem;color:#444;flex-shrink:0;">Logo</span>
                            </div>
                            <div class="dyn-ref" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;">
                                <div style="display:flex;align-items:center;gap:5px;">
                                    <span style="width:8px;height:8px;background:${fc};border-radius:50%;flex-shrink:0;"></span>
                                    <span style="color:#aaa;font-size:0.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span>
                                </div>
                                <input type="text" value="${f.leaderName||''}" placeholder="Faction leader name"
                                    style="background:#000;border:1px solid #2a2a2a;color:#ccc;font-family:inherit;font-size:0.88rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                    onchange="updateFaction(${pIdx},'${f.id}','leaderName',this.value)">
                                ${fPhoto||fLogo?`<button onclick="(()=>{const pp=parties[${pIdx}];const ff=pp.factions.find(x=>x.id==='${f.id}');if(ff){ff.leaderPhoto='';ff.logoPhoto='';renderLeaderList();}})()"
                                    style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;">✕ Remove Photo</button>`:''}
                            </div>
                        </div>`;
                    }).join('');
                    factionHtml = `<div style="margin-top:8px;border-top:1px dashed #222;padding-top:6px;">
                        <div style="color:#555;font-size:0.75rem;margin-bottom:5px;letter-spacing:1px;">▌ Factions</div>
                        ${fCards}
                    </div>`;
                }

                div.innerHTML = `
                    <div class="dyn-row" style="display:flex;gap:10px;align-items:stretch;">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;">
                            <div class="leader-photo-box dyn-photo" data-ratio="0.8" title="Click to upload photo" style="width:52px;height:65px;">
                                ${photo?`<img src="${photo}" alt="leader">`:'<div class="photo-ph">👤</div>'}
                                <input type="file" accept="image/*" onchange="uploadLeaderPhoto(this,'party',${p.id})">
                            </div>
                            <span style="font-size:0.75rem;color:#444;flex-shrink:0;">Upload Photo</span>
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span style="width:10px;height:10px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="color:var(--tno-neon);font-size:0.95rem;">${p.name}</span>
                            </div>
                            <input type="text" value="${p.leaderName||''}" placeholder="Leader name"
                                style="background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.95rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateLeaderField('party',${p.id},'leaderName',this.value)">
                            ${photo?`<button onclick="removeLeaderPhoto(${p.id})" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.8rem;padding:3px 8px;cursor:pointer;text-align:left;">✕ Remove Photo</button>`:''}
                        </div>
                    </div>
                    ${factionHtml}
                `;
                container.appendChild(div);
            });
            fitDynPhotos(container);
        }

        function removeLeaderPhoto(pid) {
            const p = parties.find(x=>x.id===pid);
            if(p){ p.leaderPhoto=''; refreshUI(); simulate(); }
        }

        // ===== Party tab: coalition (photo settings) =====
        function renderCoalitionLeaderList() {
            const container = document.getElementById('coalitionLeaderList');
            if(!container) return;
            container.innerHTML = '';

            if(coalitions.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[No coalition formed — form a coalition in the Parliament tab first]</div>';
                return;
            }

            coalitions.forEach(coal => {
                const leadP = coal.leadPartyId ? parties.find(p=>p.id===coal.leadPartyId) : null;
                const synced = coal.syncWithLeadParty && leadP;
                const photo = synced ? (leadP.leaderPhoto||'') : (coal.leaderPhoto||'');
                const leaderNameVal = synced ? (leadP.leaderName||'') : (coal.leaderName||'');
                const div = document.createElement('div');
                div.className = `card-item drag-card-coalitionleader ${coal.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor = coal.color;
                div.innerHTML = `
                    <div class="dyn-row" style="display:flex;gap:10px;align-items:stretch;">
                        <span class="drag-handle" style="align-self:center;">⋮⋮</span>
                        <!-- Leader photo -->
                        <div class="leader-photo-box dyn-photo" data-ratio="0.8" title="${synced?'Syncing with lead party (uncheck the box below to detach)':'Upload leader photo'}" style="width:52px;height:65px;flex-shrink:0;${synced?'opacity:0.6;cursor:default;':''}">
                            ${photo?`<img src="${photo}" alt="leader">`:'<div class="photo-ph">👤</div>'}
                            ${synced?'':`<input type="file" accept="image/*" onchange="uploadLeaderPhoto(this,'coalition','${coal.id}')">`}
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span style="width:10px;height:10px;background:${coal.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="color:var(--tno-neon);font-size:0.95rem;">${coal.name}</span>
                            </div>
                            <input type="text" value="${leaderNameVal}" placeholder="Leader name" ${synced?'disabled':''}
                                style="background:#000;border:1px solid #2a2a2a;color:${synced?'#666':'#e0e0e0'};font-family:inherit;font-size:0.95rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateLeaderField('coalition','${coal.id}','leaderName',this.value)">
                            ${synced?`<div style="color:#665500;font-size:0.78rem;">↳ Syncing with lead party (${leadP.name})</div>`
                                : (photo?`<button onclick="removeCoalitionLeaderPhoto('${coal.id}')" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.8rem;padding:3px 8px;cursor:pointer;text-align:left;">✕ Remove Photo</button>`:'')}
                            <label style="display:flex;align-items:center;gap:6px;cursor:${coal.leadPartyId?'pointer':'not-allowed'};color:#777;font-size:0.78rem;margin-top:2px;">
                                <input type="checkbox" ${coal.syncWithLeadParty?'checked':''} ${coal.leadPartyId?'':'disabled'}
                                    onchange="updateCoalition('${coal.id}','syncWithLeadParty',this.checked); refreshUI(); simulate();">
                                Same as lead party ${coal.leadPartyId?'':'<br>(designate a lead party in the Parliament tab first)'}
                            </label>
                        </div>
                    </div>
                `;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'coalitionLeaderList', '.drag-card-coalitionleader', coalitions, renderCoalitionLeaderList);
            });
            fitDynPhotos(container);
        }

        function removeCoalitionLeaderPhoto(cid) {
            const c = coalitions.find(x=>x.id===cid);
            if(c){ c.leaderPhoto=''; refreshUI(); simulate(); }
        }

        // ===== Party tab: independents (individual member info) =====
        // Calculate how many seats come before an independent party when it actually renders (a global seat-number offset for display)
        function computeIndependentOffset(chamber) {
            const seatKey = seatKeyFor(chamber);
            const inKey = inKeyFor(chamber);
            let offset = 0;
            for(const p of parties) {
                if(!p[inKey]) continue;
                if(p.ideologyId === IND_IDEOLOGY_ID) break;
                offset += p[seatKey] || 0;
            }
            return offset;
        }

        let independentInnerTab = 'house';
        function switchIndependentInnerTab(ch) {
            independentInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabInd'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
            renderIndependentList();
        }

        function renderIndependentList() {
            const container = document.getElementById('independentList');
            if(!container) return;
            container.innerHTML = '';

            const indParty = getIndependentParty();
            if(!indParty) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[No independent ideology/party has been set up]</div>';
                return;
            }

            // Hide tabs for chambers that don't exist, and switch to the first valid tab if the current one is invalid
            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabInd'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) btn.style.display = chambers.includes(c) ? '' : 'none';
            });
            if(!chambers.includes(independentInnerTab)) independentInnerTab = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabInd'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===independentInnerTab);
            });

            const ch = independentInnerTab;
            const list = independents.filter(x=>x.chamber===ch).sort((a,b)=>a.seatIndex-b.seatIndex);
            const offset = computeIndependentOffset(ch);

            if(list.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[This chamber has no independent seats — set the independent party\'s seat count in Parliament > Settings]</div>';
                return;
            }

            list.forEach(ind => {
                const globalSeatNum = offset + ind.seatIndex; // Internally 1..N, displayed as the actual overall seat number
                const div = document.createElement('div');
                div.className = 'card-item dyn-row drag-card-indlist';
                div.dataset.indId = ind.id;
                div.style.cssText = 'display:flex;gap:10px;align-items:stretch;border-left-color:#999;margin-bottom:8px;';
                div.innerHTML = `
                    <span class="drag-handle" style="align-self:center;">⋮⋮</span>
                    <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:52px;height:65px;flex-shrink:0;">
                        ${ind.photo?`<img src="${ind.photo}" alt="">`:'<div class="photo-ph">👤</div>'}
                        <input type="file" accept="image/*" onchange="uploadIndependentPhoto(this,'${ind.id}')">
                    </div>
                    <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="color:#999;font-size:0.85rem;flex-shrink:0;" title="Number based on overall seat count">#${globalSeatNum}</span>
                            <input type="text" value="${ind.name||''}" placeholder="Member name"
                                style="flex:1;background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.95rem;padding:5px 8px;min-width:0;"
                                onchange="updateIndependent('${ind.id}','name',this.value)">
                        </div>
                        <select onchange="updateIndependent('${ind.id}','ideologyId',this.value?parseInt(this.value):null)"
                            style="width:100%;background:#000;border:1px solid #2a2a2a;color:#aaa;font-family:inherit;font-size:0.85rem;padding:4px;">
                            <option value="">No ideology assigned</option>
                            ${ideologies.filter(i=>i.id!==IND_IDEOLOGY_ID).map(i=>`<option value="${i.id}" ${ind.ideologyId===i.id?'selected':''}>${i.name}</option>`).join('')}
                        </select>
                        ${ind.photo?`<button onclick="removeIndependentPhoto('${ind.id}')" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">✕ Remove Photo</button>`:''}
                    </div>
                `;
                container.appendChild(div);
                startIndependentDragReorder(div.querySelector('.drag-handle'), 'independentList', '.drag-card-indlist', ch, renderIndependentList);
            });
            fitDynPhotos(container);
        }

        function updateIndependent(id, key, val) {
            const ind = independents.find(x=>x.id===id);
            if(!ind) return;
            ind[key] = val;
            if(key === 'name') renderIndependentList();
            simulate();
        }

        function uploadIndependentPhoto(input, id) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const ind = independents.find(x=>x.id===id);
                if(ind){ ind.photo = e.target.result; renderIndependentList(); }
            };
            reader.readAsDataURL(file);
        }

        function removeIndependentPhoto(id) {
            const ind = independents.find(x=>x.id===id);
            if(ind){ ind.photo=''; renderIndependentList(); }
        }

        // ===== Parliament > Independent tab: per-member coalition participation / external support settings =====
        let indMemberInnerTab = 'house';
        function switchIndMemberInnerTab(ch) {
            indMemberInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabIndMem'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
            renderIndMemberList();
        }

        function renderIndMemberList() {
            const container = document.getElementById('indMemberList');
            if(!container) return;
            container.innerHTML = '';

            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabIndMem'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) btn.style.display = chambers.includes(c) ? '' : 'none';
            });
            if(!chambers.includes(indMemberInnerTab)) indMemberInnerTab = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabIndMem'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===indMemberInnerTab);
            });

            const ch = indMemberInnerTab;
            const list = independents.filter(x=>x.chamber===ch).sort((a,b)=>a.seatIndex-b.seatIndex);
            const offset = computeIndependentOffset(ch);

            if(coalitions.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[No coalition formed — form a coalition in the Coalition tab first]</div>';
                return;
            }
            if(list.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[This chamber has no independent seats]</div>';
                return;
            }

            list.forEach(ind => {
                const indKey = 'ind__' + ind.id;
                // Determine current membership status
                let currentValue = '';
                for(const coal of coalitions) {
                    if(coal.members.includes(indKey)) { currentValue = 'm_'+coal.id; break; }
                    if(coal.externalSupporters?.includes(indKey)) { currentValue = 'e_'+coal.id; break; }
                }
                const globalSeatNum = offset + ind.seatIndex;
                const div = document.createElement('div');
                div.className = 'card-item drag-card-indmember';
                div.dataset.indId = ind.id;
                div.style.cssText = 'border-left-color:#999;margin-bottom:8px;padding:10px;';
                div.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span class="drag-handle">⋮⋮</span>
                        <span style="color:#999;font-size:0.85rem;flex-shrink:0;">#${globalSeatNum}</span>
                        <span style="color:#ccc;font-size:0.95rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ind.name||'(unnamed)'}</span>
                    </div>
                    <select onchange="updateIndCoalitionMembership('${ind.id}',this.value)"
                        style="width:100%;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:5px;">
                        <option value="" ${currentValue===''?'selected':''}>-- No Affiliation --</option>
                        ${coalitions.map(coal => `
                            <option value="m_${coal.id}" ${currentValue==='m_'+coal.id?'selected':''}>${coal.name} — Full Member</option>
                            <option value="e_${coal.id}" ${currentValue==='e_'+coal.id?'selected':''}>${coal.name} — ${coal.externalSupportLabel||'External Support'}</option>
                        `).join('')}
                    </select>
                `;
                container.appendChild(div);
                startIndependentDragReorder(div.querySelector('.drag-handle'), 'indMemberList', '.drag-card-indmember', ch, renderIndMemberList);
            });
        }

        function updateIndCoalitionMembership(indId, value) {
            const indKey = 'ind__' + indId;
            // Remove from all coalitions first
            coalitions.forEach(coal => {
                coal.members = coal.members.filter(m => m !== indKey);
                if(coal.externalSupporters) coal.externalSupporters = coal.externalSupporters.filter(m => m !== indKey);
            });
            if(value) {
                const [type, coalId] = [value.slice(0,1), value.slice(2)];
                const coal = coalitions.find(c => c.id === coalId);
                if(coal) {
                    if(type === 'm') coal.members.push(indKey);
                    else { if(!coal.externalSupporters) coal.externalSupporters = []; coal.externalSupporters.push(indKey); }
                }
            }
            refreshUI(); simulate();
        }

        // ===== Parliament > Members tab: individual management of district-elected members =====
        let membersInnerTab = 'house';
        function switchMembersInnerTab(ch) {
            membersInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabMembers'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
            renderMembersList();
        }

        // Return a chamber's district-winner list together with global seat numbers (offset applied)
        function getDistrictMemberEntries(ch) {
            const keys = districtSortedKeys(ch).filter(k => districtMembers[ch][k]);
            return keys.map(key => ({ key, member: districtMembers[ch][key], name: districtNames[ch][key] || key }));
        }

        function renderMembersList() {
            const container = document.getElementById('membersList');
            if(!container) return;
            container.innerHTML = '';

            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabMembers'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) btn.style.display = chambers.includes(c) ? '' : 'none';
            });
            if(!chambers.includes(membersInnerTab)) membersInnerTab = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabMembers'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===membersInnerTab);
            });

            const ch = membersInnerTab;
            const entries = getDistrictMemberEntries(ch);

            if(entries.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[No district-elected members — run an election using district+proportional mode and apply it to Parliament to see them here]</div>';
                return;
            }

            entries.forEach(({key, member, name}) => {
                const party = parties.find(p=>p.id===member.partyId);
                const div = document.createElement('div');
                div.className = 'card-item';
                div.style.cssText = `border-left-color:${member.vacant?'#663333':(party?.color||'#666')};margin-bottom:8px;padding:10px;${member.vacant?'opacity:0.6;':''}`;
                div.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="width:9px;height:9px;background:${party?.color||'#666'};border-radius:50%;flex-shrink:0;"></span>
                        <span style="color:#ccc;font-size:0.9rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${key}">${name}</span>
                        ${member.vacant?'<span style="color:#cc3333;font-size:0.75rem;">[Vacant]</span>':''}
                    </div>
                    <input type="text" value="${member.name||''}" placeholder="Member name" ${member.vacant?'disabled':''}
                        style="width:100%;box-sizing:border-box;background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.9rem;padding:5px 8px;margin-bottom:6px;"
                        onchange="updateDistrictMember('${ch}','${key}','name',this.value)">
                    <select ${member.vacant?'disabled':''} onchange="updateDistrictMemberParty('${ch}','${key}',parseInt(this.value))"
                        style="width:100%;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:4px;margin-bottom:6px;">
                        ${parties.filter(p=>p[inKeyFor(ch)]).map(p=>`<option value="${p.id}" ${member.partyId===p.id?'selected':''}>${p.name}</option>`).join('')}
                    </select>
                    ${(party?.factions||[]).length>0?`
                    <select ${member.vacant?'disabled':''} onchange="updateDistrictMember('${ch}','${key}','factionId',this.value||null)"
                        style="width:100%;background:#000;border:1px solid #333;color:#aaa;font-family:inherit;font-size:0.85rem;padding:4px;margin-bottom:6px;">
                        <option value="">No faction assigned</option>
                        ${party.factions.map(f=>`<option value="${f.id}" ${member.factionId===f.id?'selected':''}>${f.name}</option>`).join('')}
                    </select>`:''}
                    <div style="display:flex;gap:6px;">
                        ${member.vacant
                            ? `<button onclick="fillVacantSeat('${ch}','${key}')" style="flex:1;background:transparent;border:1px solid #00cc66;color:#00cc66;font-family:inherit;font-size:0.8rem;padding:5px;cursor:pointer;">Fill via By-election</button>`
                            : `<button onclick="vacateSeat('${ch}','${key}')" style="flex:1;background:transparent;border:1px solid #663333;color:#cc6666;font-family:inherit;font-size:0.8rem;padding:5px;cursor:pointer;">Mark Vacant (resigned/deceased)</button>`
                        }
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function updateDistrictMember(ch, key, field, value) {
            const m = districtMembers[ch][key];
            if(!m) return;
            m[field] = value;
            if(field !== 'name') simulate();
            if(field === 'name') renderMembersList();
        }

        // Change a district member's party (defection/transfer) — old party seats -1, new party seats +1
        function updateDistrictMemberParty(ch, key, newPartyId) {
            const m = districtMembers[ch][key];
            if(!m || m.partyId === newPartyId) return;
            const seatKey = seatKeyFor(ch);
            const oldParty = parties.find(p=>p.id===m.partyId);
            const newParty = parties.find(p=>p.id===newPartyId);
            if(oldParty) oldParty[seatKey] = Math.max(0, (oldParty[seatKey]||0) - 1);
            if(newParty) newParty[seatKey] = (newParty[seatKey]||0) + 1;
            m.partyId = newPartyId;
            m.factionId = null; // Faction membership is cleared on transfer
            refreshUI(); simulate();
        }

        // Mark vacant: a member leaves due to resignation/death, etc. — that party's seats -1 (vacant until a by-election)
        function vacateSeat(ch, key) {
            const m = districtMembers[ch][key];
            if(!m || m.vacant) return;
            if(!confirm('Mark this district as vacant?\n(The affiliated party\'s seat count decreases by 1 until refilled by a by-election)')) return;
            const seatKey = seatKeyFor(ch);
            const party = parties.find(p=>p.id===m.partyId);
            if(party) party[seatKey] = Math.max(0, (party[seatKey]||0) - 1);
            m.vacant = true;
            refreshUI(); simulate();
        }

        function fillVacantSeat(ch, key) {
            alert(`In the Election tab, check the "By-election" checkbox for the district and run the count\nto automatically include this district (${districtNames[ch][key]||key}).`);
        }








        // ═══════════════════════════════════════
        // Election simulation
        // ═══════════════════════════════════════
        const elecStore = { house:{}, senate:{}, third:{} };   // { chamber: { partyId: { prob, err } } } — independent per-chamber support rates (party lineups can differ)
        let elecProbChamber = 'house';  // chamber currently being edited in the support-rate tab
        let elecRunning  = false;
        let elecPaused   = false;
        let elecSkipToEnd = false;
        let elecRecords  = [];         // Election record array
        let elecLastResult = null;     // Last count result (for applying)

        // ── Tab switching ────────────────────────
        function switchDispTab(tab) {
            document.querySelectorAll('.disp-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.disp-panel').forEach(p => p.classList.remove('active'));
            const btn   = document.getElementById('dispTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
            const panel = document.getElementById('dispPanel' + tab.charAt(0).toUpperCase() + tab.slice(1));
            if(btn)   btn.classList.add('active');
            if(panel) panel.classList.add('active');
            requestAnimationFrame(() => {
                if(tab === 'house')  { simulate(); if(document.getElementById('houseViewDistrictWrap')?.style.display !== 'none') drawChamberDistrict('house'); }
                if(tab === 'senate') { simulate(); if(document.getElementById('senateViewDistrictWrap')?.style.display !== 'none') drawChamberDistrict('senate'); }
                if(tab === 'third')  { simulate(); if(document.getElementById('thirdViewDistrictWrap')?.style.display !== 'none') drawChamberDistrict('third'); }
            });
        }

        // Close a tab with × like a browser tab — if the closed tab was active, move to the rightmost remaining tab
        function closeDispTab(tab) {
            const btn = document.getElementById('dispTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
            if(!btn) return;
            const wasActive = btn.classList.contains('active');
            btn.style.display = 'none';
            if(wasActive) {
                const visible = Array.from(document.querySelectorAll('.disp-tab-btn'))
                    .filter(b => b.style.display !== 'none');
                if(visible.length > 0) {
                    const last = visible[visible.length - 1];
                    const targetTab = last.dataset.tab;
                    if(targetTab) switchDispTab(targetTab);
                }
            }
        }

        // ─────────────────────────────────────────
        // District map
        // ─────────────────────────────────────────
        let districtGrid = { house: {}, senate: {}, third: {} };
        let districtNames = { house: {}, senate: {}, third: {} }; // { "q,r": "name" }
        let districtMembers = { house: {}, senate: {}, third: {} }; // { "q,r": {name, partyId, factionId, vacant} } — individual info for district-elected members
        let districtOrder = { house: [], senate: [], third: [] }; // list display order (can be changed by dragging)
        let selectedDistrictKey = null; // the cell clicked/selected in 'name' mode

        function districtOrderSync(ch) {
            // Reflect districtGrid changes onto districtOrder (add missing entries, remove entries that no longer exist)
            const keys = Object.keys(districtGrid[ch]);
            districtOrder[ch] = districtOrder[ch].filter(k => districtGrid[ch][k]);
            keys.forEach(k => { if(!districtOrder[ch].includes(k)) districtOrder[ch].push(k); });
        }

        function districtSortedKeys(ch) {
            districtOrderSync(ch);
            return [...districtOrder[ch]];
        }
        let districtView = { zoom: 1, panX: 0, panY: 0 };
        let districtMode = 'add'; // 'add' | 'remove'
        let districtChamber = 'house'; // 'house' | 'senate' | 'third'
        const HEX_SIZE = 18;

        function districtSetChamber(ch) {
            districtChamber = ch;
            const hBtn = document.getElementById('districtChamberHouseBtn');
            const sBtn = document.getElementById('districtChamberSenateBtn');
            const tBtn = document.getElementById('districtChamberThirdBtn');
            const neon = getComputedStyle(document.documentElement).getPropertyValue('--tno-neon').trim()||'#00ffff';
            if(hBtn) {
                hBtn.style.background   = ch==='house' ? '#0a1a2a' : 'transparent';
                hBtn.style.color        = ch==='house' ? neon : '#335533';
                hBtn.style.borderColor  = ch==='house' ? neon : '#335533';
            }
            if(sBtn) {
                sBtn.style.background   = ch==='senate' ? '#1a1200' : 'transparent';
                sBtn.style.color        = ch==='senate' ? 'var(--tno-gold)' : '#664400';
                sBtn.style.borderColor  = ch==='senate' ? 'var(--tno-gold)' : '#664400';
            }
            if(tBtn) {
                tBtn.style.background   = ch==='third' ? '#1a0022' : 'transparent';
                tBtn.style.color        = ch==='third' ? '#cc33ff' : '#6a0080';
                tBtn.style.borderColor  = ch==='third' ? '#cc33ff' : '#6a0080';
            }
            selectedDistrictKey = null;
            const namePanel = document.getElementById('districtNamePanel');
            if(namePanel) namePanel.style.display = 'none';
            districtDrawCanvas();
        }

        function districtSetMode(mode) {
            districtMode = mode;
            const addBtn = document.getElementById('districtModeAdd');
            const remBtn = document.getElementById('districtModeRemove');
            const nameBtn = document.getElementById('districtModeName');
            const noneBtn = document.getElementById('districtModeNone');
            if(addBtn) {
                addBtn.style.background  = mode==='add' ? '#0a2a1a' : 'transparent';
                addBtn.style.color       = mode==='add' ? '#00cc66' : '#336644';
                addBtn.style.borderColor = mode==='add' ? '#00cc66' : '#336644';
                addBtn.style.boxShadow   = mode==='add' ? '0 0 8px #00cc6688' : 'none';
            }
            if(remBtn) {
                remBtn.style.background  = mode==='remove' ? '#2a0a0a' : 'transparent';
                remBtn.style.color       = mode==='remove' ? '#cc3333' : '#663333';
                remBtn.style.borderColor = mode==='remove' ? '#cc3333' : '#663333';
                remBtn.style.boxShadow   = mode==='remove' ? '0 0 8px #cc333388' : 'none';
            }
            if(nameBtn) {
                nameBtn.style.background  = mode==='name' ? '#2a2a0a' : 'transparent';
                nameBtn.style.color       = mode==='name' ? '#cccc33' : '#666633';
                nameBtn.style.borderColor = mode==='name' ? '#cccc33' : '#666633';
                nameBtn.style.boxShadow   = mode==='name' ? '0 0 8px #cccc3388' : 'none';
            }
            if(noneBtn) {
                noneBtn.style.background  = mode==='none' ? '#1a1a1a' : 'transparent';
                noneBtn.style.color       = mode==='none' ? '#aaa' : '#555';
                noneBtn.style.borderColor = mode==='none' ? '#888' : '#444';
            }
            const namePanel = document.getElementById('districtNamePanel');
            if(namePanel) {
                if(mode !== 'name') { namePanel.style.display = 'none'; selectedDistrictKey = null; }
            }
            const cvs = document.getElementById('districtCanvas');
            if(cvs) cvs.style.cursor = mode==='none' ? 'grab' : (mode==='remove' ? 'cell' : mode==='name' ? 'pointer' : 'crosshair');
            districtDrawCanvas();
        }

        function districtRenderNamePanel() {
            const panel = document.getElementById('districtNamePanel');
            const coordEl = document.getElementById('districtNamePanelCoord');
            const input = document.getElementById('districtNameInput');
            if(!panel || !selectedDistrictKey) { if(panel) panel.style.display = 'none'; return; }
            panel.style.display = '';
            if(coordEl) coordEl.textContent = `(${selectedDistrictKey})`;
            if(input) input.value = districtNames[districtChamber][selectedDistrictKey] || '';
        }

        function districtSetName(name) {
            if(!selectedDistrictKey) return;
            if(name.trim()) districtNames[districtChamber][selectedDistrictKey] = name.trim();
            else delete districtNames[districtChamber][selectedDistrictKey];
            renderDistrictListPanel();
        }

        // ── District list panel (House/Senate/Third 3rd-level tabs + drag sort) ──
        let districtListInnerTab = 'house';
        function switchDistrictListInnerTab(ch) {
            districtListInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabDistList'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
            renderDistrictListPanel();
        }

        function renderDistrictListPanel() {
            const container = document.getElementById('districtListPanel');
            if(!container) return;
            container.innerHTML = '';

            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabDistList'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) btn.style.display = chambers.includes(c) ? '' : 'none';
            });
            if(!chambers.includes(districtListInnerTab)) districtListInnerTab = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabDistList'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===districtListInnerTab);
            });

            const ch = districtListInnerTab;
            const keys = districtSortedKeys(ch);

            if(keys.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:16px;font-size:0.85rem;">[No active districts]</div>';
                return;
            }

            keys.forEach(key => {
                const div = document.createElement('div');
                div.className = 'drag-card-district';
                div.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px;background:#0a0c10;border:1px solid #222;margin-bottom:5px;';
                const name = districtNames[ch][key] || '';
                div.innerHTML = `
                    <span class="drag-handle">⋮⋮</span>
                    <span style="color:#555;font-size:0.75rem;flex-shrink:0;width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${key}">${key}</span>
                    <input type="text" value="${name}" placeholder="(no name)"
                        style="flex:1;min-width:0;background:#000;border:1px solid #2a2a2a;color:#ddd;font-family:inherit;font-size:0.85rem;padding:4px 6px;"
                        onchange="districtSetNameByKey('${ch}','${key}',this.value)">
                `;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'districtListPanel', '.drag-card-district', districtOrder[ch], renderDistrictListPanel);
            });
        }

        function districtSetNameByKey(ch, key, name) {
            if(name.trim()) districtNames[ch][key] = name.trim();
            else delete districtNames[ch][key];
            if(ch === districtChamber && key === selectedDistrictKey) districtRenderNamePanel();
            districtDrawCanvas();
        }

        // Given a coordinate, find which chamber it belongs to and return its name (or empty string); returns null if not an active district
        function districtNameFor(key) {
            for(const ch of ['house','senate','third']) {
                if(districtGrid[ch][key]) return districtNames[ch][key] || '';
            }
            return null;
        }

        function districtHexCorners(cx, cy, size) {
            return Array.from({length:6}, (_,i) => {
                const a = Math.PI/180 * (60*i);   // flat-top: starting from 0°
                return [cx + size * Math.cos(a), cy + size * Math.sin(a)];
            });
        }

        function districtAxialToPixel(q, r, size, panX, panY) {
            // flat-top axial → pixel
            const x = size * (3/2 * q) + panX;
            const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r) + panY;
            return [x, y];
        }

        function districtPixelToAxial(px, py, size, panX, panY) {
            // flat-top pixel → axial
            const x = (px - panX) / size;
            const y = (py - panY) / size;
            const q = (2/3 * x);
            const r = (-1/3 * x + Math.sqrt(3)/3 * y);
            return districtHexRound(q, r);
        }

        function districtHexRound(q, r) {
            const s = -q - r;
            let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
            const dq = Math.abs(rq-q), dr = Math.abs(rr-r), ds = Math.abs(rs-s);
            if(dq > dr && dq > ds) rq = -rr-rs;
            else if(dr > ds) rr = -rq-rs;
            return [rq, rr];
        }

        function districtDrawCanvas() {
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;
            const w = cvs.offsetWidth  || cvs.parentElement?.offsetWidth  || 500;
            const h = cvs.offsetHeight || cvs.parentElement?.offsetHeight || 400;
            if(w < 10 || h < 10) return;
            cvs.width  = w;
            cvs.height = h;
            const ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, cvs.width, cvs.height);

            const size = HEX_SIZE * districtView.zoom;
            const { panX, panY } = districtView;
            const neonColor = getComputedStyle(document.documentElement).getPropertyValue('--tno-neon').trim() || '#00ffff';

            // Determine grid bounds by computing the axial coordinates of all four screen corners
            const corners4 = [
                districtPixelToAxial(0, 0,           size, panX, panY),
                districtPixelToAxial(cvs.width, 0,   size, panX, panY),
                districtPixelToAxial(0, cvs.height,  size, panX, panY),
                districtPixelToAxial(cvs.width, cvs.height, size, panX, panY),
            ];
            const qs = corners4.map(c => c[0]);
            const rs = corners4.map(c => c[1]);
            const minQ = Math.min(...qs) - 2;
            const maxQ = Math.max(...qs) + 2;
            const minR = Math.min(...rs) - 2;
            const maxR = Math.max(...rs) + 2;

            for(let r = minR; r <= maxR; r++) {
                for(let q = minQ; q <= maxQ; q++) {
                    const [cx, cy] = districtAxialToPixel(q, r, size, panX, panY);
                    if(cx < -size*2 || cx > cvs.width+size*2 || cy < -size*2 || cy > cvs.height+size*2) continue;

                    const key = `${q},${r}`;
                    const activeHouse   = !!districtGrid.house[key];
                    const activeSenate  = !!districtGrid.senate[key];
                    const activeThird   = !!districtGrid.third[key];
                    const active = activeHouse || activeSenate || activeThird;
                    const corners = districtHexCorners(cx, cy, size * 0.95);

                    ctx.beginPath();
                    ctx.moveTo(...corners[0]);
                    corners.slice(1).forEach(c => ctx.lineTo(...c));
                    ctx.closePath();
                    ctx.fillStyle = activeHouse ? '#0a2020' : activeSenate ? '#1a1500' : activeThird ? '#1a0022' : '#0a0c10';
                    ctx.fill();

                    if(activeHouse) {
                        ctx.strokeStyle = neonColor;
                        ctx.lineWidth = 2;
                        ctx.shadowColor = neonColor;
                        ctx.shadowBlur = 6;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    } else if(activeSenate) {
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 2;
                        ctx.shadowColor = '#ffd700';
                        ctx.shadowBlur = 6;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    } else if(activeThird) {
                        ctx.strokeStyle = '#cc33ff';
                        ctx.lineWidth = 2;
                        ctx.shadowColor = '#cc33ff';
                        ctx.shadowBlur = 6;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    } else {
                        ctx.strokeStyle = '#1a1d22';
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            const cntH = Object.keys(districtGrid.house).length;
            const cntS = Object.keys(districtGrid.senate).length;
            const cntT = Object.keys(districtGrid.third).length;
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const el = document.getElementById('districtCount');
            if(el) {
                let txt = `House ${cntH} cells`;
                if(isBi) txt += ` · Senate ${cntS} cells`;
                if(isTri) txt += ` · Third ${cntT} cells`;
                el.textContent = txt;
            }
        }

        function districtFitView() {
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;
            const allKeys = [...new Set([...Object.keys(districtGrid.house), ...Object.keys(districtGrid.senate)])];
            if(allKeys.length === 0) return; // Leave as-is if there are no active cells

            const w = cvs.offsetWidth  || 500;
            const h = cvs.offsetHeight || 400;

            // Axial bounding box of active cells
            let minQ=Infinity, maxQ=-Infinity, minR=Infinity, maxR=-Infinity;
            allKeys.forEach(k => {
                const [q,r] = k.split(',').map(Number);
                if(q<minQ) minQ=q; if(q>maxQ) maxQ=q;
                if(r<minR) minR=r; if(r>maxR) maxR=r;
            });

            // padding: 2-cell margin around active cells
            const PAD = 2;
            minQ -= PAD; maxQ += PAD;
            minR -= PAD; maxR += PAD;

            // Compute a size that fits this range exactly on the canvas (flat-top)
            const spanX = (maxQ - minQ + 1) * 1.5 + 0.5;
            const spanY = (maxR - minR + 1) * Math.sqrt(3) + Math.sqrt(3)/2;
            const sizeByW = w / spanX;
            const sizeByH = h / spanY;
            const newSize = Math.min(sizeByW, sizeByH, HEX_SIZE * 3); // Cap so it doesn't get too large

            // Fit the center axial coordinate to the center of the screen
            const cq = (minQ + maxQ) / 2;
            const cr = (minR + maxR) / 2;
            const [px, py] = [
                newSize * (3/2 * cq),
                newSize * (Math.sqrt(3)/2 * cq + Math.sqrt(3) * cr)
            ];
            districtView.zoom = newSize / HEX_SIZE;
            districtView.panX = w/2 - px;
            districtView.panY = h/2 - py;
            districtDrawCanvas();
        }

        function districtZoom(factor) {
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;
            districtView.panX = cx + (districtView.panX - cx) * factor;
            districtView.panY = cy + (districtView.panY - cy) * factor;
            districtView.zoom = Math.max(0.3, Math.min(5, districtView.zoom * factor));
            districtDrawCanvas();
        }

        function districtResetView() {
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;
            const w = cvs.offsetWidth || 500;
            const h = cvs.offsetHeight || 400;
            districtView = { zoom: 1, panX: w/2, panY: h/2 };
            districtDrawCanvas();
        }

        function districtClearAll() {
            districtGrid[districtChamber] = {};
            districtNames[districtChamber] = {};
            districtOrder[districtChamber] = [];
            selectedDistrictKey = null;
            const namePanel = document.getElementById('districtNamePanel');
            if(namePanel) namePanel.style.display = 'none';
            districtDrawCanvas();
            renderDistrictListPanel();
        }

        function districtInitCanvas() {
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;

            // Secure the actual width (works correctly even if a tab was hidden then reopened)
            let w = cvs.offsetWidth  || cvs.parentElement?.offsetWidth  || 500;
            const h = cvs.offsetHeight || cvs.parentElement?.offsetHeight || 400;

            if(districtView.panX === 0) {
                districtView.panX = w / 2;
                districtView.panY = h / 2;
                // Auto-fit if there are active cells
                const allKeys = [...Object.keys(districtGrid.house), ...Object.keys(districtGrid.senate)];
                if(allKeys.length > 0) {
                    setTimeout(() => districtFitView(), 0);
                }
            }

            // Bind events only once
            if(!cvs._districtInited) {
                cvs._districtInited = true;
                let isMiddle = false, isPainting = false;
                let lastX = 0, lastY = 0;

                cvs.addEventListener('mousedown', e => {
                    if(e.button === 1) {
                        isMiddle = true;
                        lastX = e.offsetX; lastY = e.offsetY;
                        e.preventDefault(); return;
                    }
                    if(e.button === 0) {
                        if(districtMode === 'none') {
                            // Deselect mode: left-click drag only pans
                            isMiddle = true;
                            lastX = e.offsetX; lastY = e.offsetY;
                            return;
                        }
                        const size = HEX_SIZE * districtView.zoom;
                        const [q, r] = districtPixelToAxial(e.offsetX, e.offsetY, size, districtView.panX, districtView.panY);
                        const key = `${q},${r}`;
                        if(districtMode === 'name') {
                            // Name mode: click to select a cell (not drag)
                            if(districtGrid[districtChamber][key]) {
                                selectedDistrictKey = key;
                                districtRenderNamePanel();
                                districtDrawCanvas();
                            }
                            return;
                        }
                        isPainting = true;
                        const others = ['house','senate','third'].filter(c=>c!==districtChamber);
                        if(districtMode === 'add') {
                            // Cannot add if it already exists in another chamber
                            if(!others.some(o=>districtGrid[o][key])) { districtGrid[districtChamber][key] = true; districtOrderSync(districtChamber); }
                        } else {
                            delete districtGrid[districtChamber][key];
                            if(selectedDistrictKey === key) selectedDistrictKey = null;
                            districtOrderSync(districtChamber);
                        }
                        districtDrawCanvas();
                    }
                });
                cvs.addEventListener('mousemove', e => {
                    if(isMiddle) {
                        districtView.panX += e.offsetX - lastX;
                        districtView.panY += e.offsetY - lastY;
                        lastX = e.offsetX; lastY = e.offsetY;
                        districtDrawCanvas(); return;
                    }
                    if(isPainting && districtMode !== 'none' && districtMode !== 'name') {
                        const size = HEX_SIZE * districtView.zoom;
                        const [q, r] = districtPixelToAxial(e.offsetX, e.offsetY, size, districtView.panX, districtView.panY);
                        const key = `${q},${r}`;
                        const others2 = ['house','senate','third'].filter(c=>c!==districtChamber);
                        if(districtMode === 'add') {
                            if(!others2.some(o=>districtGrid[o][key])) { districtGrid[districtChamber][key] = true; districtOrderSync(districtChamber); }
                        } else {
                            delete districtGrid[districtChamber][key];
                            districtOrderSync(districtChamber);
                        }
                        districtDrawCanvas();
                        return;
                    }
                    // Hover tooltip (when not drawing/panning)
                    const size = HEX_SIZE * districtView.zoom;
                    const [hq, hr] = districtPixelToAxial(e.offsetX, e.offsetY, size, districtView.panX, districtView.panY);
                    const hkey = `${hq},${hr}`;
                    const tip = document.getElementById('tooltipBox');
                    if(tip && districtGrid[districtChamber][hkey]) {
                        const nm = districtNames[districtChamber][hkey];
                        const mem = districtMembers[districtChamber][hkey];
                        let text = nm ? nm : `(${hkey})`;
                        if(mem) {
                            const memParty = parties.find(p=>p.id===mem.partyId);
                            if(mem.vacant) text += ` — Vacant`;
                            else text += ` — ${mem.name||'(unnamed)'} (${memParty?.name||'?'})`;
                        }
                        positionTooltip(tip, text, e.clientX, e.clientY);
                    } else if(tip) {
                        tip.style.display = 'none';
                    }
                });
                cvs.addEventListener('mouseup',    () => { isMiddle=false; isPainting=false; });
                cvs.addEventListener('mouseleave', () => { isMiddle=false; isPainting=false; document.getElementById('tooltipBox').style.display='none'; });
                cvs.addEventListener('wheel', e => {
                    e.preventDefault();
                    const factor = e.deltaY < 0 ? 1.15 : 1/1.15;
                    districtView.panX = e.offsetX + (districtView.panX - e.offsetX) * factor;
                    districtView.panY = e.offsetY + (districtView.panY - e.offsetY) * factor;
                    districtView.zoom = Math.max(0.3, Math.min(5, districtView.zoom * factor));
                    districtDrawCanvas();
                }, { passive: false });
            }

            districtDrawCanvas();
        }

        // ─────────────────────────────────────────
        // Tendency map
        // ─────────────────────────────────────────
        let tendencyData   = {};   // { partyId: { "q,r": 0|25|50|75|100 } }
        let tendencyStrength = 50;

        function tendencySetStrength(v) {
            tendencyStrength = v;
            [0,25,50,75,100].forEach(s => {
                const btn = document.getElementById(`tendStrBtn${s}`);
                if(!btn) return;
                btn.style.background = s===v ? 'var(--tno-neon)' : '#111';
                btn.style.color      = s===v ? '#000' : '#888';
                btn.style.borderColor= s===v ? 'var(--tno-neon)' : '#333';
            });
        }

        function tendencyGetBounds() {
            const keys = [...new Set([...Object.keys(districtGrid.house), ...Object.keys(districtGrid.senate), ...Object.keys(districtGrid.third)])];
            if(keys.length === 0) return null;
            let minQ=Infinity, maxQ=-Infinity, minR=Infinity, maxR=-Infinity;
            keys.forEach(k => {
                const [q,r] = k.split(',').map(Number);
                if(q<minQ) minQ=q; if(q>maxQ) maxQ=q;
                if(r<minR) minR=r; if(r>maxR) maxR=r;
            });
            return { minQ, maxQ, minR, maxR };
        }

        function tendencyAllKeys() {
            return [...new Set([...Object.keys(districtGrid.house), ...Object.keys(districtGrid.senate), ...Object.keys(districtGrid.third)])];
        }

        function tendencyDrawMap(cvs, partyId) {
            // partyId === '__all__' means the composite map
            const isAll = partyId === '__all__';
            const w = cvs.clientWidth || 260;
            const bounds = tendencyGetBounds();
            if(!bounds) { cvs.width=w; cvs.height=60; const c=cvs.getContext('2d'); c.fillStyle='#333'; c.font='12px monospace'; c.fillText('Set up districts first',8,35); return; }

            const { minQ, maxQ, minR, maxR } = bounds;
            // flat-top: x-direction is q, y-direction is r
            const spanQ = maxQ - minQ + 1;
            const spanR = maxR - minR + 1;
            // Compute flat-top pixel range
            const sizeByW = w / (spanQ * 1.5 + 0.5);
            const sizeByH = (w * 1.2) / (spanR * Math.sqrt(3) + Math.sqrt(3)/2 + 1);
            const size = Math.min(sizeByW, sizeByH, 20);
            const totalH = Math.ceil(size * (spanR * Math.sqrt(3) + Math.sqrt(3)) + size * 2);
            cvs.width = w; cvs.height = Math.max(totalH, 60);

            // Fit the center cell to the center of the canvas
            const cq = (minQ + maxQ) / 2;
            const cr = (minR + maxR) / 2;
            const offX = cvs.width/2  - size * (3/2 * cq);
            const offY = cvs.height/2 - size * (Math.sqrt(3)/2 * cq + Math.sqrt(3) * cr);

            const ctx = cvs.getContext('2d');
            ctx.clearRect(0,0,cvs.width,cvs.height);
            const neon = getComputedStyle(document.documentElement).getPropertyValue('--tno-neon').trim()||'#00ffff';

            tendencyAllKeys().forEach(key => {
                const [q,r] = key.split(',').map(Number);
                const [cx,cy] = districtAxialToPixel(q, r, size, offX, offY);
                const corners = districtHexCorners(cx, cy, size*0.93);
                const isHouse  = !!districtGrid.house[key];
                const isSenate = !!districtGrid.senate[key];
                const isThird  = !!districtGrid.third[key];

                ctx.beginPath();
                ctx.moveTo(...corners[0]);
                corners.slice(1).forEach(c=>ctx.lineTo(...c));
                ctx.closePath();

                if(isAll) {
                    let bestParty = null, bestVal = -1;
                    parties.forEach(p => {
                        const val = tendencyData[p.id]?.[key] || 0;
                        if(val > bestVal) { bestVal=val; bestParty=p; }
                    });
                    if(bestParty && bestVal > 0) {
                        ctx.fillStyle = bestParty.color + Math.round(bestVal/100*255).toString(16).padStart(2,'0');
                        ctx.fill();
                        ctx.strokeStyle = bestParty.color;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        if(size > 12) {
                            ctx.fillStyle = '#fff';
                            ctx.font = `${Math.round(size*0.55)}px monospace`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(bestVal+'%', cx, cy);
                        }
                    } else {
                        ctx.fillStyle = '#111'; ctx.fill();
                        ctx.strokeStyle = '#222'; ctx.lineWidth=0.8; ctx.stroke();
                    }
                } else {
                    const val = tendencyData[partyId]?.[key] || 0;
                    const p = parties.find(x=>x.id===partyId);
                    if(p && val > 0) {
                        ctx.fillStyle = p.color + Math.round(val/100*200+55).toString(16).padStart(2,'0');
                        ctx.fill();
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        if(size > 12) {
                            ctx.fillStyle = '#fff';
                            ctx.font = `${Math.round(size*0.55)}px monospace`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(val+'%', cx, cy);
                        }
                    } else {
                        ctx.fillStyle = '#111'; ctx.fill();
                        ctx.strokeStyle = '#1a1d22'; ctx.lineWidth=0.8; ctx.stroke();
                    }
                }
                // District boundary overlay (House=neon, Senate=gold, Third=purple)
                if(isHouse || isSenate || isThird) {
                    const innerCorners = districtHexCorners(cx, cy, size*0.82);
                    ctx.beginPath();
                    ctx.moveTo(...innerCorners[0]);
                    innerCorners.slice(1).forEach(c=>ctx.lineTo(...c));
                    ctx.closePath();
                    const flags = [isHouse, isSenate, isThird].filter(Boolean).length;
                    if(flags > 1) {
                        // If two or more overlap: draw a solid neon line, with dashed lines layered for the rest
                        if(isHouse) { ctx.strokeStyle = neon; ctx.lineWidth = 1.5; ctx.stroke(); }
                        if(isSenate) { ctx.strokeStyle = 'rgba(255,200,0,0.85)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]); }
                        if(isThird) { ctx.strokeStyle = 'rgba(204,51,255,0.85)'; ctx.lineWidth = 1; ctx.setLineDash([2,2]); ctx.stroke(); ctx.setLineDash([]); }
                    } else if(isHouse) {
                        ctx.strokeStyle = neon;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    } else if(isSenate) {
                        ctx.strokeStyle = 'rgba(255,200,0,0.9)';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    } else if(isThird) {
                        ctx.strokeStyle = 'rgba(204,51,255,0.9)';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }
            });
        }

        function tendencyRenderMaps() {
            const container = document.getElementById('tendencyMaps');
            if(!container) return;
            container.innerHTML = '';
            // Reset offset cache (since map size can change)
            parties.forEach(p => { p._tendOffset = { x: null, y: null }; });

            // Composite map
            const allWrap = document.createElement('div');
            allWrap.style.cssText = 'margin-bottom:12px;';
            allWrap.innerHTML = `<div style="color:#888;font-size:0.8rem;margin-bottom:4px;letter-spacing:1px;">▌ Composite</div>`;
            const allCvs = document.createElement('canvas');
            allCvs.style.cssText = 'width:100%;display:block;background:#0a0c10;border:1px solid #222;cursor:default;';
            allWrap.appendChild(allCvs);
            container.appendChild(allWrap);

            // Per-party maps
            parties.forEach(p => {
                if(!tendencyData[p.id]) tendencyData[p.id] = {};
                const wrap = document.createElement('div');
                wrap.style.cssText = 'margin-bottom:12px;';
                wrap.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="width:10px;height:10px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                        <span style="color:#aaa;font-size:0.8rem;">${p.name}</span>
                    </div>`;
                const cvs = document.createElement('canvas');
                cvs.style.cssText = 'width:100%;display:block;background:#0a0c10;border:1px solid #222;cursor:crosshair;';
                cvs.dataset.partyId = p.id;

                // Events: click/drag to paint, wheel-click-drag to pan
                let painting = false, middleDrag = false, mx=0, my=0;
                // Store each map's own offset
                if(!p._tendOffset) p._tendOffset = { x: null, y: null };

                function getTendOffset(c) {
                    if(p._tendOffset.x === null) {
                        const w2 = c.clientWidth || c.offsetWidth || 260;
                        const bounds = tendencyGetBounds();
                        if(!bounds) return;
                        const {minQ,maxQ,minR,maxR} = bounds;
                        const spanQ = maxQ-minQ+1, spanR = maxR-minR+1;
                        const sizeByW = w2 / (spanQ * 1.5 + 0.5);
                        const sizeByH = (w2 * 1.2) / (spanR * Math.sqrt(3) + Math.sqrt(3)/2 + 1);
                        const sz = Math.min(sizeByW, sizeByH, 20);
                        const cq = (minQ+maxQ)/2, cr = (minR+maxR)/2;
                        p._tendOffset.x    = w2/2 - sz*(3/2*cq);
                        p._tendOffset.y    = (c.offsetHeight||w2*0.6)/2 - sz*(Math.sqrt(3)/2*cq + Math.sqrt(3)*cr);
                        p._tendOffset.size = sz;
                    }
                    return p._tendOffset;
                }

                cvs.addEventListener('mousedown', e => {
                    if(e.button===1){ middleDrag=true; mx=e.offsetX; my=e.offsetY; e.preventDefault(); return; }
                    if(e.button===0) {
                        painting=true;
                        const off = getTendOffset(cvs); if(!off) return;
                        const [q,r]=districtPixelToAxial(e.offsetX, e.offsetY, off.size, off.x, off.y);
                        const key=`${q},${r}`;
                        if(districtGrid.house[key] || districtGrid.senate[key] || districtGrid.third[key]) {
                            if(tendencyStrength===0) delete tendencyData[p.id][key];
                            else tendencyData[p.id][key]=tendencyStrength;
                            tendencyDrawMap(cvs, p.id);
                            tendencyDrawMap(allCvs, '__all__');
                        }
                    }
                });
                cvs.addEventListener('mousemove', e => {
                    if(middleDrag) {
                        const off = getTendOffset(cvs); if(!off) return;
                        off.x += e.offsetX-mx; off.y += e.offsetY-my;
                        mx=e.offsetX; my=e.offsetY;
                        tendencyDrawMap(cvs, p.id); return;
                    }
                    if(painting) {
                        const off = getTendOffset(cvs); if(!off) return;
                        const [q,r]=districtPixelToAxial(e.offsetX, e.offsetY, off.size, off.x, off.y);
                        const key=`${q},${r}`;
                        if(districtGrid.house[key] || districtGrid.senate[key] || districtGrid.third[key]) {
                            if(tendencyStrength===0) delete tendencyData[p.id][key];
                            else tendencyData[p.id][key]=tendencyStrength;
                            tendencyDrawMap(cvs, p.id);
                            tendencyDrawMap(allCvs, '__all__');
                        }
                        return;
                    }
                    // Hover tooltip
                    const off = getTendOffset(cvs);
                    const tip = document.getElementById('tooltipBox');
                    if(off && tip) {
                        const [hq,hr] = districtPixelToAxial(e.offsetX, e.offsetY, off.size, off.x, off.y);
                        const hkey = `${hq},${hr}`;
                        const nm = districtNameFor(hkey);
                        if(nm !== null) {
                            let text = nm || `(${hkey})`;
                            const hCh = ['house','senate','third'].find(c => districtGrid[c][hkey]);
                            const mem = hCh ? districtMembers[hCh][hkey] : null;
                            if(mem) {
                                const memParty = parties.find(p=>p.id===mem.partyId);
                                if(mem.vacant) text += ` — Vacant`;
                                else text += ` — ${mem.name||'(unnamed)'} (${memParty?.name||'?'})`;
                            }
                            positionTooltip(tip, text, e.clientX, e.clientY);
                        } else {
                            tip.style.display = 'none';
                        }
                    }
                });
                cvs.addEventListener('mouseup', ()=>{painting=false; middleDrag=false;});
                cvs.addEventListener('mouseleave', ()=>{painting=false; middleDrag=false; document.getElementById('tooltipBox').style.display='none';});

                wrap.appendChild(cvs);
                container.appendChild(wrap);

                requestAnimationFrame(() => {
                    tendencyDrawMap(cvs, p.id);
                });
            });

            requestAnimationFrame(() => { tendencyDrawMap(allCvs, '__all__'); });
        }

        // ─────────────────────────────────────────
        // Election result view switching
        // ─────────────────────────────────────────
        function elecSetView(view, chamber) {
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            const arcDiv  = document.getElementById('elecViewArc'+suf);
            const distDiv = document.getElementById('elecViewDistrict'+suf);
            const arcBtn  = document.getElementById('elecViewArcBtn'+suf);
            const distBtn = document.getElementById('elecViewDistrictBtn'+suf);
            if(!arcDiv) return;
            if(view === 'arc') {
                arcDiv.style.display=''; distDiv.style.display='none';
                arcBtn.style.background='var(--tno-neon)'; arcBtn.style.color='#000'; arcBtn.style.borderColor='var(--tno-neon)';
                distBtn.style.background='transparent'; distBtn.style.color='#555'; distBtn.style.borderColor='#333';
            } else {
                arcDiv.style.display='none'; distDiv.style.display='';
                distBtn.style.background='var(--tno-neon)'; distBtn.style.color='#000'; distBtn.style.borderColor='var(--tno-neon)';
                arcBtn.style.background='transparent'; arcBtn.style.color='#555'; arcBtn.style.borderColor='#333';
            }
        }

        // ─────────────────────────────────────────
        // Election sub-tab switching
        // ─────────────────────────────────────────
        function elecSwitchSub(sub) {
            ['district','tendency','vote','record'].forEach(s => {
                document.getElementById(`elecSubTab${s.charAt(0).toUpperCase()+s.slice(1)}`)?.classList.toggle('active', s===sub);
                document.getElementById(`elecSub${s.charAt(0).toUpperCase()+s.slice(1)}`)?.classList.toggle('active', s===sub);
            });
            if(sub === 'district') {
                document.getElementById('dispTabDistrict').style.display = '';
                switchDispTab('district');
                setTimeout(() => { districtInitCanvas(); }, 80);
                renderDistrictListPanel();
            }
            if(sub === 'tendency') {
                document.getElementById('dispTabTendency').style.display = '';
                switchDispTab('tendency');
                setTimeout(() => { tendencyRenderMaps(); }, 80);
            }
        }

        function buildParliamentMap(chamberType) {
            const total = parseInt(document.getElementById(chamberType==='senate'?'senateTotal':chamberType==='third'?'thirdTotal':'houseTotal').value)||0;
            const highlightGov = document.getElementById('chkGovHighlight').checked;
            const seatKey = seatKeyFor(chamberType);
            const rulingCoal = coalitions.find(c=>c.isRuling);
            let map = [];
            parties.filter(p => p[inKeyFor(chamberType)]).forEach(p => {
                const cnt = p[seatKey];
                const coal = coalitions.find(c=>c.members.includes(p.id));
                const isPartyRuling = p.isRuling;
                const isCoalRuling  = !isPartyRuling && (coal && coal.isRuling);
                const isGov = isPartyRuling || isCoalRuling;
                const effectiveCoal = (isPartyRuling && !(coal && coal.isRuling)) ? null : coal;
                const isExtSupport = !isGov && !coal && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                let stroke = highlightGov&&isGov ? 'var(--tno-gold)' : (effectiveCoal?effectiveCoal.color:null);
                let strokeDashed = false;
                if(isExtSupport && rulingCoal) { stroke = highlightGov ? '#ffd700' : rulingCoal.color; strokeDashed = true; }

                // Faction seat allocation
                const factions = (p.factions||[]).filter(f=>(f[seatKey]||0)>0);
                if(factions.length > 0) {
                    let placed = 0;
                    factions.forEach(f => {
                        const fc = f.usePartyColor ? p.color : f.color;
                        const fKey = `${p.id}__${f.id}`;
                        const fCoal = coalitions.find(c=>c.members.includes(fKey));
                        const fCoalRuling = !isPartyRuling && (fCoal && fCoal.isRuling);
                        const fIsGov = isPartyRuling || fCoalRuling;
                        const fEffCoal = (isPartyRuling && !(fCoal && fCoal.isRuling)) ? null : fCoal;
                        const fStroke = highlightGov&&fIsGov ? 'var(--tno-gold)' : (fEffCoal?fEffCoal.color:null);
                        for(let k=0; k<(f[seatKey]||0); k++){
                            if(map.length>=total) break;
                            map.push({color:fc, partyName:p.name, factionName:f.name,
                                ideology:ideologies.find(i=>i.id===f.ideologyId)?.name||ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                                coalitionName:fEffCoal?.name, strokeColor:fStroke, isRuling:fIsGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                        }
                        placed += f[seatKey]||0;
                    });
                    // If faction total < party seats, the remainder uses the party color
                    for(let k=placed; k<cnt; k++){
                        if(map.length>=total) break;
                        map.push({color:p.color, partyName:p.name, factionName:null,
                            ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                    }
                } else {
                    for(let k=0;k<cnt;k++){
                        if(map.length>=total) break;
                        map.push({color:p.color, partyName:p.name, factionName:null,
                            ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                    }
                }
            });
            while(map.length<total) map.push({color:'#222',partyName:'Vacant',factionName:null,ideology:'-',strokeColor:'#333',isRuling:false,externalSupport:false});
            return map;
        }

        // ── Reflect names ───────────────────────
        function elecUpdateLabels() {
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const tName = document.getElementById('thirdNameInput')?.value || 'Third';
            const isBi  = hasSenateChamber();
            const isTri = hasThirdChamber();
            const hBtn  = document.getElementById('dispTabHouse');
            const sBtn  = document.getElementById('dispTabSenate');
            const tBtn  = document.getElementById('dispTabThird');
            const hl    = document.getElementById('elecHouseLabel');
            const sl    = document.getElementById('elecSenateLabel');
            const tl    = document.getElementById('elecThirdLabel');
            const bl    = document.getElementById('elecBothLabel');
            const sw    = document.getElementById('elecSenateWrap');
            const tw    = document.getElementById('elecThirdWrap');
            const bw    = document.getElementById('elecBothWrap');
            if(hBtn) hBtn.textContent = hName;
            if(sBtn) sBtn.textContent = sName;
            if(tBtn) tBtn.textContent = tName;
            if(hl)   hl.textContent   = hName;
            if(sl)   sl.textContent   = sName;
            if(tl)   tl.textContent   = tName;
            if(bl)   bl.textContent   = 'All';
            const dcH = document.getElementById('districtChamberHouseLabel');
            const dcS = document.getElementById('districtChamberSenateLabel');
            const dcT = document.getElementById('districtChamberThirdLabel');
            if(dcH) dcH.textContent = hName;
            if(dcS) dcS.textContent = sName;
            if(dcT) dcT.textContent = tName;
            if(sw)   sw.style.display = isBi ? '' : 'none';
            if(tw)   tw.style.display = isTri ? '' : 'none';
            if(bw)   bw.style.display = isBi ? '' : 'none';
            // Unicameral: hide the election-target selection group entirely (nothing to choose)
            const elecGroup = document.getElementById('elecChamberSelectGroup');
            if(elecGroup) elecGroup.style.display = isBi ? '' : 'none';
            if(!isBi) {
                document.querySelector('input[name="elecTarget"][value="house"]').checked = true;
                const senateChk = document.querySelector('input[name="elecTarget"][value="senate"]');
                if(senateChk) senateChk.checked = false;
                const thirdChk = document.querySelector('input[name="elecTarget"][value="third"]');
                if(thirdChk) thirdChk.checked = false;
                const allChk = document.getElementById('elecTargetAll');
                if(allChk) allChk.checked = false;
            }
        }

        // ── Render party list ─────────────────────
        // Determine whether a color is dark (HSP brightness)
        function elecIsColorDark(hex) {
            const r = parseInt(hex.slice(1,3),16);
            const g = parseInt(hex.slice(3,5),16);
            const b = parseInt(hex.slice(5,7),16);
            const hsp = Math.sqrt(0.299*r*r + 0.587*g*g + 0.114*b*b);
            return hsp < 128;
        }

        // Update combined bar
        function elecUpdateAllBars() {
            const store = elecStore[elecProbChamber] || {};
            const inKey = inKeyFor(elecProbChamber);
            const allEntries = [
                ...parties.filter(p => p[inKey]).map(p => ({ id: p.id, prob: Math.max(0, store[p.id]?.prob||0), color: p.color })),
                { id: '__swing__', prob: Math.max(0, store['__swing__']?.prob||0), color: null }
            ];
            const total = allEntries.reduce((s,e)=>s+e.prob,0) || 1;

            // Compute each segment's position/width
            let cursor = 0;
            const segs = allEntries.map(e => {
                const pct = e.prob / total * 100;
                const pos = cursor;
                cursor += pct;
                return { ...e, pct, pos };
            });
            const n = segs.length;

            segs.forEach((seg, idx) => {
                const errRaw = Math.max(0, store[seg.id]?.err||0);
                const errPct = errRaw / total * 100;

                // Segment bar
                const el = document.querySelector(`.elec-seg[data-id="${seg.id}"]`);
                if(el) { el.style.left = seg.pos + '%'; el.style.width = seg.pct + '%'; }

                // Label color: white on dark colors, black on light colors
                const lbl = document.querySelector(`.elec-seg-lbl[data-id="${seg.id}"]`);
                if(lbl) {
                    const isDark = seg.color ? elecIsColorDark(seg.color) : true;
                    lbl.style.color = isDark ? '#fff' : '#000';
                    lbl.style.textShadow = isDark ? '0 0 3px rgba(0,0,0,0.8)' : 'none';
                    if(seg.pct > 4) {
                        lbl.style.left = seg.pos + '%';
                        lbl.style.width = seg.pct + '%';
                        lbl.textContent = seg.prob.toFixed(1) + '%';
                        lbl.style.opacity = '1';
                    } else {
                        lbl.style.opacity = '0';
                    }
                }

                // Margin of error: split evenly to both sides; if one side lacks room, overflow to the other
                const half       = errPct / 2;
                const leftSpace  = seg.pos;                    // Space available on the left
                const rightSpace = 100 - (seg.pos + seg.pct);  // Space available on the right

                let errLeft  = Math.min(half, leftSpace);
                let errRight = Math.min(half, rightSpace);
                // Push the shortfall to the other side
                errLeft  = Math.min(errLeft  + Math.max(0, half - errRight), leftSpace);
                errRight = Math.min(errRight + Math.max(0, half - Math.min(half, leftSpace)), rightSpace);

                const elL = document.querySelector(`.elec-seg-err-l[data-id="${seg.id}"]`);
                const elR = document.querySelector(`.elec-seg-err-r[data-id="${seg.id}"]`);

                if(elL) {
                    const lo = seg.pos - errLeft;
                    elL.style.left  = lo + '%';
                    elL.style.width = errLeft + '%';
                    elL.style.display = '';
                }
                if(elR) {
                    elR.style.left  = (seg.pos + seg.pct) + '%';
                    elR.style.width = errRight + '%';
                    elR.style.display = '';
                }
            });
        }

        // Flush the currently displayed support-rate inputs into the store for whichever chamber is showing.
        // Call this "just before" switching chambers — if called after elecProbChamber changes, the old tab's
        // values would be written into the new chamber's store instead.
        function elecSyncCurrentProbDom() {
            const container = document.getElementById('elecInputList');
            if(!container) return;
            const store = elecStore[elecProbChamber] || (elecStore[elecProbChamber] = {});
            container.querySelectorAll('.elec-prob').forEach(el => {
                const id = el.dataset.id;
                if(!store[id]) store[id]={prob:0,err:0};
                store[id].prob = parseFloat(el.value)||0;
            });
            container.querySelectorAll('.elec-err').forEach(el => {
                const id = el.dataset.id;
                if(!store[id]) store[id]={prob:0,err:0};
                store[id].err = parseFloat(el.value)||0;
            });
        }

        // Switch the support-rate input tab (House/Senate/Third) — chambers can have different party lineups,
        // so each keeps its own independent support rates.
        function switchElecProbChamber(ch) {
            elecSyncCurrentProbDom(); // flush whatever was being typed on the old tab into its own store first
            elecProbChamber = ch;
            elecRenderList();
        }

        function elecRenderList() {
            elecUpdateLabels();
            elecToggleMode();
            elecUpdateDistrictInfo();

            // Sync tab visibility/active state (hide tabs for chambers that don't exist)
            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabElecProb'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) btn.style.display = chambers.includes(c) ? '' : 'none';
            });
            if(!chambers.includes(elecProbChamber)) elecProbChamber = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabElecProb'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===elecProbChamber);
            });

            const container = document.getElementById('elecInputList');
            if(!container) return;
            const store = elecStore[elecProbChamber] || (elecStore[elecProbChamber] = {});
            const inKey = inKeyFor(elecProbChamber);

            // (DOM → store syncing happens live via oninput on every keystroke, and switchElecProbChamber()
            //  already flushes the old tab's values "before" switching — the DOM here, right after a switch,
            //  still holds the previous tab's markup until we rebuild it below, so reading it now would
            //  wrongly overwrite the new chamber's store with the old chamber's values.)
            if(!store['__swing__']) store['__swing__']={prob:0,err:0};

            container.innerHTML = '';

            // ── Combined bar ──────────────────────
            const barWrap = document.createElement('div');
            barWrap.style.cssText = 'margin-bottom:14px;';

            // Label layer (above the bar, z-index:3)
            let lblHtml = '';
            parties.forEach(p => {
                lblHtml += `<div class="elec-seg-lbl" data-id="${p.id}"
                    style="position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;
                    font-size:0.7rem;font-weight:bold;overflow:hidden;white-space:nowrap;pointer-events:none;opacity:0;z-index:3;"></div>`;
            });
            lblHtml += `<div class="elec-seg-lbl" data-id="__swing__"
                style="position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;
                font-size:0.7rem;font-weight:bold;overflow:hidden;white-space:nowrap;pointer-events:none;opacity:0;z-index:3;"></div>`;

            // Error layer + segment layer
            let errHtml = '', segHtml = '';
            parties.forEach(p => {
                // Hatch pattern: sharper (higher opacity)
                const hatch = `repeating-linear-gradient(45deg,${p.color}99,${p.color}99 2.5px,transparent 2.5px,transparent 5px)`;
                errHtml += `
                    <div class="elec-seg-err-l" data-id="${p.id}" style="position:absolute;top:0;bottom:0;background:${hatch};pointer-events:none;z-index:2;"></div>
                    <div class="elec-seg-err-r" data-id="${p.id}" style="position:absolute;top:0;bottom:0;background:${hatch};pointer-events:none;z-index:2;"></div>`;
                segHtml += `<div class="elec-seg" data-id="${p.id}" style="position:absolute;top:0;bottom:0;background:${p.color};border-right:1px solid #101218;box-sizing:border-box;z-index:1;"></div>`;
            });
            // Undecided (error bar shows on the left only — err-r is hidden)
            const swHatch = `repeating-linear-gradient(45deg,#88888899,#88888899 2.5px,transparent 2.5px,transparent 5px)`;
            errHtml += `
                <div class="elec-seg-err-l" data-id="__swing__" style="position:absolute;top:0;bottom:0;background:${swHatch};pointer-events:none;z-index:2;"></div>
                <div class="elec-seg-err-r" data-id="__swing__" style="position:absolute;top:0;bottom:0;background:${swHatch};pointer-events:none;z-index:2;"></div>`;
            segHtml += `<div class="elec-seg" data-id="__swing__" style="position:absolute;top:0;bottom:0;background:repeating-linear-gradient(45deg,#333,#333 3px,#444 3px,#444 6px);border-right:1px solid #101218;z-index:1;"></div>`;

            barWrap.innerHTML = `
                <div style="font-size:0.75rem;color:#555;margin-bottom:4px;letter-spacing:1px;">▌ Support Distribution</div>
                <div style="position:relative;height:22px;background:#111;border:1px solid #333;overflow:visible;">
                    ${errHtml}${segHtml}${lblHtml}
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;">
                    ${parties.map(p=>`<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;color:#aaa;">
                        <span style="width:8px;height:8px;background:${p.color};display:inline-block;flex-shrink:0;"></span>${p.name}</span>`).join('')}
                    <span style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;color:#aaa;">
                        <span style="width:8px;height:8px;background:repeating-linear-gradient(45deg,#333,#333 2px,#444 2px,#444 4px);display:inline-block;flex-shrink:0;"></span>Undecided</span>
                </div>`;
            container.appendChild(barWrap);

            // ── Header (party name/support/error) — right below the support distribution bar, right above the input rows ──
            const headerRow = document.createElement('div');
            headerRow.style.cssText = 'display:grid;grid-template-columns:1fr 75px 60px;gap:6px;padding:0 2px;margin-bottom:4px;color:#555;font-size:0.8rem;';
            headerRow.innerHTML = `<span>Party</span><span style="text-align:center;">Support (%)</span><span style="text-align:center;">Error (±%)</span>`;
            container.appendChild(headerRow);

            // ── Party rows (independents excluded, only parties participating in the current chamber tab) ──
            const regularParties = parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID && p[inKey]);
            const indPartyForElec = parties.find(p => p.ideologyId === IND_IDEOLOGY_ID && p[inKey]);
            const ch = elecProbChamber;
            regularParties.forEach(p => {
                const st = store[p.id]||{prob:0,err:0};
                const row = document.createElement('div');
                row.style.cssText = 'display:grid;grid-template-columns:1fr 75px 60px;gap:6px;margin-bottom:7px;align-items:center;';
                row.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="width:10px;height:10px;background:${p.color};border-radius:50%;flex-shrink:0;border:1px solid #444;"></span>
                        <span style="font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.name}">${p.name}</span>
                    </div>
                    <input type="number" class="elec-prob" data-id="${p.id}" value="${st.prob}"
                        min="0" max="100" placeholder="0"
                        style="background:#000;border:1px solid var(--tno-border);color:var(--tno-neon);font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                        oninput="if(!elecStore['${ch}']['${p.id}'])elecStore['${ch}']['${p.id}']={prob:0,err:0}; elecStore['${ch}']['${p.id}'].prob=parseFloat(this.value)||0; elecUpdateAllBars();">
                    <input type="number" class="elec-err" data-id="${p.id}" value="${st.err}"
                        min="0" max="50" placeholder="0"
                        style="background:#000;border:1px solid #444;color:#888;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                        oninput="if(!elecStore['${ch}']['${p.id}'])elecStore['${ch}']['${p.id}']={prob:0,err:0}; elecStore['${ch}']['${p.id}'].err=parseFloat(this.value)||0; elecUpdateAllBars();">
                `;
                container.appendChild(row);
            });

            // ── Divider (above independents) + independent row (fixed gray color) ──
            if(indPartyForElec) {
                const p = indPartyForElec;
                const st = store[p.id]||{prob:0,err:0};
                const row = document.createElement('div');
                row.style.cssText = 'display:grid;grid-template-columns:1fr 75px 60px;gap:6px;margin-bottom:7px;align-items:center;border-top:1px dashed #333;padding-top:8px;margin-top:4px;';
                row.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="width:10px;height:10px;background:#888;border-radius:50%;flex-shrink:0;border:1px solid #444;"></span>
                        <span style="font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.name}">${p.name}</span>
                    </div>
                    <input type="number" class="elec-prob" data-id="${p.id}" value="${st.prob}"
                        min="0" max="100" placeholder="0"
                        style="background:#000;border:1px solid var(--tno-border);color:var(--tno-neon);font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                        oninput="if(!elecStore['${ch}']['${p.id}'])elecStore['${ch}']['${p.id}']={prob:0,err:0}; elecStore['${ch}']['${p.id}'].prob=parseFloat(this.value)||0; elecUpdateAllBars();">
                    <input type="number" class="elec-err" data-id="${p.id}" value="${st.err}"
                        min="0" max="50" placeholder="0"
                        style="background:#000;border:1px solid #444;color:#888;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                        oninput="if(!elecStore['${ch}']['${p.id}'])elecStore['${ch}']['${p.id}']={prob:0,err:0}; elecStore['${ch}']['${p.id}'].err=parseFloat(this.value)||0; elecUpdateAllBars();">
                `;
                container.appendChild(row);
            }

            // ── Undecided row (right below independents, no divider) ──
            const sw = store['__swing__'];
            const swRow = document.createElement('div');
            swRow.style.cssText = 'display:grid;grid-template-columns:1fr 75px 60px;gap:6px;margin-bottom:7px;align-items:center;';
            swRow.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;background:repeating-linear-gradient(45deg,#555,#555 2px,#333 2px,#333 4px);border-radius:50%;flex-shrink:0;border:1px solid #666;"></span>
                    <span style="font-size:0.85rem;color:#aaa;">Undecided</span>
                </div>
                <input type="number" class="elec-prob" data-id="__swing__" value="${sw.prob}"
                    min="0" max="100" placeholder="0"
                    style="background:#000;border:1px solid #555;color:#aaa;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                    oninput="elecStore['${ch}']['__swing__'].prob=parseFloat(this.value)||0; elecUpdateAllBars();">
                <input type="number" class="elec-err" data-id="__swing__" value="${sw.err}"
                    min="0" max="50" placeholder="0"
                    style="background:#000;border:1px solid #444;color:#555;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                    oninput="elecStore['${ch}']['__swing__'].err=parseFloat(this.value)||0; elecUpdateAllBars();">
            `;
            container.appendChild(swRow);

            elecUpdateAllBars();
        }

        // ── Pause / resume counting ───────────────
        function elecTogglePause() {
            elecPaused = !elecPaused;
            const btn = document.getElementById('elecPauseBtn');
            if(btn) btn.textContent = elecPaused ? '▶ Resume' : '⏸ Pause';
        }

        // ── Finish now ──────────────────────────
        function elecFinishNow() {
            elecSkipToEnd = true;
            elecPaused = false;
        }

        // ── Apply to Parliament ──────────────────────────
        // By-election: instantly re-run the election for vacant districts only (applied immediately, no animation)
        async function elecRunByElection(chamber, vacantKeys, chamberName) {
            const allResults = elecSimulateDistricts(chamber); // Results for all currently active districts
            const relevantResults = allResults.filter(r => vacantKeys.includes(r.key));
            const seatKey = seatKeyFor(chamber);
            const summary = [];
            relevantResults.forEach(({key, partyId}) => {
                const party = parties.find(p=>p.id===partyId);
                if(party) party[seatKey] = (party[seatKey]||0) + 1;
                districtMembers[chamber][key] = { name:'', partyId, factionId:null, vacant:false };
                summary.push(`${districtNames[chamber][key]||key} : ${party?.name||'?'}`);
            });
            refreshUI(); simulate();
            switchDispTab(chamber);
            alert(`By-election Results (${chamberName})\n\n${summary.join('\n')}\n\nPlease enter the winners' names in Parliament > Members.`);
        }

        function elecApplyToParliament() {
            if(!elecLastResult) return;
            const { chamber, seatMap, districtResults } = elecLastResult;
            const ch = chamber || (elecLastResult.isSenate?'senate':'house');
            const seatKey = seatKeyFor(ch);
            let hadFactions = false;
            parties.forEach(p => {
                const s = seatMap.find(x=>x.id===p.id);
                p[seatKey] = s?.n||0;
                // Faction seats reflect the pre-election distribution, so invalidate them (redistribution required)
                if((p.factions||[]).length > 0) {
                    hadFactions = true;
                    p.factions.forEach(f => { f[seatKey] = 0; });
                }
            });
            // Generate individual info for district winners (name left blank — enter it in Parliament > Members)
            if(Array.isArray(districtResults) && districtResults.length > 0) {
                districtResults.forEach(({key, partyId}) => {
                    districtMembers[ch][key] = { name: '', partyId, factionId: null, vacant: false };
                });
            }
            simulate(); refreshUI();
            switchDispTab(ch);
            if(hadFactions) {
                alert('Election results applied.\n\nFor parties with factions, faction-level seats have been invalidated (reset to 0) since they reflect the pre-election distribution.\nRedistribute faction seats in the Party tab.');
            }
        }

        // ── Recount ────────────────────────────
        function elecRerun() {
            if(!elecLastResult) return;
            elecRun(true);
        }

        // ── Save election record ────────────────
        function elecSaveRecord(title, year, chamber, seatMap, weightedResult, districtResults) {
            const hName = document.getElementById('houseNameInput')?.value||'House';
            const sName = document.getElementById('senateNameInput')?.value||'Senate';
            const tName = document.getElementById('thirdNameInput')?.value||'Third';
            const chamberDisplayName = chamber==='senate'?sName:chamber==='third'?tName:hName;
            // Each party's share of the actual weight total used in the count = the real result, not a pre-election estimate
            const wTotal = (weightedResult||[]).reduce((s,x)=>s+(x.w||0),0);
            const record = {
                id: 'er'+Date.now(),
                title: title || 'Untitled Election',
                year:  year  || '?',
                chamber: chamberDisplayName,
                chamberType: chamber,
                isSenate: chamber==='senate',
                savedAt: new Date().toISOString(),
                parties: parties.map(p => {
                    const w = weightedResult.find(x=>x.id===p.id);
                    const s = seatMap.find(x=>x.id===p.id);
                    return { id:p.id, name:p.name, color:p.color, prob: (w && wTotal>0) ? w.w/wTotal : 0, seats: s?.n||0 };
                }),
                totalSeats: seatMap.reduce((a,b)=>a+b.n,0),
                districtResults: (districtResults || []).map(d => ({ ...d, districtName: districtNames[chamber][d.key] || '' }))
            };
            elecRecords.unshift(record);
            elecRenderRecords();
        }

        function elecRenderRecords() {
            const container = document.getElementById('elecRecordList');
            if(!container) return;
            if(elecRecords.length === 0) {
                container.innerHTML = '<div style="color:#333;text-align:center;padding:16px;border:1px dashed #222;font-size:0.85rem;">No saved election records</div>';
                return;
            }
            container.innerHTML = '';
            elecRecords.forEach(r => {
                const div = document.createElement('div');
                div.style.cssText = 'background:#080b10;border:1px solid #2a2a2a;border-left:4px solid var(--tno-neon);padding:10px;margin-bottom:8px;';
                const partySummary = r.parties.filter(p=>p.seats>0)
                    .sort((a,b)=>b.seats-a.seats)
                    .map(p=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:6px;font-size:0.8rem;color:#aaa;"><span style="width:8px;height:8px;background:${p.color};border-radius:50%;display:inline-block;"></span>${p.name} ${p.seats} seats</span>`)
                    .join('');
                const savedAtLabel = r.savedAt ? new Date(r.savedAt).toLocaleString('en-US') : '—';
                const detailRows = r.parties.filter(p=>p.seats>0 || p.prob>0)
                    .sort((a,b)=>b.seats-a.seats)
                    .map(p=>`<div class="bill-history-entry">${p.name} — ${p.seats} seats · vote share ${(p.prob*100).toFixed(1)}%</div>`)
                    .join('') || '<div style="color:#444;">No per-party detail available</div>';
                div.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span style="color:var(--tno-gold);font-size:1rem;">${r.title}</span>
                        <span style="color:#555;font-size:0.85rem;">${r.year} · ${r.chamber}</span>
                    </div>
                    <div style="margin-bottom:4px;">${partySummary}</div>
                    <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                        <span class="elec-record-toggle" onclick="toggleElecRecordDetail('${r.id}')">▾ Details (${r.totalSeats} seats total · saved: ${savedAtLabel})</span>
                    </div>
                    <div class="elec-record-detail" id="elecRecordDetail-${r.id}">${detailRows}</div>
                    <div style="display:flex;gap:6px;">
                        <button onclick="elecLoadRecord('${r.id}')" style="flex:1;background:transparent;border:1px solid var(--tno-neon);color:var(--tno-neon);padding:5px;font-family:inherit;font-size:0.85rem;cursor:pointer;">↻ Apply to Parliament</button>
                        <button onclick="elecViewRecord('${r.id}')" style="flex:1;background:transparent;border:1px solid #888;color:#aaa;padding:5px;font-family:inherit;font-size:0.85rem;cursor:pointer;">👁 View</button>
                        <button onclick="elecDeleteRecord('${r.id}')" style="background:transparent;border:1px solid #333;color:#555;padding:5px 10px;font-family:inherit;font-size:0.85rem;cursor:pointer;">Delete</button>
                    </div>`;
                container.appendChild(div);
            });
        }

        function elecViewRecord(id) {
            const r = elecRecords.find(x=>x.id===id);
            if(!r) return;
            // Temporarily build this record's seats into a map, just to show stats
            const total = r.totalSeats || r.parties.reduce((s,p)=>s+p.seats,0);
            const map = [];
            r.parties.forEach(rp => {
                const p = parties.find(x=>x.id===rp.id);
                if(!p) return;
                const coal = coalitions.find(c=>c.members.includes(p.id));
                const isPartyRuling = p.isRuling;
                const effectiveCoal = (isPartyRuling && !(coal && coal.isRuling)) ? null : coal;
                const isGov = isPartyRuling || (!isPartyRuling && coal?.isRuling);
                const stroke = isGov ? 'var(--tno-gold)' : (effectiveCoal?.color || null);
                for(let k=0; k<rp.seats; k++) {
                    map.push({color:p.color, partyName:p.name, ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||'?', coalitionName:effectiveCoal?.name, strokeColor:stroke, isRuling:isGov});
                }
            });
            while(map.length < total) map.push({color:'#222', partyName:'Vacant', ideology:'-', strokeColor:'#333', isRuling:false});

            // Switch to the election-result panel (a dedicated tab per chamber)
            const chType = r.chamberType || (r.isSenate ? 'senate' : 'house');
            const suf = chType.charAt(0).toUpperCase() + chType.slice(1);
            const tabName = 'elecResult' + suf;
            document.getElementById('dispTabElecResult'+suf).style.display = '';
            document.getElementById('dispTabElecResult'+suf).querySelector('.disp-tab-label').textContent = `${r.chamber} Election Results`;
            switchDispTab(tabName);
            document.getElementById('elecResultTitle'+suf).innerText = `> ${r.title} (${r.year}) — ${r.chamber}`;
            document.getElementById('elecResultBar'+suf).style.width = '100%';
            elecSetView(r.districtResults?.length > 0 ? 'district' : 'arc', chType);

            // Draw the canvas
            requestAnimationFrame(() => {
                drawChamber('elecCanvas'+suf, map, total, '_elec');
                updateStats('elecResultStats'+suf, map, total);
                if(r.districtResults?.length > 0) {
                    elecDrawDistrictResult(r.districtResults, r.districtResults.length, chType);
                }
            });
        }

        function elecLoadRecord(id) {
            const r = elecRecords.find(x=>x.id===id);
            if(!r) return;
            const chType = r.chamberType || (r.isSenate ? 'senate' : 'house');
            const seatKey = seatKeyFor(chType);
            parties.forEach(p => {
                const rp = r.parties.find(x=>x.id===p.id);
                p[seatKey] = rp?.seats||0;
            });
            simulate(); refreshUI();
            switchDispTab(chType);
        }

        function elecDeleteRecord(id) {
            elecRecords = elecRecords.filter(x=>x.id!==id);
            elecRenderRecords();
        }

        function toggleElecRecordDetail(id) {
            const el = document.getElementById('elecRecordDetail-' + id);
            if(el) el.classList.toggle('open');
        }

        // ── Main vote-counting function ────────────────
        // ─────────────────────────────────────────
        // Election method switching
        // ─────────────────────────────────────────
        // Election method: proportional/district checkbox combination -> 'proportional'|'district'(district only)|'mixed'(both)
        function getElecMode() {
            const prop = document.getElementById('elecModeProportional')?.checked ?? true;
            const dist = document.getElementById('elecModeDistrict')?.checked ?? false;
            if(prop && dist) return 'mixed';
            if(dist) return 'district';
            return 'proportional';
        }
        function onElecModeChange() {
            const prop = document.getElementById('elecModeProportional');
            const dist = document.getElementById('elecModeDistrict');
            const allBox = document.getElementById('elecModeAll');
            if(allBox) allBox.checked = !!(prop?.checked && dist?.checked);
            elecToggleMode();
        }
        function onElecModeAllChange(checked) {
            const prop = document.getElementById('elecModeProportional');
            const dist = document.getElementById('elecModeDistrict');
            if(prop) prop.checked = checked;
            if(dist) dist.checked = checked;
            elecToggleMode();
        }
        function elecToggleMode() {
            const mode = getElecMode();
            const info = document.getElementById('elecModeInfo');
            if(mode === 'district' || mode === 'mixed') {
                info.style.display = '';
                elecUpdateDistrictInfo();
            } else {
                info.style.display = 'none';
            }
        }

        // Election-target checkboxes (multi-select)
        function getElecTargets() {
            const checked = Array.from(document.querySelectorAll('input[name="elecTarget"]:checked')).map(el=>el.value);
            return checked.length > 0 ? checked : ['house'];
        }
        function onElecTargetChange() {
            const all = chamberList();
            const checked = getElecTargets();
            const allChecked = all.every(c => checked.includes(c));
            const allBox = document.getElementById('elecTargetAll');
            if(allBox) allBox.checked = allChecked;
            elecUpdateDistrictInfo();
        }
        function onElecTargetAllChange(checked) {
            document.querySelectorAll('input[name="elecTarget"]').forEach(el => {
                const wrap = el.closest('label');
                if(wrap && wrap.style.display === 'none') return; // Skip chambers that don't exist
                el.checked = checked;
            });
            elecUpdateDistrictInfo();
        }

        function elecUpdateDistrictInfo() {
            const targets = getElecTargets();
            const hName = document.getElementById('houseNameInput')?.value || 'House';
            const sName = document.getElementById('senateNameInput')?.value || 'Senate';
            const tName = document.getElementById('thirdNameInput')?.value || 'Third';
            const chColors = { house:'var(--tno-neon)', senate:'#ffd700', third:'#cc33ff' };
            const chNames  = { house:hName, senate:sName, third:tName };
            const chTotalId = { house:'houseTotal', senate:'senateTotal', third:'thirdTotal' };
            const chInfoId  = { house:'elecModeInfoHouse', senate:'elecModeInfoSenate', third:'elecModeInfoThird' };

            ['house','senate','third'].forEach(ch => {
                const el = document.getElementById(chInfoId[ch]);
                if(!el) return;
                const show = targets.includes(ch);
                if(!show) { el.style.display = 'none'; return; }
                const total = parseInt(document.getElementById(chTotalId[ch])?.value) || 0;
                const dist  = Object.keys(districtGrid[ch]||{}).length;
                const distSeats = Math.min(dist, total);
                const propSeats = Math.max(0, total - distSeats);
                el.innerHTML = `<span style="color:${chColors[ch]}">${chNames[ch]}</span> District <b>${distSeats}</b> + Proportional <b>${propSeats}</b>`;
                el.style.display = '';
            });
        }

        // ─────────────────────────────────────────
        // District election simulation
        // ─────────────────────────────────────────
        function elecSimulateDistricts(chamber) {
            // Determine the winner for each district (tendency + noise)
            // Returns: [{ key, partyId }] — in a shuffleable form
            const results = [];
            const districtKeys = Object.keys(districtGrid[chamber] || {});
            districtKeys.forEach(key => {
                let bestParty = null, bestScore = -1;
                parties.forEach(p => {
                    const support = tendencyData[p.id]?.[key] || 0;
                    // Noise: roughly ±15% random
                    const noise = (Math.random() * 30 - 15);
                    const score = support + noise;
                    if(score > bestScore) { bestScore = score; bestParty = p; }
                });
                if(bestParty && bestScore > 0) {
                    results.push({ key, partyId: bestParty.id });
                } else {
                    // Random party if there's no support data
                    const p = parties[Math.floor(Math.random()*parties.length)];
                    results.push({ key, partyId: p.id });
                }
            });
            return results;
        }

        // For hover on the election-result district canvas: remember the last-drawn data (coordinate → name)
        let lastDistrictResultCtx = { house: null, senate: null, third: null };
        let elecDistrictHoverBound = { house: false, senate: false, third: false };

        function elecDistrictBindHover(chamber) {
            if(elecDistrictHoverBound[chamber]) return;
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            const cvs = document.getElementById('elecDistrictResultCanvas'+suf);
            if(!cvs) return;
            elecDistrictHoverBound[chamber] = true;
            cvs.addEventListener('mousemove', e => {
                const ctxData = lastDistrictResultCtx[chamber];
                const tip = document.getElementById('tooltipBox');
                if(!ctxData || !tip) { if(tip) tip.style.display='none'; return; }
                const [hq, hr] = districtPixelToAxial(e.offsetX, e.offsetY, ctxData.size, ctxData.offX, ctxData.offY);
                const hkey = `${hq},${hr}`;
                const found = ctxData.nameMap[hkey];
                if(found !== undefined) {
                    positionTooltip(tip, found || `(${hkey})`, e.clientX, e.clientY);
                } else {
                    tip.style.display = 'none';
                }
            });
            cvs.addEventListener('mouseleave', () => { document.getElementById('tooltipBox').style.display='none'; });
        }

        function elecDrawDistrictResult(districtResults, progress, chamber) {
            // Paint district colors onto the elecDistrictResultCanvas on the right
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            const cvs = document.getElementById('elecDistrictResultCanvas'+suf);
            if(!cvs) return;
            elecDistrictBindHover(chamber);
            const w = cvs.offsetWidth;
            const h = cvs.offsetHeight;
            // If the canvas is still hidden (0px) or pre-layout, retry next frame (prevents drawing incorrectly at default size)
            if(!w || !h) {
                requestAnimationFrame(() => elecDrawDistrictResult(districtResults, progress, chamber));
                return;
            }
            cvs.width = w; cvs.height = h;
            const ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            const bounds = tendencyGetBounds();
            if(!bounds) return;
            const { minQ, maxQ, minR, maxR } = bounds;
            // flat-top formula (same as districtAxialToPixel) — add a 1-cell margin to prevent top/bottom/left/right clipping
            const spanQ = (maxQ - minQ + 1) + 2;
            const spanR = (maxR - minR + 1) + 2;
            const sizeByW = w / (spanQ * 1.5 + 0.5);
            const sizeByH = (h) / (spanR * Math.sqrt(3) + Math.sqrt(3)/2 + 1);
            const size = Math.min(sizeByW, sizeByH, 30);
            const cq = (minQ + maxQ) / 2;
            const cr = (minR + maxR) / 2;
            const offX = w/2 - size * (3/2 * cq);
            const offY = h/2 - size * (Math.sqrt(3)/2 * cq + Math.sqrt(3) * cr);

            // Store hover-tooltip context (fixed districtName during record playback, current name if live)
            const nameMap = {};
            districtResults.forEach(d => { nameMap[d.key] = (d.districtName !== undefined ? d.districtName : districtNames[chamber][d.key]) || ''; });
            lastDistrictResultCtx[chamber] = { size, offX, offY, nameMap };

            // Draw all districts as the background
            tendencyAllKeys().forEach(key => {
                const [q, r] = key.split(',').map(Number);
                const [cx, cy] = districtAxialToPixel(q, r, size, offX, offY);
                const corners = districtHexCorners(cx, cy, size*0.93);
                ctx.beginPath();
                ctx.moveTo(...corners[0]);
                corners.slice(1).forEach(c => ctx.lineTo(...c));
                ctx.closePath();
                ctx.fillStyle = '#0a0c10';
                ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            });

            // Paint result colors up to the current progress
            const highlightGov = document.getElementById('chkGovHighlight')?.checked;
            const rulingCoal = coalitions.find(c=>c.isRuling);
            for(let i = 0; i < Math.min(progress, districtResults.length); i++) {
                const { key, partyId } = districtResults[i];
                const p = parties.find(x => x.id === partyId);
                if(!p) continue;
                const [q, r] = key.split(',').map(Number);
                const [cx, cy] = districtAxialToPixel(q, r, size, offX, offY);
                const corners = districtHexCorners(cx, cy, size*0.93);
                ctx.beginPath();
                ctx.moveTo(...corners[0]);
                corners.slice(1).forEach(c => ctx.lineTo(...c));
                ctx.closePath();
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.2;
                ctx.stroke();

                // Highlight ruling power
                if(highlightGov) {
                    const coal = coalitions.find(c=>c.members.includes(p.id));
                    const isGov = p.isRuling || (coal && coal.isRuling);
                    const isExtSupport = !isGov && !coal && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                    if(isGov) {
                        ctx.save();
                        ctx.shadowColor = 'rgba(255,215,0,0.8)';
                        ctx.shadowBlur = 6;
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();
                    } else if(isExtSupport) {
                        ctx.save();
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 1.5;
                        ctx.setLineDash([2,2]);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.restore();
                    }
                }
            }
        }

        async function elecRun(isRerun) {
            if(elecRunning) return;

            // Support rates are already synced live into elecStore[that chamber] by each input's oninput,
            // so we don't re-read the DOM here (during a multi-chamber sequential run, a different chamber's
            // tab may be the one currently shown on screen).

            const targets = getElecTargets();
            const hName = document.getElementById('houseNameInput')?.value||'House';
            const sName = document.getElementById('senateNameInput')?.value||'Senate';
            const tName = document.getElementById('thirdNameInput')?.value||'Third';
            const elecTitle = document.getElementById('elecTitle')?.value.trim() || 'Untitled Election';
            const elecYear  = document.getElementById('elecYear')?.value.trim()  || '?';
            const elecMode  = getElecMode(); // 'proportional' | 'district'(district only) | 'mixed'(district+proportional)
            const isByElection = document.getElementById('elecModeByElection')?.checked ?? false;

            // When multiple chambers are selected: run sequentially in House→Senate→Third order
            if(targets.length > 1) {
                const order = chamberList().filter(c => targets.includes(c));
                // Remember the original checked state
                const prevChecked = {};
                document.querySelectorAll('input[name="elecTarget"]').forEach(el => prevChecked[el.value] = el.checked);
                for(let i=0; i<order.length; i++) {
                    document.querySelectorAll('input[name="elecTarget"]').forEach(el => { el.checked = (el.value === order[i]); });
                    await elecRun(false);
                    if(!elecRunning && i < order.length-1) {
                        await new Promise(r=>setTimeout(r,600));
                    } else if(elecRunning) {
                        break; // Stop if canceled/errored partway through
                    }
                }
                // Restore the original checked state
                document.querySelectorAll('input[name="elecTarget"]').forEach(el => { el.checked = prevChecked[el.value]; });
                onElecTargetChange();
                return;
            }

            const chamber = targets[0]; // 'house' | 'senate' | 'third'
            const chamberName = chamber==='senate'?sName:chamber==='third'?tName:hName;
            const totalSeats = parseInt(document.getElementById(chamber==='senate'?'senateTotal':chamber==='third'?'thirdTotal':'houseTotal').value)||0;
            if(totalSeats<=0) { alert('Seat count is 0. Check the seat count in Parliament settings.'); return; }

            // By-election: re-run the election only for districts marked vacant
            if(isByElection) {
                const vacantKeys = Object.keys(districtMembers[chamber]).filter(k => districtMembers[chamber][k]?.vacant);
                if(vacantKeys.length === 0) {
                    alert('There are no districts marked vacant.\nMark districts vacant first in Parliament > Members.');
                    return;
                }
                await elecRunByElection(chamber, vacantKeys, chamberName);
                return;
            }

            // Split seats by mode
            const activeDistrictCount = Object.keys(districtGrid[chamber]||{}).length;
            let districtSeats, propSeats;
            if(elecMode === 'district') {
                // District only: fill only as many seats as there are districts, without proportional (may differ from total seats)
                districtSeats = Math.min(activeDistrictCount, totalSeats);
                propSeats = 0;
            } else if(elecMode === 'mixed') {
                districtSeats = Math.min(activeDistrictCount, totalSeats);
                propSeats = totalSeats - districtSeats;
            } else {
                districtSeats = 0;
                propSeats = totalSeats;
            }

            // If there are proportional seats, check the support rates
            const chamberStore = elecStore[chamber] || {};
            const partyProb = parties.reduce((s,p)=>s+(chamberStore[p.id]?.prob||0),0);
            if(propSeats > 0 && partyProb<=0) {
                alert('Please enter support rates.\nEnter a number in each party\'s support rate (%) field.');
                return;
            }
            // If in district mode but there are no active districts, notify the user
            if((elecMode === 'district' || elecMode === 'mixed') && districtSeats === 0) {
                alert('There are no active districts in the District tab.\nAdd districts first, or choose proportional mode.');
                return;
            }

            elecRunning   = true;
            elecPaused    = false;
            elecSkipToEnd = false;

            const runBtn   = document.getElementById('elecRunBtn');
            const midCtrl  = document.getElementById('elecMidControls');
            const postBtns = document.getElementById('elecPostBtns');
            runBtn.style.background='#222'; runBtn.style.color='#888'; runBtn.textContent='>> COUNTING... <<';
            if(midCtrl)  midCtrl.style.display='block';
            if(postBtns) postBtns.style.display='none';

            const speed = Math.round((101 - parseInt(document.getElementById('elecSpeed').value)) * 1.5);

            // ── Compute each party's support after applying error ──
            const partyWeighted = parties.map(p => {
                const st = chamberStore[p.id]||{prob:0,err:0};
                const w  = Math.max(0, st.prob + (Math.random()*2-1)*(st.err||0));
                return { id:p.id, w, origProb: st.prob };
            });

            // ── Compute undecided voters ───────────────────────
            const swingSt   = chamberStore['__swing__']||{prob:0,err:0};
            const swingRaw  = Math.max(0, swingSt.prob + (Math.random()*2-1)*(swingSt.err||0));

            // ── Undecided-voter distribution algorithm ──────────────
            // Randomly determine the A/B ratio (varies each election)
            const ratioA = Math.random(); // Random between 0~1 (Group A ratio)
            const ratioB = 1 - ratioA;
            const swingA = swingRaw * ratioA; // Fully random group
            const swingB = swingRaw * ratioB; // Support-rate × affinity group

            // Group A: distributed evenly at random across parties (random weighting)
            const randWeights = parties.map(() => Math.random());
            const randTotal   = randWeights.reduce((a,b)=>a+b,0);

            // Group B: distributed by weight of each party's (support rate × affinity coefficient)
            // Affinity coefficient: random between 0.5~1.5 (varies per party, per election)
            const affinities = parties.map(() => 0.5 + Math.random());
            const bWeights   = partyWeighted.map((p,i) => Math.max(0, p.w) * affinities[i]);
            const bTotal     = bWeights.reduce((a,b)=>a+b,0);

            // Sum the undecided allocation for each party
            const swingBonus = parties.map((p,i) => {
                const fromA = randTotal  > 0 ? swingA * (randWeights[i] / randTotal) : 0;
                const fromB = bTotal     > 0 ? swingB * (bWeights[i]    / bTotal)    : 0;
                return fromA + fromB;
            });

            // ── Final weight (party support + undecided allocation) ──
            const weighted = partyWeighted.map((p,i) => ({
                id: p.id,
                w:  p.w + swingBonus[i],
                origProb: p.origProb,
            }));
            const wTotal = weighted.reduce((s,p)=>s+p.w,0);
            if(wTotal<=0) {
                elecRunning=false;
                runBtn.style.background='var(--tno-neon)'; runBtn.style.color='#000'; runBtn.textContent='>> START COUNT <<';
                return;
            }

            // ── Largest-remainder seat allocation (proportional seats only) ────
            let seatMap;
            if(propSeats > 0) {
                seatMap = weighted.map(p=>({id:p.id, n:Math.floor((p.w/wTotal)*propSeats), origProb:p.origProb}));
                let alloc = seatMap.reduce((s,p)=>s+p.n,0);
                const rems  = weighted.map((p,i)=>({i,rem:(p.w/wTotal)*propSeats-seatMap[i].n})).sort((a,b)=>b.rem-a.rem);
                for(let ri=0; alloc<propSeats; ri++,alloc++) seatMap[rems[ri%rems.length].i].n++;
            } else {
                seatMap = weighted.map(p=>({id:p.id, n:0, origProb:p.origProb}));
            }

            // ── Pre-compute district election results ──────────
            let districtResults = [];
            if(districtSeats > 0) {
                districtResults = elecSimulateDistricts(chamber);
                // Aggregate district results into seatMap
                districtResults.forEach(({partyId}) => {
                    const sm = seatMap.find(x=>x.id===partyId);
                    if(sm) sm.n++;
                });
                // Shuffle (counting order)
                for(let i=districtResults.length-1; i>0; i--) {
                    const j = Math.floor(Math.random()*(i+1));
                    [districtResults[i], districtResults[j]] = [districtResults[j], districtResults[i]];
                }
            }

            const seatKey = seatKeyFor(chamber);

            // ── Store results (for apply/recount) ───────
            elecLastResult = { chamber, isSenate: chamber==='senate', seatMap: seatMap.map(x=>({...x})), weighted, districtResults: [...districtResults], mode: elecMode };

            // ── Build proportional pool + shuffle ─────────────────
            parties.forEach(p=>{ p[seatKey]=0; });
            let pool=[];
            // Proportional seats only go into the pool (districts are handled separately via districtResults)
            const propSeatMap = weighted.map(p => ({
                id: p.id,
                n: seatMap.find(s=>s.id===p.id).n - districtResults.filter(d=>d.partyId===p.id).length
            }));
            propSeatMap.forEach(s=>{ for(let i=0;i<s.n;i++) pool.push(s.id); });
            for(let i=pool.length-1;i>0;i--){
                const j=Math.floor(Math.random()*(i+1));
                [pool[i],pool[j]]=[pool[j],pool[i]];
            }

            // ── Switch to election-result tab (independent tab per chamber) ──────
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            document.getElementById('dispTabElecResult'+suf).style.display='';
            document.getElementById('dispTabElecResult'+suf).querySelector('.disp-tab-label').textContent = `${chamberName} Election Results`;
            switchDispTab('elecResult'+suf);
            document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName} counting...`;
            document.getElementById('elecResultBar'+suf).style.width='0%';
            document.getElementById('elecProgressBar').style.width='0%';

            // Auto-switch view depending on mode
            if(districtSeats > 0) elecSetView('district', chamber);
            else elecSetView('arc', chamber);

            await new Promise(r=>setTimeout(r,150));

            // ── Stage 1: district counting animation ─────
            if(districtSeats > 0) {
                const districtSpeed = Math.max(speed, 20);
                for(let i = 0; i < districtResults.length; i++) {
                    if(elecSkipToEnd) break;
                    while(elecPaused && !elecSkipToEnd) await new Promise(r=>setTimeout(r,80));
                    if(elecSkipToEnd) break;

                    const { key, partyId } = districtResults[i];
                    const p = parties.find(x=>x.id===partyId);
                    if(p){ p[seatKey]++; }

                    elecDrawDistrictResult(districtResults, i+1, chamber);

                    const distName = districtNames[chamber][key];
                    document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName} counting... (${distName || key})`;

                    const pct = ((i+1)/totalSeats*100).toFixed(1)+'%';
                    document.getElementById('elecProgressBar').style.width = pct;
                    document.getElementById('elecResultBar'+suf).style.width   = pct;

                    if(i % Math.max(1, Math.floor(districtResults.length/30)) === 0 || i === districtResults.length-1) {
                        const map = buildElecMap(chamber, totalSeats);
                        updateStats('elecResultStats'+suf, map, totalSeats);
                    }
                    if(districtSpeed > 0) await new Promise(r=>setTimeout(r, districtSpeed));
                }
                // Switch view to proportional once districts are done
                if(propSeats > 0 && !elecSkipToEnd) {
                    await new Promise(r=>setTimeout(r,300));
                    elecSetView('arc', chamber);
                    await new Promise(r=>setTimeout(r,200));
                }
                // Final district render
                elecDrawDistrictResult(districtResults, districtResults.length, chamber);
            }

            // ── Stage 2: proportional counting animation ─────
            const drawEvery = Math.max(1, Math.floor(propSeats/100));

            for(let i=0; i<pool.length; i++) {
                if(elecSkipToEnd) {
                    for(let j=i; j<pool.length; j++) {
                        const pp=parties.find(x=>x.id===pool[j]);
                        if(pp){ pp[seatKey]++; }
                    }
                    break;
                }
                while(elecPaused && !elecSkipToEnd) await new Promise(r=>setTimeout(r,80));
                if(elecSkipToEnd) {
                    for(let j=i; j<pool.length; j++) {
                        const pp=parties.find(x=>x.id===pool[j]);
                        if(pp){ pp[seatKey]++; }
                    }
                    break;
                }

                const p = parties.find(x=>x.id===pool[i]);
                if(p){ p[seatKey]++; }

                const pct = ((districtSeats + i + 1)/totalSeats*100).toFixed(1)+'%';
                document.getElementById('elecProgressBar').style.width=pct;
                document.getElementById('elecResultBar'+suf).style.width=pct;

                if(i%drawEvery===0 || i===pool.length-1) {
                    const map = buildElecMap(chamber, totalSeats);
                    drawChamber('elecCanvas'+suf, map, totalSeats, '_elec');
                    updateStats('elecResultStats'+suf, map, totalSeats);
                }

                if(speed>0) await new Promise(r=>setTimeout(r,speed));
            }

            // Final render
            document.getElementById('elecProgressBar').style.width='100%';
            document.getElementById('elecResultBar'+suf).style.width='100%';
            const finalMap = buildElecMap(chamber, totalSeats);
            drawChamber('elecCanvas'+suf, finalMap, totalSeats, '_elec');
            updateStats('elecResultStats'+suf, finalMap, totalSeats);
            if(districtSeats > 0) elecDrawDistrictResult(districtResults, districtResults.length, chamber);

            // ── Counting complete ──────────────────────
            document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName} result confirmed`;
            if(midCtrl)  midCtrl.style.display='none';
            if(postBtns) postBtns.style.display='block';

            // Save record
            elecSaveRecord(elecTitle, elecYear, chamber, seatMap, weighted, districtResults);

            elecRunning=false;
            runBtn.style.background='var(--tno-neon)'; runBtn.style.color='#000'; runBtn.textContent='>> START COUNT <<';
        }

        function buildElecMap(chamber, totalSeats) {
            const hG = document.getElementById('chkGovHighlight').checked;
            const seatKey = seatKeyFor(chamber);
            const rulingCoal = coalitions.find(c=>c.isRuling);
            let map=[];
            parties.forEach(p=>{
                const cnt = p[seatKey];
                const coal = coalitions.find(c=>c.members.includes(p.id));
                const isPartyRuling = p.isRuling;
                const isCoalRuling  = !isPartyRuling && (coal && coal.isRuling);
                const isGov = isPartyRuling || isCoalRuling;
                const effectiveCoal = (isPartyRuling && !(coal && coal.isRuling)) ? null : coal;
                const isExtSupport = !isGov && !coal && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                let stroke = hG&&isGov ? 'var(--tno-gold)' : (effectiveCoal?effectiveCoal.color:null);
                let strokeDashed = false;
                if(isExtSupport && rulingCoal) { stroke = hG ? '#ffd700' : rulingCoal.color; strokeDashed = true; }

                const factions = (p.factions||[]).filter(f=>(f[seatKey]||0)>0);
                if(factions.length > 0) {
                    let placed = 0;
                    factions.forEach(f => {
                        const fc = f.usePartyColor ? p.color : f.color;
                        const fKey = `${p.id}__${f.id}`;
                        const fCoal = coalitions.find(c=>c.members.includes(fKey));
                        const fCoalRuling = !isPartyRuling && (fCoal && fCoal.isRuling);
                        const fIsGov = isPartyRuling || fCoalRuling;
                        const fEffCoal = (isPartyRuling && !(fCoal && fCoal.isRuling)) ? null : fCoal;
                        const fStroke = hG&&fIsGov ? 'var(--tno-gold)' : (fEffCoal?fEffCoal.color:null);
                        for(let k=0; k<(f[seatKey]||0); k++){
                            if(map.length>=totalSeats) break;
                            map.push({color:fc, partyName:p.name, factionName:f.name,
                                ideology:ideologies.find(i=>i.id===f.ideologyId)?.name||ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                                coalitionName:fEffCoal?.name, strokeColor:fStroke, isRuling:fIsGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                        }
                        placed += f[seatKey]||0;
                    });
                    for(let k=placed; k<cnt; k++){
                        if(map.length>=totalSeats) break;
                        map.push({color:p.color, partyName:p.name, factionName:null,
                            ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                    }
                } else {
                    for(let k=0;k<cnt;k++){
                        if(map.length>=totalSeats) break;
                        map.push({color:p.color, partyName:p.name, factionName:null,
                            ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                    }
                }
            });
            while(map.length<totalSeats) map.push({color:'#222',partyName:'Vacant',factionName:null,ideology:'-',strokeColor:'#333',isRuling:false,externalSupport:false});
            return map;
        }

        /* ===== SIMULATE & DRAW ===== */
        function simulate() {
            const isBicameral = hasSenateChamber();
            const highlightGov = document.getElementById('chkGovHighlight').checked;
            const sTotal = parseInt(document.getElementById('senateTotal').value) || 100;
            const hTotal = parseInt(document.getElementById('houseTotal').value) || 300;

            if(!manualSort) {
                parties.sort((a,b) => {
                    const ia = ideologies.findIndex(i=>i.id===a.ideologyId);
                    const ib = ideologies.findIndex(i=>i.id===b.ideologyId);
                    if(a.ideologyId===IND_IDEOLOGY_ID && b.ideologyId!==IND_IDEOLOGY_ID) return 1;
                    if(b.ideologyId===IND_IDEOLOGY_ID && a.ideologyId!==IND_IDEOLOGY_ID) return -1;
                    return ia - ib;
                });
            }

            const rulingCoal = coalitions.find(c=>c.isRuling);
            const getMap = (targetTotal, chamberKey, checkKey) => {
                const seatKey = chamberKey;
                const active = parties.filter(p=>p[checkKey]);
                let map = [];
                active.forEach(p => {
                    const cnt = p[chamberKey];
                    const coal = coalitions.find(c=>c.members.includes(p.id));
                    const isPartyRuling = p.isRuling;
                    const isCoalRuling  = !isPartyRuling && (coal && coal.isRuling);
                    const isGov = isPartyRuling || isCoalRuling;
                    const effectiveCoal = (isPartyRuling && !(coal && coal.isRuling)) ? null : coal;
                    const isExtSupport = !isGov && !coal && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                    let stroke = null;
                    let strokeDashed = false;
                    if(highlightGov && isGov) stroke = "var(--tno-gold)";
                    else if(effectiveCoal) stroke = effectiveCoal.color;
                    if(isExtSupport && rulingCoal) { stroke = highlightGov ? '#ffd700' : rulingCoal.color; strokeDashed = true; }

                    const factions = (p.factions||[]).filter(f=>(f[seatKey]||0)>0);
                    if(factions.length > 0) {
                        let placed = 0;
                        factions.forEach(f => {
                            const fc = f.usePartyColor ? p.color : f.color;
                            const fKey = `${p.id}__${f.id}`;
                            // Check only whether the faction itself is a coalition member (no fallback to the party's coalition)
                            const fCoal = coalitions.find(c=>c.members.includes(fKey));
                            const fCoalRuling = !isPartyRuling && (fCoal && fCoal.isRuling);
                            const fIsGov = isPartyRuling || fCoalRuling;
                            const fEffCoal = (isPartyRuling && !(fCoal && fCoal.isRuling)) ? null : fCoal; // Remove party-coalition fallback
                            const fStroke = highlightGov&&fIsGov ? 'var(--tno-gold)' : (fEffCoal?fEffCoal.color:null);
                            for(let k=0; k<(f[seatKey]||0); k++){
                                if(map.length>=targetTotal) break;
                                map.push({color:fc, partyName:p.name, factionName:f.name,
                                    ideology:ideologies.find(i=>i.id===f.ideologyId)?.name||ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                                    coalitionName:fEffCoal?.name, strokeColor:fStroke, isRuling:fIsGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                            }
                            placed += f[seatKey]||0;
                        });
                        for(let k=placed; k<cnt; k++){
                            if(map.length>=targetTotal) break;
                            map.push({color:p.color, partyName:p.name, factionName:null,
                                ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                                coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false});
                        }
                    } else {
                        const isIndParty = p.ideologyId === IND_IDEOLOGY_ID;
                        const chName = chamberKey==='seatsHouse'?'house':chamberKey==='seatsSenate'?'senate':'third';
                        const indList = isIndParty ? independents.filter(x=>x.chamber===chName).sort((a,b)=>a.seatIndex-b.seatIndex) : [];
                        for(let k=0; k<cnt; k++) {
                            if(map.length >= targetTotal) break;
                            const indEntry = indList[k];
                            // Individual independent member: only the border reflects their coalition (fill color stays gray)
                            let indStroke = stroke, indDashed = strokeDashed, indIsGov = isGov, indCoalName = effectiveCoal?.name;
                            let indExtSupport = isExtSupport?(rulingCoal.externalSupportLabel||'External Support'):false;
                            if(isIndParty && indEntry) {
                                const indKey = 'ind__' + indEntry.id;
                                const indCoal = coalitions.find(c => c.members.includes(indKey));
                                const indExtCoal = !indCoal && rulingCoal ? (rulingCoal.externalSupporters?.includes(indKey) ? rulingCoal : null) : null;
                                if(indCoal) {
                                    indIsGov = !!indCoal.isRuling;
                                    indStroke = highlightGov && indIsGov ? 'var(--tno-gold)' : indCoal.color;
                                    indDashed = false;
                                    indCoalName = indCoal.name;
                                    indExtSupport = false;
                                } else if(indExtCoal) {
                                    indIsGov = false;
                                    indStroke = highlightGov ? '#ffd700' : indExtCoal.color;
                                    indDashed = true;
                                    indCoalName = null;
                                    indExtSupport = indExtCoal.externalSupportLabel || 'External Support';
                                } else {
                                    // This member individually belongs to neither a coalition nor external support — shown as a plain independent regardless of the party's overall external-support status
                                    indExtSupport = false;
                                }
                            }
                            map.push({color:p.color, partyName:p.name, factionName:null,
                                ideology:ideologies.find(i=>i.id===p.ideologyId)?.name||'?',
                                coalitionName:indCoalName, strokeColor:indStroke, strokeDashed:indDashed, isRuling:indIsGov, externalSupport:indExtSupport,
                                independentName: indEntry?.name || null, independentSeatIndex: indEntry?.seatIndex || null});
                        }
                    }
                });
                while(map.length < targetTotal) map.push({color:'#222', partyName:'Vacant', factionName:null, ideology:'-', strokeColor:'#333', isRuling:false, externalSupport:false});
                return map;
            };

            const hMap = getMap(hTotal, 'seatsHouse', 'inHouse');
            drawChamber('houseCanvas', hMap, hTotal, 'house');
            updateStats('houseStats', hMap, hTotal);

            if(isBicameral) {
                const sMap = getMap(sTotal, 'seatsSenate', 'inSenate');
                drawChamber('senateCanvas', sMap, sTotal, 'senate');
                updateStats('senateStats', sMap, sTotal);
            }

            if(hasThirdChamber()) {
                const tTotal = parseInt(document.getElementById('thirdTotal')?.value) || 100;
                const tMap = getMap(tTotal, 'seatsThird', 'inThird');
                drawChamber('thirdCanvas', tMap, tTotal, 'third');
                updateStats('thirdStats', tMap, tTotal);
            }

            updateVoteResults();
            renderBulkPartyList();
            if(currentSubTab?.legislation === 'bill') renderBillList();
        }

        function drawChamber(cvsId, map, total, chamber) {
            const cvs = document.getElementById(cvsId);
            if(!cvs) return;
            // Keep CSS width:100%, but measure only the parent (wrapper)'s actual rendered width
            // (don't fix the canvas's own style.width in px, so it keeps responding to container size changes)
            const parent = cvs.parentElement;
            let width = parent?.clientWidth || parent?.offsetWidth || cvs.clientWidth || 566;
            if(width <= 50) return; // Skip if too narrow
            const dpr = window.devicePixelRatio || 1;
            const heightBuffer = 160;
            const cssHeight = width / 2 + heightBuffer;
            cvs.width  = width * dpr;
            cvs.height = cssHeight * dpr;
            // Keep style.width at 100%, only set height in pixels (width always follows the parent)
            cvs.style.height = cssHeight + "px";
            const ctx = cvs.getContext('2d');
            ctx.scale(dpr, dpr);

            const CX = width / 2;
            const CY = (width / 2 + heightBuffer) - 60;

            ctx.clearRect(0, 0, width, cvs.height/dpr);
            if(total <= 0) return;

            // Geometry
            const minR = width * 0.15;
            const maxR = (width / 2) - 10;
            let best = null;
            const calc = (rows) => {
                const dotR_est = Math.max(0.5, (maxR - minR) / rows / 2.2);
                let cap = 0, rRows = [];
                for(let i=0; i<rows; i++) {
                    const r = minR + i * (dotR_est * 2.2) + dotR_est;
                    const c = Math.floor((Math.PI * r) / (dotR_est * 2.2));
                    rRows.push({r, c}); cap += c;
                }
                return { cap, rows, dotR: dotR_est, rRows };
            };
            for(let r=3; r<30; r++) { let res=calc(r); if(res.cap>=total){best=res;break;} }
            if(!best) best = calc(30);

            const { dotR, rRows } = best;
            if(dotR <= 0) return; // Can't draw if radius is 0 or less
            let pts = [];
            let totalCap = rRows.reduce((a,b)=>a+b.c, 0);
            let currentPoints = 0;
            rRows.forEach((row, rI) => {
                let count = Math.round(total * (row.c / totalCap));
                if(rI === rRows.length-1) count = total - currentPoints;
                currentPoints += count;
                if(count > 0) {
                    for(let i=0; i<count; i++) {
                        let angle = Math.PI - (Math.PI / (count > 1 ? count-1 : 1)) * i;
                        if(count===1) angle = Math.PI/2;
                        pts.push({ x: CX + row.r * Math.cos(angle), y: CY - row.r * Math.sin(angle) });
                    }
                }
            });
            pts.forEach(p => { p.angle = Math.atan2(CY - p.y, p.x - CX); });
            pts.sort((a,b) => b.angle - a.angle);

            // Save dot positions for click detection
            dotCache[chamber] = pts.map((pt, i) => ({
                x: pt.x, y: pt.y, r: dotR,
                cx: CX, cy: CY,
                color: map[i]?.color || '#222',
                strokeColor: map[i]?.strokeColor || null,
                strokeDashed: map[i]?.strokeDashed || false,
                isRuling: map[i]?.isRuling || false,
                externalSupport: map[i]?.externalSupport || false,
                partyName: map[i]?.partyName || 'Vacant',
                ideology: map[i]?.ideology || '-',
                independentName: map[i]?.independentName || null,
                independentSeatIndex: map[i]?.independentSeatIndex || null,
            }));

            const highlightGov = document.getElementById('chkGovHighlight').checked;
            const chamberVoteState = voteState[chamber] || {};

            // Draw dots (with vote state)
            pts.forEach((pt, i) => {
                if(i >= map.length) return;
                const d = map[i];
                const vote = chamberVoteState[i] || 'none';
                const voteColor = getVoteColor(vote);
                const radius = Math.max(0.5, dotR * 0.85);

                ctx.beginPath();
                ctx.arc(pt.x, pt.y, radius, 0, Math.PI*2);
                ctx.fillStyle = voteColor || d.color;
                ctx.fill();

                // Stroke: party/coalition/gov
                if(d.isRuling && highlightGov) {
                    ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = "#ffd700";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                } else if(d.strokeColor) {
                    ctx.strokeStyle = d.strokeColor;
                    ctx.lineWidth = d.strokeDashed ? 1.5 : 1;
                    if(d.strokeDashed) ctx.setLineDash([2,2]);
                    ctx.stroke();
                    if(d.strokeDashed) ctx.setLineDash([]);
                }

                // If voted, overlay party color as border so color stays visible
                if(voteColor) {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, radius, 0, Math.PI*2);
                    ctx.strokeStyle = d.color;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }
            });

            // Center label
            ctx.fillStyle = "#fff";
            ctx.font = "30px 'NeoDunggeunmo'";
            ctx.textAlign = "center";
            ctx.fillText(total, CX, CY);
            ctx.font = "16px 'NeoDunggeunmo'";
            ctx.fillStyle = "var(--tno-neon)";
            ctx.fillText("SEATS", CX, CY + 25);
        }

        // Infer the chamber from the stats-container id (houseStats/senateStats/thirdStats/elecResultStatsHouse, etc.)
        function inferChamberFromStatsId(id) {
            const low = (id||'').toLowerCase();
            if(low.includes('third')) return 'third';
            if(low.includes('senate')) return 'senate';
            return 'house';
        }

        function updateStats(id, map, total) {
            const el = document.getElementById(id);
            if(total===0){ el.innerHTML=""; return; }
            let stats = {};
            const vac = map.filter(x=>x.partyName==='Vacant').length;
            const valid = total - vac;
            const maj = Math.floor(valid/2)+1;
            map.forEach(m => {
                if(m.partyName==='Vacant') return;
                let k = m.coalitionName ? 'c_'+m.coalitionName :
                        m.externalSupport ? 'e_'+m.partyName :
                        (m.factionName && !m.isRuling) ? 'f_'+m.partyName+'__'+m.factionName :
                                          'p_'+m.partyName;
                const displayName = m.coalitionName ? m.coalitionName :
                                    (m.factionName && !m.isRuling) ? `${m.partyName} — ${m.factionName}` :
                                                      m.partyName;
                // partyColor: the party/coalition's own original color (not the gold stroke, the actual color)
                const party = parties.find(p=>p.name===m.partyName);
                const coalObjForColor = m.coalitionName ? coalitions.find(c=>c.name===m.coalitionName) : null;
                // legend-pill etc. use the member party's actual color as-is (independent of the coalition color)
                const partyColor = party?.color || m.color;
                // Card's left-side stripe color: the coalition's own color (gold when ruling) for coalitions, the party color for regular parties
                const cardStripColor = coalObjForColor ? coalObjForColor.color : partyColor;
                if(!stats[k]) stats[k] = { name: displayName, count:0, color: m.strokeColor||m.color, partyColor: cardStripColor, isRuling: m.isRuling, externalSupport: m.externalSupport, parties:{}, factions:{}, coalitionName: m.coalitionName };
                stats[k].count++;
                // parties: aggregated by party (for legend-pill)
                if(!stats[k].parties[m.partyName]) stats[k].parties[m.partyName] = {n:0, c:partyColor, i:m.ideology};
                stats[k].parties[m.partyName].n++;
                // factions: aggregated by faction
                if(m.factionName) {
                    const fKey = `${m.partyName}__${m.factionName}`;
                    if(!stats[k].factions[fKey]) stats[k].factions[fKey] = {n:0, name:m.factionName, partyName:m.partyName, c:m.color};
                    stats[k].factions[fKey].n++;
                }
            });
            const allStats = Object.values(stats);
            // Sum of seats for external-support (confidence-and-supply) parties — factored into the ruling party's effective majority determination
            const extSupportTotal = allStats.reduce((sum,s)=> s.externalSupport ? sum+s.count : sum, 0);

            // Category classification: government / external support / opposition
            const govArr = allStats.filter(s=>s.isRuling);
            const extArr = allStats.filter(s=>!s.isRuling && s.externalSupport).sort((a,b)=>b.count-a.count);
            const oppArr = allStats.filter(s=>!s.isRuling && !s.externalSupport).sort((a,b)=>b.count-a.count);

            function renderCard(s) {
                let statusHtml = '';
                let extNoteHtml = '';
                if(s.isRuling) {
                    const effectiveCount = s.count + extSupportTotal;
                    statusHtml = `<span style="color:var(--tno-gold);font-weight:bold;">[GOV]</span> `;
                    statusHtml += effectiveCount>=maj ? `<span style="color:#0f0;font-weight:bold;">[MAJ]</span>` : `<span style="color:#f00;font-weight:bold;">[MIN]</span>`;
                    if(extSupportTotal > 0) {
                        const pct = ((effectiveCount/total)*100).toFixed(1);
                        const extLabel = extArr[0]?.externalSupport || 'External Support';
                        extNoteHtml = `<div style="color:var(--tno-gold);opacity:0.75;font-size:0.78rem;margin-top:2px;">+ ${extLabel} ${extSupportTotal} seats = effective ${effectiveCount} seats (${pct}%)</div>`;
                    }
                } else if(s.externalSupport) {
                    statusHtml = `<span style="color:var(--tno-gold);font-weight:bold;border-bottom:2px dashed var(--tno-gold);" title="Has not formally joined the coalition but supports the government in confidence votes, budgets, etc.">[${s.externalSupport} C&S]</span>`;
                } else if(s.count>=maj && govArr.length > 0) {
                    statusHtml = `<span style="color:#f00;font-weight:bold;">[DIVIDED GOV]</span>`;
                }

                // Look up the lead party (leadPartyId) — used for pill ordering on the ruling-coalition card
                const coalObj = s.coalitionName ? coalitions.find(x=>x.name===s.coalitionName) : null;
                const leadPartyName = coalObj?.leadPartyId ? parties.find(p=>p.id===coalObj.leadPartyId)?.name : null;

                // legend-pill: by faction if present, otherwise by party — lead party first, then by seat count
                let subs = '';
                const hasFactions = Object.keys(s.factions||{}).length > 0;
                const partyEntries = Object.entries(s.parties).sort((a,b)=>{
                    if(a[0]===leadPartyName) return -1;
                    if(b[0]===leadPartyName) return 1;
                    return b[1].n - a[1].n;
                });
                const abbrOf = n => { const pp = parties.find(x=>x.name===n); return pp?.abbr ? pp.abbr : n; };
                if(hasFactions) {
                    subs = Object.values(s.factions).map(f=>
                        `<span class="legend-pill"><span style="background:${f.c};width:8px;height:8px;display:inline-block;"></span>${abbrOf(f.partyName)} — ${f.name}(${f.n})</span>`
                    ).join('');
                    // Remaining seats not assigned to a faction
                    partyEntries.forEach(([n,d])=>{
                        const fTotal = Object.values(s.factions).filter(f=>f.partyName===n).reduce((a,f)=>a+f.n,0);
                        const rem = d.n - fTotal;
                        if(rem > 0) subs += `<span class="legend-pill" title="${n}"><span style="background:${d.c};width:8px;height:8px;display:inline-block;"></span>${abbrOf(n)}(${rem})</span>`;
                    });
                } else {
                    subs = partyEntries.map(([n,d])=>
                        `<span class="legend-pill" title="${n}"><span style="background:${d.c};width:8px;height:8px;display:inline-block;"></span>${abbrOf(n)}(${d.n})</span>`
                    ).join('');
                }

                // Determine photo/name
                let photo = '', leaderName = '', isLogo = false;
                let isIndependentCard = false;
                if(s.coalitionName) {
                    const coal = coalObj;
                    if(coal) {
                        const leadP = coal.leadPartyId ? parties.find(p=>p.id===coal.leadPartyId) : null;
                        if(coal.syncWithLeadParty && leadP) {
                            photo      = leadP.leaderPhoto || '';
                            leaderName = leadP.leaderName  || '';
                        } else {
                            photo      = coal.leaderPhoto || '';
                            leaderName = coal.leaderName  || '';
                        }
                    }
                } else {
                    const pName = Object.keys(s.parties)[0];
                    const party = parties.find(p=>p.name===pName);
                    isLogo     = party?.showLogoInStats ?? false;
                    photo      = party ? (isLogo ? (party.logoPhoto||party.leaderPhoto||'') : (party.leaderPhoto||party.logoPhoto||'')) : '';
                    leaderName = party?.leaderName || '';
                    isIndependentCard = party?.ideologyId === IND_IDEOLOGY_ID;
                }

                // Independent card: collapsible list of individual members
                let independentToggleHtml = '';
                let independentListHtml = '';
                if(isIndependentCard) {
                    const chamber = inferChamberFromStatsId(id);
                    const listItems = independents.filter(x=>x.chamber===chamber).sort((a,b)=>a.seatIndex-b.seatIndex);
                    const panelId = `indPanel_${id}_${chamber}`;
                    independentToggleHtml = `<span onclick="event.stopPropagation();toggleIndependentPanel('${panelId}')" style="cursor:pointer;color:#888;font-size:0.85rem;user-select:none;flex-shrink:0;" id="${panelId}_arrow">▶</span>`;
                    independentListHtml = `<div id="${panelId}" style="display:none;margin-top:6px;border-top:1px dashed #333;padding-top:6px;max-height:260px;overflow-y:auto;">
                        ${listItems.length===0 ? '<div style="color:#444;font-size:0.78rem;">No individual info</div>' : listItems.map(ind => {
                            const indIdeo = ind.ideologyId ? ideologies.find(i=>i.id===ind.ideologyId)?.name : null;
                            return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.8rem;color:#aaa;border-bottom:1px solid #1a1a1a;">
                                <div style="width:22px;height:27px;flex-shrink:0;background:#0a0c10;border:1px solid #333;overflow:hidden;">
                                    ${ind.photo?`<img src="${ind.photo}" style="width:100%;height:100%;object-fit:cover;">`:''}
                                </div>
                                <span style="width:24px;color:#666;flex-shrink:0;">#${ind.seatIndex}</span>
                                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ind.name||'(unnamed)'}</span>
                                <span style="color:#666;font-size:0.75rem;flex-shrink:0;">${indIdeo||'Independent'}</span>
                            </div>`;
                        }).join('')}
                    </div>`;
                }

                return `<div class="stat-block" style="border-left-color:${(s.coalitionName && s.isRuling) ? 'var(--tno-gold)' : (s.partyColor||s.color)};">
                    <div class="dyn-row" style="display:flex;gap:8px;align-items:stretch;">
                        <!-- Photo: sized in px via JS to match the measured height of the text on the right -->
                        <div class="leader-photo-box dyn-photo" data-ratio="${isLogo?'1':'0.75'}" style="flex-shrink:0;background:#0a0c10;border:1px solid #222;overflow:hidden;">
                            ${photo?`<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`:''}
                        </div>
                        <!-- Right-side 3 rows -->
                        <div class="dyn-ref" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
                            <!-- Row 1: coalition/party name : seats (%) + status -->
                            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px;flex-wrap:wrap;">
                                <span style="font-size:1.1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;display:flex;align-items:center;gap:6px;">${independentToggleHtml}${s.name} : ${s.count} <span style="color:#888;font-size:0.85rem;">(${((s.count/total)*100).toFixed(1)}%)</span></span>
                                <span style="flex-shrink:0;font-size:0.9rem;">${statusHtml}</span>
                            </div>
                            ${extNoteHtml}
                            <!-- Row 2: leader name -->
                            <div style="color:#888;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${leaderName||'　'}</div>
                            <!-- Row 3: party list (wraps) -->
                            <div style="opacity:0.8;line-height:1.8;flex-wrap:wrap;display:flex;gap:2px;">${subs}</div>
                            ${independentListHtml}
                        </div>
                    </div>
                </div>`;
            }

            function renderSectionHeader(label) {
                return `<div style="display:flex;align-items:center;gap:8px;margin:10px 0 6px;">
                    <div style="flex:1;height:1px;background:#333;"></div>
                    <span style="color:#666;font-size:0.78rem;letter-spacing:2px;white-space:nowrap;">${label}</span>
                    <div style="flex:1;height:1px;background:#333;"></div>
                </div>`;
            }

            let html = "";
            if(govArr.length > 0) {
                html += renderSectionHeader('Government');
                govArr.forEach(s => html += renderCard(s));
            }
            if(extArr.length > 0) {
                html += renderSectionHeader(extArr[0]?.externalSupport || 'External Support');
                extArr.forEach(s => html += renderCard(s));
            }
            if(oppArr.length > 0) {
                html += renderSectionHeader('Opposition');
                oppArr.forEach(s => html += renderCard(s));
            }
            el.innerHTML = html;
            fitDynPhotos(el);
        }

        function toggleIndependentPanel(panelId) {
            const panel = document.getElementById(panelId);
            const arrow = document.getElementById(panelId+'_arrow');
            if(!panel) return;
            const show = panel.style.display === 'none';
            panel.style.display = show ? '' : 'none';
            if(arrow) arrow.textContent = show ? '▼' : '▶';
        }
    
