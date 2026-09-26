        const IND_IDEOLOGY_ID = 9999;

        // ── 국가명·국기 (v1.4.8) ──────────────
        let nationFlag = ''; // dataURL

        function updateNationIdBar() {
            const name = document.getElementById('nationNameInput')?.value?.trim() || '';
            const nameEl = document.getElementById('nationNameDisp');
            if(nameEl) nameEl.textContent = name || '국가명 미설정';
            const banner = document.getElementById('nationFlagBanner');
            const bannerImg = document.getElementById('nationFlagBannerImg');
            if(nationFlag) {
                // 국기가 있으면 좌측 탭 폭에 맞춘 큰 배너로 표시
                if(bannerImg) bannerImg.src = nationFlag;
                if(banner) banner.style.display = '';
            } else if(banner) {
                banner.style.display = 'none';
            }
        }

        function renderNationConfig() {
            const img = document.getElementById('nationFlagImg');
            const ph  = document.getElementById('nationFlagPh');
            if(img && ph) {
                if(nationFlag) { img.src = nationFlag; img.style.display = ''; ph.style.display = 'none'; }
                else { img.style.display = 'none'; ph.style.display = ''; }
            }
            const removeBtn = document.getElementById('nationFlagRemoveBtn');
            if(removeBtn) removeBtn.style.display = nationFlag ? '' : 'none';
            updateNationIdBar();
            updateDispInfoBar();
        }

        function uploadNationFlag(input) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => { nationFlag = e.target.result; renderNationConfig(); };
            reader.readAsDataURL(file);
        }

        function removeNationFlag() {
            nationFlag = '';
            renderNationConfig();
        }

        // ── 날짜/회기 (v1.4.8) ──────────────
        let nationDateMode = 'progressive';  // 'progressive'(연 · 월 · 일, 기본) | 'simple'(글자로 직접 입력)
        let nationSessionMode = 'simple';    // 'simple' | 'individual'
        let nationSessionType = 'regular';   // 'regular'(정기회) | 'extraordinary'(임시회) — 개별형에서만 사용
        let nationNextSessionType = 'regular'; // 다음 회기의 종류 — 날짜 줄의 토글로 고르고, "다음 회기"를 누를 때 적용 (지금 회기 종류는 국가 › 날짜에서만 바꿈)

        // ── 내각 > 설정: 정부 형태 (v1.5.P) ──────────────
        let govType = 'parliamentary'; // 'presidential'(대통령제) | 'semi'(이원집정부제) | 'parliamentary'(의원내각제) | 'collective'(집단지도체제)
        let president = { name: '', photo: '', partyId: null, linkedSeat: null }; // 대통령(+대선 == 행정부 선거)
        let pm = { name: '', photo: '', partyId: null, linkedSeat: null };         // 총리/국무총리
        let deputyPms = []; // 부총리 — 여러 명 추가 가능(기본 0명) { id, name, position, photo, partyId, linkedSeat }
        let cabinetMembers = []; // 국무위원/내각 구성원(집단지도체제에서는 "장관") { id, name, position, photo, partyId, linkedSeat }
        let collectiveChair = { name: '', photo: '', partyId: null, linkedSeat: null }; // 집단지도체제: 의장
        // 이원집정부제 + 양원제 전용: 의회 해산권을 원별로 나눠 대통령=상원 해산, 총리=하원 해산으로 지정 가능
        // (기본은 꺼짐 — 켜면 기존 단일 "의회 해산" 권한 주체 설정 대신 이 두 개별 권한을 사용)
        let splitDissolutionHolders = false;
        // 건설적 불신임제(독일·이스라엘식): 켜면 내각 불신임안에 후임 총리를 함께 지명해야 하고,
        // 가결되면 공석 없이 그 후임이 바로 총리가 된다 (끄면 기존처럼 가결 시 총리 공석)
        let constructiveNoConfidence = false;

        // ── 총리 선출 과정 ──────────────
        let pmDirectElectionEnabled = false; // 총리직선제 체크박스 — 켜면 국가>선거>총선에서 "총리 선거" 실행 가능
        // 다수당 방식(pmSelectionMethod()==='majority')일 때, 기본은 매번 현재 다수당 대표를 실시간으로
        // 따라가지만(소수정부 불신임안이 의미 있으려면 의석 변동만으로 총리가 바뀌면 안 되므로), "고정"하면
        // 그 시점의 총리 정보를 그대로 유지하고 의석 변동에 더 이상 반응하지 않음 — 내각 불신임이 가결되면 자동 해제됨
        let pmMajorityLocked = false;
        let pmNominee = { name: '', photo: '', partyId: null, linkedSeat: null }; // 대통령 임명제: 심의 상정 전 후보
        let pmNomineeBillId = null; // 현재 의회 심의 중인 임명동의안 bill id (있으면 심의 진행 중)

        // 국무위원/장관 카드에 기본 표시할 라벨 — 집단지도체제에서는 "장관", 그 외에는 "국무위원"
        function cabinetMemberRoleLabel() { return govType === 'collective' ? '장관' : '국무위원'; }

        // 대통령제에서는 관례상 총리를 "국무총리"라 부르므로, 정부 형태에 따라 탭/라벨 표기를 바꾼다
        function pmRoleLabel() { return govType === 'presidential' ? '국무총리' : '총리'; }

        // 입헌군주제에서는 "대통령" 자리가 상징적 국가원수인 "국왕"으로 바뀐다 (실권은 총리에게 있음)
        function presidentRoleLabel() { return govType === 'monarchy' ? '국왕' : '대통령'; }

        // 내각 디스플레이의 직책 이름(대통령/총리·국무총리/부총리/의장/장관·국무위원)을 사용자가 직접 바꿀 수 있게 함 —
        // 비워두면(기본값) 정부 형태에 따른 자동 라벨(pmRoleLabel/cabinetMemberRoleLabel)을 그대로 사용
        let cabinetRoleLabels = { president: '', pm: '', deputyPm: '', chair: '', cabinetMember: '' };
        function cabinetRoleLabelDefault(key) {
            return { president: presidentRoleLabel(), pm: pmRoleLabel(), deputyPm: '부총리', chair: '의장', cabinetMember: cabinetMemberRoleLabel() }[key];
        }
        function effRoleLabel(key) {
            return cabinetRoleLabels[key] || cabinetRoleLabelDefault(key);
        }
        function updateCabinetRoleLabel(key, val) {
            cabinetRoleLabels[key] = val;
            updatePmRoleLabels();
            updatePresidentRoleLabels();
            updateHolderButtonLabels();
            applyGovTypeTabVisibility();
            renderPmSection();
            renderPresidentSection();
            renderCabinetDisplay();
        }
        function renderCabinetRoleLabelInputs() {
            ['president','pm','deputyPm','chair','cabinetMember'].forEach(key => {
                const input = document.getElementById('roleLabel'+key.charAt(0).toUpperCase()+key.slice(1)+'Input');
                if(!input) return;
                input.placeholder = cabinetRoleLabelDefault(key);
                if(document.activeElement !== input) input.value = cabinetRoleLabels[key] || '';
            });
        }

        // 대통령/총리/국무위원의 당적 선택 <select> 옵션 — 무소속 가상 정당은 목록에서 제외하고
        // 빈 값("")을 기본 "무소속"으로 취급한다 (의석에 영향 없는 표시 전용 소속이므로)
        function partySelectOptionsHtml(selectedId) {
            const real = parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID);
            return `<option value="">무소속</option>` + real.map(p =>
                `<option value="${p.id}" ${String(p.id) === String(selectedId) ? 'selected' : ''}>${p.name}</option>`
            ).join('');
        }
        function partyDotColor(partyId) {
            if(partyId === null || partyId === undefined || partyId === '') return '#666';
            const p = parties.find(x => x.id === partyId);
            return p ? p.color : '#666';
        }

        // ── 대통령/총리/국무위원을 실제 의원(지역구·비례·무소속)과 연결 — 이름·사진·당적 자동 반영 ──────────────
        function chamberDisplayName(ch) {
            return document.getElementById(ch+'NameInput')?.value || ({house:'하원',senate:'상원',third:'삼원'}[ch] || ch);
        }

        // linkedSeat: { type:'district', chamber, key } | { type:'list', chamber, partyId, memberId } | { type:'independent', memberId }
        // 연결이 끊어진(의원이 삭제된) 경우 null을 반환 — 호출부에서 자동으로 연결 해제 처리
        function resolveLinkedSeat(link) {
            if(!link) return null;
            if(link.type === 'district') {
                const m = districtMembers[link.chamber]?.[link.key];
                if(!m || m.vacant) return null;
                const party = parties.find(p => p.id === m.partyId);
                if(party?.ideologyId === IND_IDEOLOGY_ID) {
                    const ind = independents.find(x => x.chamber === link.chamber && x.districtKey === link.key);
                    return { name: ind?.name || '', photo: ind?.photo || '', partyId: m.partyId };
                }
                return { name: m.name || '', photo: m.photo || '', partyId: m.partyId };
            }
            if(link.type === 'independent') {
                const ind = independents.find(x => x.id === link.memberId);
                if(!ind) return null;
                const indParty = parties.find(p => p.ideologyId === IND_IDEOLOGY_ID);
                return { name: ind.name || '', photo: ind.photo || '', partyId: indParty ? indParty.id : null };
            }
            if(link.type === 'list') {
                const m = listMembers[link.chamber]?.[link.partyId]?.find(x => x.id === link.memberId);
                if(!m || m.vacant) return null;
                return { name: m.name || '', photo: m.photo || '', partyId: link.partyId };
            }
            return null;
        }

        // 대통령/총리/국무위원 카드에 넣을 "의원에서 불러오기" 드롭다운의 옵션 목록 —
        // 원별 지역구 당선자 → 비례 의원 → 비례·무소속 순으로 나열.
        // filterPartyId를 지정하면 그 정당(무소속 항목이면 무소속 의원) 소속 의원만 보여준다 —
        // 대선/총리선거 후보 설정처럼 특정 정당의 후보 슬롯에 다른 정당 의원이 섞여 나오면 안 되는 곳에서 사용.
        function memberPickerOptionsHtml(filterPartyId) {
            const filterIsInd = filterPartyId !== undefined && parties.find(p => p.id === filterPartyId)?.ideologyId === IND_IDEOLOGY_ID;
            const opts = ['<option value="">-- 의원에서 불러오기 --</option>'];
            chamberList().forEach(ch => {
                const chLabel = chamberDisplayName(ch);
                districtSortedKeys(ch).forEach((key, i) => {
                    const m = districtMembers[ch][key];
                    if(!m || m.vacant) return;
                    if(filterPartyId !== undefined && m.partyId !== filterPartyId) return;
                    const party = parties.find(p => p.id === m.partyId);
                    const isInd = party?.ideologyId === IND_IDEOLOGY_ID;
                    const ind = isInd ? independents.find(x => x.chamber === ch && x.districtKey === key) : null;
                    const nm = isInd ? (ind?.name || '무소속') : (m.name || '(이름 없음)');
                    opts.push(`<option value="district:${ch}:${key}">[${chLabel}] #${i+1} ${nm} (${party?.name||''})</option>`);
                });
                parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID && (filterPartyId === undefined || p.id === filterPartyId)).forEach(p => {
                    (listMembers[ch]?.[p.id]||[]).forEach(m => {
                        if(m.vacant) return;
                        opts.push(`<option value="list:${ch}:${p.id}:${m.id}">[${chLabel} 비례] ${m.name||'(이름 없음)'} (${p.name})</option>`);
                    });
                });
                if(filterPartyId === undefined || filterIsInd) {
                    independents.filter(x => x.chamber === ch && !x.districtKey).forEach(ind => {
                        const label = ind.name || `#${computeIndependentOffset(ch) + ind.seatIndex}`;
                        opts.push(`<option value="independent:${ind.id}">[${chLabel} 비례·무소속] ${label}</option>`);
                    });
                }
            });
            return opts.join('');
        }

        function parseMemberPickerValue(val) {
            if(!val) return null;
            const parts = val.split(':');
            if(parts[0] === 'district') return { type:'district', chamber:parts[1], key:parts[2] };
            if(parts[0] === 'list') return { type:'list', chamber:parts[1], partyId:parseInt(parts[2]), memberId:parts[3] };
            if(parts[0] === 'independent') return { type:'independent', memberId:parts[1] };
            return null;
        }

        // 거부권(veto) 주체 — 정부 형태에 따라 기본값을 다르게 두되, 내각>설정에서 직접 재지정 가능
        // 'none' | 'president' | 'pm'
        let vetoHolder = 'none';

        function setGovType(type) {
            if(!['presidential','semi','parliamentary','monarchy','collective'].includes(type)) return;
            govType = type;
            document.getElementById('govTypePresidentialBtn')?.classList.toggle('active', type==='presidential');
            document.getElementById('govTypeSemiBtn')?.classList.toggle('active', type==='semi');
            document.getElementById('govTypeParliamentaryBtn')?.classList.toggle('active', type==='parliamentary');
            document.getElementById('govTypeMonarchyBtn')?.classList.toggle('active', type==='monarchy');
            document.getElementById('govTypeCollectiveBtn')?.classList.toggle('active', type==='collective');
            updatePmRoleLabels();
            updatePresidentRoleLabels();
            updateHolderButtonLabels();
            applyGovTypeHolderRestrictions();
            applyGovTypeTabVisibility();
            updateSplitDissolutionUI();
            renderPmSection();
            renderDeputyPmsList();
            renderChairSection();
            renderCabinetMembersList();
            renderCabinetDisplay();
            renderCabinetRoleLabelInputs();
        }

        // 집단지도체제에서는 대통령/총리 탭이 사라지고 모두 내각 탭(의장+장관)으로 이관된다
        function applyGovTypeTabVisibility() {
            const isCollective = govType === 'collective';
            const presTabBtn = document.getElementById('subTabPresident');
            if(presTabBtn) presTabBtn.style.display = isCollective ? 'none' : '';
            const pmTabBtn = document.getElementById('subTabPm');
            if(pmTabBtn) pmTabBtn.style.display = isCollective ? 'none' : '';
            const chairSection = document.getElementById('chairSection');
            if(chairSection) chairSection.style.display = isCollective ? '' : 'none';
            // 대통령/총리 탭이 사라졌는데 그 탭을 보고 있었다면 내각 탭으로 이동
            if(isCollective && (currentSubTab.cabinet === 'president' || currentSubTab.cabinet === 'pm')) {
                switchSubTab('cabinet', 'cabinetmembers');
            }
            const addBtn = document.getElementById('addCabinetMemberBtn');
            if(addBtn) addBtn.textContent = `[+] ${effRoleLabel('cabinetMember')} 추가`;
        }

        // 정부 형태에 따라 거부권/비상 권한 주체로 고를 수 있는 대상을 제한한다 —
        // 대통령제: 없음/대통령만, 의원내각제: 없음/총리만, 이원집정부제: 셋 다 가능, 집단지도체제: 없음/내각만
        function applyGovTypeHolderRestrictions() {
            const isCollective = govType === 'collective';
            // 입헌군주제의 국왕은 의원내각제의 대통령과 마찬가지로 실권(거부권·비상 권한)이 없음
            const showPresident = !isCollective && govType !== 'parliamentary' && govType !== 'monarchy';
            const showPm = !isCollective && govType !== 'presidential';
            const showCabinet = isCollective;

            const vpBtn = document.getElementById('vetoHolderPresidentBtn');
            const vmBtn = document.getElementById('vetoHolderPmBtn');
            const vcBtn = document.getElementById('vetoHolderCabinetBtn');
            if(vpBtn) vpBtn.style.display = showPresident ? '' : 'none';
            if(vmBtn) vmBtn.style.display = showPm ? '' : 'none';
            if(vcBtn) vcBtn.style.display = showCabinet ? '' : 'none';
            if(!showPresident && vetoHolder === 'president') setVetoHolder('none');
            if(!showPm && vetoHolder === 'pm') setVetoHolder('none');
            if(!showCabinet && vetoHolder === 'cabinet') setVetoHolder('none');

            Object.keys(EMERGENCY_POWERS).forEach(key => {
                const suf = key.charAt(0).toUpperCase() + key.slice(1);
                const presBtn = document.getElementById('emergencyHolderPresident'+suf);
                const pmBtn = document.getElementById('emergencyHolderPm'+suf);
                const cabBtn = document.getElementById('emergencyHolderCabinet'+suf);
                if(presBtn) presBtn.style.display = showPresident ? '' : 'none';
                if(pmBtn) pmBtn.style.display = showPm ? '' : 'none';
                if(cabBtn) cabBtn.style.display = showCabinet ? '' : 'none';
                if(!showPresident && emergencyPowers[key].holder === 'president') { emergencyPowers[key].active = false; setEmergencyHolder(key, 'none'); }
                if(!showPm && emergencyPowers[key].holder === 'pm') { emergencyPowers[key].active = false; setEmergencyHolder(key, 'none'); }
                if(!showCabinet && emergencyPowers[key].holder === 'cabinet') { emergencyPowers[key].active = false; setEmergencyHolder(key, 'none'); }
            });
        }

        function updatePmRoleLabels() {
            const label = effRoleLabel('pm');
            const tabBtn = document.getElementById('subTabPm');
            if(tabBtn) tabBtn.textContent = label;
            const sectionLabel = document.getElementById('pmSectionLabel');
            if(sectionLabel) sectionLabel.textContent = label;
            const nameInput = document.getElementById('pmNameInput');
            if(nameInput) nameInput.placeholder = `${label} 이름`;
            const img = document.getElementById('pmPhotoImg');
            if(img) img.alt = label;
        }

        function updatePresidentRoleLabels() {
            const label = effRoleLabel('president');
            const tabBtn = document.getElementById('subTabPresident');
            if(tabBtn) tabBtn.textContent = label;
            const sectionLabel = document.getElementById('presidentSectionLabel');
            if(sectionLabel) sectionLabel.textContent = label;
            const nameInput = document.getElementById('presidentNameInput');
            if(nameInput) nameInput.placeholder = `${label} 이름`;
            const img = document.getElementById('presidentPhotoImg');
            if(img) img.alt = label;
        }

        // 거부권/비상 권한 주체 선택 버튼(대통령/총리)과 해산권 분할 문구는 정적 HTML 텍스트라
        // 정부 형태·직책 이름 커스텀에 맞춰 실시간으로 갱신해줘야 함
        function updateHolderButtonLabels() {
            const presLabel = effRoleLabel('president');
            const pmLabel = effRoleLabel('pm');
            const vp = document.getElementById('vetoHolderPresidentBtn'); if(vp) vp.textContent = presLabel;
            const vm = document.getElementById('vetoHolderPmBtn'); if(vm) vm.textContent = pmLabel;
            Object.keys(EMERGENCY_POWERS).forEach(key => {
                const suf = key.charAt(0).toUpperCase() + key.slice(1);
                const p = document.getElementById('emergencyHolderPresident'+suf); if(p) p.textContent = presLabel;
                const m = document.getElementById('emergencyHolderPm'+suf); if(m) m.textContent = pmLabel;
            });
            const sp = document.getElementById('splitDissolutionPresLabel'); if(sp) sp.textContent = presLabel;
            const sm = document.getElementById('splitDissolutionPmLabel'); if(sm) sm.textContent = pmLabel;
        }

        function renderPresidentSection() {
            if(president.linkedSeat && !resolveLinkedSeat(president.linkedSeat)) president.linkedSeat = null;
            const resolved = president.linkedSeat ? resolveLinkedSeat(president.linkedSeat) : null;
            const effName = resolved ? resolved.name : president.name;
            const effPhoto = resolved ? resolved.photo : president.photo;
            const effPartyId = resolved ? resolved.partyId : president.partyId;

            const nameInput = document.getElementById('presidentNameInput');
            if(nameInput) {
                nameInput.disabled = !!resolved;
                if(nameInput.value !== (effName||'')) nameInput.value = effName || '';
            }
            const img = document.getElementById('presidentPhotoImg');
            const ph  = document.getElementById('presidentPhotoPh');
            const removeBtn = document.getElementById('presidentPhotoRemoveBtn');
            if(img && ph) {
                if(effPhoto) { img.src = effPhoto; img.style.display = ''; ph.style.display = 'none'; }
                else { img.style.display = 'none'; ph.style.display = ''; }
            }
            if(removeBtn) removeBtn.style.display = (!resolved && president.photo) ? '' : 'none';
            const photoInput = document.querySelector('#presidentPhotoBox input[type=file]');
            if(photoInput) photoInput.disabled = !!resolved;
            const partySelect = document.getElementById('presidentPartySelect');
            if(partySelect) { partySelect.innerHTML = partySelectOptionsHtml(effPartyId); partySelect.disabled = !!resolved; }
            const dot = document.getElementById('presidentPartyDot');
            if(dot) dot.style.background = partyDotColor(effPartyId);
            const picker = document.getElementById('presidentMemberPicker');
            if(picker) { picker.innerHTML = memberPickerOptionsHtml(); picker.value = ''; picker.style.display = resolved ? 'none' : ''; }
            const badge = document.getElementById('presidentLinkedBadge');
            if(badge) badge.style.display = resolved ? 'flex' : 'none';
        }

        function updatePresidentField(key, val) {
            president[key] = val;
            if(key === 'partyId') renderPresidentSection();
            renderCabinetDisplay();
        }

        function linkPresidentToMember(val) {
            const parsed = parseMemberPickerValue(val);
            if(!parsed) return;
            president.linkedSeat = parsed;
            renderPresidentSection();
            renderCabinetDisplay();
        }

        function unlinkPresident() {
            president.linkedSeat = null;
            renderPresidentSection();
            renderCabinetDisplay();
        }

        function uploadPresidentPhoto(input) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => { president.photo = e.target.result; renderPresidentSection(); renderCabinetDisplay(); };
            reader.readAsDataURL(file);
        }

        function removePresidentPhoto() {
            president.photo = '';
            renderPresidentSection();
            renderCabinetDisplay();
        }

        // ── 집단지도체제: 의장 (president와 동일한 구조) ──────────────
        function renderChairSection() {
            if(collectiveChair.linkedSeat && !resolveLinkedSeat(collectiveChair.linkedSeat)) collectiveChair.linkedSeat = null;
            const resolved = collectiveChair.linkedSeat ? resolveLinkedSeat(collectiveChair.linkedSeat) : null;
            const effName = resolved ? resolved.name : collectiveChair.name;
            const effPhoto = resolved ? resolved.photo : collectiveChair.photo;
            const effPartyId = resolved ? resolved.partyId : collectiveChair.partyId;

            const nameInput = document.getElementById('chairNameInput');
            if(nameInput) {
                nameInput.disabled = !!resolved;
                if(nameInput.value !== (effName||'')) nameInput.value = effName || '';
            }
            const img = document.getElementById('chairPhotoImg');
            const ph  = document.getElementById('chairPhotoPh');
            const removeBtn = document.getElementById('chairPhotoRemoveBtn');
            if(img && ph) {
                if(effPhoto) { img.src = effPhoto; img.style.display = ''; ph.style.display = 'none'; }
                else { img.style.display = 'none'; ph.style.display = ''; }
            }
            if(removeBtn) removeBtn.style.display = (!resolved && collectiveChair.photo) ? '' : 'none';
            const photoInput = document.querySelector('#chairPhotoBox input[type=file]');
            if(photoInput) photoInput.disabled = !!resolved;
            const partySelect = document.getElementById('chairPartySelect');
            if(partySelect) { partySelect.innerHTML = partySelectOptionsHtml(effPartyId); partySelect.disabled = !!resolved; }
            const dot = document.getElementById('chairPartyDot');
            if(dot) dot.style.background = partyDotColor(effPartyId);
            const picker = document.getElementById('chairMemberPicker');
            if(picker) { picker.innerHTML = memberPickerOptionsHtml(); picker.value = ''; picker.style.display = resolved ? 'none' : ''; }
            const badge = document.getElementById('chairLinkedBadge');
            if(badge) badge.style.display = resolved ? 'flex' : 'none';
        }

        function updateChairField(key, val) {
            collectiveChair[key] = val;
            if(key === 'partyId') renderChairSection();
            renderCabinetDisplay();
        }

        function linkChairToMember(val) {
            const parsed = parseMemberPickerValue(val);
            if(!parsed) return;
            collectiveChair.linkedSeat = parsed;
            renderChairSection();
            renderCabinetDisplay();
        }

        function unlinkChair() {
            collectiveChair.linkedSeat = null;
            renderChairSection();
            renderCabinetDisplay();
        }

        function uploadChairPhoto(input) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => { collectiveChair.photo = e.target.result; renderChairSection(); renderCabinetDisplay(); };
            reader.readAsDataURL(file);
        }

        function removeChairPhoto() {
            collectiveChair.photo = '';
            renderChairSection();
            renderCabinetDisplay();
        }

        // ── 내각 > 총리 (president와 동일한 구조) ──────────────
        // 총리 선출 방식 — 총리직선제 체크박스가 켜져 있으면 'direct', 아니면 정부 형태에서 파생
        // (대통령제→임명제, 그 외(의원내각제/이원집정부제)→다수당 방식). 집단지도체제는 총리 자체가 없음.
        function pmSelectionMethod() {
            if(pmDirectElectionEnabled) return 'direct';
            return govType === 'presidential' ? 'appoint' : 'majority';
        }

        function setPmDirectElectionEnabled(checked) {
            pmDirectElectionEnabled = !!checked;
            renderPmSection();
            const toggleGroup = document.getElementById('elecKindToggleGroup');
            if(toggleGroup) toggleGroup.style.display = pmDirectElectionEnabled ? 'flex' : 'none';
            if(!pmDirectElectionEnabled && electionKind === 'pm') setElectionKind('member');
        }

        // 총리 값의 "자동 소스"를 우선순위대로 판정 — 의원 연결 > 다수당 자동 반영 > (그 외) 수동 입력
        function pmAutoSource() {
            if(pm.linkedSeat) {
                const r = resolveLinkedSeat(pm.linkedSeat);
                if(r) return { ...r, badgeText: '🔗 의원과 연결됨 — 이름·사진·당적 자동 반영' };
                pm.linkedSeat = null;
            }
            if(pmSelectionMethod() === 'majority' && !pmMajorityLocked) {
                const ch = presElectionChamberBasis;
                const seatKey = seatKeyFor(ch);
                const eligible = parties.filter(p => p[inKeyFor(ch)] && p.status !== 'banned' && p.ideologyId !== IND_IDEOLOGY_ID);
                if(eligible.length > 0) {
                    const top = eligible.reduce((a,b) => (b[seatKey]||0) > (a[seatKey]||0) ? b : a);
                    return { name: top.leaderName||'', photo: top.leaderPhoto||'', partyId: top.id, badgeText: `👑 다수당(${top.name}) 대표 자동 반영` };
                }
            }
            return null;
        }

        function renderPmSection() {
            updatePmRoleLabels();
            const resolved = pmAutoSource();
            const effName = resolved ? resolved.name : pm.name;
            const effPhoto = resolved ? resolved.photo : pm.photo;
            const effPartyId = resolved ? resolved.partyId : pm.partyId;

            const nameInput = document.getElementById('pmNameInput');
            if(nameInput) {
                nameInput.disabled = !!resolved;
                if(nameInput.value !== (effName||'')) nameInput.value = effName || '';
                nameInput.placeholder = (pmMajorityLocked && !effName) ? `${effRoleLabel('pm')} 이름 (공석)` : `${effRoleLabel('pm')} 이름`;
            }
            const img = document.getElementById('pmPhotoImg');
            const ph  = document.getElementById('pmPhotoPh');
            const removeBtn = document.getElementById('pmPhotoRemoveBtn');
            if(img && ph) {
                if(effPhoto) { img.src = effPhoto; img.style.display = ''; ph.style.display = 'none'; }
                else { img.style.display = 'none'; ph.style.display = ''; }
            }
            if(removeBtn) removeBtn.style.display = (!resolved && pm.photo) ? '' : 'none';
            const photoInput = document.querySelector('#pmPhotoBox input[type=file]');
            if(photoInput) photoInput.disabled = !!resolved;
            const partySelect = document.getElementById('pmPartySelect');
            if(partySelect) { partySelect.innerHTML = partySelectOptionsHtml(effPartyId); partySelect.disabled = !!resolved; }
            const dot = document.getElementById('pmPartyDot');
            if(dot) dot.style.background = partyDotColor(effPartyId);
            const picker = document.getElementById('pmMemberPicker');
            if(picker) { picker.innerHTML = memberPickerOptionsHtml(); picker.value = ''; picker.style.display = resolved ? 'none' : ''; }
            const badge = document.getElementById('pmLinkedBadge');
            if(badge) {
                badge.style.display = resolved ? 'flex' : 'none';
                if(resolved) document.getElementById('pmLinkedBadgeText').textContent = resolved.badgeText;
                const unlinkBtn = document.getElementById('pmUnlinkBtn');
                if(unlinkBtn) unlinkBtn.style.display = pm.linkedSeat ? '' : 'none';
            }

            // 총리직선제 체크박스 상태 동기화
            const cb = document.getElementById('pmDirectElectionCheckbox');
            if(cb) cb.checked = pmDirectElectionEnabled;

            const method = pmSelectionMethod();
            const hint = document.getElementById('pmSelectionMethodHint');
            if(hint) hint.textContent = method === 'appoint' ? `현재 선출 방식: ${effRoleLabel('president')} 임명제 — ${effRoleLabel('president')}이 후보를 지명하면 의회 심의를 거쳐 ${effRoleLabel('pm')}으로 확정됩니다`
                : method === 'majority' ? `현재 선출 방식: 다수당 방식 — 기준 원(${chamberDisplayName(presElectionChamberBasis)})의 다수당 대표가 자동으로 ${effRoleLabel('pm')}이 됩니다`
                : `현재 선출 방식: 총리직선제 — 선거 > 총선 탭에서 "총리 선거"로 개표하세요`;

            const nomineeSection = document.getElementById('pmNomineeSection');
            if(nomineeSection) nomineeSection.style.display = method === 'appoint' ? '' : 'none';
            if(method === 'appoint') renderPmNomineeSection();

            // 다수당 방식 전용 — 의석 변동만으로 총리가 바뀌지 않도록 고정/고정 해제 (의원 연결 중이면 이미 그 의원으로 고정된 것이므로 숨김)
            const majorityLockSection = document.getElementById('pmMajorityLockSection');
            if(majorityLockSection) {
                majorityLockSection.style.display = (method === 'majority' && !pm.linkedSeat) ? '' : 'none';
                const lockBtn = document.getElementById('pmMajorityLockBtn');
                const unlockBtn = document.getElementById('pmMajorityUnlockBtn');
                const lockedNote = document.getElementById('pmMajorityLockedNote');
                if(lockBtn) lockBtn.style.display = pmMajorityLocked ? 'none' : '';
                if(unlockBtn) unlockBtn.style.display = pmMajorityLocked ? '' : 'none';
                if(lockedNote) {
                    lockedNote.style.display = pmMajorityLocked ? '' : 'none';
                    lockedNote.textContent = pm.name
                        ? '🔒 총리가 고정되어 있습니다 — 다수당이 바뀌어도 총리는 유지되며, 내각 불신임이 가결되면 공석이 됩니다.'
                        : '🔒 내각 불신임으로 총리가 공석입니다 — 직접 지정하거나, 아래 "고정 해제"로 현재 다수당 대표를 새 총리로 반영하세요.';
                }
            }

            const noConfidenceSection = document.getElementById('noConfidenceSection');
            if(noConfidenceSection) {
                const canNoConfidence = govType === 'parliamentary' || govType === 'semi';
                noConfidenceSection.style.display = canNoConfidence ? '' : 'none';
                if(canNoConfidence) renderNoConfidenceSection();
            }
        }

        function updatePmField(key, val) {
            pm[key] = val;
            if(key === 'partyId') renderPmSection();
            renderCabinetDisplay();
        }

        // 다수당 방식 총리 고정 — 현재 자동 반영된(다수당 대표) 정보를 그대로 pm에 못박아, 이후 의석
        // 변동으로 다수당이 바뀌어도 총리가 따라 바뀌지 않게 함. 해제하면 다시 실시간 다수당 추적으로 복귀.
        function lockPmMajority() {
            const resolved = pmAutoSource();
            if(resolved) { pm.name = resolved.name; pm.photo = resolved.photo; pm.partyId = resolved.partyId; }
            pmMajorityLocked = true;
            renderPmSection();
            renderCabinetDisplay();
        }
        function unlockPmMajority() {
            pmMajorityLocked = false;
            renderPmSection();
            renderCabinetDisplay();
        }

        function linkPmToMember(val) {
            const parsed = parseMemberPickerValue(val);
            if(!parsed) return;
            pm.linkedSeat = parsed;
            renderPmSection();
            renderCabinetDisplay();
        }

        function unlinkPm() {
            pm.linkedSeat = null;
            renderPmSection();
            renderCabinetDisplay();
        }

        function uploadPmPhoto(input) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => { pm.photo = e.target.result; renderPmSection(); renderCabinetDisplay(); };
            reader.readAsDataURL(file);
        }

        function removePmPhoto() {
            pm.photo = '';
            renderPmSection();
            renderCabinetDisplay();
        }

        // ── 부총리 (cabinetMembers와 동일한 구조 — 여러 명 추가 가능, 기본 0명) ──────────────
        function renderDeputyPmsList() {
            const container = document.getElementById('deputyPmsList');
            if(!container) return;
            container.innerHTML = deputyPms.map(d => {
                if(d.linkedSeat && !resolveLinkedSeat(d.linkedSeat)) d.linkedSeat = null;
                const resolved = d.linkedSeat ? resolveLinkedSeat(d.linkedSeat) : null;
                const effName = resolved ? resolved.name : d.name;
                const effPhoto = resolved ? resolved.photo : d.photo;
                const effPartyId = resolved ? resolved.partyId : d.partyId;
                return `
                <div class="card-item drag-card-deputypm" data-dpm-id="${d.id}" style="border-left-color:#888;margin-bottom:8px;">
                    <div class="dyn-row" style="display:flex;gap:10px;align-items:stretch;">
                        <span class="drag-handle" style="align-self:center;">⋮⋮</span>
                        <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:52px;height:65px;flex-shrink:0;">
                            ${effPhoto?`<img src="${effPhoto}" alt="">`:'<div class="photo-ph">👤</div>'}
                            <input type="file" accept="image/*" ${resolved?'disabled':''} onchange="uploadDeputyPmPhoto(this,'${d.id}')">
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                            <input type="text" value="${effName||''}" placeholder="이름" ${resolved?'disabled':''}
                                style="background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.95rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateDeputyPm('${d.id}','name',this.value)">
                            <input type="text" value="${d.position||''}" placeholder="직책 (예: 경제 부총리, 비워두면 부총리1식으로 표시)"
                                style="background:#000;border:1px solid #2a2a2a;color:#aaa;font-family:inherit;font-size:0.85rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateDeputyPm('${d.id}','position',this.value)">
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:${partyDotColor(effPartyId)};"></span>
                                <select ${resolved?'disabled':''} onchange="updateDeputyPm('${d.id}','partyId',this.value?parseInt(this.value):null)"
                                    style="flex:1;min-width:0;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:4px;">
                                    ${partySelectOptionsHtml(effPartyId)}
                                </select>
                            </div>
                            ${resolved ? `
                            <div style="display:flex;align-items:center;gap:6px;color:#6cf;font-size:0.72rem;">
                                🔗 의원과 연결됨 — 이름·사진·당적 자동 반영
                                <button onclick="unlinkDeputyPm('${d.id}')" style="background:transparent;border:1px solid #333;color:#888;font-family:inherit;font-size:0.7rem;padding:2px 6px;cursor:pointer;">연결 해제</button>
                            </div>` : `
                            <select onchange="linkDeputyPmToSeat('${d.id}',this.value)"
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid #333;color:#888;font-family:inherit;font-size:0.75rem;padding:4px;">
                                ${memberPickerOptionsHtml()}
                            </select>`}
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                ${(!resolved && d.photo)?`<button onclick="removeDeputyPmPhoto('${d.id}')" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;">✕ 사진 제거</button>`:'<span></span>'}
                                <button onclick="removeDeputyPm('${d.id}')" style="background:transparent;border:1px solid #333;color:#a55;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;">삭제</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
            fitDynPhotos(container);
            container.querySelectorAll('.drag-card-deputypm').forEach(card => {
                startDeputyPmDragReorder(card.querySelector('.drag-handle'), 'deputyPmsList', '.drag-card-deputypm');
            });
        }

        // 부총리 순서 변경 — cabinetMembers의 드래그 재정렬과 동일한 방식
        function startDeputyPmDragReorder(handleEl, containerId, cardSelector) {
            if(!handleEl) return;
            handleEl.addEventListener('pointerdown', e => {
                e.preventDefault();
                const container = document.getElementById(containerId);
                if(!container) return;
                const card = handleEl.closest(cardSelector);
                if(!card) return;
                let idList = Array.from(container.querySelectorAll(cardSelector)).map(c => c.dataset.dpmId);
                let idx = idList.indexOf(card.dataset.dpmId);
                card.classList.add('drag-lifted');

                function applyOrder() {
                    deputyPms.sort((a,b) => idList.indexOf(a.id) - idList.indexOf(b.id));
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
                        renderDeputyPmsList();
                        renderCabinetDisplay();
                        requestAnimationFrame(() => {
                            const newCards = document.getElementById(containerId)?.querySelectorAll(cardSelector);
                            if(newCards && newCards[idx]) newCards[idx].classList.add('drag-lifted');
                        });
                    }
                }
                function onUp() {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => el.classList.remove('drag-lifted'));
                    applyOrder();
                    renderDeputyPmsList();
                    renderCabinetDisplay();
                }
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
            });
        }

        function addDeputyPm() {
            deputyPms.push({ id: 'dpm_'+Date.now()+'_'+Math.floor(Math.random()*1000), name: '', position: '', photo: '', partyId: null, linkedSeat: null });
            renderDeputyPmsList();
            renderCabinetDisplay();
        }

        function linkDeputyPmToSeat(id, val) {
            const parsed = parseMemberPickerValue(val);
            if(!parsed) return;
            const d = deputyPms.find(x => x.id === id);
            if(!d) return;
            d.linkedSeat = parsed;
            renderDeputyPmsList();
            renderCabinetDisplay();
        }

        function unlinkDeputyPm(id) {
            const d = deputyPms.find(x => x.id === id);
            if(!d) return;
            d.linkedSeat = null;
            renderDeputyPmsList();
            renderCabinetDisplay();
        }

        function removeDeputyPm(id) {
            deputyPms = deputyPms.filter(d => d.id !== id);
            renderDeputyPmsList();
            renderCabinetDisplay();
        }

        function updateDeputyPm(id, key, val) {
            const d = deputyPms.find(x => x.id === id);
            if(!d) return;
            d[key] = val;
            if(key === 'partyId') renderDeputyPmsList();
            renderCabinetDisplay();
        }

        function uploadDeputyPmPhoto(input, id) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const d = deputyPms.find(x => x.id === id);
                if(d) { d.photo = e.target.result; renderDeputyPmsList(); renderCabinetDisplay(); }
            };
            reader.readAsDataURL(file);
        }

        function removeDeputyPmPhoto(id) {
            const d = deputyPms.find(x => x.id === id);
            if(d) { d.photo = ''; renderDeputyPmsList(); renderCabinetDisplay(); }
        }

        // ── 대통령 임명제: 총리 후보 지명 → 의회 심의 상정 ──────────────
        function renderPmNomineeSection() {
            if(pmNomineeBillId) {
                const bill = bills.find(b => b.id === pmNomineeBillId);
                const hint = document.getElementById('pmNomineePendingHint');
                if(bill && getBillOverallStatus(bill) === 'pending') {
                    if(hint) { hint.style.display = ''; hint.textContent = `『${bill.title}』 국가 > 입법 탭에서 심의 중입니다`; }
                } else {
                    // 이미 처리(가결/부결)된 심의안이면 다음 지명을 받을 수 있도록 정리
                    pmNomineeBillId = null;
                    if(hint) hint.style.display = 'none';
                }
            } else {
                const hint = document.getElementById('pmNomineePendingHint');
                if(hint) hint.style.display = 'none';
            }

            if(pmNominee.linkedSeat && !resolveLinkedSeat(pmNominee.linkedSeat)) pmNominee.linkedSeat = null;
            const resolved = pmNominee.linkedSeat ? resolveLinkedSeat(pmNominee.linkedSeat) : null;
            const effName = resolved ? resolved.name : pmNominee.name;
            const effPhoto = resolved ? resolved.photo : pmNominee.photo;
            const effPartyId = resolved ? resolved.partyId : pmNominee.partyId;

            const nameInput = document.getElementById('pmNomineeNameInput');
            if(nameInput) {
                nameInput.disabled = !!resolved;
                if(nameInput.value !== (effName||'')) nameInput.value = effName || '';
            }
            const img = document.getElementById('pmNomineePhotoImg');
            const ph  = document.getElementById('pmNomineePhotoPh');
            if(img && ph) {
                if(effPhoto) { img.src = effPhoto; img.style.display = ''; ph.style.display = 'none'; }
                else { img.style.display = 'none'; ph.style.display = ''; }
            }
            const photoInput = document.querySelector('#pmNomineePhotoBox input[type=file]');
            if(photoInput) photoInput.disabled = !!resolved;
            const partySelect = document.getElementById('pmNomineePartySelect');
            if(partySelect) { partySelect.innerHTML = partySelectOptionsHtml(effPartyId); partySelect.disabled = !!resolved; }
            const dot = document.getElementById('pmNomineePartyDot');
            if(dot) dot.style.background = partyDotColor(effPartyId);
            const picker = document.getElementById('pmNomineeMemberPicker');
            if(picker) { picker.innerHTML = memberPickerOptionsHtml(); picker.value = ''; picker.style.display = resolved ? 'none' : ''; }
            const badge = document.getElementById('pmNomineeLinkedBadge');
            if(badge) badge.style.display = resolved ? 'flex' : 'none';
        }

        function updatePmNomineeField(key, val) { pmNominee[key] = val; if(key === 'partyId') renderPmNomineeSection(); }
        function linkPmNomineeToMember(val) {
            const parsed = parseMemberPickerValue(val);
            if(!parsed) return;
            pmNominee.linkedSeat = parsed;
            renderPmNomineeSection();
        }
        function unlinkPmNominee() { pmNominee.linkedSeat = null; renderPmNomineeSection(); }
        function uploadPmNomineePhoto(input) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => { pmNominee.photo = e.target.result; renderPmNomineeSection(); };
            reader.readAsDataURL(file);
        }
        function removePmNomineePhoto() { pmNominee.photo = ''; renderPmNomineeSection(); }

        function submitPmNominationBill() {
            const resolved = pmNominee.linkedSeat ? resolveLinkedSeat(pmNominee.linkedSeat) : null;
            const nomineeName = resolved ? resolved.name : pmNominee.name;
            if(!nomineeName) { showCustomAlert('먼저 총리 후보(이름 또는 의원 연결)를 지정하세요.'); return; }
            const bill = {
                id: 'b'+Date.now(), title: `${effRoleLabel('pm')} 임명동의안 (${nomineeName})`, content: '', threshold: 0.5, numer: null, denom: null, tags: ['임명동의안'],
                houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
                version: 1, parentBillId: null, isAmendment: false, voteHistory: [],
                isPmConfirmation: true, pmApplied: false,
                pmNomineeSnapshot: { name: nomineeName, photo: resolved ? resolved.photo : pmNominee.photo, partyId: resolved ? resolved.partyId : pmNominee.partyId },
            };
            bills.push(bill);
            pmNomineeBillId = bill.id;
            renderPmNomineeSection();
            renderBillList(); syncBillSelect();
            showCustomAlert(`${nomineeName}에 대한 ${effRoleLabel('pm')} 임명동의안이 국가 > 입법 탭에 상정되었습니다.`);
        }

        // 임명동의안이 가결되면 지명자를 실제 총리로 확정 반영
        function checkPmConfirmationBills() {
            bills.forEach(b => {
                if(!b.isPmConfirmation || b.pmApplied) return;
                if(getBillOverallStatus(b) !== 'passed') return;
                b.pmApplied = true;
                const snap = b.pmNomineeSnapshot || {};
                pm.linkedSeat = null;
                pm.name = snap.name || '';
                pm.photo = snap.photo || '';
                pm.partyId = snap.partyId ?? null;
                pmNominee = { name: '', photo: '', partyId: null, linkedSeat: null };
                if(pmNomineeBillId === b.id) pmNomineeBillId = null;
                renderPmSection();
                renderCabinetDisplay();
            });
        }

        // ── 내각 불신임 (의원내각제/이원집정부제 전용) ──────────────
        function submitNoConfidenceBill() {
            let successor = null;
            if(constructiveNoConfidence) {
                const name = (document.getElementById('ncSuccessorName')?.value || '').trim();
                const partyVal = document.getElementById('ncSuccessorParty')?.value || '';
                if(!name) { showCustomAlert('건설적 불신임제에서는 후임 총리를 함께 지명해야 합니다.\n후임 총리 이름을 입력하세요.'); return; }
                successor = { name, partyId: partyVal ? parseInt(partyVal) : null };
            }
            const pmLabel = effRoleLabel('pm');
            const bill = {
                id: 'b'+Date.now(),
                title: successor ? `건설적 불신임안 — 후임 ${pmLabel}: ${successor.name}` : `내각 불신임안`,
                content: successor ? `현 ${pmLabel}를 불신임하고 ${successor.name}${successor.partyId ? `(${parties.find(p => p.id === successor.partyId)?.name || ''})` : ''}을(를) 후임 ${pmLabel}로 선출한다.` : '',
                threshold: 0.5, numer: null, denom: null, tags: successor ? ['불신임안', '건설적불신임'] : ['불신임안'],
                houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
                version: 1, parentBillId: null, isAmendment: false, voteHistory: [],
                isNoConfidence: true, noConfidenceApplied: false,
                ...(successor ? { constructiveSuccessor: successor } : {}),
            };
            bills.push(bill);
            renderBillList(); syncBillSelect();
            if(successor) { const n = document.getElementById('ncSuccessorName'); if(n) n.value = ''; }
            showCustomAlert(successor
                ? `건설적 불신임안(후임 ${pmLabel}: ${successor.name})이 국가 > 입법 탭에 상정되었습니다.\n가결되면 ${successor.name}이(가) 곧바로 새 ${pmLabel}가 됩니다.`
                : `내각 불신임안이 국가 > 입법 탭에 상정되었습니다.`);
        }

        function setConstructiveNoConfidence(checked) {
            constructiveNoConfidence = !!checked;
            renderNoConfidenceSection();
        }

        // 불신임 영역: 건설적 불신임제 체크 상태에 따라 후임 총리 지명 칸과 안내 문구를 바꾼다
        function renderNoConfidenceSection() {
            const chk = document.getElementById('constructiveNoConfidenceCheckbox');
            if(chk) chk.checked = constructiveNoConfidence;
            const fields = document.getElementById('ncSuccessorFields');
            if(fields) fields.style.display = constructiveNoConfidence ? '' : 'none';
            const pmLabel = effRoleLabel('pm');
            const sel = document.getElementById('ncSuccessorParty');
            if(sel) {
                const prev = sel.value;
                const eligible = parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID && p.status !== 'dissolved' && p.status !== 'banned');
                sel.innerHTML = `<option value="">-- 후임 ${pmLabel} 소속 정당 --</option>` + eligible.map(p => `<option value="${p.id}">${escapeHtmlText(p.name)}</option>`).join('');
                if(eligible.some(p => String(p.id) === prev)) sel.value = prev;
            }
            const nameEl = document.getElementById('ncSuccessorName');
            if(nameEl) nameEl.placeholder = `후임 ${pmLabel} 이름`;
            const btnLabel = document.getElementById('noConfidenceBtnLabel');
            if(btnLabel) btnLabel.textContent = constructiveNoConfidence ? '건설적 불신임안' : '내각 불신임안';
            const note = document.getElementById('noConfidenceNote');
            if(note) note.textContent = constructiveNoConfidence
                ? `가결되면 지명한 후임이 곧바로 새 ${pmLabel}가 되고, 기존 내각(부${pmLabel}·국무위원)은 물러납니다 — 공석이 생기지 않습니다`
                : `가결되면 국가 > 입법 탭에서 확인할 수 있으며, 통과 시 현재 ${pmLabel}가 해임됩니다`;
        }

        // 후임 소속 정당을 고르면, 이름 칸이 비어 있을 때 그 정당 당수 이름을 채워 준다
        function onNcSuccessorPartyChange() {
            const sel = document.getElementById('ncSuccessorParty');
            const nameEl = document.getElementById('ncSuccessorName');
            if(!sel || !nameEl) return;
            const p = parties.find(x => String(x.id) === sel.value);
            if(p && p.leaderName && (!nameEl.value.trim() || nameEl.dataset.autofill === '1')) {
                nameEl.value = p.leaderName;
                nameEl.dataset.autofill = '1';
            }
        }

        // 내각 불신임안이 가결되면 총리·부총리·국무위원 전원의 재직자 정보를 초기화 —
        // 자리(직책/국무위원 슬롯) 자체는 남고, 의원 연결·이름·사진·당적만 비워짐
        function checkNoConfidenceBills() {
            bills.forEach(b => {
                if(!b.isNoConfidence || b.noConfidenceApplied) return;
                if(getBillOverallStatus(b) !== 'passed') return;
                b.noConfidenceApplied = true;
                // 건설적 불신임: 불신임과 동시에 지명된 후임이 새 총리가 된다 (공석 없음)
                const successor = b.constructiveSuccessor;
                pm = successor
                    ? { name: successor.name, photo: '', partyId: successor.partyId ?? null, linkedSeat: null }
                    : { name: '', photo: '', partyId: null, linkedSeat: null };
                // 불신임 가결 직후엔 공석으로 유지 — 다수당 대표가 곧바로 다시 총리가 되는 게 아니라,
                // "고정" 상태를 유지한 채 이름을 비워 공석으로 표시하고, 새 총리는 "고정 해제"로
                // 다수당 대표를 다시 반영하거나 직접 지정하는 등 명시적인 절차를 거치도록 함
                pmMajorityLocked = true;
                deputyPms.forEach(d => { d.name = ''; d.photo = ''; d.partyId = null; d.linkedSeat = null; });
                cabinetMembers.forEach(m => { m.name = ''; m.photo = ''; m.partyId = null; m.linkedSeat = null; });
                renderPmSection();
                renderDeputyPmsList();
                renderCabinetMembersList();
                renderCabinetDisplay();
                if(successor) showCustomAlert(`건설적 불신임안이 가결되어 ${successor.name}이(가) 새 ${effRoleLabel('pm')}가 되었습니다.\n기존 내각은 물러났으니 내각 > 내각에서 새 국무위원을 채워 주세요.`);
            });
        }

        // ── 내각 > 내각(국무위원) ──────────────
        function renderCabinetMembersList() {
            const container = document.getElementById('cabinetMembersList');
            if(!container) return;
            container.innerHTML = cabinetMembers.map(m => {
                if(m.linkedSeat && !resolveLinkedSeat(m.linkedSeat)) m.linkedSeat = null;
                const resolved = m.linkedSeat ? resolveLinkedSeat(m.linkedSeat) : null;
                const effName = resolved ? resolved.name : m.name;
                const effPhoto = resolved ? resolved.photo : m.photo;
                const effPartyId = resolved ? resolved.partyId : m.partyId;
                return `
                <div class="card-item drag-card-cabinetmember" data-cm-id="${m.id}" style="border-left-color:#888;margin-bottom:8px;">
                    <div class="dyn-row" style="display:flex;gap:10px;align-items:stretch;">
                        <span class="drag-handle" style="align-self:center;">⋮⋮</span>
                        <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:52px;height:65px;flex-shrink:0;">
                            ${effPhoto?`<img src="${effPhoto}" alt="">`:'<div class="photo-ph">👤</div>'}
                            <input type="file" accept="image/*" ${resolved?'disabled':''} onchange="uploadCabinetMemberPhoto(this,'${m.id}')">
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                            <input type="text" value="${effName||''}" placeholder="이름" ${resolved?'disabled':''}
                                style="background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.95rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateCabinetMember('${m.id}','name',this.value)">
                            <input type="text" value="${m.position||''}" placeholder="직책 (예: 외교부 장관)"
                                style="background:#000;border:1px solid #2a2a2a;color:#aaa;font-family:inherit;font-size:0.85rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateCabinetMember('${m.id}','position',this.value)">
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:${partyDotColor(effPartyId)};"></span>
                                <select ${resolved?'disabled':''} onchange="updateCabinetMember('${m.id}','partyId',this.value?parseInt(this.value):null)"
                                    style="flex:1;min-width:0;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:4px;">
                                    ${partySelectOptionsHtml(effPartyId)}
                                </select>
                            </div>
                            ${resolved ? `
                            <div style="display:flex;align-items:center;gap:6px;color:#6cf;font-size:0.72rem;">
                                🔗 의원과 연결됨 — 이름·사진·당적 자동 반영
                                <button onclick="unlinkCabinetMember('${m.id}')" style="background:transparent;border:1px solid #333;color:#888;font-family:inherit;font-size:0.7rem;padding:2px 6px;cursor:pointer;">연결 해제</button>
                            </div>` : `
                            <select onchange="linkCabinetMemberToSeat('${m.id}',this.value)"
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid #333;color:#888;font-family:inherit;font-size:0.75rem;padding:4px;">
                                ${memberPickerOptionsHtml()}
                            </select>`}
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                ${(!resolved && m.photo)?`<button onclick="removeCabinetMemberPhoto('${m.id}')" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;">✕ 사진 제거</button>`:'<span></span>'}
                                <button onclick="removeCabinetMember('${m.id}')" style="background:transparent;border:1px solid #333;color:#a55;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;">삭제</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
            fitDynPhotos(container);
            container.querySelectorAll('.drag-card-cabinetmember').forEach(card => {
                startCabinetMemberDragReorder(card.querySelector('.drag-handle'), 'cabinetMembersList', '.drag-card-cabinetmember');
            });
        }

        // 국무위원/장관 순서 변경 — 배열 순서 자체를 바꾼다 (독립 의원의 seatIndex 방식과 달리 별도 정렬 키가 필요 없음)
        function startCabinetMemberDragReorder(handleEl, containerId, cardSelector) {
            if(!handleEl) return;
            handleEl.addEventListener('pointerdown', e => {
                e.preventDefault();
                const container = document.getElementById(containerId);
                if(!container) return;
                const card = handleEl.closest(cardSelector);
                if(!card) return;
                let idList = Array.from(container.querySelectorAll(cardSelector)).map(c => c.dataset.cmId);
                let idx = idList.indexOf(card.dataset.cmId);
                card.classList.add('drag-lifted');

                function applyOrder() {
                    cabinetMembers.sort((a,b) => idList.indexOf(a.id) - idList.indexOf(b.id));
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
                        renderCabinetMembersList();
                        renderCabinetDisplay();
                        requestAnimationFrame(() => {
                            const newCards = document.getElementById(containerId)?.querySelectorAll(cardSelector);
                            if(newCards && newCards[idx]) newCards[idx].classList.add('drag-lifted');
                        });
                    }
                }
                function onUp() {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => el.classList.remove('drag-lifted'));
                    applyOrder();
                    renderCabinetMembersList();
                    renderCabinetDisplay();
                }
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
            });
        }

        function addCabinetMember() {
            cabinetMembers.push({ id: 'cm_'+Date.now()+'_'+Math.floor(Math.random()*1000), name: '', position: '', photo: '', partyId: null, linkedSeat: null });
            renderCabinetMembersList();
            renderCabinetDisplay();
        }

        function linkCabinetMemberToSeat(id, val) {
            const parsed = parseMemberPickerValue(val);
            if(!parsed) return;
            const m = cabinetMembers.find(x => x.id === id);
            if(!m) return;
            m.linkedSeat = parsed;
            renderCabinetMembersList();
            renderCabinetDisplay();
        }

        function unlinkCabinetMember(id) {
            const m = cabinetMembers.find(x => x.id === id);
            if(!m) return;
            m.linkedSeat = null;
            renderCabinetMembersList();
            renderCabinetDisplay();
        }

        function removeCabinetMember(id) {
            cabinetMembers = cabinetMembers.filter(m => m.id !== id);
            renderCabinetMembersList();
            renderCabinetDisplay();
        }

        function updateCabinetMember(id, key, val) {
            const m = cabinetMembers.find(x => x.id === id);
            if(!m) return;
            m[key] = val;
            if(key === 'partyId') renderCabinetMembersList();
            renderCabinetDisplay();
        }

        function uploadCabinetMemberPhoto(input, id) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const m = cabinetMembers.find(x => x.id === id);
                if(m) { m.photo = e.target.result; renderCabinetMembersList(); renderCabinetDisplay(); }
            };
            reader.readAsDataURL(file);
        }

        function removeCabinetMemberPhoto(id) {
            const m = cabinetMembers.find(x => x.id === id);
            if(m) { m.photo = ''; renderCabinetMembersList(); renderCabinetDisplay(); }
        }

        // ── 우측 디스플레이 패널의 "내각" 탭 (하원/상원/삼원처럼 항상 표시) — 대통령·총리·국무위원 읽기 전용 그리드 ──────────────
        // 내각 디스플레이(HTML)와 내보내기(canvas)가 공유하는 카드 데이터 목록
        // 행 단위로 묶어서 반환 — 집단지도체제가 아니면 1행 대통령 / 2행 총리·부총리 / 3행 장관(국무위원),
        // 집단지도체제면 1행 의장 / 2행 장관(국무위원)
        function getCabinetDisplayRows() {
            const rows = [];
            if(govType === 'collective') {
                const chairResolved = collectiveChair.linkedSeat ? resolveLinkedSeat(collectiveChair.linkedSeat) : null;
                rows.push([{ voteKey: 'chair', label: effRoleLabel('chair'), photo: chairResolved ? chairResolved.photo : collectiveChair.photo, name: chairResolved ? chairResolved.name : collectiveChair.name, partyId: chairResolved ? chairResolved.partyId : collectiveChair.partyId }]);
            } else {
                const presResolved = president.linkedSeat ? resolveLinkedSeat(president.linkedSeat) : null;
                rows.push([{ voteKey: 'president', label: effRoleLabel('president'), photo: presResolved ? presResolved.photo : president.photo, name: presResolved ? presResolved.name : president.name, partyId: presResolved ? presResolved.partyId : president.partyId }]);

                const pmResolved = pmAutoSource();
                rows.push([
                    { voteKey: 'pm', label: effRoleLabel('pm'), photo: pmResolved ? pmResolved.photo : pm.photo, name: pmResolved ? pmResolved.name : pm.name, partyId: pmResolved ? pmResolved.partyId : pm.partyId },
                    ...deputyPms.map((d, i) => {
                        const resolved = d.linkedSeat ? resolveLinkedSeat(d.linkedSeat) : null;
                        const numberedLabel = deputyPms.length > 1 ? `${effRoleLabel('deputyPm')}${i+1}` : effRoleLabel('deputyPm');
                        return { voteKey: 'deputyPm_'+d.id, label: d.position || numberedLabel, photo: resolved ? resolved.photo : d.photo, name: resolved ? resolved.name : d.name, partyId: resolved ? resolved.partyId : d.partyId };
                    }),
                ]);
            }
            rows.push(cabinetMembers.map((m, i) => {
                const resolved = m.linkedSeat ? resolveLinkedSeat(m.linkedSeat) : null;
                return { voteKey: 'cm_'+m.id, label: m.position || `${effRoleLabel('cabinetMember')}${i+1}`, photo: resolved ? resolved.photo : m.photo, name: resolved ? resolved.name : m.name, partyId: resolved ? resolved.partyId : m.partyId };
            }));
            // 이름이 없는 자리는 공석으로 취급 — 불신임 가결 등으로 재직자 정보가 비워진 경우 포함
            rows.forEach(row => row.forEach(c => { c.vacant = !c.name; }));
            return rows.filter(row => row.length > 0);
        }

        // 계엄령으로 의회가 정지되어, 내각 디스플레이에서 국무회의 표결(찬성/반대/기권)을 받을 수 있는 상태인지
        function isCouncilVotingMode() {
            return emergencyPowers.martialLaw.active && emergencyPowers.martialLaw.suspendParliament;
        }

        // 국무회의 표결 UI(전원찬성/전원반대/초기화, 인물별 찬성·반대·기권 버튼, "국무회의로 의결" 패널)는
        // 계엄령으로 의회가 정지된 것만으로는 부족하고, 실제로 아직 결론나지 않은 법안이 선택되어 있어야 표시됨 —
        // 그 법안이 가결/부결로 확정되거나 다른 법안으로 바뀌면 다시 사라짐
        function hasActivePendingCouncilBill() {
            if(!isCouncilVotingMode()) return false;
            if(!activeCouncilBillId) return false;
            const bill = bills.find(b => b.id === activeCouncilBillId);
            if(!bill) return false;
            return getBillOverallStatus(bill) === 'pending';
        }

        function setCabinetCouncilVote(voteKey, vote) {
            if(cabinetCouncilVote[voteKey] === vote) delete cabinetCouncilVote[voteKey]; // 같은 표를 다시 누르면 취소
            else cabinetCouncilVote[voteKey] = vote;
            renderCabinetDisplay();
        }
        function setAllCabinetCouncilVote(vote) {
            getCabinetDisplayRows().flat().forEach(c => { if(!c.vacant) cabinetCouncilVote[c.voteKey] = vote; });
            renderCabinetDisplay();
        }
        function clearCabinetCouncilVote() {
            cabinetCouncilVote = {};
            renderCabinetDisplay();
        }

        function renderCabinetDisplay() {
            const container = document.getElementById('cabinetDisplayGrid');
            if(!container) return;
            const councilMode = hasActivePendingCouncilBill();
            const controls = document.getElementById('cabinetCouncilControls');
            if(controls) controls.style.display = councilMode ? 'flex' : 'none';
            const councilPanel = document.getElementById('cabinetCouncilPanel');
            if(councilPanel) councilPanel.style.display = councilMode ? '' : 'none';
            const councilResult = document.getElementById('councilVoteResult');
            if(councilResult) councilResult.style.display = councilMode ? '' : 'none';
            if(councilMode) renderCouncilVoteResult();
            const cardHtml = ({ voteKey, label, photo, name, partyId, vacant }) => {
                const councilVacant = councilMode && vacant;
                const party = parties.find(p => p.id === partyId);
                const partyName = councilVacant ? '공석' : (party ? party.name : '무소속');
                const partyColor = councilVacant ? '#555' : (party ? party.color : '#666');
                const vote = councilVacant ? null : cabinetCouncilVote[voteKey];
                const voteColor = getVoteColor(vote);
                const photoBoxVoteStyle = voteColor ? `box-shadow:0 0 10px ${voteColor}, 0 0 18px ${voteColor};border:2px solid ${voteColor};` : (councilVacant ? 'opacity:0.4;' : '');
                const voteBtn = (v, txt, c) => `<button onclick="setCabinetCouncilVote('${voteKey}','${v}')" style="flex:1;background:${vote===v?c:'transparent'};color:${vote===v?'#000':c};border:1px solid ${c};font-size:0.65rem;padding:2px 0;cursor:pointer;font-family:inherit;">${txt}</button>`;
                const voteButtonsHtml = !councilMode ? '' : councilVacant
                    ? `<div style="margin-top:4px;color:#555;font-size:0.68rem;">공석 — 표결 제외</div>`
                    : `<div style="display:flex;gap:2px;margin-top:4px;justify-content:center;">
                        ${voteBtn('yea','찬성','#00ff88')}
                        ${voteBtn('nay','반대','#ff2244')}
                        ${voteBtn('abs','기권','#888888')}
                    </div>`;
                return `
                    <div style="text-align:center;width:130px;">
                        <div style="color:#e0e0e0;font-size:0.85rem;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${label}">${label}</div>
                        <div class="leader-photo-box" style="width:70px;height:88px;margin:0 auto;pointer-events:none;${photoBoxVoteStyle}">
                            ${photo ? `<img src="${photo}" alt="">` : '<div class="photo-ph">👤</div>'}
                        </div>
                        <div style="color:#ccc;font-size:0.82rem;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${name||''}">${councilVacant ? '공석' : (name || '이름 미지정')}</div>
                        <div style="display:inline-block;margin-top:4px;padding:1px 8px;border:1px solid ${partyColor};color:${partyColor};font-size:0.7rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box;${councilVacant?'':`box-shadow:0 0 6px ${partyColor};text-shadow:0 0 4px ${partyColor};`}">${partyName}</div>
                        ${voteButtonsHtml}
                    </div>
                `;
            };
            const rowHtml = row => `<div style="display:flex;flex-wrap:wrap;gap:22px;">${row.map(cardHtml).join('')}</div>`;
            container.innerHTML = getCabinetDisplayRows().map(rowHtml).join('<div style="height:20px;"></div>');
            // <svg>는 div처럼 내용에 맞춰 자동으로 높이가 늘어나지 않으므로, 우클릭 내보내기가
            // 실제 화면과 동일한 벡터를 담도록 렌더 후 실측한 높이를 svg에 직접 반영한다
            requestAnimationFrame(() => {
                const svg = document.getElementById('cabinetDisplaySvg');
                if(svg) svg.setAttribute('height', container.scrollHeight + 'px');
            });
        }

        // 내각 카드 그리드 PNG/JPG 내보내기 — 반원 내보내기와 달리 base canvas가 없으므로 처음부터 직접 그림
        async function renderCabinetExportCanvas() {
            await ensureExportFontsLoaded();
            const pal = exportPalette();
            const font = pal.font;
            const displayRows = getCabinetDisplayRows();
            const allCards = displayRows.flat();
            const photoMap = new Map();
            await Promise.all(allCards.map(async c => { if(c.photo) photoMap.set(c, await loadImageAsync(c.photo)); }));

            const scale = window.devicePixelRatio || 1;
            const pad = Math.round(16*scale), cardW = Math.round(130*scale), cardGap = Math.round(22*scale), rowGap = Math.round(20*scale);
            const photoW = Math.round(70*scale), photoH = Math.round(88*scale);
            const labelH = Math.round(20*scale), gapSm = Math.round(6*scale), nameH = Math.round(18*scale), badgeH = Math.round(18*scale);
            const cardH = labelH + gapSm + photoH + gapSm + nameH + gapSm + badgeH;

            const containerEl = document.getElementById('cabinetDisplayGrid');
            const maxRowLen = Math.max(1, ...displayRows.map(r => r.length));
            const containerWidth = (containerEl?.clientWidth || 0) * scale || (cardW + cardGap) * maxRowLen;
            const perRow = Math.max(1, Math.floor((containerWidth + cardGap) / (cardW + cardGap)));

            // 화면과 동일하게, 각 행(대통령/총리·부총리/장관)이 컨테이너 폭에 맞춰 줄바꿈되는 줄 수를 미리 계산
            const lineCounts = displayRows.map(row => Math.max(1, Math.ceil(row.length / perRow)));
            const totalLines = lineCounts.reduce((a,b) => a+b, 0);
            const totalW = perRow*cardW + (perRow-1)*cardGap;
            const totalH = totalLines*cardH + Math.max(0, totalLines-1)*cardGap + Math.max(0, displayRows.length-1)*rowGap;

            const cvs = document.createElement('canvas');
            cvs.width = totalW + pad*2;
            cvs.height = totalH + pad*2;
            const ctx = cvs.getContext('2d');
            ctx.fillStyle = tc('#000', '--m-surface');
            ctx.fillRect(0, 0, cvs.width, cvs.height);
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            let cursorY = pad;
            displayRows.forEach((row, rIdx) => {
                row.forEach((c, i) => {
                    const col = i % perRow, lineIdx = Math.floor(i / perRow);
                    const x = pad + col * (cardW + cardGap);
                    let cy = cursorY + lineIdx * (cardH + cardGap);
                    const cx = x + cardW/2;

                    ctx.font = `${Math.round(labelH*0.75)}px ${font}`;
                    ctx.fillStyle = pal.text;
                    ctx.fillText(c.label, cx, cy + labelH/2, cardW);
                    cy += labelH + gapSm;

                    const photoX = x + (cardW - photoW)/2;
                    ctx.fillStyle = tc('#000', '--m-surface-2');
                    ctx.fillRect(photoX, cy, photoW, photoH);
                    const img = photoMap.get(c);
                    if(img) drawImageCover(ctx, img, photoX, cy, photoW, photoH);
                    else {
                        ctx.fillStyle = tc('#2a3a3a', '--m-text-4');
                        ctx.font = `${Math.round(photoH*0.4)}px ${font}`;
                        ctx.fillText('👤', cx, cy + photoH/2, photoW);
                    }
                    ctx.strokeStyle = tc('#2a2a2a', '--m-border');
                    ctx.lineWidth = Math.max(1, Math.round(scale));
                    ctx.strokeRect(photoX + 0.5, cy + 0.5, photoW - 1, photoH - 1);
                    cy += photoH + gapSm;

                    ctx.font = `${Math.round(nameH*0.8)}px ${font}`;
                    ctx.fillStyle = pal.text2;
                    ctx.fillText(c.name || '이름 미지정', cx, cy + nameH/2, cardW);
                    cy += nameH + gapSm;

                    const party = parties.find(p => p.id === c.partyId);
                    const partyName = party ? party.name : '무소속';
                    const partyColor = party ? party.color : '#666';
                    ctx.font = `${Math.round(badgeH*0.6)}px ${font}`;
                    const textW = ctx.measureText(partyName).width;
                    const badgeW = Math.min(cardW, textW + Math.round(16*scale));
                    const badgeX = x + (cardW - badgeW)/2;
                    ctx.strokeStyle = partyColor;
                    ctx.lineWidth = Math.max(1, Math.round(scale));
                    ctx.strokeRect(badgeX + 0.5, cy + 0.5, badgeW - 1, badgeH - 1);
                    ctx.fillStyle = partyColor;
                    ctx.shadowColor = partyColor;
                    ctx.shadowBlur = isModernTheme() ? 0 : Math.round(8*scale);
                    ctx.fillText(partyName, cx, cy + badgeH/2, badgeW - Math.round(8*scale));
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                });
                cursorY += lineCounts[rIdx] * (cardH + cardGap) - cardGap + rowGap;
            });
            ctx.textAlign = 'left';
            return cvs;
        }

        // ── 법안 거부권(veto) 주체 설정 ──────────────
        function setVetoHolder(holder) {
            if(!['none','president','pm','cabinet'].includes(holder)) return;
            vetoHolder = holder;
            document.getElementById('vetoHolderNoneBtn')?.classList.toggle('active', holder==='none');
            document.getElementById('vetoHolderPresidentBtn')?.classList.toggle('active', holder==='president');
            document.getElementById('vetoHolderPmBtn')?.classList.toggle('active', holder==='pm');
            document.getElementById('vetoHolderCabinetBtn')?.classList.toggle('active', holder==='cabinet');
        }

        // ── 국가 비상사태 / 계엄령 / 의회 해산 — 권한 주체 + 선포 상태 ──────────────
        const EMERGENCY_POWERS = {
            stateOfEmergency: { label: '국가 비상사태', color: 'var(--tno-gold)' },
            dissolution:      { label: '의회 해산',     color: '#ff8800' },
            martialLaw:       { label: '계엄령',        color: 'var(--tno-alert)' },
            // splitDissolutionHolders가 켜졌을 때만 쓰이는 대체 권한 — 주체가 대통령/총리로 고정되어
            // 선택 버튼이 따로 없고, setSplitDissolutionHolders()가 holder를 직접 지정한다
            dissolutionSenate: { label: '상원 해산', color: '#ff8800' },
            dissolutionHouse:  { label: '하원 해산', color: '#ff8800' },
        };
        let emergencyPowers = {
            stateOfEmergency: { holder: 'none', active: false },
            dissolution:      { holder: 'none', active: false },
            martialLaw:       { holder: 'none', active: false, suspendParliament: false },
            dissolutionSenate: { holder: 'none', active: false },
            dissolutionHouse:  { holder: 'none', active: false },
        };

        // 상원/하원 분할 해산권은 원 이름이 설정에 따라 바뀌므로, EMERGENCY_POWERS의 고정 label 대신
        // 항상 현재 이름(chamberDisplayName)으로 다시 계산해서 반환한다
        function emergencyPowerLabel(key) {
            if(key === 'dissolution' && dissolutionScope() !== 'all') return `${chamberDisplayName(dissolutionScope())} 해산`;
            if(key === 'dissolutionSenate') return `${chamberDisplayName('senate')} 해산`;
            if(key === 'dissolutionHouse')  return `${chamberDisplayName('house')} 해산`;
            return EMERGENCY_POWERS[key]?.label || '';
        }

        // 계엄령으로 의회가 정지됐을 때, 국무회의(대통령/총리·국무총리/부총리/의장/장관·국무위원)가
        // 대신 표결하는 기능 — { voteKey: 'yea'|'nay'|'abs' }, voteKey는 getCabinetDisplayRows()의 voteKey와 대응
        let cabinetCouncilVote = {};
        // 국무회의 탭에서 심의 중인 법안 (표결 탭의 activeBillId와는 별개 — 국회/국무회의 각각 독립적으로 법안을 심의)
        let activeCouncilBillId = null;
        // 국무회의 의결 정족수 — 개별 법안의 가결 기준(threshold)과 별도로, 국무회의 표결 전체에 적용되는 전역 기준
        let councilVoteThreshold = 0.5, councilVoteNumer = null, councilVoteDenom = null;

        function setEmergencyHolder(key, holder) {
            if(!EMERGENCY_POWERS[key] || !['none','president','pm','cabinet'].includes(holder)) return;
            emergencyPowers[key].holder = holder;
            const suf = key.charAt(0).toUpperCase() + key.slice(1);
            document.getElementById('emergencyHolderNone'+suf)?.classList.toggle('active', holder==='none');
            document.getElementById('emergencyHolderPresident'+suf)?.classList.toggle('active', holder==='president');
            document.getElementById('emergencyHolderPm'+suf)?.classList.toggle('active', holder==='pm');
            document.getElementById('emergencyHolderCabinet'+suf)?.classList.toggle('active', holder==='cabinet');
            renderEmergencyPowers();
        }

        // ── 브라우저 기본 alert/confirm 대신 앱 자체 UI로 표시 (권한 선포 등 확인/안내용) ──────────────
        function showCustomAlert(message) {
            window.DnoUI ? DnoUI.alert(message) : alert(message);
        }
        function showCustomConfirm(message, onConfirm, onCancel) {
            if(!window.DnoUI) { if(confirm(message)) onConfirm(); else onCancel?.(); return; }
            DnoUI.confirm(message).then(ok => ok ? onConfirm() : onCancel?.());
        }

        // 지정된 한 원의 의석을 비운다 — 지역구는 궐석 처리(기록 보존), 비례 명단은 초기화, 정당별 의석 수는 0으로
        function clearChamberSeatsForDissolution(chamber) {
            const seatKey = seatKeyFor(chamber);
            Object.keys(districtMembers[chamber] || {}).forEach(key => {
                const m = districtMembers[chamber][key];
                if(m) m.vacant = true;
            });
            listMembers[chamber] = {};
            independents = independents.filter(x => !(x.chamber === chamber && !x.districtKey));
            parties.forEach(p => { p[seatKey] = 0; });
        }

        // 의회 해산 선포 시 현재 존재하는 모든 원(하원/상원/삼원)의 의석을 전부 비운다
        function clearAllSeatsForDissolution() {
            chamberList().forEach(clearChamberSeatsForDissolution);
            simulate();
            refreshUI();
        }

        const DISSOLUTION_KEYS = ['dissolution', 'dissolutionSenate', 'dissolutionHouse'];

        // 의회 해산 대상 — 'all'(의회 전체) 또는 한 원('house'/'senate'/'third')만. 원이 둘 이상일 때만 고를 수 있고,
        // 지금 없는 원을 가리키고 있으면(원 구성 변경 등) 의회 전체로 본다
        function dissolutionScope() {
            const sc = emergencyPowers.dissolution.scope;
            return (sc && sc !== 'all' && chamberList().length > 1 && chamberList().includes(sc)) ? sc : 'all';
        }
        function setDissolutionScope(scope) {
            if(emergencyPowers.dissolution.active) { showCustomAlert('이미 선포된 해산의 대상은 바꿀 수 없습니다.\n총선을 반영해 해제한 뒤 다시 고르세요.'); return; }
            emergencyPowers.dissolution.scope = scope;
            renderEmergencyPowers();
        }

        function toggleEmergencyActive(key) {
            if(!EMERGENCY_POWERS[key]) return;
            if(emergencyPowers[key].holder === 'none') { showCustomAlert('먼저 권한 주체를 지정하세요.'); return; }
            // 의회 해산(원별 분할 포함)은 한 번 선포되면 임의로 해제할 수 없고, 총선을 새로 반영해야만 풀린다
            if(DISSOLUTION_KEYS.includes(key) && emergencyPowers[key].active) {
                showCustomAlert(`${emergencyPowerLabel(key)}은 스스로 해제할 수 없습니다.\n선거 > 총선에서 새 선거를 반영해야 해제됩니다.`);
                return;
            }
            if(!emergencyPowers[key].active) {
                showCustomConfirm(`${emergencyPowerLabel(key)}을(를) 선포합니다. 계속하시겠습니까?`, () => {
                    emergencyPowers[key].active = true;
                    if(key === 'dissolution') {
                        const scope = dissolutionScope();
                        if(scope === 'all') clearAllSeatsForDissolution();
                        else { clearChamberSeatsForDissolution(scope); simulate(); refreshUI(); }
                    }
                    if(key === 'dissolutionSenate') { clearChamberSeatsForDissolution('senate'); simulate(); refreshUI(); }
                    if(key === 'dissolutionHouse') { clearChamberSeatsForDissolution('house'); simulate(); refreshUI(); }
                    if(key === 'martialLaw' && !emergencyPowers.martialLaw.suspendParliament) submitMartialLawLiftBill();
                    renderEmergencyPowers();
                    applyMartialLawEffects();
                });
                return;
            }
            emergencyPowers[key].active = false;
            renderEmergencyPowers();
            applyMartialLawEffects();
        }

        // 이원집정부제 + 양원제 전용: 의회 해산권을 상원(대통령)/하원(총리)으로 분할할지 여부
        function setSplitDissolutionHolders(checked) {
            splitDissolutionHolders = !!checked;
            if(splitDissolutionHolders) {
                if(emergencyPowers.dissolution.active) { showCustomAlert('의회 전체가 이미 해산된 상태에서는 해산권을 분할할 수 없습니다.\n총선을 반영해 해제한 뒤 다시 시도하세요.'); splitDissolutionHolders = false; updateSplitDissolutionUI(); return; }
                emergencyPowers.dissolution.holder = 'none';
                setEmergencyHolder('dissolutionSenate', 'president');
                setEmergencyHolder('dissolutionHouse', 'pm');
            } else {
                if(emergencyPowers.dissolutionSenate.active || emergencyPowers.dissolutionHouse.active) { showCustomAlert('상원 또는 하원이 이미 해산된 상태에서는 해산권 분할을 끌 수 없습니다.\n총선을 반영해 해제한 뒤 다시 시도하세요.'); splitDissolutionHolders = true; updateSplitDissolutionUI(); return; }
                setEmergencyHolder('dissolutionSenate', 'none');
                setEmergencyHolder('dissolutionHouse', 'none');
            }
            updateSplitDissolutionUI();
        }

        // 해산권 분할 체크박스는 이원집정부제 + 양원제일 때만 노출 — 조건이 깨지면(정부 형태/원 구성 변경) 자동으로 꺼짐
        function updateSplitDissolutionUI() {
            const eligible = govType === 'semi' && getSystemType() === 'bicameral';
            if(!eligible && splitDissolutionHolders) {
                emergencyPowers.dissolutionSenate.holder = 'none';
                emergencyPowers.dissolutionSenate.active = false;
                emergencyPowers.dissolutionHouse.holder = 'none';
                emergencyPowers.dissolutionHouse.active = false;
                splitDissolutionHolders = false;
            }
            const wrap = document.getElementById('splitDissolutionWrap');
            if(wrap) wrap.style.display = eligible ? '' : 'none';
            const checkbox = document.getElementById('splitDissolutionCheckbox');
            if(checkbox) checkbox.checked = splitDissolutionHolders;
            const singleGroup = document.getElementById('dissolutionHolderGroup');
            if(singleGroup) singleGroup.style.display = splitDissolutionHolders ? 'none' : '';
        }

        // 계엄령 선포 시 "의회 정지" 여부 — 체크 후 선포하면 의회가 shade 처리되고 표결이 정지되며,
        // 체크하지 않으면 의회는 정상 기능하되 계엄 해제 결의안이 자동으로 상정됨
        function setMartialLawSuspendParliament(checked) {
            emergencyPowers.martialLaw.suspendParliament = checked;
        }

        // 계엄령을 의회 정지 없이 선포했을 때 자동으로 상정되는 계엄 해제 결의안 — 가결되면 계엄령이 해제됨
        function submitMartialLawLiftBill() {
            const bill = {
                id: 'b'+Date.now(), title: '계엄 해제 결의안', content: '', threshold: 0.5, numer: null, denom: null, tags: ['계엄해제'],
                houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
                version: 1, parentBillId: null, isAmendment: false, voteHistory: [],
                isMartialLawLift: true, martialLawLiftApplied: false,
            };
            bills.push(bill);
            renderBillList(); syncBillSelect();
            showCustomAlert('계엄 해제 결의안이 국가 > 입법 탭에 자동으로 상정되었습니다.\n의회가 가결하면 계엄령이 해제됩니다.');
        }

        // 계엄 해제 결의안이 가결되면 계엄령을 자동으로 해제
        function checkMartialLawLiftBills() {
            bills.forEach(b => {
                if(!b.isMartialLawLift || b.martialLawLiftApplied) return;
                if(getBillOverallStatus(b) !== 'passed') return;
                b.martialLawLiftApplied = true;
                emergencyPowers.martialLaw.active = false;
                renderEmergencyPowers();
                applyMartialLawEffects();
            });
        }

        // 계엄령 선포 중에는 하원/상원/삼원 화면을 어둡게 가리고 "의회 활동 정지" 배너를 표시,
        // 표결(좌석 클릭/일괄 투표)도 막는다 — 해제되면 원상 복구
        function applyMartialLawEffects() {
            const suspended = emergencyPowers.martialLaw.active && emergencyPowers.martialLaw.suspendParliament;
            ['House','Senate','Third'].forEach(suf => {
                const panel = document.getElementById('dispPanel'+suf);
                if(!panel) return;
                let shade = panel.querySelector('.martial-law-shade');
                if(suspended) {
                    if(!shade) {
                        shade = document.createElement('div');
                        shade.className = 'martial-law-shade';
                        shade.style.cssText = 'position:absolute;inset:0;background:rgba(20,0,0,0.72);z-index:50;display:flex;align-items:center;justify-content:center;pointer-events:auto;';
                        shade.innerHTML = `<div style="color:var(--tno-alert);text-shadow:0 0 8px var(--tno-alert);font-size:1.1rem;letter-spacing:2px;border:1px solid var(--tno-alert);padding:10px 18px;background:rgba(0,0,0,0.6);">! 계엄령 선포 중 — 의회 활동 정지 !</div>`;
                        const box = panel.querySelector('.chamber-box');
                        if(box) { box.style.position = 'relative'; box.appendChild(shade); }
                    }
                } else if(shade) {
                    shade.remove();
                }
            });
            // 입법 > 표결 탭 전체도 하원/상원/삼원과 동일하게 shade — 계엄령 중에는 국무회의 탭을 이용해야 함
            const voteTab = document.getElementById('contentVote');
            if(voteTab) {
                let vShade = voteTab.querySelector('.martial-law-shade');
                if(suspended) {
                    if(!vShade) {
                        vShade = document.createElement('div');
                        vShade.className = 'martial-law-shade';
                        vShade.style.cssText = 'position:absolute;inset:0;background:rgba(20,0,0,0.72);z-index:50;display:flex;align-items:center;justify-content:center;pointer-events:auto;';
                        vShade.innerHTML = `<div style="color:var(--tno-alert);text-shadow:0 0 8px var(--tno-alert);font-size:1.1rem;letter-spacing:2px;border:1px solid var(--tno-alert);padding:10px 18px;background:rgba(0,0,0,0.6);text-align:center;">! 계엄령 선포 중 — 의회 표결 정지 !<br><span style="font-size:0.8rem;letter-spacing:0;">법안은 [국무회의] 탭에서 처리하세요.</span></div>`;
                        voteTab.style.position = 'relative';
                        voteTab.appendChild(vShade);
                    }
                } else if(vShade) {
                    vShade.remove();
                }
            }
            renderCabinetDisplay(); // cabinetCouncilPanel 표시 여부도 여기서 함께 갱신됨 (hasActivePendingCouncilBill 기준)
        }

        // 국무회의 의결 정족수 설정 UI (국무회의 탭) — 개별 법안의 가결 기준과 별개로, 국무회의 표결 전체에 적용
        function toggleCouncilCustomThreshold() {
            const sel = document.getElementById('councilThresholdSelect');
            const wrap = document.getElementById('councilCustomThresholdWrap');
            if(!sel || !wrap) return;
            const isCustom = sel.value === 'custom';
            wrap.style.display = isCustom ? 'flex' : 'none';
            if(isCustom) {
                const numer = document.getElementById('councilCustomNumer');
                const denom = document.getElementById('councilCustomDenom');
                const updatePreview = () => {
                    const n = parseInt(numer.value) || 0;
                    const d = parseInt(denom.value) || 1;
                    document.getElementById('councilCustomThresholdPreview').textContent =
                        n && d ? `= ${(n/d*100).toFixed(1)}%` : '';
                    setCouncilThreshold();
                };
                numer.oninput = updatePreview;
                denom.oninput = updatePreview;
            }
            setCouncilThreshold();
        }

        function setCouncilThreshold() {
            const sel = document.getElementById('councilThresholdSelect');
            if(!sel) return;
            if(sel.value !== 'custom') {
                councilVoteThreshold = parseFloat(sel.value) || 0.5;
                councilVoteNumer = null; councilVoteDenom = null;
            } else {
                const n = parseInt(document.getElementById('councilCustomNumer')?.value);
                const d = parseInt(document.getElementById('councilCustomDenom')?.value);
                if(n && d) { councilVoteThreshold = n/d; councilVoteNumer = n; councilVoteDenom = d; }
            }
            renderCouncilVoteResult();
        }

        // 국무회의 탭 UI를 저장된 상태(councilVoteThreshold 등)와 동기화
        function renderCouncilThresholdUI() {
            const sel = document.getElementById('councilThresholdSelect');
            if(!sel) return;
            sel.value = (councilVoteNumer && councilVoteDenom) ? 'custom' : String(councilVoteThreshold);
            toggleCouncilCustomThreshold();
            if(councilVoteNumer && councilVoteDenom) {
                document.getElementById('councilCustomNumer').value = councilVoteNumer;
                document.getElementById('councilCustomDenom').value = councilVoteDenom;
                const preview = document.getElementById('councilCustomThresholdPreview');
                if(preview) preview.textContent = `= ${(councilVoteNumer/councilVoteDenom*100).toFixed(1)}%`;
            }
        }

        // 국무회의 탭의 단원제 스타일 표결 결과 바 — 내각 디스플레이에서 매긴 찬성/반대/기권을 실시간 집계
        function renderCouncilVoteResult() {
            const wrap = document.getElementById('councilVoteResult');
            if(!wrap || wrap.style.display === 'none') return;
            const participants = getCabinetDisplayRows().flat().filter(c => !c.vacant);
            const total = participants.length || 1;
            let yea = 0, nay = 0, abs = 0;
            participants.forEach(({voteKey}) => {
                const v = cabinetCouncilVote[voteKey];
                if(v === 'yea') yea++; else if(v === 'nay') nay++; else if(v === 'abs') abs++;
            });
            const none = Math.max(0, total - yea - nay - abs);
            const required = councilVoteThreshold >= 1.0 ? total : Math.floor(total * councilVoteThreshold) + 1;
            const thLabel = getThresholdLabel(councilVoteThreshold, councilVoteNumer, councilVoteDenom);

            document.getElementById('counCntYea').textContent = yea;
            document.getElementById('counCntNay').textContent = nay;
            document.getElementById('counCntAbs').textContent = abs;
            document.getElementById('counCntNone').textContent = none;
            document.getElementById('counBarYea').style.width = (yea/total*100).toFixed(1)+'%';
            document.getElementById('counBarNay').style.width = (nay/total*100).toFixed(1)+'%';
            document.getElementById('counBarAbs').style.width = (abs/total*100).toFixed(1)+'%';
            document.getElementById('counBarNone').style.width = (none/total*100).toFixed(1)+'%';

            const barOuter = document.getElementById('counBarYea')?.parentElement;
            if(barOuter) {
                let marker = barOuter.querySelector('.threshold-marker');
                if(!marker) { marker = document.createElement('div'); marker.className = 'threshold-marker'; barOuter.appendChild(marker); }
                let labelEl = barOuter.querySelector('.threshold-label');
                if(!labelEl) { labelEl = document.createElement('div'); labelEl.className = 'threshold-label'; barOuter.appendChild(labelEl); }
                barOuter.style.position = 'relative';
                const pct = Math.min(councilVoteThreshold * 100, 100).toFixed(1);
                marker.style.cssText = `position:absolute; left:${pct}%; top:0; bottom:0; width:2px; background:var(--tno-gold); box-shadow:0 0 5px var(--tno-gold); z-index:2; pointer-events:none;`;
                labelEl.style.cssText = `position:absolute; left:${pct}%; top:-18px; transform:translateX(-50%); font-size:0.75rem; color:var(--tno-gold); white-space:nowrap; pointer-events:none; font-family:'NeoDunggeunmo','VT323',monospace;`;
                labelEl.textContent = `${thLabel} (${required}인)`;
            }

            const infoEl = document.getElementById('counVoteInfo');
            if(infoEl) {
                if(yea + nay + abs === 0) infoEl.textContent = `기준: ${thLabel}, ${required}인 필요`;
                else if(yea >= required) infoEl.textContent = `${yea} / ${required} (${thLabel})`;
                else infoEl.textContent = `${yea} / ${required} (${thLabel}, ${required - yea}인 부족)`;
            }
            const verdict = document.getElementById('counVerdict');
            if(verdict) {
                if(yea + nay + abs === 0) { verdict.className = 'vote-verdict verdict-pending'; verdict.textContent = '-- 표결 대기 중 --'; }
                else if(yea >= required) { verdict.className = 'vote-verdict verdict-pass'; verdict.textContent = '✔ 가결 예상'; }
                else { verdict.className = 'vote-verdict verdict-fail'; verdict.textContent = '✘ 부결 예상'; }
            }
        }

        // 계엄령 중 대체 입법 경로 — 내각 디스플레이(우측 "내각" 탭)에서 국무위원별로 매긴
        // 찬성/반대/기권 표를 집계해, 국무회의 의결 정족수 기준으로 통과 여부를 확정
        // (의회가 정지된 경우에만 필요 — 정지되지 않았다면 의회에서 정상적으로 표결하면 됨)
        function resolveCabinetCouncilVote() {
            if(!(emergencyPowers.martialLaw.active && emergencyPowers.martialLaw.suspendParliament)) { showCustomAlert('의회가 정지된 계엄령 상태에서만 사용할 수 있습니다.'); return; }
            if(!activeCouncilBillId) { showCustomAlert('심의할 법안을 먼저 선택하세요.'); return; }
            const bill = bills.find(b => b.id === activeCouncilBillId);
            if(!bill) return;
            // 공석(재직자 없음)인 자리는 표결 정족수에서 제외 — 의회 표결에서 궐석/활동금지 정당을 제외하는 것과 동일한 방식
            const participants = getCabinetDisplayRows().flat().filter(c => !c.vacant);
            const totalParticipants = participants.length;
            if(totalParticipants === 0) { showCustomAlert('국무회의에 참여할 인원이 없습니다 (모든 자리가 공석입니다).'); return; }
            let yea = 0, nay = 0, abs = 0;
            participants.forEach(({voteKey}) => {
                const v = cabinetCouncilVote[voteKey];
                if(v === 'yea') yea++; else if(v === 'nay') nay++; else if(v === 'abs') abs++;
            });
            if(yea + nay + abs === 0) { showCustomAlert('표결한 국무위원이 없습니다.\n내각 디스플레이에서 각 인물의 찬성·반대·기권을 먼저 표시하세요.'); return; }
            const threshold = councilVoteThreshold ?? 0.5;
            const required = threshold >= 1.0 ? totalParticipants : Math.floor(totalParticipants * threshold) + 1;
            const result = yea >= required ? 'pass' : 'fail';
            showCustomConfirm(`국무회의 표결 결과 — 찬성 ${yea} · 반대 ${nay} · 기권 ${abs} (총 ${totalParticipants}인)\n\n『${bill.title}』이(가) ${result==='pass'?'가결':'부결'}됩니다. 확정하시겠습니까?`, () => {
                bill.houseStatus = result;
                if(hasSenateChamber()) bill.senateStatus = result;
                if(hasThirdChamber()) bill.thirdStatus = result;
                if(!bill.voteHistory) bill.voteHistory = [];
                bill.voteHistory.push({ chamber: 'cabinetCouncil', result, yea, nay, abs, total: totalParticipants, required, threshold, numer: councilVoteNumer, denom: councilVoteDenom, date: bill.voteDate || '', at: new Date().toISOString() });
                cabinetCouncilVote = {};
                renderBillList(); renderArchiveList(); syncBillSelect(); syncCouncilBillSelect(); renderCabinetDisplay();
                showCustomAlert(`『${bill.title}』이(가) 국무회의 의결로 ${result==='pass'?'가결':'부결'}되었습니다.`);
            });
        }

        function isParliamentSuspended() {
            if(emergencyPowers.martialLaw.active && emergencyPowers.martialLaw.suspendParliament) { showCustomAlert('계엄령으로 의회가 정지된 상태에서는 표결을 진행할 수 없습니다.\n법안은 국무회의를 통해 통과시킬 수 있습니다.'); return true; }
            return false;
        }

        // 각 비상 권한의 선포/해제 버튼은 설정에서 지정한 권한 주체(대통령/총리)의 탭에 표시된다 —
        // 대통령에게 준 권한은 대통령 탭에, 총리에게 준 권한은 총리 탭에 나타나며, 주체가 없으면 어디에도 표시되지 않는다.
        function renderEmergencyPowers() {
            const containerIdFor = { president: 'presidentEmergencyPowers', pm: 'pmEmergencyPowers', cabinet: 'cabinetEmergencyPowers' };
            ['president', 'pm', 'cabinet'].forEach(office => {
                const container = document.getElementById(containerIdFor[office]);
                if(!container) return;
                const keys = Object.keys(EMERGENCY_POWERS).filter(k => emergencyPowers[k].holder === office);
                if(keys.length === 0) { container.innerHTML = ''; return; }
                container.innerHTML = `<div style="color:#666;font-size:0.8rem;margin:16px 0 8px;letter-spacing:1px;border-top:1px solid #222;padding-top:10px;">▌ 비상 권한</div>` +
                    keys.map(key => {
                        const cfg = EMERGENCY_POWERS[key];
                        const st = emergencyPowers[key];
                        const bg = st.active ? `color-mix(in srgb, ${cfg.color} 15%, transparent)` : 'transparent';
                        const shadow = st.active ? `0 0 10px ${cfg.color}` : 'none';
                        const locked = DISSOLUTION_KEYS.includes(key) && st.active;
                        const lbl = emergencyPowerLabel(key);
                        const label = locked ? `! ${lbl} 선포됨 (총선으로만 해제) !` : `! ${lbl} ${st.active ? '해제' : '선포'} !`;
                        const btn = `<button class="add-btn" style="margin-top:8px;border-style:solid;border-color:${cfg.color};color:${cfg.color};text-shadow:0 0 4px ${cfg.color};background:${bg};box-shadow:${shadow};${locked?'cursor:default;opacity:0.85;':''}" onclick="toggleEmergencyActive('${key}')">${label}</button>`;
                        if(key === 'dissolution' && chamberList().length > 1) {
                            const scope = dissolutionScope();
                            const opts = [['all', '의회 전체'], ...chamberList().map(ch => [ch, `${chamberDisplayName(ch)}만`])];
                            return btn + `
                            <div style="color:#888;font-size:0.76rem;margin:8px 0 4px;">해산 대상</div>
                            <div class="system-radio-group">${opts.map(([v, t]) =>
                                `<button type="button" class="system-radio-btn${scope === v ? ' active' : ''}" ${st.active ? 'disabled' : ''} onclick="setDissolutionScope('${v}')">${escapeHtmlText(t)}</button>`).join('')}</div>
                            <div style="color:#555;font-size:0.72rem;margin-top:4px;">한 원만 해산하면 그 원의 의석만 비워지고, 그 원의 총선을 반영하면 해제됩니다.</div>`;
                        }
                        if(key === 'martialLaw') {
                            return btn + `
                            <label style="display:flex;align-items:flex-start;gap:6px;margin-top:6px;cursor:${st.active?'default':'pointer'};color:#888;font-size:0.76rem;line-height:1.4;">
                                <input type="checkbox" class="chk-alert" ${st.suspendParliament?'checked':''} ${st.active?'disabled':''} onchange="setMartialLawSuspendParliament(this.checked)" style="margin-top:2px;flex-shrink:0;">
                                <span>의회 정지 — 체크 후 선포하면 의회가 정지(화면 어둡게, 표결 불가)됩니다. 체크하지 않으면 의회는 정상 작동하고, 계엄 해제 결의안이 자동으로 상정됩니다.</span>
                            </label>`;
                        }
                        return btn;
                    }).join('');
            });
        }

        function setNationSessionType(type) {
            nationSessionType = type;
            document.getElementById('nationSessionTypeRegularBtn')?.classList.toggle('active', type==='regular');
            document.getElementById('nationSessionTypeExtraBtn')?.classList.toggle('active', type==='extraordinary');
            updateDispInfoBar();
        }

        function setNationDateMode(mode) {
            nationDateMode = mode;
            document.getElementById('nationDateModeSimpleBtn')?.classList.toggle('active', mode==='simple');
            document.getElementById('nationDateModeProgBtn')?.classList.toggle('active', mode==='progressive');
            const simpleWrap = document.getElementById('nationDateSimpleWrap');
            const progWrap   = document.getElementById('nationDateProgWrap');
            if(simpleWrap) simpleWrap.style.display = mode==='simple' ? '' : 'none';
            if(progWrap)   progWrap.style.display   = mode==='progressive' ? '' : 'none';
            updateDispInfoBar();
        }

        function setNationSessionMode(mode) {
            nationSessionMode = mode;
            document.getElementById('nationSessionModeSimpleBtn')?.classList.toggle('active', mode==='simple');
            document.getElementById('nationSessionModeIndivBtn')?.classList.toggle('active', mode==='individual');
            const simpleWrap = document.getElementById('nationSessionSimpleWrap');
            const indivWrap  = document.getElementById('nationSessionIndivWrap');
            if(simpleWrap) simpleWrap.style.display = mode==='simple' ? '' : 'none';
            if(indivWrap)  indivWrap.style.display  = mode==='individual' ? '' : 'none';
            updateDispInfoBar();
        }

        // 수동 진행형 날짜: +1일/+7일/+1개월 진행 (달력 계산은 실제 Date 객체로 처리해 월말/윤년 등을 정확히 넘김)
        function advanceNationDate(amount, unit) {
            const yEl = document.getElementById('nationDateYear');
            const mEl = document.getElementById('nationDateMonth');
            const dEl = document.getElementById('nationDateDay');
            // 아직 날짜를 안 정했으면 넘길 기준이 없으므로 설정(국가 › 날짜)을 열어 연도 칸으로
            if(!yEl.value && !mEl.value && !dEl.value) { openDatePanel(); setTimeout(() => yEl.focus(), 50); return; }
            const y = parseInt(yEl.value) || 1;
            const m = parseInt(mEl.value) || 1;
            const d = parseInt(dEl.value) || 1;
            const dt = new Date(y, m-1, d);
            const before = new Date(dt);
            if(unit === 'month') dt.setMonth(dt.getMonth() + amount);
            else dt.setDate(dt.getDate() + amount);
            yEl.value = dt.getFullYear();
            mEl.value = dt.getMonth() + 1;
            dEl.value = dt.getDate();
            updateDispInfoBar();
            autoStartRegularSessions(before, dt);
        }

        // ===== 자동 진행 (국가 › 날짜 › 자동 진행) =====
        // 날짜를 넘기다 정기회 시작일(기본 9월 1일)을 지나면, 지난 횟수만큼 다음 회기를 정기회로 시작 (회기 개별형일 때)
        function autoStartRegularSessions(from, to) {
            if(!document.getElementById('nationAutoRegularSession')?.checked || nationSessionMode !== 'individual' || !(to > from)) return;
            const m = Math.min(12, Math.max(1, parseInt(document.getElementById('nationRegularSessionMonth')?.value) || 9));
            const d = Math.min(31, Math.max(1, parseInt(document.getElementById('nationRegularSessionDay')?.value) || 1));
            let count = 0;
            for(let y = from.getFullYear(); y <= to.getFullYear(); y++) {
                const start = new Date(y, m - 1, d);
                if(start > from && start <= to) count++;
            }
            if(!count) return;
            const keepNext = nationNextSessionType;
            for(let i = 0; i < count; i++) { nationNextSessionType = 'regular'; advanceNationSession(); }
            setNationNextSessionType(keepNext); // 날짜 줄에서 골라 둔 "다음:" 선택은 그대로 둔다
            if(typeof showKbdToast === 'function') showKbdToast(`정기회 시작 — ${formatNationSession()}`);
        }
        // 하원 총선 결과가 확정되면 대수 +1 (회기 개별형일 때 · 보궐선거와 재개표는 제외 — elecRun에서 호출)
        function autoAdvanceTermOnElection() {
            if(!document.getElementById('nationAutoTermOnElection')?.checked || nationSessionMode !== 'individual') return;
            const termEl = document.getElementById('nationSessionTerm');
            if(!termEl) return;
            termEl.value = (parseInt(termEl.value) || 0) + 1;
            updateDispInfoBar();
            const orgName = document.getElementById('nationSessionOrgName')?.value?.trim() || '국회';
            if(typeof showKbdToast === 'function') showKbdToast(`제${termEl.value}대 ${orgName} 시작`);
        }

        // 개별형 회기: 다음 회기 (회기 번호만 +1, 대수는 총선 등 큰 이벤트 때 수동으로 바꾸는 값이라 유지)
        function advanceNationSession() {
            const numEl = document.getElementById('nationSessionNumber');
            const num = parseInt(numEl.value) || 0;
            numEl.value = num + 1;
            setNationSessionType(nationNextSessionType); // 골라 둔 다음 회기 종류가 이제 지금 회기 종류가 됨
        }
        // 날짜 줄의 정기회/임시회 토글 — 지금 회기는 그대로, 다음 회기부터 적용
        function setNationNextSessionType(type) {
            nationNextSessionType = type === 'extraordinary' ? 'extraordinary' : 'regular';
            updateDispInfoBar();
        }
        function toggleNationNextSessionType() {
            setNationNextSessionType(nationNextSessionType === 'regular' ? 'extraordinary' : 'regular');
        }

        function formatNationDate() {
            if(nationDateMode === 'progressive') {
                const y = document.getElementById('nationDateYear')?.value;
                const m = document.getElementById('nationDateMonth')?.value;
                const d = document.getElementById('nationDateDay')?.value;
                if(!y && !m && !d) return '';
                return `${y||'?'}년 ${m||'?'}월 ${d||'?'}일`;
            }
            return document.getElementById('nationDateInput')?.value?.trim() || '';
        }

        function formatNationSession() {
            if(nationSessionMode === 'individual') {
                const term = document.getElementById('nationSessionTerm')?.value;
                const orgName = document.getElementById('nationSessionOrgName')?.value?.trim() || '국회';
                const num  = document.getElementById('nationSessionNumber')?.value;
                if(!term && !num) return '';
                const typeLabel = nationSessionType === 'extraordinary' ? '임시회' : '정기회';
                return `제${term||'?'}대 ${orgName} 제${num||'?'}회 ${typeLabel}`;
            }
            return document.getElementById('nationSessionInput')?.value?.trim() || '';
        }

        function updateDispInfoBar() {
            const dateEl = document.getElementById('dispInfoDate');
            const sessEl = document.getElementById('dispInfoSession');
            if(dateEl) dateEl.textContent = formatNationDate() || '날짜 미설정';
            if(sessEl) sessEl.textContent = formatNationSession() || '회기 미설정';
            // 진행 버튼은 수동 진행형 날짜, 다음 회기 · … 는 개별형 회기일 때만 (단순형은 글자를 직접 쓰는 방식이라 진행할 값이 없음)
            const dateCtl = document.getElementById('dispDateControls');
            const sessCtl = document.getElementById('dispSessionControls');
            if(dateCtl) dateCtl.style.visibility = nationDateMode === 'progressive' ? '' : 'hidden';
            if(sessCtl) sessCtl.style.visibility = nationSessionMode === 'individual' ? '' : 'hidden';
            const nextBtn = document.getElementById('dispNextSessionTypeBtn');
            if(nextBtn) {
                const extra = nationNextSessionType === 'extraordinary';
                nextBtn.textContent = extra ? '다음: 임시회' : '다음: 정기회';
                nextBtn.classList.toggle('is-extra', extra);
            }
        }
        // 날짜 줄의 설정 버튼 — 국가 › 날짜 탭을 연다 (모바일은 조작 화면으로 넘어감)
        // 날짜 줄의 ⚙ — 날짜 · 회기 설정 창(구 국가 › 날짜)을 ⚙ 바로 아래에 띄운다 (다시 누르면 닫힘)
        function openNationDateSettings() { isDatePanelOpen() ? closeDatePanel() : openDatePanel(); }
        function openDatePanel() {
            const ov = document.getElementById('datePanelLayer');
            const panel = document.getElementById('datePanel');
            if(!ov || !panel) return;
            if(typeof closeSavePanel === 'function') closeSavePanel();
            ov.style.display = '';
            const btn = document.getElementById('dispDateSettingsBtn');
            const r = btn && btn.offsetParent !== null ? btn.getBoundingClientRect() : null;
            if(r && r.width) {
                panel.style.top = Math.round(r.bottom + 6) + 'px';
                panel.style.right = Math.max(12, Math.round(window.innerWidth - r.right)) + 'px';
            } else { panel.style.top = ''; panel.style.right = ''; }
            btn?.classList.add('active');
            panel.querySelector('.save-panel-close')?.focus({ preventScroll: true });
        }
        function closeDatePanel() {
            const ov = document.getElementById('datePanelLayer');
            if(ov) ov.style.display = 'none';
            document.getElementById('dispDateSettingsBtn')?.classList.remove('active');
        }
        function isDatePanelOpen() {
            const ov = document.getElementById('datePanelLayer');
            return !!ov && ov.style.display !== 'none';
        }

        // ── 무소속 개별 의원 데이터 ──────────────
        // districtKey가 있으면 지역구 당선(의원 탭에 표시), 없으면 비례 당선(비례 탭에 표시)
        let independents = []; // { id, chamber, seatIndex, name, photo, ideologyId, districtKey }

        function getIndependentParty() {
            let p = parties.find(p => p.ideologyId === IND_IDEOLOGY_ID);
            if(!p) {
                // 무소속 이념 슬롯이 없으면 자동 생성 (구버전 파일 등 예외 대비)
                if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) {
                    ideologies.push({ id: IND_IDEOLOGY_ID, name: "무소속" });
                }
                p = { id: 'ind_auto_'+Date.now(), name: "무소속", color: "#999999",
                    seatsHouse: 10, seatsSenate: 5, seatsThird: 0, ideologyId: IND_IDEOLOGY_ID,
                    isRuling: false, inHouse: true, inSenate: true, inThird: true,
                    leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, hideStatsPhoto: false,
                    description: "", factions: [], abbr: "" };
                parties.push(p);
            }
            return p;
        }

        // 무소속 정당의 의석 수 변화에 맞춰 independents 배열 자동 동기화
        // (지역구로 당선된 무소속은 districtKey로 연결되어 있으며, 총 의석 감소로 정리할 때 비례(미연결) 인원부터 제거)
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
                        independents.push({ id:'ind_'+ch+'_'+Date.now()+'_'+i, chamber:ch, seatIndex:i, name:'', photo:'', ideologyId:null, districtKey:null });
                    }
                } else if(list.length > total) {
                    const excess = list.length - total;
                    const unlinkedFirst = [...list].sort((a,b) => (a.districtKey?1:0) - (b.districtKey?1:0));
                    const removeIds = unlinkedFirst.slice(0, excess).map(x=>x.id);
                    independents = independents.filter(x=>!removeIds.includes(x.id));
                }
                // 의석 번호 재정렬
                independents.filter(x=>x.chamber===ch).sort((a,b)=>a.seatIndex-b.seatIndex).forEach((x,i)=>{ x.seatIndex = i+1; });
            });
            // 현재 존재하지 않는 의원실(단원제 전환 등)의 잔여 데이터 제거
            independents = independents.filter(x => valid.includes(x.chamber));
        }

        // 특정 의원실에서 특정 정당(비무소속)의 지역구 당선 인원 수
        function districtCountForParty(ch, partyId) {
            const dm = districtMembers[ch] || {};
            return Object.values(dm).filter(m => String(m.partyId) === String(partyId)).length;
        }

        // 의원실 지역구 지도에서 특정 칸(key)에 연결된 무소속 개별 정보를 찾거나 새로 만들어 연결
        function ensureDistrictIndependent(ch, key) {
            let ind = independents.find(x => x.chamber===ch && x.districtKey===key);
            if(ind) return ind;
            // 아직 연결되지 않은(비례) 무소속 인원이 있으면 그 인원을 이 지역구에 연결
            ind = independents.find(x => x.chamber===ch && !x.districtKey);
            if(ind) { ind.districtKey = key; return ind; }
            // 여분이 없으면 새로 생성 (다음 syncIndependents 때 총원과 맞춰짐)
            const maxIdx = independents.filter(x=>x.chamber===ch).reduce((m,x)=>Math.max(m,x.seatIndex||0), 0);
            ind = { id:'ind_'+ch+'_'+Date.now()+'_'+(maxIdx+1), chamber:ch, seatIndex:maxIdx+1, name:'', photo:'', ideologyId:null, districtKey:key };
            independents.push(ind);
            return ind;
        }

        // 지역구 key에 연결된 무소속 개별 정보의 연결을 해제 (당적이 무소속이 아니게 될 때)
        function unlinkDistrictIndependent(ch, key) {
            const ind = independents.find(x => x.chamber===ch && x.districtKey===key);
            if(ind) ind.districtKey = null;
        }

        // districtMembers의 무소속 당선자와 independents[] 개별 정보 간 연결을 항상 최신 상태로 맞춤
        // (당적 변경/선거 반영/보궐선거 등 지역구 데이터가 바뀌는 모든 경로 이후 refreshUI에서 공통 호출)
        function syncDistrictIndependentLinks() {
            const indParty = getIndependentParty();
            if(!indParty) return;
            chamberList().forEach(ch => {
                const dm = districtMembers[ch] || {};
                const districtIndKeys = new Set(
                    Object.entries(dm).filter(([,m]) => String(m.partyId) === String(indParty.id)).map(([key]) => key)
                );
                // 더 이상 무소속이 아니게 된 지역구는 연결 해제 (이름은 개별 정보 쪽에 보존되어 있으므로 지역구 카드용으로 되돌려줌)
                independents.filter(x => x.chamber===ch && x.districtKey && !districtIndKeys.has(x.districtKey))
                    .forEach(x => {
                        const m = dm[x.districtKey];
                        if(m && !m.name && x.name) m.name = x.name;
                        x.districtKey = null;
                    });
                // 무소속으로 지정된 지역구 중 아직 연결 안 된 것은 개별 정보를 연결/생성 (이름은 지역구 쪽 값을 이어받음)
                // seatIndex는 지역구 표시 순서를 반영하는 큰 오프셋으로 맞춰, 비례(미연결) 무소속과 정렬 공간이 겹치지 않게 함
                const order = districtOrder[ch] || [];
                districtIndKeys.forEach(key => {
                    let ind = independents.find(x=>x.chamber===ch && x.districtKey===key);
                    if(!ind) {
                        ind = ensureDistrictIndependent(ch, key);
                        const m = dm[key];
                        if(m && m.name && !ind.name) ind.name = m.name;
                    }
                    const orderIdx = order.indexOf(key);
                    ind.seatIndex = 100000 + (orderIdx===-1 ? 0 : orderIdx);
                });
            });
        }

        // 비무소속 정당의 비례(지역구 외) 의석 개별 명단 자동 동기화
        let listMembers = { house: {}, senate: {}, third: {} }; // listMembers[ch][partyId] = [{id,name,factionId,vacant}]
        function syncListMembers() {
            const valid = chamberList();
            valid.forEach(ch => {
                if(!listMembers[ch]) listMembers[ch] = {};
                const seatKey = seatKeyFor(ch);
                parties.forEach(p => {
                    if(p.ideologyId === IND_IDEOLOGY_ID) return; // 무소속은 independents[]로 관리
                    const total = p[seatKey] || 0;
                    const distCount = districtCountForParty(ch, p.id);
                    const listCount = Math.max(0, total - distCount);
                    let arr = listMembers[ch][p.id] || [];
                    if(arr.length < listCount) {
                        arr = [...arr];
                        for(let i=arr.length; i<listCount; i++) {
                            arr.push({ id:'lm_'+ch+'_'+p.id+'_'+Date.now()+'_'+i, name:'', factionId:null, vacant:false, photo:'' });
                        }
                    } else if(arr.length > listCount) {
                        arr = arr.slice(0, listCount);
                    }
                    listMembers[ch][p.id] = arr;
                });
                // 삭제된 정당의 잔여 데이터 제거
                Object.keys(listMembers[ch]).forEach(pid => {
                    if(!parties.find(p=>String(p.id)===String(pid))) delete listMembers[ch][pid];
                });
            });
            Object.keys(listMembers).forEach(ch => { if(!valid.includes(ch)) listMembers[ch] = {}; });
        }

        // ── 의회 구성 헬퍼 (단원제/양원제/삼원제) ──────────
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
            { id: 101, name: "혁명적 사회주의" },
            { id: 102, name: "사회주의" },
            { id: 103, name: "진보주의" },
            { id: 104, name: "자유주의" },
            { id: 105, name: "보수주의" },
            { id: 106, name: "권위주의" },
            { id: 107, name: "국가사회주의" }
        ];

        // ── 서브 이념 ── 이념마다 subs: [{id, name}]를 둘 수 있고, 정당·파벌·무소속 의원은 이념 또는 서브 이념을 고른다.
        // 서브 이념은 부모 이념 자리에 붙어 정렬되고(부모 순서 → 서브 순서), 필터에서 부모를 고르면 서브도 함께 걸린다
        function findIdeology(id) {
            if(id == null) return null;
            for(const ide of ideologies) {
                if(ide.id === id) return ide;
                const sub = (ide.subs || []).find(s => s.id === id);
                if(sub) return { ...sub, parentId: ide.id, parentName: ide.name };
            }
            return null;
        }
        function ideologyName(id) { return findIdeology(id)?.name || ''; }
        function ideologyParentId(id) { const f = findIdeology(id); return f ? (f.parentId ?? f.id) : null; }
        // 자동 정렬용 순서 값 — 없는 이념은 맨 뒤
        function ideologySortKey(id) {
            for(let i = 0; i < ideologies.length; i++) {
                if(ideologies[i].id === id) return i * 1000;
                const si = (ideologies[i].subs || []).findIndex(s => s.id === id);
                if(si >= 0) return i * 1000 + si + 1;
            }
            return 1e9;
        }
        // <select>용 이념 목록 — 서브 이념은 부모 아래에 들여 써서 보여 준다
        function ideologyOptionsHtml(selectedId, { excludeInd = true } = {}) {
            return ideologies.filter(ide => !excludeInd || ide.id !== IND_IDEOLOGY_ID).map(ide =>
                `<option value="${ide.id}" ${selectedId===ide.id?'selected':''}>${ide.name}</option>` +
                (ide.subs || []).map(sub => `<option value="${sub.id}" ${selectedId===sub.id?'selected':''}>\u00a0\u00a0└ ${sub.name}</option>`).join('')
            ).join('');
        }

        let parties = [
            { id: 1, name: "국가재건당", color: "#2E2E2E", seatsHouse: 140, seatsSenate: 60, seatsThird: 0, ideologyId: 101, isRuling: true,  inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, hideStatsPhoto: false, description: "", factions: [] },
            { id: 2, name: "개혁그룹",   color: "#5D6D7E", seatsHouse: 50,  seatsSenate: 20, seatsThird: 0, ideologyId: 102, isRuling: false, inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, hideStatsPhoto: false, description: "", factions: [] },
            { id: 3, name: "민주당",     color: "#3498DB", seatsHouse: 60,  seatsSenate: 10, seatsThird: 0, ideologyId: 105, isRuling: false, inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, hideStatsPhoto: false, description: "", factions: [] },
            { id: 4, name: "사회당",     color: "#E74C3C", seatsHouse: 40,  seatsSenate: 5, seatsThird: 0,  ideologyId: 106, isRuling: false, inHouse: true, inSenate: true, inThird: false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, hideStatsPhoto: false, description: "", factions: [] }
        ];

        let coalitions = [
            { id: 'c1', name: "국민전선", color: "#2E2E2E", members: [1], isRuling: true , leadPartyId: null, externalSupporters: [], externalSupportLabel: "각외협력" },
        ];

        // 원외정당 접기/펼치기 상태 (실제 정당 목록은 parties에서 의석 0인 것을 그때그때 걸러냄)
        let extraPartiesCollapsed = true;

        let currentTab = 'house';

        // ===== BILL STATE =====
        // bill: { id, title, content, houseStatus: 'pending'|'pass'|'fail', senateStatus: 'pending'|'pass'|'fail',
        //         houseVote: {yea,nay,abs}, senateVote: {yea,nay,abs},
        //         version, parentBillId, isAmendment, voteHistory: [{chamber,result,date,yea,nay,abs,total,required,at}] }
        let bills = [
            { id: 'b1', title: '국가재건특별법 제1조', threshold: 0.5, tags: ['재건', '긴급'],
              content: '국가 재건을 위해 필요한 모든 조치를 취할 수 있다.\n집행부는 의회의 동의 없이 긴급 법령을 발동할 수 있다.',
              houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
              version: 1, parentBillId: null, isAmendment: false, voteHistory: [] }
        ];
        let activeBillId = null;
        let amendmentSourceId = null;

        // ===== 태그 필터 상태 =====
        let activeBillTagFilter = null;
        let activeArchiveTagFilter = null;
        let activeArchiveStatusFilter = null; // null(전체) | 'passed' | 'rejected'(부결+거부권 행사) | 'awaiting_veto'
        // 국무회의가 의결한 법안은 입법 > 기록이 아니라 내각 > 기록에 모은다 (필터 상태는 따로)
        let activeCouncilArchiveTagFilter = null;
        let activeCouncilArchiveStatusFilter = null;
        const ARCHIVE_SCOPES = {
            law:     { list: 'archiveList',        search: 'archiveSearchInput',        status: 'archiveStatusFilter',        tags: 'archiveTagFilter',
                       include: b => billTabledTo(b) !== 'council',
                       get: () => ({ tag: activeArchiveTagFilter, status: activeArchiveStatusFilter }),
                       set: (k, v) => { if(k === 'tag') activeArchiveTagFilter = v; else activeArchiveStatusFilter = v; } },
            council: { list: 'councilArchiveList', search: 'councilArchiveSearchInput', status: 'councilArchiveStatusFilter', tags: 'councilArchiveTagFilter',
                       include: b => billTabledTo(b) === 'council',
                       get: () => ({ tag: activeCouncilArchiveTagFilter, status: activeCouncilArchiveStatusFilter }),
                       set: (k, v) => { if(k === 'tag') activeCouncilArchiveTagFilter = v; else activeCouncilArchiveStatusFilter = v; } },
        };

        // ===== VOTE STATE =====
        let voteState = { house: {}, senate: {}, third: {} };
        let currentVoteMode = 'none';
        let dotCache = { house: [], senate: [], third: [], _elec: [] };
        let hoveredSeat = { house: -1, senate: -1, third: -1 };

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
            if(threshold >= 1.0) return '전원 일치';
            if(Math.abs(threshold - 0.5) < 0.01) return '과반';
            if(Math.abs(threshold - 0.667) < 0.01) return '특별다수(2/3)';
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
            if(!title) { showCustomAlert('법안 제목을 입력하세요.'); return; }
            const amendedBill = amendmentSourceId ? bills.find(b => b.id === amendmentSourceId) : null;
            const version = amendedBill ? (amendedBill.version || 1) + 1 : 1;
            bills.push({ id: 'b'+Date.now(), title, content, threshold, numer, denom, tags,
                houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
                version, parentBillId: amendedBill ? amendedBill.id : null, isAmendment: !!amendedBill, voteHistory: [],
                tabledTo: isCouncilVotingMode() ? 'council' : 'parliament' });
            document.getElementById('newBillTitle').value = '';
            document.getElementById('newBillContent').value = '';
            document.getElementById('newBillTags').value = '';
            amendmentSourceId = null;
            renderAmendmentBanner();
            renderBillList(); syncBillSelect();
        }

        // ── 개정안 발의 ──────────────────────────
        function startAmendment(id) {
            const orig = bills.find(b => b.id === id);
            if(!orig) return;
            if(getBillOverallStatus(orig) !== 'passed') { showCustomAlert('가결된 법안만 개정안을 발의할 수 있습니다.'); return; }
            amendmentSourceId = id;
            switchSubTab('law', 'bill');
            document.getElementById('newBillTitle').value = orig.title + ' 개정안';
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
            text.innerHTML = `📝 개정 대상:<br>${orig.title} (제${orig.version || 1}판)`;
            banner.classList.add('show');
        }

        function getAmendmentsOf(id) {
            return bills.filter(b => b.parentBillId === id);
        }

        function removeBill(id) {
            bills = bills.filter(b => b.id !== id);
            if(activeBillId === id) { activeBillId = null; voteState = {house:{}, senate:{}, third:{}}; redrawAll(); updateVoteResults(); }
            if(activeCouncilBillId === id) { activeCouncilBillId = null; cabinetCouncilVote = {}; renderCabinetDisplay(); }
            renderBillList();
            syncBillSelect();
        }

        // 법안의 상정 대상 (국회 / 국무회의) — 지정되지 않은 법안(구버전 세이브 포함)은 국회로 취급
        function billTabledTo(bill) {
            return bill.tabledTo || 'parliament';
        }

        // 입법 > 상정 탭에서 법안을 국회 또는 국무회의로 상정 — 계엄령으로 의회가 정지된 동안은 국무회의만 선택 가능
        function setBillTabledTo(id, dest) {
            if(!['parliament','council'].includes(dest)) return;
            const bill = bills.find(b => b.id === id);
            if(!bill) return;
            if(dest === 'parliament' && isCouncilVotingMode()) { showCustomAlert('계엄령으로 의회가 정지된 상태에서는 국회로 상정할 수 없습니다.'); return; }
            bill.tabledTo = dest;
            if(activeBillId === id && dest !== 'parliament') { activeBillId = null; voteState = {house:{}, senate:{}, third:{}}; redrawAll(); updateVoteResults(); }
            if(activeCouncilBillId === id && dest !== 'council') { activeCouncilBillId = null; cabinetCouncilVote = {}; }
            renderBillList();
            syncBillSelect();
            renderCabinetDisplay();
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
                el.innerHTML = '<span style="color:#444; font-size:0.9rem;">법안을 선택하세요...</span>';
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

        // 국무회의 탭 — 국무회의로 상정된 법안 심의 선택 (표결 탭의 selectBillForVote와 대응, cabinetCouncilVote 초기화)
        function selectBillForCouncilVote(id) {
            activeCouncilBillId = id;
            cabinetCouncilVote = {};
            renderBillList();
            renderCouncilActiveBillDisplay();
            renderCabinetDisplay();
            const dateInput = document.getElementById('councilVoteDateInput');
            if(dateInput) {
                const bill = bills.find(b=>b.id===id);
                dateInput.value = bill?.voteDate || '';
            }
        }

        function updateCouncilVoteDate(val) {
            if(!activeCouncilBillId) return;
            const bill = bills.find(b=>b.id===activeCouncilBillId);
            if(bill) { bill.voteDate = val.trim(); renderBillList(); renderArchiveList(); }
        }

        function renderCouncilActiveBillDisplay() {
            const el = document.getElementById('councilActiveBillDisplay');
            const sel = document.getElementById('councilSelectBill');
            if(!el || !sel) return;
            if(!activeCouncilBillId || !bills.find(b=>b.id===activeCouncilBillId)) {
                el.innerHTML = '<span style="color:#444; font-size:0.9rem;">법안을 선택하세요...</span>';
                sel.value = '';
                return;
            }
            const bill = bills.find(b=>b.id===activeCouncilBillId);
            el.innerHTML = `
                <div style="color:var(--tno-gold); font-size:1rem; margin-bottom:3px;">${bill.title}</div>
                ${bill.content ? `<div style="color:#666; font-size:0.8rem; white-space:pre-wrap; max-height:50px; overflow:hidden;">${bill.content}</div>` : ''}
            `;
            sel.value = activeCouncilBillId;
        }

        function syncBillSelect() {
            const sel = document.getElementById('voteSelectBill');
            if(sel) {
                sel.innerHTML = '<option value="">-- 법안 선택 --</option>';
                bills.filter(b => getBillOverallStatus(b) === 'pending' && billTabledTo(b) === 'parliament').forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.id;
                    opt.textContent = b.title + getBillStatusSuffix(b);
                    sel.appendChild(opt);
                });
                sel.value = activeBillId || '';
                renderActiveBillDisplay();
            }
            // 제출 탭의 "기존 법안 수정" 드롭다운도 함께 동기화 (대기 중인 법안만 수정 가능, 상정 대상 무관)
            const editSel = document.getElementById('editBillSelect');
            if(editSel) {
                const prevEdit = editSel.value;
                editSel.innerHTML = '<option value="">-- 수정할 법안 선택 --</option>';
                bills.filter(b => getBillOverallStatus(b) === 'pending').forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.id;
                    opt.textContent = b.title + getBillStatusSuffix(b);
                    editSel.appendChild(opt);
                });
                if(bills.find(b=>b.id===prevEdit)) editSel.value = prevEdit;
            }
            syncCouncilBillSelect();
        }

        // 국무회의 탭 — 국무회의로 상정된 대기 중인 법안만 드롭다운에 표시
        function syncCouncilBillSelect() {
            const sel = document.getElementById('councilSelectBill');
            if(!sel) return;
            sel.innerHTML = '<option value="">-- 법안 선택 --</option>';
            bills.filter(b => getBillOverallStatus(b) === 'pending' && billTabledTo(b) === 'council').forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.title + getBillStatusSuffix(b);
                sel.appendChild(opt);
            });
            sel.value = activeCouncilBillId || '';
            renderCouncilActiveBillDisplay();
        }

        // ── 기존 법안 수정 (제출 탭) ──────────────
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
            if(!title) { showCustomAlert('법안 제목을 입력하세요.'); return; }
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
            // 저장 후 "-- 수정할 법안 선택 --" 상태로 초기화
            editingBillId = null;
            const editSel = document.getElementById('editBillSelect');
            if(editSel) editSel.value = '';
            const editForm = document.getElementById('editBillForm');
            if(editForm) editForm.style.display = 'none';
            showCustomAlert('법안이 수정되었습니다.');
        }

        function getBillStatusSuffix(b) {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const parts = [];
            if(b.houseStatus !== 'pending') parts.push(b.houseStatus === 'pass' ? '하원✔' : '하원✘');
            if(isBi && b.senateStatus !== 'pending' && b.senateStatus !== 'skip') parts.push(b.senateStatus === 'pass' ? '상원✔' : '상원✘');
            if(isTri && b.thirdStatus !== 'pending' && b.thirdStatus !== 'skip') parts.push(b.thirdStatus === 'pass' ? '삼원✔' : '삼원✘');
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
            const allChambersPassed = bill.houseStatus === 'pass' && (!isBi || bill.senateStatus === 'pass') && (!isTri || bill.thirdStatus === 'pass');
            if(allChambersPassed) {
                // 거부권 주체가 지정돼 있으면(내각>설정), 의회 표결 통과만으로 바로 최종 가결되지 않고
                // 서명/거부 결정을 거쳐야 함 — 단, 내각 불신임안은 그 대상이 총리 본인이므로 거부권자가
                // 총리라면 자기 자신의 불신임안을 서명/거부할 수 없어야 하고, 대신 무조건 서명(즉시 가결)됨
                const skipVeto = bill.isNoConfidence && vetoHolder === 'pm';
                if(vetoHolder !== 'none' && !skipVeto) {
                    if(bill.vetoStatus === 'vetoed') return 'vetoed';
                    if(bill.vetoStatus !== 'signed') return 'awaiting_veto';
                }
                return 'passed';
            }
            return 'pending';
        }

        function vetoHolderLabel() {
            return vetoHolder === 'president' ? effRoleLabel('president') : vetoHolder === 'pm' ? effRoleLabel('pm') : vetoHolder === 'cabinet' ? '내각' : '';
        }

        function signBill(id) {
            const bill = bills.find(b => b.id === id);
            if(!bill) return;
            bill.vetoStatus = 'signed';
            renderArchiveList();
        }

        function vetoBill(id) {
            const bill = bills.find(b => b.id === id);
            if(!bill) return;
            showCustomConfirm(`${vetoHolderLabel()}의 거부권을 행사해 이 법안을 최종 부결시킵니다. 계속하시겠습니까?`, () => {
                bill.vetoStatus = 'vetoed';
                renderArchiveList();
            });
        }

        // 법안 카드 공통 배지 생성
        function buildBillBadges(bill) {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const overall = getBillOverallStatus(bill);
            const overallCfg = {
                passed: ['passed', '✔ 최종 가결'],
                failed: ['failed', '✘ 최종 부결'],
                vetoed: ['failed', `🛑 ${vetoHolderLabel()} 거부권 행사`],
                awaiting_veto: ['pending', `⏳ ${vetoHolderLabel()} 서명 대기`],
                pending: ['pending', '대기 중'],
            };
            const [oc, ol] = overallCfg[overall];

            // 각 줄(전체 상태 / 의원실별 상태)을 별도 행으로 쌓아 줄바꿈이 항상 깔끔하게 되도록 구성
            const rows = [];

            let overallRow = `<span class="bill-status-badge ${oc}">${ol}</span>`;
            if(bill.voteDate) overallRow += `<span style="color:#666;font-size:0.75rem;">📅 ${bill.voteDate}</span>`;
            rows.push(overallRow);

            if(billTabledTo(bill) === 'council' && bill.houseStatus !== 'pending') {
                // 국무회의로 상정된 법안은 국회/상원 대신 [국무회의 ✔가결/✘부결]로 표시
                const councilVote = [...(bill.voteHistory||[])].reverse().find(h => h.chamber === 'cabinetCouncil');
                let row = `<span class="bill-status-badge ${bill.houseStatus==='pass'?'house-pass':'house-fail'}">국무회의 ${bill.houseStatus==='pass'?'✔가결':'✘부결'}</span>`;
                if(councilVote) row += `<span style="color:#555; font-size:0.75rem;">(찬${councilVote.yea}/반${councilVote.nay}/기${councilVote.abs})</span>`;
                rows.push(row);
            } else {
                if(bill.houseStatus !== 'pending') {
                    const hName = document.getElementById('houseNameInput')?.value || '하원';
                    let row = `<span class="bill-status-badge ${bill.houseStatus==='pass'?'house-pass':'house-fail'}">${hName} ${bill.houseStatus==='pass'?'✔가결':'✘부결'}</span>`;
                    if(bill.houseVote) row += `<span style="color:#555; font-size:0.75rem;">(찬${bill.houseVote.yea}/반${bill.houseVote.nay}/기${bill.houseVote.abs})</span>`;
                    rows.push(row);
                }
                if(isBi && bill.senateStatus !== 'pending' && bill.senateStatus !== 'skip') {
                    const sName = document.getElementById('senateNameInput')?.value || '상원';
                    let row = `<span class="bill-status-badge ${bill.senateStatus==='pass'?'senate-pass':'senate-fail'}">${sName} ${bill.senateStatus==='pass'?'✔가결':'✘부결'}</span>`;
                    if(bill.senateVote) row += `<span style="color:#555; font-size:0.75rem;">(찬${bill.senateVote.yea}/반${bill.senateVote.nay}/기${bill.senateVote.abs})</span>`;
                    rows.push(row);
                }
                if(isBi && bill.senateStatus === 'skip') {
                    const sName = document.getElementById('senateNameInput')?.value || '상원';
                    rows.push(`<span class="bill-status-badge senate-fail">${sName} 미상정</span>`);
                }
                if(isTri && bill.thirdStatus !== 'pending' && bill.thirdStatus !== 'skip') {
                    const tName = document.getElementById('thirdNameInput')?.value || '삼원';
                    let row = `<span class="bill-status-badge ${bill.thirdStatus==='pass'?'third-pass':'third-fail'}">${tName} ${bill.thirdStatus==='pass'?'✔가결':'✘부결'}</span>`;
                    if(bill.thirdVote) row += `<span style="color:#555; font-size:0.75rem;">(찬${bill.thirdVote.yea}/반${bill.thirdVote.nay}/기${bill.thirdVote.abs})</span>`;
                    rows.push(row);
                }
                if(isTri && bill.thirdStatus === 'skip') {
                    const tName = document.getElementById('thirdNameInput')?.value || '삼원';
                    rows.push(`<span class="bill-status-badge third-fail">${tName} 미상정</span>`);
                }
            }
            if((bill.version || 1) > 1 || bill.isAmendment) {
                let row = '';
                if((bill.version || 1) > 1) row += `<span class="bill-version-badge">제${bill.version}판</span>`;
                if(bill.isAmendment) {
                    const orig = bills.find(b => b.id === bill.parentBillId);
                    row += `<span class="bill-version-badge" title="개정 대상 법안">↩ 개정: ${orig ? orig.title : '(삭제된 법안)'}</span>`;
                }
                rows.push(row);
            }

            return rows.map(r => `<div style="display:flex; align-items:center; gap:6px; width:100%;">${r}</div>`).join('');
        }

        // 법안 세부 표결 기록(타임라인) + 개정안 목록 HTML — 실제 표결 결과 패널과 동일한 막대그래프로 표시
        function buildBillHistoryHtml(bill) {
            const chamberLabel = ch => ch === 'cabinetCouncil' ? '국무회의'
                : ch === 'senate' ? (document.getElementById('senateNameInput')?.value || '상원')
                : ch === 'third' ? (document.getElementById('thirdNameInput')?.value || '삼원')
                : (document.getElementById('houseNameInput')?.value || '하원');
            const history = bill.voteHistory || [];
            const historyRows = history.length === 0
                ? '<div style="color:#444;">표결 기록 없음</div>'
                : history.map(h => {
                    if(h.result === 'skip') return `<div class="vote-verdict verdict-pending" style="margin:6px 0;">⊘ ${chamberLabel(h.chamber)} 미상정</div>`;
                    const total = h.total || 1;
                    const none = Math.max(0, total - h.yea - h.nay - h.abs);
                    const threshold = h.threshold ?? 0.5;
                    const threshPct = Math.min(threshold * 100, 100).toFixed(1);
                    const threshLabel = getThresholdLabel(threshold, h.numer, h.denom);
                    const dateStr = h.date ? ` · ${h.date}` : '';
                    return `
                        <div class="vote-result-wrap" style="margin-top:8px; padding:8px;">
                            <div class="vote-result-title">[ ${chamberLabel(h.chamber)} 표결 결과 ]${dateStr}</div>
                            <div class="vote-bar-outer">
                                <div class="vote-bar-yea" style="width:${(h.yea/total*100).toFixed(1)}%"></div>
                                <div class="vote-bar-nay" style="width:${(h.nay/total*100).toFixed(1)}%"></div>
                                <div class="vote-bar-abs" style="width:${(h.abs/total*100).toFixed(1)}%"></div>
                                <div class="vote-bar-none" style="width:${(none/total*100).toFixed(1)}%"></div>
                                <div style="position:absolute; left:${threshPct}%; top:0; bottom:0; width:2px; background:var(--tno-gold); box-shadow:0 0 5px var(--tno-gold); z-index:2;"></div>
                                <div style="position:absolute; left:${threshPct}%; top:-18px; transform:translateX(-50%); font-size:0.72rem; color:var(--tno-gold); white-space:nowrap; font-family:'NeoDunggeunmo','VT323',monospace;">${threshLabel} (${h.required}석)</div>
                            </div>
                            <div class="vote-counts">
                                <span class="vc-yea">찬성 <b>${h.yea}</b></span>
                                <span class="vc-nay">반대 <b>${h.nay}</b></span>
                                <span class="vc-abs">기권 <b>${h.abs}</b></span>
                                <span class="vc-none">미투표 <b>${none}</b></span>
                            </div>
                            <div class="vote-verdict ${h.result==='pass'?'verdict-pass':'verdict-fail'}">${h.result==='pass'?'✔ 가결':'✘ 부결'}</div>
                        </div>`;
                }).join('');

            const amendments = getAmendmentsOf(bill.id);
            const amendmentRows = amendments.length === 0 ? '' : `
                <div style="margin-top:6px; padding-top:6px; border-top:1px dotted #1a1a1a;">
                    <div style="color:#666; margin-bottom:2px;">개정안 (${amendments.length}건)</div>
                    ${amendments.map(a => `<div class="bill-history-entry">제${a.version}판 — ${a.title} [${buildBillBadges(a).replace(/<[^>]+>/g,' ').trim() || '대기 중'}]</div>`).join('')}
                </div>`;

            return `<div class="bill-history" id="billHistory-${bill.id}">${historyRows}${amendmentRows}</div>`;
        }

        function toggleBillHistory(id) {
            const el = document.getElementById('billHistory-' + id);
            if(el) el.classList.toggle('open');
        }

        // ===== 태그 헬퍼 =====
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

        // 기록 탭 전용 — 결과별 필터('rejected'는 부결/거부권 행사를 하나로 묶음)
        function billMatchesStatusFilter(bill, statusFilter) {
            if(!statusFilter) return true;
            const overall = getBillOverallStatus(bill);
            if(statusFilter === 'rejected') return overall === 'failed' || overall === 'vetoed';
            return overall === statusFilter;
        }
        function toggleArchiveStatusFilter(key, scope = 'law') {
            const sc = ARCHIVE_SCOPES[scope];
            sc.set('status', sc.get().status === key ? null : key);
            renderArchiveList(scope);
        }
        function renderArchiveStatusFilter(done, scope = 'law') {
            const sc = ARCHIVE_SCOPES[scope];
            const el = document.getElementById(sc.status);
            if(!el) return;
            const activeStatus = sc.get().status;
            const options = [
                { key: 'passed', label: '✔ 가결' },
                { key: 'rejected', label: '✘ 부결/거부' },
                { key: 'awaiting_veto', label: '⏳ 서명 대기' },
            ].filter(o => done.some(b => billMatchesStatusFilter(b, o.key)));
            if(options.length === 0) { el.innerHTML = ''; return; }
            el.innerHTML = options.map(o =>
                `<span class="tag-badge ${activeStatus===o.key?'active':''}" onclick="toggleArchiveStatusFilter('${o.key}','${scope}')">${o.label}</span>`
            ).join('');
        }

        function buildTagHtml(bill) {
            if(!bill.tags || bill.tags.length === 0) return '';
            return bill.tags.map(t => `<span class="tag-badge" style="cursor:default;"># ${t}</span>`).join('');
        }

        // 법안 제출 탭 — 대기 중인 법안만 + 검색/태그 필터
        function renderBillList() {
            const container = document.getElementById('billList');
            if(!container) return;
            const query = document.getElementById('billSearchInput')?.value || '';
            const pending = bills.filter(b => getBillOverallStatus(b) === 'pending');

            // 태그 필터 바 렌더
            const allTags = getAllTags(pending);
            renderTagFilter('billTagFilter', allTags, activeBillTagFilter, (t) => {
                activeBillTagFilter = activeBillTagFilter === t ? null : t;
                renderBillList();
            });

            const filtered = pending.filter(b => billMatchesFilter(b, query, activeBillTagFilter));

            if(pending.length === 0) {
                container.innerHTML = '<div style="color:#333; text-align:center; padding:20px; border:1px dashed #222;">대기 중인 법안이 없습니다</div>';
                return;
            }
            if(filtered.length === 0) {
                container.innerHTML = '<div style="color:#444; text-align:center; padding:16px; border:1px dashed #222;">검색 결과가 없습니다</div>';
                return;
            }

            container.innerHTML = '';
            filtered.forEach(bill => {
                const dest = billTabledTo(bill);
                const isActive = dest === 'council' ? bill.id === activeCouncilBillId : bill.id === activeBillId;
                const thLabel = getThresholdLabel(bill.threshold || 0.5, bill.numer, bill.denom);
                const suspended = isCouncilVotingMode();
                // 선택된 상정 대상은 색이 채워진 강조 스타일로, 선택되지 않은 쪽은 흐린 회색으로 — 한눈에 구분되도록
                const routeBtn = (d, txt, color) => {
                    const disabled = d === 'parliament' && suspended;
                    const selected = dest === d;
                    const style = selected
                        ? `border-color:${color};color:${color};background:color-mix(in srgb, ${color} 15%, transparent);box-shadow:0 0 6px color-mix(in srgb, ${color} 50%, transparent);text-shadow:0 0 4px ${color};font-weight:bold;`
                        : `border-color:#333;color:#555;background:transparent;`;
                    return `<button class="bill-select-btn" style="${style}${disabled?'opacity:0.4;cursor:not-allowed;':''}" ${disabled?'disabled title="계엄령으로 의회가 정지된 상태에서는 선택할 수 없습니다"':''} onclick="setBillTabledTo('${bill.id}','${d}')">${selected?'✔ ':''}${txt}</button>`;
                };
                const selectAction = dest === 'council'
                    ? `selectBillForCouncilVote('${bill.id}'); switchSubTab('cabinet','council');`
                    : `selectBillForVote('${bill.id}'); switchTab('vote');`;
                const div = document.createElement('div');
                div.className = 'bill-card' + (isActive ? ' selected' : '');
                div.innerHTML = `
                    <div class="bill-card-title">
                        ${isActive ? '<span style="color:var(--tno-neon); font-size:0.8rem;">[심의중]</span>' : ''}
                        ${bill.title}
                    </div>
                    ${bill.content ? `<div class="bill-card-body">${bill.content}</div>` : ''}
                    <div style="margin-top:4px;">${buildTagHtml(bill)}</div>
                    <div style="margin-top:4px; display:flex; align-items:center; gap:6px;">
                        <span style="color:#666; font-size:0.75rem;">상정:</span>
                        ${routeBtn('parliament', '국회', 'var(--tno-gold)')}
                        ${routeBtn('council', '국무회의', 'var(--tno-alert)')}
                    </div>
                    <div class="bill-card-footer">
                        ${buildBillBadges(bill)}
                        <span style="color:#555; font-size:0.75rem; margin-left:4px;">[${thLabel}]</span>
                        ${(bill.voteHistory||[]).length > 0 ? `<span class="bill-history-toggle" onclick="event.stopPropagation(); toggleBillHistory('${bill.id}')">▾ 세부 기록</span>` : ''}
                        <div style="margin-left:auto; display:flex; gap:5px;">
                            ${!isActive ? `<button class="bill-select-btn" onclick="${selectAction}">심의 선택</button>` : ''}
                            <button class="bill-remove-btn" onclick="removeBill('${bill.id}')">삭제</button>
                        </div>
                    </div>
                    ${(bill.voteHistory||[]).length > 0 ? buildBillHistoryHtml(bill) : ''}
                `;
                container.appendChild(div);
            });
        }

        // 기록 탭 — 가결/부결 완료 법안만 + 검색/태그 필터
        // 기록 목록 — scope: 'law'(입법 > 기록, 의회가 의결한 법안) | 'council'(내각 > 기록, 국무회의가 의결한 법안), 없으면 둘 다
        function renderArchiveList(scope) {
            if(!scope) { renderArchiveList('law'); renderArchiveList('council'); return; }
            const sc = ARCHIVE_SCOPES[scope];
            const container = document.getElementById(sc.list);
            if(!container) return;
            const query = document.getElementById(sc.search)?.value || '';
            const done = [...bills.filter(b => getBillOverallStatus(b) !== 'pending' && sc.include(b))].reverse();
            const { tag: activeTag, status: activeStatus } = sc.get();

            // 결과별 필터 + 태그 필터 바 렌더
            renderArchiveStatusFilter(done, scope);
            const allTags = getAllTags(done);
            renderTagFilter(sc.tags, allTags, activeTag, (t) => {
                sc.set('tag', sc.get().tag === t ? null : t);
                renderArchiveList(scope);
            });

            const filtered = done.filter(b => billMatchesStatusFilter(b, activeStatus) && billMatchesFilter(b, query, activeTag));

            if(done.length === 0) {
                container.innerHTML = `<div style="color:#333; text-align:center; padding:20px; border:1px dashed #222;">${scope === 'council' ? '국무회의에서 의결된 법안이 없습니다' : '완료된 법안이 없습니다'}</div>`;
                return;
            }
            if(filtered.length === 0) {
                container.innerHTML = '<div style="color:#444; text-align:center; padding:16px; border:1px dashed #222;">검색 결과가 없습니다</div>';
                return;
            }

            container.innerHTML = '';
            filtered.forEach(bill => {
                const overall = getBillOverallStatus(bill);
                const thLabel = getThresholdLabel(bill.threshold || 0.5, bill.numer, bill.denom);
                const div = document.createElement('div');
                div.className = 'bill-card';
                div.style.borderLeftColor = (overall === 'passed') ? 'var(--vote-yea)' : (overall === 'awaiting_veto') ? 'var(--tno-gold)' : 'var(--vote-nay)';
                div.innerHTML = `
                    <div class="bill-card-title">${bill.title}</div>
                    ${bill.content ? `<div class="bill-card-body">${bill.content}</div>` : ''}
                    <div style="margin-top:4px;">${buildTagHtml(bill)}</div>
                    <div class="bill-card-footer">
                        ${buildBillBadges(bill)}
                        <span style="color:#555; font-size:0.75rem; margin-left:4px;">[${thLabel}]</span>
                        <span class="bill-history-toggle" onclick="event.stopPropagation(); toggleBillHistory('${bill.id}')">▾ 세부 기록</span>
                        <div style="display:flex; gap:5px;">
                            ${overall === 'awaiting_veto' ? `<button class="bill-amend-btn" onclick="signBill('${bill.id}')">✍ ${vetoHolderLabel()} 서명</button><button class="bill-remove-btn" onclick="vetoBill('${bill.id}')">🛑 거부권 행사</button>` : ''}
                            ${overall === 'passed' ? `<button class="bill-amend-btn" onclick="startAmendment('${bill.id}')">📝 개정안 발의</button>` : ''}
                            <button class="bill-remove-btn" onclick="removeBill('${bill.id}')">삭제</button>
                        </div>
                    </div>
                    ${buildBillHistoryHtml(bill)}
                `;
                container.appendChild(div);
            });
        }

        // ===== CONFIRM CHAMBER VOTE =====
        function confirmChamberVote(chamber) {
            if(!activeBillId) { showCustomAlert('심의할 법안을 먼저 선택하세요.'); return; }
            const bill = bills.find(b=>b.id===activeBillId);
            if(!bill) return;

            const isBi  = hasSenateChamber();
            const isTri = hasThirdChamber();
            const hName = document.getElementById('houseNameInput')?.value || '하원';
            const sName = document.getElementById('senateNameInput')?.value || '상원';

            // 상원은 하원 가결 후에만, 삼원은 상원(또는 하원) 가결 후에만 가능
            if(chamber === 'senate') {
                if(bill.houseStatus === 'pending') { showCustomAlert(`${hName} 표결을 먼저 확정하세요.`); return; }
                if(bill.houseStatus === 'fail') { showCustomAlert(`${hName}에서 부결된 법안은 ${document.getElementById('senateNameInput')?.value||'상원'}에 상정되지 않습니다.`); return; }
            }
            if(chamber === 'third') {
                const prevStatus = isBi ? bill.senateStatus : bill.houseStatus;
                const prevName = isBi ? sName : hName;
                if(prevStatus === 'pending') { showCustomAlert(`${prevName} 표결을 먼저 확정하세요.`); return; }
                if(prevStatus === 'fail') { showCustomAlert(`${prevName}에서 부결된 법안은 삼원에 상정되지 않습니다.`); return; }
            }

            const dots = dotCache[chamber];
            let yea=0, nay=0, abs=0;
            dots.forEach((d,i) => {
                if(d.partyName==='Vacant' || d.partyStatus==='banned') return;
                const v = voteState[chamber][i]||'none';
                if(v==='yea') yea++;
                else if(v==='nay') nay++;
                else if(v==='abs') abs++;
            });
            // 활동 금지된 정당은 표결에 참여할 수 없으므로 유효 의석(과반 기준)에서 제외
            const validSeats = dots.filter(d=>d.partyName!=='Vacant' && d.partyStatus!=='banned').length;
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
                // 하원 부결 → 이후 단계(상원/삼원) 자동 부결 처리
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

        // 확정 버튼 잠금/해제 상태 갱신
        function updateConfirmButtons() {
            const isBi = hasSenateChamber();
            const isTri = hasThirdChamber();
            const bill = activeBillId ? bills.find(b=>b.id===activeBillId) : null;
            const hName = document.getElementById('houseNameInput')?.value || '하원';
            const sName = document.getElementById('senateNameInput')?.value || '상원';
            const tName = document.getElementById('thirdNameInput')?.value || '삼원';

            const hBtn = document.getElementById('hConfirmBtn');
            const sBtn = document.getElementById('sConfirmBtn');
            const tBtn = document.getElementById('tConfirmBtn');
            if(!hBtn || !sBtn) return;

            const hDone = bill && bill.houseStatus !== 'pending';
            hBtn.disabled = !!hDone;
            hBtn.style.opacity = hDone ? '0.35' : '1';
            hBtn.style.cursor = hDone ? 'not-allowed' : 'pointer';
            hBtn.textContent = hDone
                ? (bill.houseStatus === 'pass' ? `✔ ${hName} 가결 확정됨` : `✘ ${hName} 부결 확정됨`)
                : `▶ ${hName} 표결 확정`;

            if(isBi) {
                const hPassed = bill && bill.houseStatus === 'pass';
                const sDone   = bill && bill.senateStatus !== 'pending' && bill.senateStatus !== 'skip';
                const sSkip   = bill && bill.senateStatus === 'skip';

                sBtn.disabled = !hPassed || sDone || sSkip;
                sBtn.style.opacity = (!hPassed || sDone || sSkip) ? '0.35' : '1';
                sBtn.style.cursor = (!hPassed || sDone || sSkip) ? 'not-allowed' : 'pointer';

                if(sSkip)         sBtn.textContent = `✘ ${hName} 부결 — ${sName} 미상정`;
                else if(sDone)    sBtn.textContent = bill.senateStatus === 'pass' ? `✔ ${sName} 가결 확정됨` : `✘ ${sName} 부결 확정됨`;
                else if(!hPassed) sBtn.textContent = `[##] ${hName} 가결 후 열림`;
                else              sBtn.textContent = `▶ ${sName} 표결 확정`;
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

                if(tSkip)         tBtn.textContent = `✘ ${prevName} 부결 — ${tName} 미상정`;
                else if(tDone)    tBtn.textContent = bill.thirdStatus === 'pass' ? `✔ ${tName} 가결 확정됨` : `✘ ${tName} 부결 확정됨`;
                else if(!prevPassed) tBtn.textContent = `[##] ${prevName} 가결 후 열림`;
                else              tBtn.textContent = `▶ ${tName} 표결 확정`;
            }
        }

        function setVoteMode(mode) {
            currentVoteMode = mode;
            closeSeatInfoCard();
            const labels = { yea: '▲ 찬성 (초록)', nay: '▼ 반대 (빨강)', abs: '— 기권 (회색)', none: '✕ 제거', info: '🔍 정보 보기' };
            const colors  = { yea: '#00ff88', nay: '#ff2244', abs: '#888888', none: '#888', info: 'var(--tno-neon)' };
            const el = document.getElementById('currentModeLabel');
            el.textContent = labels[mode] || '없음';
            el.style.color = colors[mode] || '#888';
        }

        function clearAllVotes() {
            voteState = { house: {}, senate: {}, third: {} };
            redrawAll();
            updateVoteResults();
            renderBulkPartyList();
        }

        // ===== BULK PARTY VOTE =====
        // 체크된 의원실 목록 반환 (다중 선택)
        function getBulkChambers() {
            const checked = Array.from(document.querySelectorAll('input[name="bulkChamber"]:checked')).map(el=>el.value);
            return checked.length > 0 ? checked : ['house'];
        }
        // 하위호환: 기준 의원실 하나(대표행 표시용)
        function getBulkChamber() {
            return getBulkChambers()[0];
        }
        // 개별 체크박스 변경 시: 전체 체크 상태 동기화
        function onBulkChamberChange() {
            const all = chamberList();
            const checked = getBulkChambers();
            const allChecked = all.every(c => checked.includes(c));
            const allBox = document.getElementById('bulkChamberAll');
            if(allBox) allBox.checked = allChecked;
            renderBulkPartyList();
        }
        // 전체 체크박스 변경 시: 모든 의원실 체크박스 동기화
        function onBulkChamberAllChange(checked) {
            document.querySelectorAll('input[name="bulkChamber"]').forEach(el => {
                const wrap = el.closest('label');
                if(wrap && wrap.style.display === 'none') return; // 존재하지 않는 의원실은 건너뜀
                el.checked = checked;
            });
            renderBulkPartyList();
        }

        function applyPartyVote(partyName, vote) {
            if(vote !== 'none' && isParliamentSuspended()) return;
            // 활동 금지된 정당은 표결에 참여할 수 없음
            if(vote !== 'none' && parties.find(p=>p.name===partyName)?.status==='banned') return;
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
            // 체크된 의원실들을 합산해서 해당 당의 다수 투표 상태 반환
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
            // 단원제: 일괄 투표 대상 선택 그룹 자체를 숨김 (선택할 게 없으므로)
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
                container.innerHTML = '<div style="color:#444;font-size:0.85rem;text-align:center;padding:8px;">시뮬레이션을 먼저 실행하세요</div>';
                return;
            }

            container.innerHTML = '';
            partyOrder.forEach(d => {
                const party = parties.find(p => p.name === d.partyName);
                const hasFactions = party?.factions?.length > 0;
                const dominant = getPartyDominantVote(d.partyName);
                const isBanned = party?.status === 'banned';
                const voteButtonsHtml = isBanned
                    ? `<div class="bulk-vote-banned" title="활동 금지된 정당은 표결에 참여할 수 없습니다">활동 금지</div>`
                    : `<button class="bulk-vote-btn yea ${dominant==='yea'?'active-yea':''}" onclick="applyPartyVote('${d.partyName}','yea')">▲찬</button>
                    <button class="bulk-vote-btn nay ${dominant==='nay'?'active-nay':''}" onclick="applyPartyVote('${d.partyName}','nay')">▼반</button>
                    <button class="bulk-vote-btn abs ${dominant==='abs'?'active-abs':''}" onclick="applyPartyVote('${d.partyName}','abs')">—기</button>`;

                // 당 행
                const row = document.createElement('div');
                row.className = 'bulk-party-row';
                row.style.cssText = hasFactions ? 'border-bottom:none;padding-bottom:2px;' : '';
                row.innerHTML = `
                    <div class="bulk-party-dot" style="background:${d.color};"></div>
                    <span class="bulk-party-name" title="${d.partyName}">${d.partyName}</span>
                    ${voteButtonsHtml}
                    <button class="bulk-vote-btn clr" onclick="applyPartyVote('${d.partyName}','none')">✕</button>
                `;
                container.appendChild(row);

                // 파벌 서브행
                if(hasFactions) {
                    party.factions.forEach(f => {
                        const fDominant = getFactionDominantVote(d.partyName, f, refCh);
                        const fVoteButtonsHtml = isBanned
                            ? `<div class="bulk-vote-banned" title="활동 금지된 정당은 표결에 참여할 수 없습니다">활동 금지</div>`
                            : `<button class="bulk-vote-btn yea ${fDominant==='yea'?'active-yea':''}" onclick="applyFactionVote('${d.partyName}','${f.id}','yea')">▲찬</button>
                            <button class="bulk-vote-btn nay ${fDominant==='nay'?'active-nay':''}" onclick="applyFactionVote('${d.partyName}','${f.id}','nay')">▼반</button>
                            <button class="bulk-vote-btn abs ${fDominant==='abs'?'active-abs':''}" onclick="applyFactionVote('${d.partyName}','${f.id}','abs')">—기</button>`;
                        const fRow = document.createElement('div');
                        fRow.className = 'bulk-party-row';
                        fRow.style.cssText = 'padding-left:18px;background:#080a0e;border-top:none;';
                        fRow.innerHTML = `
                            <div class="bulk-party-dot" style="background:${f.color};width:7px;height:7px;"></div>
                            <span class="bulk-party-name" style="color:#888;font-size:0.82rem;" title="${f.name}">${f.name}</span>
                            ${fVoteButtonsHtml}
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

        // 파벌의 지배적 투표 상태
        function getFactionDominantVote(partyName, faction, chamber) {
            // 파벌 의석 수 파악: 해당 의원실 의석
            const seatKey = seatKeyFor(chamber);
            const fSeats = faction[seatKey] || 0;
            if(fSeats === 0) return 'none';
            // 파벌에 할당된 dot 인덱스를 찾아야 하는데, 현재는 dot에 파벌 정보가 없으므로
            // 당 전체 dot 중 파벌 비율만큼을 파벌 몫으로 간주해서 표결 상태를 산출
            // 단순화: 파벌 전용 voteState 키를 별도로 관리
            const key = `__faction__${partyName}__${faction.id}`;
            return voteState[chamber]?.[key] || 'none';
        }

        function applyFactionVote(partyName, factionId, vote) {
            if(vote !== 'none' && isParliamentSuspended()) return;
            // 활동 금지된 정당은 표결에 참여할 수 없음
            if(vote !== 'none' && parties.find(p=>p.name===partyName)?.status==='banned') return;
            const key = `__faction__${partyName}__${factionId}`;
            const chs = getBulkChambers();
            chs.forEach(ch => {
                if(!voteState[ch]) voteState[ch] = {};
                // 파벌 메타 키 저장
                if(vote === 'none') delete voteState[ch][key];
                else voteState[ch][key] = vote;

                // 실제 dot에 적용: 해당 당의 dot 중 파벌 의석 수만큼 앞에서부터 할당
                const party = parties.find(p => p.name === partyName);
                if(!party) return;
                const faction = party.factions?.find(f => f.id === factionId);
                if(!faction) return;

                const seatKey = seatKeyFor(ch);
                // 이 당의 모든 dot 인덱스 수집
                const dots = dotCache[ch] || [];
                const partyDots = [];
                dots.forEach((d, i) => { if(d.partyName === partyName) partyDots.push(i); });

                // 파벌 순서: 파벌 목록에서 이 파벌 이전의 의석 합산 = offset
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
        // 표결 탭에서는 currentVoteMode로 "표결 입력" vs "정보 보기"를 선택하고,
        // 그 외 탭에서는 항상 좌석 정보 카드를 띄운다 (투표 상태를 건드리지 않음).
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

            const onVoteTab = currentMainTab === 'law' && currentSubTab.law === 'vote';
            if(!onVoteTab || currentVoteMode === 'info') {
                showSeatInfoCard(chamber, hit, e.clientX, e.clientY);
                return;
            }

            // 활동 금지된 정당의 좌석은 표결에 참여할 수 없으므로 클릭으로 표를 넣을 수 없음
            if(dots[hit].partyStatus === 'banned') {
                showSeatInfoCard(chamber, hit, e.clientX, e.clientY);
                return;
            }

            if(currentVoteMode !== 'none' && isParliamentSuspended()) return;

            const prev = voteState[chamber][hit] || 'none';
            if(currentVoteMode === 'none') {
                // 초기화 모드: 해당 원만 리셋
                delete voteState[chamber][hit];
            } else if(currentVoteMode === prev) {
                // 같은 모드 다시 클릭 → 초기화
                delete voteState[chamber][hit];
            } else {
                voteState[chamber][hit] = currentVoteMode;
            }

            redrawAll();
            updateVoteResults();
        }

        // ===== TOOLTIP / 좌석 정보 카드 =====
        // 화면 오른쪽/아래 끝에서도 잘리지 않도록 실제 렌더 크기를 측정해 위치를 보정
        function positionFloatingBox(el, clientX, clientY) {
            const margin = 8;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            let left = clientX + 14;
            let top = clientY - 8;
            if(left + w > window.innerWidth - margin) left = clientX - w - 14;
            if(left < margin) left = margin;
            if(top + h > window.innerHeight - margin) top = window.innerHeight - h - margin;
            if(top < margin) top = margin;
            el.style.left = left + 'px';
            el.style.top = top + 'px';
        }

        function positionTooltip(tip, text, clientX, clientY) {
            tip.textContent = text;
            tip.style.display = 'block';
            positionFloatingBox(tip, clientX, clientY);
        }

        // 캔버스/SVG 우클릭 → 내보내기 메뉴 → 내보내기 옵션 창 (앱 전체 canvas·svg 요소 공용, 사이트 전역에서 한 번만 등록)
        let canvasExportTarget = null;
        document.addEventListener('contextmenu', e => {
            // 계엄령으로 의회가 정지되면 .chamber-box 위에 클릭을 가로채는 shade가 덮이므로,
            // 우클릭 대상이 shade여도 그 안의 실제 캔버스/svg를 찾아 내보내기 대상으로 삼는다
            let el = e.target.closest?.('canvas, svg');
            if(!el) {
                const shade = e.target.closest?.('.martial-law-shade');
                el = shade?.closest('.chamber-box')?.querySelector('canvas, svg') || null;
            }
            if(!el) return;
            e.preventDefault();
            canvasExportTarget = el;
            const menu = document.getElementById('canvasExportMenu');
            if(!menu) return;
            menu.style.display = 'block';
            positionFloatingBox(menu, e.clientX, e.clientY);
        });
        document.addEventListener('click', () => {
            const menu = document.getElementById('canvasExportMenu');
            if(menu) menu.style.display = 'none';
        });

        let exportDialogTarget = null;
        let exportFormat = 'png';

        function setExportFormat(fmt) {
            exportFormat = fmt;
            document.querySelectorAll('#exportDialogOverlay .sub-tab-btn-3').forEach(b => b.classList.toggle('active', b.dataset.format === fmt));
        }

        function onExportIncludeStatsChange() {
            const show = document.getElementById('exportIncludeStats').checked;
            document.getElementById('exportStatsSubOptions').style.display = show ? 'block' : 'none';
        }

        function openExportDialog() {
            document.getElementById('canvasExportMenu').style.display = 'none';
            if(!canvasExportTarget) return;
            exportDialogTarget = canvasExportTarget;
            document.getElementById('exportIncludeFlag').checked = false;
            document.getElementById('exportIncludeName').checked = false;
            document.getElementById('exportIncludeDate').checked = false;
            document.getElementById('exportIncludeSession').checked = false;
            document.getElementById('exportIncludeStats').checked = false;
            document.getElementById('exportIncludePhotos').checked = true;
            document.getElementById('exportExpandIndependents').checked = false;
            document.getElementById('exportIncludeExtraParties').checked = false;
            onExportIncludeStatsChange();
            setExportFormat('png');
            // 내각 카드 그리드는 통계/헤더 옵션이 적용되지 않으므로 해당 섹션을 숨긴다
            const headerStatsSection = document.getElementById('exportHeaderStatsSection');
            if(headerStatsSection) headerStatsSection.style.display = canvasExportTarget.dataset?.exportKind === 'cabinet' ? 'none' : '';
            document.getElementById('exportDialogOverlay').style.display = 'flex';
        }

        function closeExportDialog() {
            document.getElementById('exportDialogOverlay').style.display = 'none';
        }

        // id 규칙이 두 가지라 정규식도 둘 다 잡아야 함: 반원(houseStats)은 Stats로 끝나지만,
        // 선거 결과(elecResultStatsHouse)는 원 이름이 뒤에 더 붙어 Stats가 중간에 옴
        function findStatsElementIn(box) {
            return Array.from(box.querySelectorAll('[id]')).find(n => /Stats(House|Senate|Third)?$/.test(n.id)) || null;
        }

        // 대상 요소(캔버스/svg)를 담고 있는 .chamber-box 안에서, 그 아래 표시되는 의석 통계 블록(있다면)을 찾음
        function findExportStatsBlock(el) {
            const box = el.closest('.chamber-box');
            if(!box) return null;
            const stats = findStatsElementIn(box);
            return (stats && stats.children.length > 0) ? box : null;
        }

        // 계엄령으로 하원/상원/삼원 화면이 가려진 상태에서 우클릭 내보내기를 해도, 화면에 보이는
        // "! 계엄령 선포 중 !" 경고 문구가 그대로 이미지에 담기도록 캔버스/SVG 양쪽에 오버레이를 합성한다.
        // (통계 포함 SVG 내보내기는 .chamber-box 전체를 그대로 복제하므로 이미 자동으로 포함됨 — 그 외 경로에만 필요)
        const MARTIAL_LAW_SHADE_TEXT = '! 계엄령 선포 중 — 의회 활동 정지 !';
        function isMartialLawShadedTarget(target) {
            const box = target.closest?.('.chamber-box');
            return !!box?.querySelector('.martial-law-shade');
        }
        function measureTextWidth(text, font) {
            const c = measureTextWidth._c || (measureTextWidth._c = document.createElement('canvas'));
            const ctx = c.getContext('2d');
            ctx.font = font;
            return ctx.measureText(text).width;
        }
        function drawMartialLawShadeOnCanvas(ctx, x, y, w, h, scale = 1) {
            const alertColor = getComputedStyle(document.documentElement).getPropertyValue('--tno-alert').trim() || '#ff0055';
            const fontSize = Math.round(18 * scale);
            const font = `${fontSize}px 'NeoDunggeunmo','VT323',monospace`;
            const textW = measureTextWidth(MARTIAL_LAW_SHADE_TEXT, font);
            const padX = 18 * scale, padY = 10 * scale;
            const boxW = textW + padX * 2, boxH = fontSize + padY * 2;
            const cx = x + w / 2, cy = y + h / 2;
            ctx.save();
            ctx.fillStyle = 'rgba(20,0,0,0.72)';
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
            ctx.strokeStyle = alertColor;
            ctx.lineWidth = Math.max(1, scale);
            ctx.strokeRect(cx - boxW / 2 + 0.5, cy - boxH / 2 + 0.5, boxW - 1, boxH - 1);
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = alertColor;
            ctx.shadowBlur = 8 * scale;
            ctx.fillStyle = alertColor;
            ctx.fillText(MARTIAL_LAW_SHADE_TEXT, cx, cy + 1);
            ctx.restore();
        }
        function martialLawShadeSvgMarkup(w, h) {
            const alertColor = getComputedStyle(document.documentElement).getPropertyValue('--tno-alert').trim() || '#ff0055';
            const font = `18px 'NeoDunggeunmo','VT323',monospace`;
            const textW = measureTextWidth(MARTIAL_LAW_SHADE_TEXT, font);
            const boxW = textW + 36, boxH = 38;
            const cx = w / 2, cy = h / 2;
            return `<g>`
                + `<rect x="0" y="0" width="${w}" height="${h}" fill="rgba(20,0,0,0.72)"/>`
                + `<rect x="${cx - boxW / 2}" y="${cy - boxH / 2}" width="${boxW}" height="${boxH}" fill="rgba(0,0,0,0.6)" stroke="${alertColor}"/>`
                + `<text x="${cx}" y="${cy}" fill="${alertColor}" font-family="'NeoDunggeunmo','VT323',monospace" font-size="18" text-anchor="middle" dominant-baseline="middle">${escapeXml(MARTIAL_LAW_SHADE_TEXT)}</text>`
                + `</g>`;
        }

        // 최상단 정보(국기/국가 이름/날짜/회기) 체크박스 상태 + 실제 국가 데이터를 조합해,
        // 그릴 내용이 실제로 하나라도 있을 때만 헤더 정보 객체를 반환(전부 비어있으면 null → 헤더 자체를 생략)
        function buildExportHeaderInfo(headerOptions = {}) {
            const flag = headerOptions.includeFlag && nationFlag ? nationFlag : null;
            const name = headerOptions.includeName ? (document.getElementById('nationNameInput')?.value?.trim() || '') : '';
            const date = headerOptions.includeDate ? formatNationDate() : '';
            const session = headerOptions.includeSession ? formatNationSession() : '';
            if(!flag && !name && !date && !session) return null;
            return { flag, name, date, session };
        }

        const EXPORT_HEADER_H = 60; // 헤더 높이(css px 기준, 캔버스에서는 배율(scale)을 곱해 사용)

        function escapeXml(str) {
            return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]));
        }

        function loadImageAsync(src) {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null); // 실패해도 헤더 자체는 계속 그림(국기만 생략)
                img.src = src;
            });
        }

        // 실제 화면의 object-fit:cover와 동일하게, 원본 비율을 유지한 채 대상 박스를 꽉 채우도록(넘치는 부분은 크롭) 그림
        function drawImageCover(ctx, img, x, y, w, h) {
            const srcRatio = img.width / img.height, dstRatio = w / h;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;
            if(srcRatio > dstRatio) { sw = img.height * dstRatio; sx = (img.width - sw) / 2; }
            else { sh = img.width / dstRatio; sy = (img.height - sh) / 2; }
            ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
        }

        // 캔버스에 헤더 행(국기+국가 이름 좌측, 날짜/회기 우측)을 직접 그림
        async function drawExportHeader(ctx, info, width, headerH, scale, font) {
            const pal = exportPalette();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = pal.bg;
            ctx.fillRect(0, 0, width, headerH);
            ctx.strokeStyle = pal.rule;
            ctx.lineWidth = Math.max(1, Math.round(scale));
            ctx.beginPath();
            ctx.moveTo(0, headerH - 0.5);
            ctx.lineTo(width, headerH - 0.5);
            ctx.stroke();

            const pad = Math.round(14 * scale);
            const midY = headerH / 2;
            let x = pad;

            if(info.flag) {
                const img = await loadImageAsync(info.flag);
                if(img && img.width && img.height) {
                    const fh = Math.round(36 * scale);
                    const fw = Math.round(fh * (img.width / img.height));
                    ctx.drawImage(img, x, midY - fh / 2, fw, fh);
                    x += fw + Math.round(10 * scale);
                }
            }
            if(info.name) {
                ctx.font = `${Math.round(22 * scale)}px ${font}`;
                ctx.fillStyle = pal.text;
                ctx.fillText(info.name, x, midY);
            }

            if(info.date || info.session) {
                ctx.textAlign = 'right';
                const rightX = width - pad;
                if(info.date && info.session) {
                    ctx.font = `${Math.round(16 * scale)}px ${font}`;
                    ctx.fillStyle = pal.text2;
                    ctx.fillText(info.date, rightX, midY - Math.round(9 * scale));
                    ctx.font = `${Math.round(14 * scale)}px ${font}`;
                    ctx.fillStyle = pal.text3;
                    ctx.fillText(info.session, rightX, midY + Math.round(9 * scale));
                } else {
                    ctx.font = `${Math.round(16 * scale)}px ${font}`;
                    ctx.fillStyle = pal.text2;
                    ctx.fillText(info.date || info.session, rightX, midY);
                }
                ctx.textAlign = 'left';
            }
        }

        // SVG 헤더는 <foreignObject> 없는 순수 SVG 도형(<image>/<text>)으로 직접 그림 —
        // 통계 영역의 <style> 배치 문제와 무관하게 항상 안전하게 렌더링됨
        function buildExportHeaderSvgMarkup(info, width, headerH) {
            if(!info) return '';
            const pal = exportPalette();
            const font = pal.svgFont;
            const pad = 14, midY = headerH / 2;
            let x = pad;
            let markup = `<rect x="0" y="0" width="${width}" height="${headerH}" fill="${pal.bg}"/>`
                       + `<line x1="0" y1="${headerH}" x2="${width}" y2="${headerH}" stroke="${pal.rule}" stroke-width="1"/>`;
            if(info.flag) {
                const fh = 36, fw = 54;
                markup += `<image href="${info.flag}" x="${x}" y="${midY - fh / 2}" width="${fw}" height="${fh}" preserveAspectRatio="xMidYMid slice"/>`;
                x += fw + 10;
            }
            if(info.name) {
                markup += `<text x="${x}" y="${midY}" fill="${pal.text}" font-family="${font}" font-size="22" dominant-baseline="middle">${escapeXml(info.name)}</text>`;
            }
            if(info.date || info.session) {
                const rightX = width - pad;
                if(info.date && info.session) {
                    markup += `<text x="${rightX}" y="${midY - 9}" fill="${pal.text2}" font-family="${font}" font-size="16" text-anchor="end" dominant-baseline="middle">${escapeXml(info.date)}</text>`;
                    markup += `<text x="${rightX}" y="${midY + 9}" fill="${pal.text3}" font-family="${font}" font-size="14" text-anchor="end" dominant-baseline="middle">${escapeXml(info.session)}</text>`;
                } else {
                    markup += `<text x="${rightX}" y="${midY}" fill="${pal.text2}" font-family="${font}" font-size="16" text-anchor="end" dominant-baseline="middle">${escapeXml(info.date || info.session)}</text>`;
                }
            }
            return markup;
        }

        function downloadDataUrl(dataUrl, filename) {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }

        function downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            downloadDataUrl(url, filename);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }

        // svg 요소를 그 자체(비트맵 아님, <foreignObject> 없는 순수 벡터 마크업)만으로 캔버스에 래스터화
        // — foreignObject로 임의 HTML을 담으면 Chromium이 교차출처 리소스 여부와 무관하게 캔버스를
        // "오염(tainted)"시켜 toDataURL을 막아버리므로, 통계 영역은 별도로 캔버스/SVG 기본 도형으로 직접 그린다
        function rasterizeSvgElement(svgEl, mime) {
            return new Promise((resolve, reject) => {
                const rect = svgEl.getBoundingClientRect();
                const clone = svgEl.cloneNode(true);
                clone.setAttribute('width', rect.width);
                clone.setAttribute('height', rect.height);
                const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    const scale = window.devicePixelRatio || 1;
                    const cvs = document.createElement('canvas');
                    cvs.width = Math.max(1, Math.round(rect.width * scale));
                    cvs.height = Math.max(1, Math.round(rect.height * scale));
                    const ctx = cvs.getContext('2d');
                    ctx.fillStyle = exportPalette().bg;
                    ctx.fillRect(0, 0, cvs.width, cvs.height);
                    ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                    URL.revokeObjectURL(url);
                    try { resolve(cvs); } catch(e) { reject(e); }
                };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG 렌더링 실패')); };
                img.src = url;
            });
        }

        // 통계 블록(.stat-block들) 각각에서 좌측 띠 색·이름줄(이름:의석수(%))·상태 태그(색 포함)·
        // 정당별 legend-pill(점 색+텍스트)을 구조째로 뽑아냄 — 실제 카드 디자인에 최대한 가깝게
        // 캔버스/SVG 기본 도형으로 다시 그리기 위함(사진 박스·복잡한 파벌 서식 등은 생략).
        // expandIndependents: 무소속 카드의 숨겨진 개별 의원 패널(indPanel_*)도 함께 뽑아 sub-line으로 붙임.
        // includeExtraParties: 화면에서 접혀 있어(원외정당 접기) DOM에 아예 없는 원외정당도 데이터에서 직접 행을 만들어 덧붙임.
        function extractStatsRows(statsEl, chamber, statsOptions = {}) {
            const rows = Array.from(statsEl.querySelectorAll('.stat-block')).map(block => {
                const barColor = getComputedStyle(block).borderLeftColor || '#888';
                const ref = block.querySelector('.dyn-ref');
                const headerRow = ref?.children?.[0];
                const nameSpan = headerRow?.children?.[0];
                const statusSpan = headerRow?.children?.[1];
                const nameText = (nameSpan ? nameSpan.textContent : block.textContent).replace(/\s+/g, ' ').trim();
                const nameSegments = nameSpan ? extractColoredTextSegments(nameSpan) : null;
                const statusTags = statusSpan
                    ? Array.from(statusSpan.children).map(s => ({ text: s.textContent.trim(), color: getComputedStyle(s).color })).filter(t => t.text)
                    : [];
                const pills = Array.from(block.querySelectorAll('.legend-pill')).map(p => ({
                    dotColor: getComputedStyle(p.querySelector('span')).backgroundColor || '#888',
                    text: p.textContent.trim(),
                }));
                let independentMembers = [];
                if(statsOptions.expandIndependents) {
                    const panel = block.querySelector('[id^="indPanel_"]:not([id$="_arrow"])');
                    if(panel) {
                        independentMembers = Array.from(panel.children).map(row => {
                            const kids = Array.from(row.children);
                            if(kids.length >= 4) {
                                return `${kids[1].textContent.trim()} ${kids[2].textContent.trim()} (${kids[3].textContent.trim()})`;
                            }
                            return row.textContent.replace(/\s+/g, ' ').trim();
                        }).filter(Boolean);
                    }
                }
                const photoSrc = statsOptions.includePhotos ? (block.querySelector('.leader-photo-box img')?.src || null) : null;
                return { barColor, nameText, nameSegments, statusTags, pills, independentMembers, photoSrc };
            }).filter(r => r.nameText);

            if(statsOptions.includeExtraParties && chamber) rows.push(...extractExtraPartyRows(chamber, statsOptions));
            return rows;
        }

        // 이름 줄을 색상별 조각으로 나눔 — 인라인 색이 지정된 span(비율 회색, 의석 변동 ▲초록/▼빨강 등)은
        // 화면과 같은 색·굵기를 유지하고, 나머지 일반 텍스트는 color:null(기본색)로 둔다
        function extractColoredTextSegments(el) {
            const segs = [];
            el.childNodes.forEach(node => {
                const text = node.textContent.replace(/\s+/g, ' ');
                if(!text.trim()) return;
                const isStyledEl = node.nodeType === Node.ELEMENT_NODE && node.style?.color;
                const cs = isStyledEl ? getComputedStyle(node) : null;
                segs.push({ text, color: cs ? cs.color : null, bold: cs ? parseInt(cs.fontWeight, 10) >= 600 : false });
            });
            if(!segs.length) return null;
            segs[0].text = segs[0].text.trimStart();
            segs[segs.length - 1].text = segs[segs.length - 1].text.trimEnd();
            // 화면에선 flex gap이 조각 사이를 띄워주므로, 공백 없이 맞붙는 조각 사이엔 한 칸을 넣어준다
            for(let i = 1; i < segs.length; i++) {
                if(!/\s$/.test(segs[i - 1].text) && !/^\s/.test(segs[i].text)) segs[i].text = ' ' + segs[i].text;
            }
            return segs;
        }

        // 원외정당(의석 0)은 화면에서 접혀 있으면 DOM에 카드 자체가 없으므로, 데이터에서 직접
        // 같은 모양의 행을 만들어 통계 내보내기에 추가한다 (실제 화면 접기 상태는 건드리지 않음)
        function extractExtraPartyRows(chamber, statsOptions = {}) {
            return extraParliamentaryPartyList(chamber).map(p => {
                const ideoName = ideologyName(p.ideologyId) || '';
                const statusTags = p.status === 'dissolved' ? [{ text: '해산', color: '#999' }]
                                  : p.status === 'banned' ? [{ text: '활동 금지', color: '#ff0055' }] : [];
                const isLogo = p.showLogoInStats ?? false;
                const photoSrc = (statsOptions.includePhotos && !p.hideStatsPhoto) ? ((isLogo ? (p.logoPhoto||p.leaderPhoto) : (p.leaderPhoto||p.logoPhoto)) || null) : null;
                return {
                    barColor: p.color,
                    nameText: `${p.name}${p.abbr ? ` (${p.abbr})` : ''}`,
                    statusTags,
                    pills: ideoName ? [{ dotColor: p.color, text: ideoName }] : [],
                    independentMembers: [],
                    photoSrc,
                };
            });
        }

        // 캔버스에 텍스트를 그리기 전, 사이트 웹폰트(NeoDunggeunmo)가 실제로 로드되길 기다림 —
        // 링크된 폰트라도 canvas 2D는 자동으로 기다려주지 않아 그냥 그리면 기본 폰트로 그려짐.
        // 네트워크 문제 등으로 로드가 안 되는 경우를 대비해 시간 제한을 둠(넘으면 기본 폰트로 진행)
        async function ensureExportFontsLoaded() {
            try {
                await Promise.race([
                    Promise.all([
                        document.fonts.load("15px 'NeoDunggeunmo'"),
                        document.fonts.load("bold 11px 'NeoDunggeunmo'"),
                    ]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('font-timeout')), 3000)),
                ]);
            } catch(e) { /* 실패해도 기본 폰트로 계속 진행 */ }
        }

        // 시각화(canvas 또는 svg)를 캔버스에 그린 뒤, includeStats면 그 아래에 통계 행을 이어서 그려
        // 최종 캔버스를 반환. 통계는 <foreignObject> 없이 canvas 2D 도형(rect+text)으로 직접 그림
        // (foreignObject로 그리면 Chromium이 래스터화 시 캔버스를 오염시켜 toDataURL이 막힘)
        async function renderExportCanvas(target, box, statsOptions = {}, headerOptions = {}) {
            const baseCanvas = target.tagName === 'CANVAS' ? target : await rasterizeSvgElement(target, 'image/png');
            const statsEl = box ? findStatsElementIn(box) : null;
            const chamber = statsEl ? inferChamberFromStatsId(statsEl.id) : null;
            const rows = statsEl ? extractStatsRows(statsEl, chamber, statsOptions) : [];
            const headerInfo = buildExportHeaderInfo(headerOptions);
            if(rows.length === 0 && !headerInfo) return baseCanvas;

            await ensureExportFontsLoaded();
            await Promise.all(rows.map(async row => { if(row.photoSrc) row.photoImg = await loadImageAsync(row.photoSrc); }));
            const pal = exportPalette();
            const font = pal.font;

            const scale = (baseCanvas.width / (target.clientWidth || target.getBoundingClientRect().width || baseCanvas.width)) || 1;
            const pad = Math.round(10 * scale), barW = Math.round(4 * scale);
            const nameSize = Math.round(15 * scale), tagSize = Math.round(11 * scale), pillSize = Math.round(11 * scale);
            const indLineSize = Math.round(11 * scale), indLineH = Math.round(15 * scale);
            const photoW = Math.round(40 * scale), photoH = Math.round(44 * scale), photoGap = Math.round(8 * scale);
            const baseRowH = Math.round(56 * scale);
            const rowHeights = rows.map(row => baseRowH + row.independentMembers.length * indLineH);
            const statsH = rows.length ? pad + rowHeights.reduce((a, b) => a + b, 0) + pad : 0;
            const headerH = headerInfo ? Math.round(EXPORT_HEADER_H * scale) : 0;

            const out = document.createElement('canvas');
            out.width = baseCanvas.width;
            out.height = headerH + baseCanvas.height + statsH;
            const ctx = out.getContext('2d');
            ctx.fillStyle = pal.bg;
            ctx.fillRect(0, 0, out.width, out.height);
            if(headerInfo) await drawExportHeader(ctx, headerInfo, out.width, headerH, scale, font);
            ctx.drawImage(baseCanvas, 0, headerH);
            if(isMartialLawShadedTarget(target)) drawMartialLawShadeOnCanvas(ctx, 0, headerH, baseCanvas.width, baseCanvas.height, scale);
            ctx.textBaseline = 'middle';

            let cursorY = headerH + baseCanvas.height + pad;
            rows.forEach((row, i) => {
                const y = cursorY;
                const rowH = rowHeights[i];
                const innerH = rowH - Math.round(4 * scale);
                ctx.fillStyle = pal.card;
                ctx.fillRect(pad, y, out.width - pad * 2, innerH);
                if(pal.cardBorder) {
                    ctx.strokeStyle = pal.cardBorder;
                    ctx.lineWidth = Math.max(1, Math.round(scale));
                    ctx.strokeRect(pad + 0.5, y + 0.5, out.width - pad * 2 - 1, innerH - 1);
                }
                ctx.fillStyle = row.barColor;
                ctx.fillRect(pad, y, barW, innerH);

                const photoX = pad + barW + Math.round(6 * scale);
                if(row.photoImg) {
                    const photoY = y + Math.round(4 * scale);
                    ctx.fillStyle = pal.photoBg;
                    ctx.fillRect(photoX, photoY, photoW, photoH);
                    drawImageCover(ctx, row.photoImg, photoX, photoY, photoW, photoH);
                    ctx.strokeStyle = pal.photoStroke;
                    ctx.lineWidth = Math.max(1, Math.round(scale));
                    ctx.strokeRect(photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
                }
                const textX = photoX + (row.photoImg ? photoW + photoGap : Math.round(4 * scale));
                const nameY = y + Math.round(18 * scale);

                // 우측 정렬 상태 태그 먼저 배치(자리를 먼저 차지해야 이름 줄 최대폭을 계산할 수 있음)
                ctx.font = `bold ${tagSize}px ${font}`;
                let tagX = out.width - pad - Math.round(8 * scale);
                for(let t = row.statusTags.length - 1; t >= 0; t--) {
                    const tag = row.statusTags[t];
                    const w = ctx.measureText(tag.text).width;
                    tagX -= w;
                    ctx.fillStyle = tag.color || pal.tag;
                    ctx.fillText(tag.text, tagX, nameY);
                    tagX -= Math.round(8 * scale);
                }

                // 이름 줄은 조각별로 화면과 같은 색으로 그림(의석 변동 ▲초록/▼빨강 등) — 전체 폭이 넘치면 같은 비율로 압축
                const nameMaxW = Math.max(10, tagX - textX - Math.round(6 * scale));
                const segs = row.nameSegments || [{ text: row.nameText, color: null, bold: false }];
                const segFont = s => `${s.bold ? 'bold ' : ''}${nameSize}px ${font}`;
                const segWidths = segs.map(s => { ctx.font = segFont(s); return ctx.measureText(s.text).width; });
                const fit = Math.min(1, nameMaxW / (segWidths.reduce((a, b) => a + b, 0) || 1));
                let segX = textX;
                segs.forEach((s, si) => {
                    const w = segWidths[si] * fit;
                    ctx.font = segFont(s);
                    ctx.fillStyle = s.color || pal.text;
                    ctx.fillText(s.text, segX, nameY, Math.max(1, w));
                    segX += w;
                });

                if(row.pills.length) {
                    let px = textX;
                    const py = y + Math.round(40 * scale);
                    const dotR = Math.round(3 * scale);
                    ctx.font = `${pillSize}px ${font}`;
                    for(const pill of row.pills) {
                        if(px > out.width - pad * 2) break;
                        ctx.fillStyle = pill.dotColor;
                        ctx.beginPath();
                        ctx.arc(px + dotR, py, dotR, 0, Math.PI * 2);
                        ctx.fill();
                        px += dotR * 2 + Math.round(4 * scale);
                        ctx.fillStyle = pal.pill;
                        ctx.fillText(pill.text, px, py);
                        px += ctx.measureText(pill.text).width + Math.round(10 * scale);
                    }
                }

                // 무소속 개별 의원 목록 (펼치기 체크 시) — 카드 하단에 작은 글씨로 한 줄씩 추가
                if(row.independentMembers.length) {
                    ctx.font = `${indLineSize}px ${font}`;
                    ctx.fillStyle = pal.text3;
                    row.independentMembers.forEach((line, li) => {
                        const ly = y + Math.round(52 * scale) + li * indLineH + indLineH / 2;
                        ctx.fillText('· ' + line, textX, ly, out.width - pad * 2 - (textX - pad));
                    });
                }

                cursorY += rowH;
            });
            return out;
        }

        // 같은 출처(dno.css)의 스타일 규칙 텍스트를 모아 반환 — 외부(구글 폰트 등) 스타일시트는
        // CORS 때문에 JS로 규칙을 읽을 수 없으므로 제외하고, 대신 @import로 원본 주소를 그대로 참조.
        // (이 함수는 SVG 형식 내보내기에만 쓰여 래스터화하지 않으므로, 캔버스 오염 문제와 무관함)
        let cachedInlineCss = null;
        function getExportInlineCss() {
            if(cachedInlineCss !== null) return cachedInlineCss;
            let css = "@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');\n"
                    + "@import url('https://cdn.jsdelivr.net/gh/neodgm/neodgm-webfont@latest/neodgm/style.css');\n";
            for(const sheet of document.styleSheets) {
                try { for(const rule of sheet.cssRules) css += rule.cssText + '\n'; }
                catch(e) { /* 외부(cross-origin) 스타일시트 — 건너뜀 */ }
            }
            cachedInlineCss = css;
            return css;
        }

        // 통계 포함 SVG 내보내기 — 실제 화면과 동일하게 보이도록 .chamber-box 전체를 <foreignObject>로
        // 그대로 담는다. SVG 형식은 래스터화(canvas 변환)하지 않고 파일로만 저장하므로, PNG/JPG와 달리
        // Chromium의 foreignObject 캔버스 오염 제약에 걸리지 않아 실제 카드 디자인·폰트를 온전히 담을 수 있다
        function buildStatsForeignObjectSvg(box, statsOptions = {}, headerInfo = null) {
            const rect = box.getBoundingClientRect();
            const clone = box.cloneNode(true);
            const origCanvases = Array.from(box.querySelectorAll('canvas'));
            const cloneCanvases = Array.from(clone.querySelectorAll('canvas'));
            origCanvases.forEach((orig, i) => {
                const img = document.createElement('img');
                img.src = orig.toDataURL('image/png');
                const w = orig.clientWidth || orig.width, h = orig.clientHeight || orig.height;
                img.style.cssText = `display:block;width:${w}px;height:${h}px;`;
                cloneCanvases[i]?.replaceWith(img);
            });

            // 무소속 펼치기: 화면에는 이미 렌더링돼 있지만 display:none으로 숨겨진 개별 의원
            // 패널을 복제본에서만 강제로 펼침(실제 화면 상태는 건드리지 않음)
            if(statsOptions.expandIndependents) {
                clone.querySelectorAll('[id^="indPanel_"]:not([id$="_arrow"])').forEach(panel => {
                    panel.style.display = '';
                    const arrow = clone.querySelector(`#${CSS.escape(panel.id)}_arrow`);
                    if(arrow) arrow.textContent = '▼';
                });
            }
            // 원외정당 포함하기: 접혀 있으면 카드 자체가 DOM에 없으므로, 전역 접기 상태를
            // 순간적으로(동기적으로) 펼침 상태로 바꿔 마크업만 새로 뽑아낸 뒤 즉시 원복한다
            // — 화면 리렌더링을 거치지 않으므로 실제 화면에는 아무 영향이 없다
            if(statsOptions.includeExtraParties) {
                const statsElOrig = findStatsElementIn(box);
                const chamber = statsElOrig ? inferChamberFromStatsId(statsElOrig.id) : 'house';
                const header = clone.querySelector('[onclick="toggleExtraPartiesCollapse()"]');
                if(header) {
                    const prevCollapsed = extraPartiesCollapsed;
                    extraPartiesCollapsed = false;
                    const expandedHtml = renderExtraPartiesSection(chamber);
                    extraPartiesCollapsed = prevCollapsed;
                    header.outerHTML = expandedHtml;
                }
            }
            // 당수/로고 사진 포함 체크가 꺼져 있으면 사진만 비우고(박스 자체는 남겨 레이아웃 유지) 내보냄
            if(!statsOptions.includePhotos) {
                clone.querySelectorAll('.leader-photo-box img').forEach(img => img.remove());
            }

            // 모던(라이트/다크) 테마일 땐 html[data-theme-*] 선택자를 래퍼 div의 클래스로 바꿔,
            // SVG 안(html 요소 없음)에서도 화면과 같은 테마 규칙이 적용되게 한다
            const modern = isModernTheme();
            const themeMode = document.documentElement.getAttribute('data-theme-mode');
            let css = getExportInlineCss();
            if(modern) {
                css = css.replaceAll('html[data-theme-family="modern"]', '.export-theme-modern')
                         .replaceAll('html[data-theme-mode="light"]', '.export-theme-light')
                         .replaceAll('html[data-theme-mode="dark"]', '.export-theme-dark');
            }
            const pal = exportPalette();
            const wrapClass = modern ? ` class="export-theme-modern export-theme-${themeMode}"` : '';
            const html = new XMLSerializer().serializeToString(clone);
            const headerH = headerInfo ? EXPORT_HEADER_H : 0;
            const totalH = rect.height + headerH;
            // <style>은 foreignObject 안(xhtml 문서)이 아니라 <svg> 바로 아래(형제)에 둬야 한다.
            // xhtml div 안에 넣으면 file://로 직접 열었을 때 <style> 내용이 그대로 텍스트로 노출되는데,
            // SVG 루트 레벨에 두면 동일한 CDATA로도 foreignObject 내부 요소까지 스타일이 정상 적용된다
            // (직접 만든 격리 테스트로 확인됨). CSS 본문은 XML 특수문자(&) 문제를 피하려 CDATA로 감싼다.
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${totalH}" viewBox="0 0 ${rect.width} ${totalH}">`
                + `<style><![CDATA[${css}]]></style>`
                + buildExportHeaderSvgMarkup(headerInfo, rect.width, headerH)
                + `<foreignObject y="${headerH}" width="100%" height="${rect.height}"><div xmlns="http://www.w3.org/1999/xhtml"${wrapClass} style="width:${rect.width}px;background:${pal.bg};font-family:${pal.font.replace(/"/g, "'")};">`
                + `${html}</div></foreignObject></svg>`;
        }

        // 시각화(svg 요소)만 담은 SVG 문자열을 만듦 — 통계 미포함 canvas→svg 변환용(간단히 이미지로 임베드)
        function buildExportSvgMarkup(target, box, statsOptions = {}, headerOptions = {}) {
            const headerInfo = buildExportHeaderInfo(headerOptions);
            if(box) return buildStatsForeignObjectSvg(box, statsOptions, headerInfo);
            const rect = target.getBoundingClientRect();
            const vizMarkup = (target.tagName === 'CANVAS'
                ? `<image href="${target.toDataURL('image/png')}" width="${rect.width}" height="${rect.height}"/>`
                : (() => { const c = target.cloneNode(true); c.setAttribute('width', rect.width); c.setAttribute('height', rect.height); return c.outerHTML; })())
                + (isMartialLawShadedTarget(target) ? martialLawShadeSvgMarkup(rect.width, rect.height) : '');
            const headerH = headerInfo ? EXPORT_HEADER_H : 0;
            const totalH = rect.height + headerH;
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${totalH}" viewBox="0 0 ${rect.width} ${totalH}">`
                + `<rect x="0" y="0" width="${rect.width}" height="${totalH}" fill="${exportPalette().bg}"/>`
                + buildExportHeaderSvgMarkup(headerInfo, rect.width, headerH)
                + `<g transform="translate(0, ${headerH})">${vizMarkup}</g></svg>`;
        }

        async function performExport() {
            const target = exportDialogTarget;
            const includeStats = document.getElementById('exportIncludeStats').checked;
            const statsOptions = {
                includePhotos: document.getElementById('exportIncludePhotos').checked,
                expandIndependents: document.getElementById('exportExpandIndependents').checked,
                includeExtraParties: document.getElementById('exportIncludeExtraParties').checked,
            };
            const headerOptions = {
                includeFlag: document.getElementById('exportIncludeFlag').checked,
                includeName: document.getElementById('exportIncludeName').checked,
                includeDate: document.getElementById('exportIncludeDate').checked,
                includeSession: document.getElementById('exportIncludeSession').checked,
            };
            const format = exportFormat;
            closeExportDialog();
            if(!target) return;
            try {
                await exportVisualElement(target, includeStats, format, statsOptions, headerOptions);
            } catch(e) {
                showCustomAlert('내보내기 중 오류가 발생했습니다: ' + e.message);
            }
        }

        async function exportVisualElement(target, includeStats, format, statsOptions = {}, headerOptions = {}) {
            // 내각 카드 그리드는 반원/지역구와 구조가 전혀 달라(의석 통계 없음) 별도 경로로 처리
            if(target.dataset?.exportKind === 'cabinet') {
                const filenameBase = `cabinet_${formatKstTimestampCompact()}`;
                if(format === 'svg') {
                    downloadBlob(new Blob([new XMLSerializer().serializeToString(target)], { type: 'image/svg+xml' }), `${filenameBase}.svg`);
                    return;
                }
                const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
                const cvs = await renderCabinetExportCanvas();
                downloadDataUrl(cvs.toDataURL(mime, 0.95), `${filenameBase}.${format}`);
                return;
            }
            const box = includeStats ? findExportStatsBlock(target) : null;
            const headerInfo = buildExportHeaderInfo(headerOptions);
            // 지도용 <svg>는 자체 id가 없고 감싸는 div만 id를 가지므로(예: districtSvgWrap) 그쪽으로 대체
            const nameSource = target.id || target.closest('[id]')?.id || 'export';
            const filenameBase = `${nameSource}_${formatKstTimestampCompact()}`;

            // 통계·헤더 모두 미포함 + 캔버스 + png/jpg → 캔버스를 배경색 위에 합성해서 변환
            // (반원 등은 ctx.clearRect로 그려 실제 픽셀은 투명이라, 그대로 내보내면 PNG는 배경이
            // 비어 보이고 JPG는 알파를 지원하지 않아 검게 나옴 — 통계 포함 경로와 배경을 통일)
            if(!box && !headerInfo && target.tagName === 'CANVAS' && format !== 'svg') {
                const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
                const opaque = document.createElement('canvas');
                opaque.width = target.width;
                opaque.height = target.height;
                const octx = opaque.getContext('2d');
                octx.fillStyle = exportPalette().bg;
                octx.fillRect(0, 0, opaque.width, opaque.height);
                octx.drawImage(target, 0, 0);
                if(isMartialLawShadedTarget(target)) {
                    const scale = opaque.width / (target.clientWidth || target.getBoundingClientRect().width || opaque.width) || 1;
                    drawMartialLawShadeOnCanvas(octx, 0, 0, opaque.width, opaque.height, scale);
                }
                downloadDataUrl(opaque.toDataURL(mime, 0.95), `${filenameBase}.${format}`);
                return;
            }
            // 통계·헤더 모두 미포함 + svg + svg 형식 → 마크업 그대로 직렬화(가장 흔한 경우, 벡터 그대로 보존)
            if(!box && !headerInfo && target.tagName !== 'CANVAS' && format === 'svg') {
                downloadBlob(new Blob([new XMLSerializer().serializeToString(target)], { type: 'image/svg+xml' }), `${filenameBase}.svg`);
                return;
            }

            if(format === 'svg') {
                downloadBlob(new Blob([buildExportSvgMarkup(target, box, statsOptions, headerOptions)], { type: 'image/svg+xml' }), `${filenameBase}.svg`);
                return;
            }
            const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const cvs = await renderExportCanvas(target, box, statsOptions, headerOptions);
            downloadDataUrl(cvs.toDataURL(mime, 0.95), `${filenameBase}.${format}`);
        }

        // 본원(하원/상원/삼원) 좌석 캔버스는 더 이상 호버 툴팁을 띄우지 않는다 —
        // 클릭 시 좌석 정보 카드(showSeatInfoCard)로 대체되었으므로, 호버는 커서 힌트 + 흰색 고리(토성 고리처럼 좌석과 떨어진)로 표시한다.
        function handleCanvasMouseMove(e, chamber) {
            const cvs = e.target;
            const rect = cvs.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const scaleX = cvs.width / dpr / rect.width;
            const scaleY = cvs.height / dpr / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            const dots = dotCache[chamber];
            let hit = -1;
            dots.forEach((d, i) => {
                if(Math.hypot(mx - d.x, my - d.y) <= d.r * 1.5) hit = i;
            });
            cvs.style.cursor = hit !== -1 ? 'pointer' : 'default';

            if(hoveredSeat[chamber] !== hit) {
                hoveredSeat[chamber] = hit;
                redrawChamber(cvs.id, chamber);
            }
        }

        function handleCanvasMouseLeave(e, chamber) {
            if(e?.target) e.target.style.cursor = 'default';
            if(hoveredSeat[chamber] !== -1) {
                hoveredSeat[chamber] = -1;
                redrawChamber(e.target.id, chamber);
            }
        }

        // 좌석 클릭 시 뜨는 정보 카드 (호버 대신 클릭으로 열고 닫음)
        let seatInfoCardTarget = null;
        function showSeatInfoCard(chamber, hit, clientX, clientY) {
            const card = document.getElementById('seatInfoCard');
            const body = document.getElementById('seatInfoCardBody');
            if(!card || !body) return;

            // 같은 좌석을 다시 클릭하면 닫기
            if(seatInfoCardTarget && seatInfoCardTarget.chamber === chamber && seatInfoCardTarget.hit === hit && card.style.display === 'block') {
                closeSeatInfoCard();
                return;
            }

            const d = dotCache[chamber][hit];
            if(!d) return;
            const nameLabel = d.independentName ? d.independentName : d.partyName;
            const seatLabel = d.independentSeatIndex
                ? `#${computeIndependentOffset(chamber) + d.independentSeatIndex}`
                : `#${hit+1}`;

            const titleEl = document.getElementById('seatInfoCardTitle');
            if(titleEl) {
                const baseTitle = d.partyName === '무소속'
                    ? `${d.independentName || '무소속'} ${seatLabel}`
                    : `좌석 정보 ${seatLabel}`;
                titleEl.textContent = d.isRuling ? `★ ${baseTitle}` : baseTitle;
            }

            const rows = [];
            if(d.partyName !== '무소속') rows.push(`정당: ${nameLabel}`);
            if(d.factionName) rows.push(`파벌: ${d.factionName}`);
            rows.push(`이념: ${d.ideology}`);
            if(d.coalitionName) rows.push(`연정: ${d.coalitionName}`);
            else if(d.externalSupport) rows.push(`연정: <span style="color:var(--tno-gold);font-weight:bold;border-bottom:2px dashed var(--tno-gold);" title="연정에 정식 참여하지 않지만 신임투표·예산안 등에서 정부를 지지">${d.externalSupport} (C&S)</span>`);
            if(d.partyStatus === 'dissolved') rows.push(`상태: <span class="party-status-badge status-dissolved">해산</span>`);
            if(d.partyStatus === 'banned') rows.push(`상태: <span class="party-status-badge status-banned">활동 금지</span>`);
            body.innerHTML = rows.map(r => `<div>${r}</div>`).join('');

            seatInfoCardTarget = { chamber, hit };
            card.style.display = 'block';
            positionFloatingBox(card, clientX, clientY);
        }

        function closeSeatInfoCard() {
            seatInfoCardTarget = null;
            const card = document.getElementById('seatInfoCard');
            if(card) card.style.display = 'none';
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
                // 이미 표결 확정된 법안: 확정 당시 얼려둔 수치를 그대로 사용 (이후 정당 구성이 바뀌어도 그래프 불변)
                yea = bill[voteKey].yea; nay = bill[voteKey].nay; abs = bill[voteKey].abs;
                validSeats = bill[voteKey].total ?? total; // 구버전 파일 호환: total 없으면 현재 값으로 대체
            } else {
                yea=0; nay=0; abs=0;
                const dots = dotCache[chamber];
                dots.forEach((d, i) => {
                    if(d.partyName === 'Vacant' || d.partyStatus==='banned') return;
                    const v = voteState[chamber][i] || 'none';
                    if(v==='yea') yea++;
                    else if(v==='nay') nay++;
                    else if(v==='abs') abs++;
                });
                // 활동 금지된 정당은 표결에 참여할 수 없으므로 유효 의석(과반 기준)에서 제외
                validSeats = dots.filter(d=>d.partyName!=='Vacant' && d.partyStatus!=='banned').length;
            }
            const none = validSeats - yea - nay - abs;
            const t = validSeats || 1;

            // 현재 법안의 가결 기준 적용 (확정된 표결이면 확정 당시 required도 함께 사용)
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

            // 기준선 표시 마커 (표결 바에만)
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
                labelEl.textContent = `${thLabel} (${required}석)`;
            }

            const thresholdLabels = { 0.5:'과반', 0.667:'2/3', 0.75:'3/4', 1.0:'전원일치' };
            const thLabel = getThresholdLabel(threshold, bill?.numer, bill?.denom);

            // 부가 정보 (찬성수/기준, 기준명, 부족석)
            const infoEl = document.getElementById(prefix+'VoteInfo');
            if(infoEl) {
                if(yea + nay + abs === 0) {
                    infoEl.textContent = `기준: ${thLabel}, ${required}석 필요`;
                } else if(yea >= required) {
                    infoEl.textContent = `${yea} / ${required} (${thLabel})`;
                } else {
                    infoEl.textContent = `${yea} / ${required} (${thLabel}, ${required - yea}석 부족)`;
                }
            }

            // 판정문 (원래 형식)
            const vEl = document.getElementById(prefix+'Verdict');
            vEl.className = 'vote-verdict';
            const billTitle = activeBillId ? (bills.find(b=>b.id===activeBillId)?.title || '법안') : '법안';
            if(yea + nay + abs === 0) {
                vEl.textContent = '-- 표결 대기 중 --';
                vEl.classList.add('verdict-pending');
            } else if(yea >= required) {
                vEl.textContent = `✔ 가결 (${billTitle})`;
                vEl.classList.add('verdict-pass');
            } else {
                vEl.textContent = `✘ 부결 (${billTitle})`;
                vEl.classList.add('verdict-fail');
            }
        }

        // ===== 의원실 중앙 표시 (의석 수 / 로고) — 국가>설정에서 의원실별로 선택 =====
        let chamberLogos = { house: '', senate: '', third: '' };
        let chamberCenterMode = { house: 'seats', senate: 'seats', third: 'seats' }; // 'seats' | 'logo'
        const chamberLogoImgCache = { house: null, senate: null, third: null }; // { src, img } — 매 프레임 새로 디코딩하지 않도록 캐시

        // ── 의회 > 의회 설정: 각 원의 의장/부의장 ──────────────
        // deputies: 부의장 — 여러 명 추가/삭제 가능 (기본 0명), 부총리(deputyPms)와 동일한 패턴
        let chamberLeaders = {
            house:  { speaker: { name: '', photo: '' }, deputies: [] },
            senate: { speaker: { name: '', photo: '' }, deputies: [] },
            third:  { speaker: { name: '', photo: '' }, deputies: [] },
        };

        function renderChamberLeaders() {
            const container = document.getElementById('chamberLeadersList');
            if(!container) return;
            const chambers = chamberList();
            const chamberLabel = {
                house:  document.getElementById('houseNameInput')?.value  || '하원',
                senate: document.getElementById('senateNameInput')?.value || '상원',
                third:  document.getElementById('thirdNameInput')?.value  || '삼원',
            };
            container.innerHTML = chambers.map(ch => {
                const deputies = chamberLeaders[ch].deputies || [];
                return `
                <div style="margin-bottom:16px;">
                    <div style="color:#666;font-size:0.8rem;margin-bottom:8px;letter-spacing:1px;">▌ ${chamberLabel[ch]}</div>
                    <div class="dyn-row" style="display:flex;gap:10px;align-items:stretch;margin-bottom:8px;">
                        <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:44px;height:55px;flex-shrink:0;" title="클릭하여 사진 업로드">
                            ${chamberLeaders[ch].speaker.photo ? `<img src="${chamberLeaders[ch].speaker.photo}" alt="">` : '<div class="photo-ph" style="font-size:1.3rem;">👤</div>'}
                            <input type="file" accept="image/*" onchange="uploadChamberLeaderPhoto(this,'${ch}')">
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0;">
                            <span style="color:#888;font-size:0.78rem;">의장</span>
                            <input type="text" value="${chamberLeaders[ch].speaker.name||''}" placeholder="의장 이름"
                                style="background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.9rem;padding:4px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateChamberLeader('${ch}','name',this.value)">
                        </div>
                    </div>
                    ${deputies.map((d, i) => `
                        <div class="dyn-row" style="display:flex;gap:10px;align-items:stretch;margin-bottom:8px;">
                            <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:44px;height:55px;flex-shrink:0;" title="클릭하여 사진 업로드">
                                ${d.photo ? `<img src="${d.photo}" alt="">` : '<div class="photo-ph" style="font-size:1.3rem;">👤</div>'}
                                <input type="file" accept="image/*" onchange="uploadChamberDeputyPhoto(this,'${ch}','${d.id}')">
                            </div>
                            <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0;">
                                <span style="color:#888;font-size:0.78rem;">${deputies.length > 1 ? '부의장'+(i+1) : '부의장'}</span>
                                <input type="text" value="${d.name||''}" placeholder="부의장 이름"
                                    style="background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.9rem;padding:4px 8px;width:100%;box-sizing:border-box;"
                                    onchange="updateChamberDeputy('${ch}','${d.id}','name',this.value)">
                            </div>
                            <button onclick="removeChamberDeputy('${ch}','${d.id}')" style="align-self:center;background:transparent;border:1px solid #333;color:#a55;font-family:inherit;font-size:0.75rem;padding:4px 8px;cursor:pointer;flex-shrink:0;">삭제</button>
                        </div>
                    `).join('')}
                    <button class="add-btn" style="margin-top:0;" onclick="addChamberDeputy('${ch}')">[+] 부의장 추가</button>
                </div>
            `;
            }).join('');
            fitDynPhotos(container);
            renderAllChamberLeaderDisplays();
        }

        // 하원/상원/삼원 표시 패널(제목바 아래, 반원 캔버스 위)에 의장/부의장을 사진+이름으로 표시
        // — 의장·부의장 둘 다 비어 있으면(아직 지정 안 함) 자리 자체를 만들지 않고 숨김
        function renderChamberLeaderDisplay(ch) {
            const container = document.getElementById(ch + 'LeadersDisplay');
            if(!container) return;
            const speaker = chamberLeaders[ch]?.speaker || { name: '', photo: '' };
            const deputies = chamberLeaders[ch]?.deputies || [];
            if(!speaker.name && !speaker.photo && deputies.length === 0) { container.innerHTML = ''; return; }
            const chip = (label, name, photo, small) => `
                <div style="display:flex;align-items:center;gap:6px;">
                    <div class="leader-photo-box" style="width:${small?26:32}px;height:${small?33:40}px;flex-shrink:0;pointer-events:none;">
                        ${photo ? `<img src="${photo}" alt="">` : `<div class="photo-ph" style="font-size:${small?0.7:0.8}rem;">👤</div>`}
                    </div>
                    <div style="display:flex;flex-direction:column;line-height:1.25;min-width:0;">
                        <span style="color:#555;font-size:0.62rem;">${label}</span>
                        <span style="color:#ccc;font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${name || '미지정'}</span>
                    </div>
                </div>`;
            container.innerHTML = `<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:8px;">
                ${chip('의장', speaker.name, speaker.photo, false)}
                ${deputies.map((d, i) => chip(deputies.length > 1 ? `부의장${i+1}` : '부의장', d.name, d.photo, true)).join('')}
            </div>`;
        }

        function renderAllChamberLeaderDisplays() {
            ['house', 'senate', 'third'].forEach(renderChamberLeaderDisplay);
        }

        function updateChamberLeader(ch, key, val) {
            if(!chamberLeaders[ch]) return;
            chamberLeaders[ch].speaker[key] = val;
            renderChamberLeaderDisplay(ch);
        }

        function uploadChamberLeaderPhoto(input, ch) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => { chamberLeaders[ch].speaker.photo = e.target.result; renderChamberLeaders(); };
            reader.readAsDataURL(file);
        }

        function addChamberDeputy(ch) {
            if(!chamberLeaders[ch]) return;
            chamberLeaders[ch].deputies.push({ id: 'cd_'+Date.now()+'_'+Math.floor(Math.random()*1000), name: '', photo: '' });
            renderChamberLeaders();
        }

        function removeChamberDeputy(ch, id) {
            if(!chamberLeaders[ch]) return;
            chamberLeaders[ch].deputies = chamberLeaders[ch].deputies.filter(d => d.id !== id);
            renderChamberLeaders();
        }

        function updateChamberDeputy(ch, id, key, val) {
            const d = chamberLeaders[ch]?.deputies.find(x => x.id === id);
            if(d) d[key] = val;
            renderChamberLeaderDisplay(ch);
        }

        function uploadChamberDeputyPhoto(input, ch, id) {
            const file = input.files?.[0]; if(!file) return;
            const d = chamberLeaders[ch]?.deputies.find(x => x.id === id);
            if(!d) return;
            const reader = new FileReader();
            reader.onload = e => { d.photo = e.target.result; renderChamberLeaders(); };
            reader.readAsDataURL(file);
        }

        // 이미지가 준비되어 있으면 반환, 아직 로딩 중이면 null (로딩 완료 시 onReady로 재요청)
        function getChamberLogoImage(chamber, onReady) {
            const src = chamberLogos[chamber];
            if(!src) return null;
            const cache = chamberLogoImgCache[chamber];
            if(cache && cache.src === src) return (cache.img.complete && cache.img.naturalWidth > 0) ? cache.img : null;
            const img = new Image();
            img.onload = () => { onReady && onReady(); };
            img.src = src;
            chamberLogoImgCache[chamber] = { src, img };
            return null;
        }

        // 국가>설정에서 고른 모드(의석 수/로고)에 따라 반원 중앙에 표시할 내용을 그림
        // width: 반원 캔버스 전체 너비 — 중앙 빈 공간 크기에 비례해서 로고 크기를 정하기 위해 사용
        function drawChamberCenter(ctx, CX, CY, total, chamber, cvsId, width) {
            const useLogo = chamberCenterMode[chamber] === 'logo' && chamberLogos[chamber];
            const img = useLogo ? getChamberLogoImage(chamber, () => redrawChamber(cvsId, chamber)) : null;
            if(img) {
                const boxSize = Math.max(34, Math.min((width || 0) * 0.132, 156));
                // 로고 하단이 기존 "SEATS" 글씨 하단부(CY+27 부근)를 넘지 않도록, 그 지점에 맞춰 위로 배치
                const centerY = (CY + 27) - boxSize / 2;
                const ratio = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1;
                if(Math.abs(ratio - 1) < 0.05) {
                    // 정사각형(=대개 원형 로고)에 가까우면 기존과 동일하게 원형 클립 + 꽉 채우기
                    // (정사각형을 정사각형 박스에 그리는 것이므로 늘어남 없이 예전과 같은 결과)
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(CX, centerY, boxSize / 2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, CX - boxSize / 2, centerY - boxSize / 2, boxSize, boxSize);
                    ctx.restore();
                } else {
                    // 직사각형 로고: 원형으로 강제 크롭·왜곡하지 않고, 원본 비율 그대로 boxSize 안에 맞춰(contain) 그림
                    const drawW = ratio >= 1 ? boxSize : boxSize * ratio;
                    const drawH = ratio >= 1 ? boxSize / ratio : boxSize;
                    ctx.drawImage(img, CX - drawW / 2, centerY - drawH / 2, drawW, drawH);
                }
                return;
            }
            const modernFont = isModernTheme() ? tc('', '--m-font') : null;
            ctx.fillStyle = tc("#fff", '--m-text');
            ctx.font = modernFont ? `700 30px ${modernFont}` : "30px 'NeoDunggeunmo'";
            ctx.textAlign = "center";
            ctx.fillText(total, CX, CY);
            ctx.font = modernFont ? `500 13px ${modernFont}` : "16px 'NeoDunggeunmo'";
            ctx.fillStyle = tc("#fff", '--m-text-3');
            ctx.fillText("SEATS", CX, CY + 25);
        }

        function setChamberCenterMode(chamber, mode) {
            chamberCenterMode[chamber] = mode;
            updateChamberCenterModeUI(chamber);
            simulate();
        }
        function updateChamberCenterModeUI(chamber) {
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            const mode = chamberCenterMode[chamber] || 'seats';
            document.getElementById('chamberCenterModeSeatsBtn' + suf)?.classList.toggle('active', mode === 'seats');
            document.getElementById('chamberCenterModeLogoBtn' + suf)?.classList.toggle('active', mode === 'logo');
        }

        function uploadChamberLogo(input, chamber) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                chamberLogos[chamber] = e.target.result;
                chamberLogoImgCache[chamber] = null;
                updateChamberLogoUI(chamber);
                simulate();
            };
            reader.readAsDataURL(file);
        }
        function removeChamberLogo(chamber) {
            chamberLogos[chamber] = '';
            chamberLogoImgCache[chamber] = null;
            updateChamberLogoUI(chamber);
            simulate();
        }
        function updateChamberLogoUI(chamber) {
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            const box = document.getElementById('chamberLogoPreview' + suf);
            const removeBtn = document.getElementById('chamberLogoRemoveBtn' + suf);
            const src = chamberLogos[chamber];
            // 파일 input을 함께 다시 그려야 함 — 이미지/플레이스홀더만 교체하면 업로드용 input이 사라져
            // 이후 클릭해도 파일 선택창이 뜨지 않게 되는 문제가 있었음
            if(box) box.innerHTML = (src ? `<img src="${src}" alt="">` : '<div class="photo-ph">⚑</div>') +
                `<input type="file" accept="image/*" onchange="uploadChamberLogo(this,'${chamber}')">`;
            if(removeBtn) removeBtn.style.display = src ? '' : 'none';
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
                if(d.partyStatus === 'banned') {
                    ctx.shadowColor = "rgba(255, 0, 85, 0.8)";
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = "#ff0055";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                } else if(d.isRuling && highlightGov) {
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

                // 호버 중인 좌석: 토성 고리처럼 좌석과 떨어진 흰색 고리
                if(hoveredSeat[chamber] === i) {
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r * 1.14, 0, Math.PI*2);
                    ctx.strokeStyle = tc('#fff', '--m-text');
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = 'rgba(255,255,255,0.6)';
                    ctx.shadowBlur = 6;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            });

            // Center text
            const total = dots.length;
            const CX = dots[0]?.cx ?? W/2;
            const CY = dots[0]?.cy ?? H - 40;
            drawChamberCenter(ctx, CX, CY, total, chamber, cvsId, W);
        }


        // ===== 캔버스 테마 색 =====
        // 캔버스는 CSS 변수를 못 쓰므로, 모던(라이트/다크) 모드일 때만 디자인 토큰의 실제 값을 읽어 쓰고
        // 네온 모드에서는 넘겨받은 기존 색을 그대로 돌려준다 (네온 모드 화면·내보내기는 픽셀 단위로 그대로)
        let canvasTokenCache = null;
        function isModernTheme() {
            return document.documentElement.getAttribute('data-theme-family') === 'modern';
        }
        function tc(tnoColor, token) {
            if(!isModernTheme()) return tnoColor;
            const mode = document.documentElement.getAttribute('data-theme-mode');
            if(!canvasTokenCache || canvasTokenCache.mode !== mode) canvasTokenCache = { mode, vals: {} };
            const vals = canvasTokenCache.vals;
            if(!(token in vals)) vals[token] = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
            return vals[token] || tnoColor;
        }
        // 내보내기(PNG/JPG/SVG) 색·폰트 — 화면과 같은 테마로 내보낸다
        function exportPalette() {
            return {
                bg: tc('#0a0c10', '--m-surface'),
                card: tc('#000', '--m-surface'),
                cardBorder: isModernTheme() ? tc('', '--m-border') : null,
                photoBg: tc('#0a0c10', '--m-surface-2'),
                photoStroke: tc('#222', '--m-border'),
                rule: tc('#333', '--m-border'),
                text: tc('#eee', '--m-text'),
                text2: tc('#ccc', '--m-text-2'),
                text3: tc('#888', '--m-text-3'),
                pill: tc('#aaa', '--m-text-2'),
                tag: tc('#fff', '--m-text'),
                font: isModernTheme() ? tc('', '--m-font') : "'NeoDunggeunmo','VT323',monospace",
                svgFont: isModernTheme() ? tc('', '--m-font').replace(/"/g, "'") : 'NeoDunggeunmo, VT323, monospace',
            };
        }

        // ===== MAIN SIMULATE =====
        window.addEventListener('resize', () => { simulate(); });

        // 캔버스는 CSS 폭(100%)만 컨테이너를 따라가고 비트맵은 마지막으로 그린 크기 그대로라, 창 크기·패널 폭이
        // 바뀌면 다시 그리기 전까지 가로로 찌그러진다. simulate()가 다시 그리지 않는 선거 결과·지역구 캔버스까지
        // 포함해, 화면 비율과 비트맵 비율이 어긋난 캔버스만 마지막으로 그렸던 데이터로 다시 그린다
        const lastChamberDraw = {};
        const lastElecDistrictDraw = {};
        function redrawCanvasForCurrentSize(cvs) {
            const id = cvs.id;
            if(lastChamberDraw[id]) {
                const a = lastChamberDraw[id];
                drawChamber(id, a.map, a.total, a.chamber);
                return;
            }
            let m = id.match(/^(house|senate|third)DistrictCanvas$/);
            if(m) { drawChamberDistrict(m[1]); return; }
            m = id.match(/^elecDistrictResultCanvas(House|Senate|Third)$/);
            if(m) {
                const chamber = m[1].toLowerCase();
                const a = lastElecDistrictDraw[chamber];
                if(a) elecDrawDistrictResult(a.districtResults, a.progress, chamber);
                return;
            }
            if(id === 'districtCanvas') districtDrawCanvas();
        }
        function isCanvasDistorted(cvs) {
            if(!cvs.offsetParent || !cvs.width || !cvs.height || !cvs.clientWidth || !cvs.clientHeight) return false;
            return Math.abs((cvs.clientWidth / cvs.clientHeight) / (cvs.width / cvs.height) - 1) > 0.01;
        }
        const pendingCanvasRedraws = new Set();
        const canvasResizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
            entries.forEach(e => pendingCanvasRedraws.add(e.target));
            requestAnimationFrame(() => {
                const targets = Array.from(pendingCanvasRedraws);
                pendingCanvasRedraws.clear();
                targets.forEach(cvs => { if(isCanvasDistorted(cvs)) redrawCanvasForCurrentSize(cvs); });
            });
        });
        window.addEventListener('load', () => {
            if(!canvasResizeObserver) return;
            ['house', 'senate', 'third'].forEach(ch => {
                const suf = ch.charAt(0).toUpperCase() + ch.slice(1);
                [ch + 'Canvas', ch + 'DistrictCanvas', 'elecCanvas' + suf, 'elecDistrictResultCanvas' + suf].forEach(id => {
                    const el = document.getElementById(id);
                    if(el) canvasResizeObserver.observe(el);
                });
            });
            const districtCvs = document.getElementById('districtCanvas');
            if(districtCvs) canvasResizeObserver.observe(districtCvs);
        });

        // 다른 탭(설정 화면)에서 테마를 바꾸면, 캔버스에 직접 그린 색(좌석 수 글씨·빈 지역구 칸 등)도 새 테마로 다시 그린다
        window.addEventListener('thememodechange', () => {
            canvasTokenCache = null;
            simulate();
            document.querySelectorAll('canvas').forEach(cvs => { if(cvs.offsetParent) redrawCanvasForCurrentSize(cvs); });
            if(document.getElementById('regionMapWrap')?.offsetParent) renderRegionMap(); // 권역 지도 바탕색(라이트/다크)
            if(districtSvgMap) { districtUpdateModeUI(); districtRenderMap(); } // 지역구 테두리 색(라이트/다크 고정색)
        });
        let suppressAutosaveOnUnload = false;

        // ── 새로 시작할 때 쓰는 깨끗한 기본 상태 ──
        // setAppState는 저장 기록에 없는 값(지역구 격자·성향 등)을 건드리지 않고 그대로 두기 때문에, 화면에 떠 있던
        // 이전 세이브의 값이 섞여 들어갈 수 있다. 새 세이브·프리셋·구버전/외부 파일은 먼저 깨끗한 기본 상태로 되돌린 뒤 적용한다.
        let FRESH_STATE_JSON = null;
        function freshAppState() { return FRESH_STATE_JSON ? JSON.parse(FRESH_STATE_JSON) : null; }
        function applyStateFromScratch(state) {
            const fresh = freshAppState();
            if(fresh) setAppState(fresh);
            if(state) setAppState(state);
        }
        // 지금 버전이 저장한 세이브는 모든 값을 담고 있어 바로 적용하고(빠름), 빠진 값이 있는 기록만 기본 상태부터 적용
        function stateIsComplete(state) {
            const e = state && state.election;
            return !!(e && e.elecStore && e.district && e.district.grid && e.tendency && e.tendency.data);
        }
        function applyStateSafely(state) {
            if(stateIsComplete(state)) setAppState(state);
            else applyStateFromScratch(state);
        }
        window.addEventListener('beforeunload', () => { if(autosaveEnabled && !suppressAutosaveOnUnload) autosaveNow(); });

        window.onload = function() {
            // 아무것도 불러오기 전의 깨끗한 기본 상태를 기억해 둔다 — 새 세이브·프리셋은 여기서부터 시작
            try { FRESH_STATE_JSON = JSON.stringify(getAppState()); } catch(e) { FRESH_STATE_JSON = null; }
            let restored = false;
            let bootNewSaveName = null;
            let bootPresetId = null;
            try {
                loadAutosavePreference();
                let bootSlotId = null;
                let bootImportedJSON = null;
                try {
                    bootImportedJSON = sessionStorage.getItem('dnoBootImportedStateJSON');
                    sessionStorage.removeItem('dnoBootImportedStateJSON');
                    bootSlotId = sessionStorage.getItem('dnoBootLoadSlotId');
                    sessionStorage.removeItem('dnoBootLoadSlotId');
                    bootNewSaveName = sessionStorage.getItem('dnoBootNewSaveName');
                    sessionStorage.removeItem('dnoBootNewSaveName');
                    bootPresetId = sessionStorage.getItem('dnoBootPresetId');
                    sessionStorage.removeItem('dnoBootPresetId');
                } catch(e) { /* sessionStorage 접근 불가 — 일반 부팅으로 진행 */ }
                if(bootImportedJSON) {
                    try { applyStateSafely(JSON.parse(bootImportedJSON)); setActiveSlotId(null); restored = true; }
                    catch(e) { restored = false; }
                } else if(bootNewSaveName) {
                    restored = false;
                } else if(bootSlotId) {
                    const slot = loadSaveSlots().find(s => s.id === bootSlotId);
                    if(slot) { applyStateSafely(slot.state); setActiveSlotId(slot.isAutosave ? (slot.parentId || null) : slot.id); restored = true; }
                    else restored = autosaveEnabled && loadFromAutosave();
                } else {
                    restored = autosaveEnabled && loadFromAutosave();
                }
            } catch(e) { /* 자동저장 초기화 실패 — 기본 상태로 계속 진행 */ }
            if(!restored) { toggleSystem(); simulate(); refreshUI(); renderBillList(); renderArchiveList(); syncBillSelect(); elecRenderList(); elecRenderRecords(); updateNationIdBar(); updateDispInfoBar(); renderCabinetRoleLabelInputs(); }
            // 프리셋으로 시작: 프리셋을 불러와 적용한 뒤에 새 세이브로 등록·자동저장한다 (먼저 자동저장하면
            // 아직 적용 전인 기본 상태가 "새 의회 (1)"을 덮어쓰게 되므로 그 전에는 저장하지 않음)
            if(bootPresetId) { startFromPresetOnBoot(bootPresetId, bootNewSaveName); return; }
            try {
                if(bootNewSaveName) createNamedSlotFromCurrentState(bootNewSaveName);
                if(autosaveEnabled) { autosaveNow(); startAutosaveTimer(); }
                renderSaveTabUI();
            } catch(e) { /* 자동저장 UI 갱신 실패는 앱 동작에 영향 없음 */ }
        };

        // 이름이 겹치면 " (2)", " (3)"...을 붙여 비어 있는 이름을 만든다
        function escapeHtmlText(text) {
            const div = document.createElement('div');
            div.textContent = text == null ? '' : String(text);
            return div.innerHTML;
        }

        function uniqueSaveName(base) {
            const names = new Set(loadSaveSlots().filter(s => !s.isAutosave).map(s => s.name));
            if(!names.has(base) && base !== AUTOSAVE_SLOT_NAME) return base;
            for(let i = 2; ; i++) { const n = `${base} (${i})`; if(!names.has(n)) return n; }
        }

        // 온보딩(main.html)에서 프리셋을 골라 들어온 경우 — 프리셋을 복제해 새 세이브로 만들고 그 세이브로 시작
        async function startFromPresetOnBoot(presetId, name) {
            let preset = null;
            try {
                preset = await DnoPresets.find(presetId);
                const state = await DnoPresets.loadState(preset);
                applyStateFromScratch(state); // 프리셋에 없는 값은 이전 세이브가 아니라 기본값으로
                simulate(); refreshUI();
                createNamedSlotFromCurrentState(uniqueSaveName(name || preset.title));
            } catch(e) {
                showCustomAlert('프리셋을 불러오지 못했습니다.');
            }
            try {
                if(autosaveEnabled) { autosaveNow(); startAutosaveTimer(); }
                renderSaveTabUI();
            } catch(e) { /* 자동저장 UI 갱신 실패는 앱 동작에 영향 없음 */ }
            if(preset && preset.tutorial && window.DnoTutorial) window.DnoTutorial.start();
        }

        // ===== SAVE / LOAD (v5) =====
        // 저장 형식 식별자 — 이름을 Hemicycle로 바꾸면서 새 형식으로. 예전 형식(DATANET)도 그대로 읽고,
        // 읽는 순간 새 식별자로 고쳐 두어 다음 저장부터는 Hemicycle 형식으로 남는다
        const SAVE_APP_ID = 'HEMICYCLE';
        const LEGACY_SAVE_APP_IDS = ['DATANET_PARLIAMENT_SIM'];
        function getAppState() {
            const systemType = document.querySelector('input[name="systemType"]:checked')?.value || 'bicameral';
            return {
                meta: { app: SAVE_APP_ID, version: "1.3", savedAt: new Date().toISOString() },
                ui: { currentMainTab, currentSubTab },
                config: {
                    systemType,
                    highlightGov:  document.getElementById('chkGovHighlight')?.checked ?? true,
                    nationName:    document.getElementById('nationNameInput')?.value   ?? "",
                    nationFlag,
                    nationDateMode: nationDateMode,
                    nationDate:    document.getElementById('nationDateInput')?.value    ?? "",
                    nationDateYear:  document.getElementById('nationDateYear')?.value   ?? "",
                    nationDateMonth: document.getElementById('nationDateMonth')?.value  ?? "",
                    nationDateDay:   document.getElementById('nationDateDay')?.value    ?? "",
                    nationSessionMode: nationSessionMode,
                    nationSession: document.getElementById('nationSessionInput')?.value ?? "",
                    nationSessionTerm:   document.getElementById('nationSessionTerm')?.value   ?? "",
                    nationSessionOrgName: document.getElementById('nationSessionOrgName')?.value ?? "",
                    nationSessionNumber: document.getElementById('nationSessionNumber')?.value ?? "",
                    nationSessionType: nationSessionType,
                    nationNextSessionType: nationNextSessionType,
                    nationAutoRegularSession: !!document.getElementById('nationAutoRegularSession')?.checked,
                    nationRegularSessionMonth: document.getElementById('nationRegularSessionMonth')?.value ?? "9",
                    nationRegularSessionDay: document.getElementById('nationRegularSessionDay')?.value ?? "1",
                    nationAutoTermOnElection: !!document.getElementById('nationAutoTermOnElection')?.checked,
                    govType: govType,
                    president: president,
                    pm: pm,
                    deputyPms: JSON.parse(JSON.stringify(deputyPms)),
                    collectiveChair: collectiveChair,
                    cabinetMembers: JSON.parse(JSON.stringify(cabinetMembers)),
                    cabinetRoleLabels: { ...cabinetRoleLabels },
                    pmDirectElectionEnabled: pmDirectElectionEnabled,
                    pmMajorityLocked: pmMajorityLocked,
                    splitDissolutionHolders: splitDissolutionHolders,
                    constructiveNoConfidence: constructiveNoConfidence,
                    pmNominee: pmNominee,
                    pmNomineeBillId: pmNomineeBillId,
                    vetoHolder: vetoHolder,
                    emergencyPowers: JSON.parse(JSON.stringify(emergencyPowers)),
                    cabinetCouncilVote: JSON.parse(JSON.stringify(cabinetCouncilVote)),
                    chamberLeaders: JSON.parse(JSON.stringify(chamberLeaders)),
                    senateName:    document.getElementById('senateNameInput')?.value   ?? "상원",
                    houseName:     document.getElementById('houseNameInput')?.value    ?? "국회",
                    thirdName:     document.getElementById('thirdNameInput')?.value    ?? "삼원",
                    senateTotal:   parseInt(document.getElementById('senateTotal')?.value)  || 100,
                    houseTotal:    parseInt(document.getElementById('houseTotal')?.value)   || 300,
                    thirdTotal:    parseInt(document.getElementById('thirdTotal')?.value)   || 100,
                    chamberLogos:  { ...chamberLogos },
                    chamberCenterMode: { ...chamberCenterMode }
                },
                parliament: { ideologies, parties, coalitions, manualSort, independents, listMembers: JSON.parse(JSON.stringify(listMembers)) },
                legislation: {
                    bills,
                    activeBillId,
                    activeCouncilBillId,
                    councilVoteThreshold,
                    councilVoteNumer,
                    councilVoteDenom,
                    voteState,
                    activeBillTagFilter,
                    activeArchiveTagFilter,
                    activeArchiveStatusFilter
                },
                election: {
                    elecStore:      JSON.parse(JSON.stringify(elecStore)),
                    elecRecords:    JSON.parse(JSON.stringify(elecRecords)),
                    elecLastResult: elecLastResult ? JSON.parse(JSON.stringify(elecLastResult)) : null,
                    elecLastResults: JSON.parse(JSON.stringify(elecLastResults)),
                    elecTitle:      document.getElementById('elecTitle')?.value  || '',
                    elecYear:       document.getElementById('elecYear')?.value   || '',
                    presElectionMode: presElectionMode,
                    presElectionChamberBasis: presElectionChamberBasis,
                    presElectionRecords: JSON.parse(JSON.stringify(presElectionRecords)),
                    presElectionLastResult: presElectionLastResult ? JSON.parse(JSON.stringify(presElectionLastResult)) : null,
                    pmElectionLastResult: pmElectionLastResult ? JSON.parse(JSON.stringify(pmElectionLastResult)) : null,
                    presElectionCandidateOverrides: JSON.parse(JSON.stringify(presElectionCandidateOverrides)),
                    electionKind: electionKind,
                    presElecTitle:  document.getElementById('presElecTitle')?.value || '',
                    presElecYear:   document.getElementById('presElecYear')?.value  || '',
                    pmElecTitle:    document.getElementById('pmElecTitle')?.value || '',
                    pmElecYear:     document.getElementById('pmElecYear')?.value  || '',
                    district: {
                        grid: JSON.parse(JSON.stringify(districtGrid)),
                        view: { ...districtView },
                        names: JSON.parse(JSON.stringify(districtNames)),
                        population: JSON.parse(JSON.stringify(districtPopulation)),
                        order: JSON.parse(JSON.stringify(districtOrder)),
                        members: JSON.parse(JSON.stringify(districtMembers)),
                        mapMode: districtMapMode,
                        svgMap: districtSvgMap ? JSON.parse(JSON.stringify(districtSvgMap)) : null,
                        seatCounts: JSON.parse(JSON.stringify(districtSeatCounts)),
                        svgTendency: JSON.parse(JSON.stringify(districtSvgTendency)),
                        abbr: JSON.parse(JSON.stringify(districtAbbr))
                    },
                    tendency: {
                        data:     JSON.parse(JSON.stringify(tendencyData)),
                        strength: tendencyStrength
                    },
                    regionSystem: {
                        electionSystem: JSON.parse(JSON.stringify(electionSystem)),
                        regions: JSON.parse(JSON.stringify(regions)),
                        districtRegionMap: JSON.parse(JSON.stringify(districtRegionMap)),
                        regionVoteMode: JSON.parse(JSON.stringify(regionVoteMode)),
                        regionVoteStore: JSON.parse(JSON.stringify(regionVoteStore))
                    }
                }
            };
        }

        // KST(UTC+9) 기준 압축 타임스탬프 — YYYYMMDDHHmmssSSS (구분자 없이, 파일명용)
        function formatKstTimestampCompact(date = new Date()) {
            const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
            const pad = (n, len = 2) => String(n).padStart(len, '0');
            return `${kst.getUTCFullYear()}${pad(kst.getUTCMonth() + 1)}${pad(kst.getUTCDate())}` +
                   `${pad(kst.getUTCHours())}${pad(kst.getUTCMinutes())}${pad(kst.getUTCSeconds())}${pad(kst.getUTCMilliseconds(), 3)}`;
        }

        function saveJSON() {
            const state = getAppState();
            downloadJSON(`dno-save-v1.3-${formatKstTimestampCompact()}.json`, state);
        }

        function setAppState(state) {
            if(!state || typeof state !== "object") throw new Error("Invalid state");

            // ── 의회 설정 복원 (v5/v4/v3 공통, v2 하위호환) ──
            const parl = state.parliament || state.data;
            if(!parl || !Array.isArray(parl.parties) || !Array.isArray(parl.ideologies) || !Array.isArray(parl.coalitions))
                throw new Error("Invalid parliament data");

            ideologies = parl.ideologies;
            parties    = parl.parties.map(p => ({ leaderName:'', leaderPhoto:'', floorLeaderName:'', floorLeaderPhoto:'', logoPhoto:'', showLogoInStats:false, hideStatsPhoto:false, description:'', factions:[], seatsThird:0, inThird:false, abbr:'', fraudAttempt:null, ...p, factions:(p.factions||[]).map(f=>({leaderName:'',leaderPhoto:'',logoPhoto:'',usePartyColor:false,seatsThird:0,...f})) }));
            coalitions = parl.coalitions.map(c => ({ leadPartyId:null, externalSupporters:[], externalSupportLabel:'각외협력', ...c }));
            manualSort = parl.manualSort ?? false;
            // 구버전 저장 파일 호환: districtKey 필드가 없으면 비례(미연결) 무소속으로 취급
            independents = Array.isArray(parl.independents) ? parl.independents.map(x => ({ districtKey:null, ...x })) : [];
            listMembers = parl.listMembers ? { house:{}, senate:{}, third:{}, ...parl.listMembers } : { house:{}, senate:{}, third:{} };

            // ── 입법 절차 복원 ──
            const leg = state.legislation || {};
            bills = (Array.isArray(leg.bills) ? leg.bills : (Array.isArray(state.data?.bills) ? state.data.bills : []))
                // v12: version/parentBillId/isAmendment/voteHistory (개정안·버전·세부 표결 기록) 추가
                // v14: vetoStatus (거부권 서명/거부 여부) 추가
                // v15: tabledTo (국회/국무회의 상정 대상) 추가 — 구버전 파일은 전부 국회로 취급
                .map(b => ({ tags:[], threshold:0.5, numer:null, denom:null, thirdStatus:'pending', thirdVote:null, voteDate:'', version:1, parentBillId:null, isAmendment:false, voteHistory:[], vetoStatus:'pending', tabledTo:'parliament', ...b }));
            activeBillId           = leg.activeBillId           ?? null;
            activeCouncilBillId    = leg.activeCouncilBillId    ?? null;
            councilVoteThreshold   = leg.councilVoteThreshold   ?? 0.5;
            councilVoteNumer       = leg.councilVoteNumer       ?? null;
            councilVoteDenom       = leg.councilVoteDenom       ?? null;
            voteState              = leg.voteState              ?? { house:{}, senate:{}, third:{} };
            if(!voteState.third) voteState.third = {};
            activeBillTagFilter    = leg.activeBillTagFilter    ?? null;
            activeArchiveTagFilter = leg.activeArchiveTagFilter ?? null;
            activeArchiveStatusFilter = leg.activeArchiveStatusFilter ?? null;

            // ── 선거 데이터 복원 ──
            const elec = state.election || {};
            // 지지율 저장소 복원 (v13: 의원실별 분리 { house:{}, senate:{}, third:{} } / v12 이하: 단일 목록 → 모든 의원실에 동일 적용)
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
            elecLastResults = (elec.elecLastResults && typeof elec.elecLastResults === 'object') ? elec.elecLastResults : {};
            const ge = id => document.getElementById(id);
            if(ge('elecTitle')) ge('elecTitle').value = elec.elecTitle || '';
            if(ge('elecYear'))  ge('elecYear').value  = elec.elecYear  || '';
            presElectionMode = ['plurality','runoff','electoral'].includes(elec.presElectionMode) ? elec.presElectionMode : 'plurality';
            presElectionChamberBasis = elec.presElectionChamberBasis || 'house';
            presElectionRecords = Array.isArray(elec.presElectionRecords) ? elec.presElectionRecords : [];
            presElectionLastResult = elec.presElectionLastResult ?? null;
            pmElectionLastResult = elec.pmElectionLastResult ?? null;
            presElectionCandidateOverrides = (elec.presElectionCandidateOverrides && typeof elec.presElectionCandidateOverrides === 'object') ? elec.presElectionCandidateOverrides : {};
            electionKind = elec.electionKind === 'pm' ? 'pm' : 'member';
            if(ge('presElecTitle')) ge('presElecTitle').value = elec.presElecTitle || '';
            if(ge('presElecYear'))  ge('presElecYear').value  = elec.presElecYear  || '';
            if(ge('pmElecTitle')) ge('pmElecTitle').value = elec.pmElecTitle || '';
            if(ge('pmElecYear'))  ge('pmElecYear').value  = elec.pmElecYear  || '';
            // 지역구 (v6 이하: house/senate만, v9: third 포함, v11: 이름/순서 포함, v12: 당선 의원 정보 포함)
            if(elec.district?.grid) {
                const g = elec.district.grid;
                if(g.house !== undefined) districtGrid = { house:g.house||{}, senate:g.senate||{}, third:g.third||{} };
                else districtGrid = { house: g, senate: {}, third: {} };
            }
            if(elec.district?.view) Object.assign(districtView, elec.district.view);
            districtNames = elec.district?.names ? { house:{}, senate:{}, third:{}, ...elec.district.names } : { house:{}, senate:{}, third:{} };
            districtPopulation = elec.district?.population ? { house:{}, senate:{}, third:{}, ...elec.district.population } : { house:{}, senate:{}, third:{} };
            districtOrder = elec.district?.order ? { house:[], senate:[], third:[], ...elec.district.order } : { house:[], senate:[], third:[] };
            districtMembers = elec.district?.members ? { house:{}, senate:{}, third:{}, ...elec.district.members } : { house:{}, senate:{}, third:{} };
            districtMapMode = elec.district?.mapMode === 'svg' ? 'svg' : 'hex';
            districtSvgMap = elec.district?.svgMap || null;
            districtSeatCounts = elec.district?.seatCounts || {};
            districtSvgTendency = elec.district?.svgTendency || {};
            districtAbbr = elec.district?.abbr || {};
            ['house','senate','third'].forEach(ch => districtOrderSync(ch)); // 구버전 파일은 순서 배열이 없으므로 좌표 등장순으로 자동 생성
            selectedDistrictKey = null;
            districtUpdateModeUI();
            // 성향
            if(elec.tendency?.data) tendencyData = elec.tendency.data;
            if(typeof elec.tendency?.strength === 'number') { tendencyStrength = elec.tendency.strength; tendencySetStrength(tendencyStrength); }
            // 권역형 비례대표 시스템
            const rs = elec.regionSystem || {};
            electionSystem = {
                house:  { listScope: 'national', compensationPct: 100, ...(rs.electionSystem?.house  || {}) },
                senate: { listScope: 'national', compensationPct: 100, ...(rs.electionSystem?.senate || {}) },
                third:  { listScope: 'national', compensationPct: 100, ...(rs.electionSystem?.third  || {}) },
            };
            regions = { house: [], senate: [], third: [], ...(rs.regions || {}) };
            districtRegionMap = { house: {}, senate: {}, third: {}, ...(rs.districtRegionMap || {}) };
            regionVoteMode = { house: 'auto', senate: 'auto', third: 'auto', ...(rs.regionVoteMode || {}) };
            regionVoteStore = { house: {}, senate: {}, third: {}, ...(rs.regionVoteStore || {}) };
            regionActiveId = null;

            // ── UI 설정 복원 ──
            const cfg = state.config || {};
            const radio = document.querySelector(`input[name="systemType"][value="${cfg.systemType || 'bicameral'}"]`);
            if(radio) radio.checked = true;
            const gd = id => document.getElementById(id);
            if(gd('senateNameInput')) gd('senateNameInput').value = cfg.senateName  ?? "상원";
            if(gd('houseNameInput'))  gd('houseNameInput').value  = cfg.houseName   ?? "국회";
            if(gd('thirdNameInput'))  gd('thirdNameInput').value  = cfg.thirdName   ?? "삼원";
            if(gd('senateTotal'))     gd('senateTotal').value     = cfg.senateTotal ?? 100;
            if(gd('houseTotal'))      gd('houseTotal').value      = cfg.houseTotal  ?? 300;
            if(gd('thirdTotal'))      gd('thirdTotal').value      = cfg.thirdTotal  ?? 100;
            chamberLogos = { house:'', senate:'', third:'', ...(cfg.chamberLogos||{}) };
            chamberCenterMode = { house:'seats', senate:'seats', third:'seats', ...(cfg.chamberCenterMode||{}) };
            chamberLogoImgCache.house = chamberLogoImgCache.senate = chamberLogoImgCache.third = null;
            ['house','senate','third'].forEach(ch => { updateChamberLogoUI(ch); updateChamberCenterModeUI(ch); });
            if(gd('chkGovHighlight')) gd('chkGovHighlight').checked = cfg.highlightGov ?? true;
            if(gd('nationNameInput')) gd('nationNameInput').value = cfg.nationName ?? "";
            if(gd('nationDateInput')) gd('nationDateInput').value = cfg.nationDate ?? "";
            if(gd('nationDateYear'))  gd('nationDateYear').value  = cfg.nationDateYear ?? "";
            if(gd('nationDateMonth')) gd('nationDateMonth').value = cfg.nationDateMonth ?? "";
            if(gd('nationDateDay'))   gd('nationDateDay').value   = cfg.nationDateDay ?? "";
            if(gd('nationSessionInput')) gd('nationSessionInput').value = cfg.nationSession ?? "";
            if(gd('nationSessionTerm'))   gd('nationSessionTerm').value   = cfg.nationSessionTerm ?? "";
            if(gd('nationSessionOrgName')) gd('nationSessionOrgName').value = cfg.nationSessionOrgName ?? "";
            if(gd('nationSessionNumber')) gd('nationSessionNumber').value = cfg.nationSessionNumber ?? "";
            nationFlag = cfg.nationFlag ?? "";
            setNationDateMode(cfg.nationDateMode ?? "simple");
            setNationSessionMode(cfg.nationSessionMode ?? "simple");
            setNationSessionType(cfg.nationSessionType ?? "regular");
            setNationNextSessionType(cfg.nationNextSessionType ?? cfg.nationSessionType ?? "regular"); // 예전 파일: 다음 회기도 지금과 같은 종류
            { // 자동 진행 설정 (예전 파일: 꺼짐 · 정기회 9월 1일)
                const set = (id, prop, v) => { const el = document.getElementById(id); if(el) el[prop] = v; };
                set('nationAutoRegularSession', 'checked', !!cfg.nationAutoRegularSession);
                set('nationRegularSessionMonth', 'value', cfg.nationRegularSessionMonth ?? '9');
                set('nationRegularSessionDay', 'value', cfg.nationRegularSessionDay ?? '1');
                set('nationAutoTermOnElection', 'checked', !!cfg.nationAutoTermOnElection);
            }
            president = { name: '', photo: '', partyId: null, linkedSeat: null, ...(cfg.president || {}) };
            pm = { name: '', photo: '', partyId: null, linkedSeat: null, ...(cfg.pm || {}) };
            if(Array.isArray(cfg.deputyPms)) {
                deputyPms = cfg.deputyPms.map(d => ({ position: '', partyId: null, linkedSeat: null, ...d }));
            } else if(cfg.deputyPm && (cfg.deputyPm.name || cfg.deputyPm.photo || cfg.deputyPm.partyId || cfg.deputyPm.linkedSeat)) {
                // 구버전 저장 파일(단일 부총리) 마이그레이션 — 값이 있으면 부총리 1명으로 이관
                deputyPms = [{ id: 'dpm_'+Date.now(), position: '', partyId: null, linkedSeat: null, ...cfg.deputyPm }];
            } else {
                deputyPms = [];
            }
            collectiveChair = { name: '', photo: '', partyId: null, linkedSeat: null, ...(cfg.collectiveChair || {}) };
            cabinetMembers = Array.isArray(cfg.cabinetMembers) ? cfg.cabinetMembers.map(m => ({ partyId: null, linkedSeat: null, ...m })) : [];
            cabinetRoleLabels = { president: '', pm: '', deputyPm: '', chair: '', cabinetMember: '', ...(cfg.cabinetRoleLabels || {}) };
            pmDirectElectionEnabled = !!cfg.pmDirectElectionEnabled;
            pmMajorityLocked = !!cfg.pmMajorityLocked;
            splitDissolutionHolders = !!cfg.splitDissolutionHolders;
            constructiveNoConfidence = !!cfg.constructiveNoConfidence;
            pmNominee = { name: '', photo: '', partyId: null, linkedSeat: null, ...(cfg.pmNominee || {}) };
            pmNomineeBillId = cfg.pmNomineeBillId ?? null;
            Object.keys(EMERGENCY_POWERS).forEach(k => {
                emergencyPowers[k] = { holder: 'none', active: false, ...(k==='martialLaw'?{suspendParliament:false}:{}), ...(cfg.emergencyPowers?.[k] || {}) };
            });
            cabinetCouncilVote = { ...(cfg.cabinetCouncilVote || {}) };
            ['house','senate','third'].forEach(ch => {
                const savedCh = cfg.chamberLeaders?.[ch];
                // 구버전 세이브 호환: 부의장이 단일 객체(deputy)였던 것을 배열(deputies)로 이전
                let deputies;
                if(Array.isArray(savedCh?.deputies)) deputies = savedCh.deputies.map(d => ({ id: d.id || ('cd_'+Date.now()+'_'+Math.floor(Math.random()*1000)), name: '', photo: '', ...d }));
                else if(savedCh?.deputy && (savedCh.deputy.name || savedCh.deputy.photo)) deputies = [{ id: 'cd_'+Date.now()+'_'+Math.floor(Math.random()*1000), name: savedCh.deputy.name || '', photo: savedCh.deputy.photo || '' }];
                else deputies = [];
                chamberLeaders[ch] = {
                    speaker: { name: '', photo: '', ...(savedCh?.speaker || {}) },
                    deputies,
                };
            });
            setGovType(cfg.govType ?? "parliamentary");
            setVetoHolder(cfg.vetoHolder ?? "none");
            renderNationConfig();
            setPresElectionMode(presElectionMode);
            setPresElectionChamberBasis(presElectionChamberBasis);
            renderPresElecResultPanel();

            // ── 전체 렌더 ──
            toggleSystem();
            updateNames();
            refreshUI();
            simulate();
            renderBillList();
            renderArchiveList();
            applyMartialLawEffects();
            syncBillSelect();
            renderActiveBillDisplay();
            renderCouncilActiveBillDisplay();
            renderCouncilThresholdUI();
            updateConfirmButtons();
            renderBulkPartyList();
            elecRenderList();
            elecRenderRecords();
            renderAllChamberLeaderDisplays();

            // ── 탭 복원 (마지막) ──
            let uiMain = state.ui?.currentMainTab || 'setup';
            const uiSub  = state.ui?.currentSubTab  || { setup:'party', law:'bill' };
            currentSubTab = { setup:'party', ...uiSub };
            // 구버전 파일 호환: 정당 메인탭이 의회로 통합되기 전 위치를 가리키던 경우 재매핑
            // (당시 party>ideology/partyInfo/leader/coalitionLeader/independent 중 무엇이었든, 지금은 모두 setup>party로 합쳐짐)
            if(uiMain === 'party') { uiMain = 'setup'; currentSubTab.setup = 'party'; }
            // 구버전 파일 호환: setup 하위탭이 house/senate/third/leader였다면 새 구조로 매핑
            if(['house','senate','third'].includes(currentSubTab.setup)) currentSubTab.setup = 'settings';
            // 구버전 파일 호환: 입법/기록 메인탭이 국가로 통합되기 전 위치를 가리키던 경우 재매핑
            // (옛 메인탭 키 legislation/record가 그대로 새 nation 서브탭 키로 재사용됨)
            if(uiMain === 'legislation' || uiMain === 'record') { currentSubTab.nation = uiMain; uiMain = 'nation'; }
            if(currentSubTab.election === 'record') currentSubTab.election = 'vote';
            // 구버전 파일 호환: 저장 메인탭이 국가>설정 하단으로 통합되기 전 위치를 가리키던 경우 재매핑
            if(uiMain === 'save') { uiMain = 'nation'; currentSubTab.nation = 'symbol'; }
            // 국가 > 저장은 떠 있는 저장 창으로 옮겨짐 — 예전 파일이 저장 탭을 가리키면 상징으로
            if(currentSubTab.nation === 'save' || currentSubTab.nation === 'date') currentSubTab.nation = 'symbol'; // 저장 · 날짜는 떠 있는 창으로 옮겨짐
            // 구버전 파일 호환: 국가 > 선거 / ⚠ 가 선거 메인탭으로 옮겨지기 전 위치
            if(currentSubTab.nation === 'election' || currentSubTab.nation === 'fraud') {
                currentSubTab.vote = currentSubTab.nation === 'fraud' ? 'fraud' : 'elecGeneral';
                delete currentSubTab.nation;
                if(uiMain === 'nation') uiMain = 'vote';
            }
            // 구버전 파일 호환: 국가 > 입법 / 기록이 입법 메인탭으로 옮겨지기 전 위치
            if(currentSubTab.nation === 'legislation' || currentSubTab.nation === 'record') {
                currentSubTab.law = currentSubTab.nation === 'record' ? 'archive' : 'bill';
                delete currentSubTab.nation;
                if(uiMain === 'nation') uiMain = 'law';
            }
            // 구버전 파일 호환: 국가 > 의회가 의회 > 의회 설정으로 옮겨지기 전 위치
            if(currentSubTab.nation === 'assembly' || currentSubTab.nation === 'config') {
                if(uiMain === 'nation') { uiMain = 'setup'; currentSubTab.setup = 'assembly'; }
                delete currentSubTab.nation;
            }
            switchMainTab(uiMain);
            if(uiMain !== 'election') {
                switchSubTab(uiMain, currentSubTab[uiMain] || defaultSubTabFor(uiMain), false);
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
            applyStateSafely(obj);
        }

        // ===== 저장 슬롯 (localStorage) =====
        // 이름 붙인 세이브마다 자기 전용 자동저장 슬롯("{이름} 자동저장")을 따로 가진다 —
        // 그 세이브를 불러오거나 만든 이후로는 자동저장이 그 전용 슬롯에만 계속 덮어써지고,
        // 세이브 자체(수동 저장 지점)와 다른 세이브들에는 영향이 없다. 아직 어떤 이름 붙은
        // 세이브도 활성화하지 않은 기본 상태에서는 "새 의회 (1)"이라는 전역 자동저장 슬롯
        // 하나에 계속 덮어쓴다 (예전 버전에서 "자동저장"이라 부르던 바로 그 슬롯).
        // Safari의 file:// 접근 차단, 프라이빗 모드, 저장소 차단 설정 등에서는
        // localStorage 자체에 접근하는 것만으로도 예외가 발생할 수 있으므로
        // 모든 접근을 반드시 try/catch로 감싼다 — 그렇지 않으면 window.onload 안에서
        // 예외가 나는 순간 이후의 전체 초기화 코드가 실행되지 않아 앱 자체가 먹통이 된다.
        const SAVE_SLOTS_KEY = 'dnoParliamentSaveSlots';
        const LEGACY_AUTOSAVE_KEY = 'dnoParliamentAutosave'; // 세이브 슬롯 통합 이전, 단일 키에 저장하던 구버전 자동저장
        const ACTIVE_SLOT_KEY = 'dnoParliamentActiveSlotId'; // 현재 이어서 플레이 중인 이름 붙은 세이브의 id (없으면 기본 자동저장 사용)
        const AUTOSAVE_ENABLED_KEY = 'dnoParliamentAutosaveEnabled';
        const AUTOSAVE_INTERVAL_KEY = 'dnoParliamentAutosaveIntervalSec';
        const AUTOSAVE_INTERVAL_OPTIONS = [15, 30, 60, 180, 300, 600]; // 초 단위 — 15초/30초/1분/3분/5분/10분
        const AUTOSAVE_INTERVAL_DEFAULT = 15;
        const AUTOSAVE_SLOT_ID = 'autosave';
        const AUTOSAVE_SLOT_NAME = '새 의회 (1)';
        const MAX_SAVE_SLOTS = 20; // 전용 자동저장 슬롯 제외, 사용자가 이름 붙인 슬롯 기준
        let autosaveEnabled = true;
        let autosaveIntervalSec = AUTOSAVE_INTERVAL_DEFAULT;
        let autosaveTimer = null;
        let localStorageAvailable = true;
        let activeSlotId = null;

        function checkLocalStorageAvailable() {
            try {
                const testKey = '__dno_ls_test__';
                localStorage.setItem(testKey, '1');
                localStorage.removeItem(testKey);
                return true;
            } catch(e) { return false; }
        }

        function safeLsGet(key) {
            try { return localStorage.getItem(key); } catch(e) { return null; }
        }
        function safeLsSet(key, value) {
            try { localStorage.setItem(key, value); return true; } catch(e) { return false; }
        }
        function safeLsRemove(key) {
            try { localStorage.removeItem(key); } catch(e) { /* 무시 */ }
        }

        function normalizeSaveMeta(state) {
            if(!state || typeof state !== 'object') return false;
            if(!state.meta || typeof state.meta !== 'object') { state.meta = { app: SAVE_APP_ID }; return true; }
            if(state.meta.app === SAVE_APP_ID) return false;
            state.meta.app = SAVE_APP_ID;
            return true;
        }

        function loadSaveSlots() {
            if(!localStorageAvailable) return [];
            let slots;
            try { slots = JSON.parse(safeLsGet(SAVE_SLOTS_KEY) || '[]'); } catch(e) { return []; }
            // 기본(전역) 자동저장 슬롯은 항상 현재 이름으로 — 예전 이름("기존 저장")으로 저장된 기록도 새 이름으로 보이고, 다음 저장 때 반영됨
            if(Array.isArray(slots)) slots.forEach(s => { if(s && s.isAutosave && !s.parentId) s.name = AUTOSAVE_SLOT_NAME; });
            // 브라우저에 남아 있던 예전 형식(DATANET) 세이브는 읽을 때 Hemicycle 형식으로 바꿔 한 번 다시 저장
            if(Array.isArray(slots)) {
                let migrated = false;
                slots.forEach(sl => { if(sl && normalizeSaveMeta(sl.state)) migrated = true; });
                if(migrated) persistSaveSlots(slots);
            }
            return slots;
        }
        function persistSaveSlots(slots) { return safeLsSet(SAVE_SLOTS_KEY, JSON.stringify(slots)); }
        // 기본(전역) 자동저장 — 특정 세이브에 연결되지 않은 "새 의회 (1)" 슬롯
        function getAutosaveSlot(slots) { return slots.find(s => s.isAutosave && !s.parentId); }
        // parentId로 연결된, 특정 이름 붙은 세이브 전용 자동저장 슬롯
        function getNamedAutosaveSlot(slots, parentId) { return slots.find(s => s.isAutosave && s.parentId === parentId); }

        function loadActiveSlotId() { activeSlotId = safeLsGet(ACTIVE_SLOT_KEY) || null; }
        function setActiveSlotId(id) {
            activeSlotId = id || null;
            if(activeSlotId) safeLsSet(ACTIVE_SLOT_KEY, activeSlotId);
            else safeLsRemove(ACTIVE_SLOT_KEY);
            // 무엇이든 열면(탭 전환·세이브 열기·새로 만들기) 그 탭을 탭 바에 띄우고 빈 화면 상태를 끝낸다
            ensureTabOpen(currentTabId());
            setNoOpenTab(false);
        }

        // 구버전(단일 AUTOSAVE_KEY) 자동저장 데이터를 새 통합 슬롯 배열로 옮김 —
        // 그렇지 않으면 이전 버전을 쓰던 사용자가 업데이트 후 "저장이 사라졌다"고 느끼게 됨.
        function migrateLegacyAutosave() {
            const legacyRaw = safeLsGet(LEGACY_AUTOSAVE_KEY);
            if(!legacyRaw) return;
            const slots = loadSaveSlots();
            if(getAutosaveSlot(slots)) { safeLsRemove(LEGACY_AUTOSAVE_KEY); return; }
            let legacyState;
            try { legacyState = JSON.parse(legacyRaw); } catch(e) { safeLsRemove(LEGACY_AUTOSAVE_KEY); return; }
            slots.unshift({ id: AUTOSAVE_SLOT_ID, name: AUTOSAVE_SLOT_NAME, isAutosave: true,
                savedAt: legacyState?.meta?.savedAt || new Date().toISOString(), state: legacyState });
            persistSaveSlots(slots);
            safeLsRemove(LEGACY_AUTOSAVE_KEY);
        }

        // ===== 열린 탭 목록 (진짜 프로그램처럼) — 탭을 닫아도 세이브는 지워지지 않는다(삭제는 저장 목록에서) =====
        // 저장값이 없으면(이전 버전) 기본 세션 + 모든 세이브가 열린 것으로 본다. 탭을 모두 닫으면 아래 화면은 빈다.
        const OPEN_TABS_KEY = 'dnoOpenSaveTabs';
        let noOpenTab = false;
        function currentTabId() { return activeSlotId || AUTOSAVE_SLOT_ID; }
        function loadOpenTabs(slots = loadSaveSlots()) {
            const named = slots.filter(s => !s.isAutosave).sort((a,b) => new Date(a.createdAt||a.savedAt||0) - new Date(b.createdAt||b.savedAt||0));
            let ids = null;
            try { ids = JSON.parse(safeLsGet(OPEN_TABS_KEY) || 'null'); } catch(e) { ids = null; }
            if(!Array.isArray(ids)) ids = [AUTOSAVE_SLOT_ID, ...named.map(n => n.id)];
            const valid = new Set([AUTOSAVE_SLOT_ID, ...named.map(n => n.id)]);
            return ids.filter((id, i) => valid.has(id) && ids.indexOf(id) === i);
        }
        function saveOpenTabs(ids) { if(localStorageAvailable) safeLsSet(OPEN_TABS_KEY, JSON.stringify(ids)); }
        function ensureTabOpen(id) {
            const ids = loadOpenTabs();
            if(!ids.includes(id)) { ids.push(id); saveOpenTabs(ids); }
        }
        function setNoOpenTab(on) {
            noOpenTab = !!on;
            document.body?.classList.toggle('no-open-tab', noOpenTab);
        }
        // 탭 닫기 — 지금 탭을 닫으면 오른쪽(없으면 왼쪽) 탭으로 옮겨 가고, 남은 탭이 없으면 빈 화면
        function closeSaveTab(id) {
            const ids = loadOpenTabs();
            const idx = ids.indexOf(id);
            if(idx < 0) return;
            const isCurrent = !noOpenTab && id === currentTabId();
            const doClose = () => {
                if(isCurrent) autosaveNow();
                ids.splice(idx, 1);
                saveOpenTabs(ids);
                if(!isCurrent) { renderSaveTabBar(); return; }
                const next = ids[idx] || ids[idx - 1];
                setNoOpenTab(true);
                if(next) switchToSaveTab(next);
                else { hideSaveTabNewInput(); renderSaveTabUI(); }
            };
            if(isCurrent && !autosaveEnabled && localStorageAvailable) showCustomConfirm('이 탭을 닫을까요?\n자동저장이 꺼져 있어 저장하지 않은 변경사항은 사라집니다.', doClose);
            else doClose();
        }

        function loadAutosavePreference() {
            localStorageAvailable = checkLocalStorageAvailable();
            if(!localStorageAvailable) { autosaveEnabled = false; return; }
            migrateLegacyAutosave();
            loadActiveSlotId();
            ensureTabOpen(currentTabId());
            const stored = safeLsGet(AUTOSAVE_ENABLED_KEY);
            autosaveEnabled = stored === null ? true : stored === 'true';
            const storedInterval = parseInt(safeLsGet(AUTOSAVE_INTERVAL_KEY), 10);
            autosaveIntervalSec = AUTOSAVE_INTERVAL_OPTIONS.includes(storedInterval) ? storedInterval : AUTOSAVE_INTERVAL_DEFAULT;
        }

        function setAutosaveInterval(sec) {
            sec = parseInt(sec, 10);
            if(!AUTOSAVE_INTERVAL_OPTIONS.includes(sec)) return;
            autosaveIntervalSec = sec;
            safeLsSet(AUTOSAVE_INTERVAL_KEY, String(sec));
            if(autosaveEnabled) startAutosaveTimer();
        }

        function setAutosaveEnabled(enabled) {
            if(!localStorageAvailable) {
                showCustomAlert('이 브라우저/환경에서는 자동저장(localStorage)을 사용할 수 없습니다.\n(예: 파일을 직접 열었거나, 브라우저의 저장소 차단 설정)');
                renderSaveTabUI();
                return;
            }
            autosaveEnabled = enabled;
            safeLsSet(AUTOSAVE_ENABLED_KEY, String(enabled));
            if(enabled) { autosaveNow(); startAutosaveTimer(); }
            else stopAutosaveTimer();
            renderSaveTabUI();
        }

        // 활성 세이브(activeSlotId)가 있으면 그 세이브 전용 자동저장 슬롯에,
        // 없으면 기본 "새 의회 (1)" 슬롯에 계속 덮어쓴다.
        function autosaveNow() {
            if(!autosaveEnabled || !localStorageAvailable || noOpenTab) return; // 탭을 모두 닫은 빈 화면에선 저장할 것이 없음
            const slots = loadSaveSlots();
            const savedAt = new Date().toISOString();
            const state = getAppState();
            if(activeSlotId) {
                const parent = slots.find(s => s.id === activeSlotId && !s.isAutosave);
                if(!parent) { setActiveSlotId(null); autosaveNow(); return; } // 부모 세이브가 삭제됨 — 기본 자동저장으로 폴백
                const companion = getNamedAutosaveSlot(slots, activeSlotId);
                const companionName = `${parent.name} 자동저장`;
                if(companion) { companion.state = state; companion.savedAt = savedAt; companion.name = companionName; }
                else slots.push({ id: 'autoOf_'+activeSlotId, name: companionName, isAutosave: true, parentId: activeSlotId, savedAt, state });
            } else {
                const auto = getAutosaveSlot(slots);
                if(auto) { auto.state = state; auto.savedAt = savedAt; }
                else slots.unshift({ id: AUTOSAVE_SLOT_ID, name: AUTOSAVE_SLOT_NAME, isAutosave: true, savedAt, state });
            }
            persistSaveSlots(slots);
            renderSaveTabUI();
        }

        function startAutosaveTimer() {
            stopAutosaveTimer();
            autosaveTimer = setInterval(autosaveNow, autosaveIntervalSec * 1000);
        }
        function stopAutosaveTimer() {
            if(autosaveTimer) { clearInterval(autosaveTimer); autosaveTimer = null; }
        }

        // 활성 세이브가 있으면 그 세이브의 전용 자동저장을, 없으면 기본 "새 의회 (1)"을 복원
        function loadFromAutosave() {
            if(!localStorageAvailable) return false;
            const slots = loadSaveSlots();
            const auto = activeSlotId ? getNamedAutosaveSlot(slots, activeSlotId) : getAutosaveSlot(slots);
            if(!auto) return false;
            try { setAppState(auto.state); return true; }
            catch(e) { return false; }
        }

        function resetAutosaveData() {
            showCustomConfirm('현재 자동저장 데이터를 삭제하고 처음 상태로 되돌리시겠습니까?\n(이름 붙여 저장한 슬롯과 다른 세이브의 자동저장에는 영향이 없습니다)', () => {
                suppressAutosaveOnUnload = true;
                const slots = loadSaveSlots();
                const targetId = activeSlotId ? getNamedAutosaveSlot(slots, activeSlotId)?.id : AUTOSAVE_SLOT_ID;
                persistSaveSlots(slots.filter(s => s.id !== targetId));
                location.reload();
            });
        }

        function renderSaveTabUI() {
            renderSaveSlotList();
            renderSaveTabBar();
            renderSaveCurrentCard();
            const toggle = document.getElementById('autosaveToggle');
            const info = document.getElementById('autosaveStatusText');
            const intervalSelect = document.getElementById('autosaveIntervalSelect');
            if(intervalSelect) intervalSelect.value = String(autosaveIntervalSec);
            if(!localStorageAvailable) {
                if(toggle) { toggle.checked = false; toggle.disabled = true; }
                if(intervalSelect) intervalSelect.disabled = true;
                if(info) info.textContent = '이 환경에서는 자동저장을 사용할 수 없음';
                return;
            }
            if(toggle) { toggle.checked = autosaveEnabled; toggle.disabled = false; }
            if(intervalSelect) intervalSelect.disabled = false;
            if(!info) return;
            if(!autosaveEnabled) { info.textContent = '꺼짐'; return; }
            const slots = loadSaveSlots();
            const auto = activeSlotId ? getNamedAutosaveSlot(slots, activeSlotId) : getAutosaveSlot(slots);
            info.textContent = auto?.savedAt ? `마지막 저장(${auto.name}): ${new Date(auto.savedAt).toLocaleString('ko-KR')}` : '자동저장된 데이터 없음';
        }

        // ===== 이름 붙여 저장 =====
        // "민주화 이전", "2차 총선 직후"처럼 여러 시점을 따로 보관하고 언제든 전환하고 싶을 때 쓰는
        // 이름 붙는 저장 슬롯 — 파일로 저장(.json)과 달리 다운로드 없이 브라우저(localStorage)에만
        // 보관되므로 다른 브라우저/기기에서는 보이지 않는다. 저장하는 순간 그 세이브가 "활성" 상태가
        // 되어 이후 자동저장은 이 슬롯이 아니라 "{이름} 자동저장"이라는 전용 슬롯에 계속 덮어써진다.
        // "새 의회 (1)"이라는 이름은 예약되어 있어 쓸 수 없다.
        function saveNamedSlot() {
            if(!localStorageAvailable) { alert('이 브라우저/환경에서는 저장 슬롯(localStorage)을 사용할 수 없습니다.'); return; }
            const input = document.getElementById('saveSlotNameInput');
            const name = (input?.value || '').trim();
            if(!name) { alert('저장할 이름을 입력하세요.'); return; }
            if(name === AUTOSAVE_SLOT_NAME) { alert(`"${AUTOSAVE_SLOT_NAME}"은(는) 예약된 이름입니다. 다른 이름을 입력하세요.`); return; }
            const slots = loadSaveSlots();
            const namedSlots = slots.filter(s => !s.isAutosave);
            const doSave = () => {
                const state = getAppState();
                const existing = slots.find(s => !s.isAutosave && s.name === name);
                let savedId;
                if(existing) { existing.state = state; existing.savedAt = new Date().toISOString(); savedId = existing.id; }
                else { savedId = 'slot'+Date.now(); slots.push({ id: savedId, name, isAutosave: false, createdAt: new Date().toISOString(), savedAt: new Date().toISOString(), state }); }
                if(persistSaveSlots(slots)) {
                    if(autosaveEnabled && activeSlotId && activeSlotId !== savedId) autosaveNow(); // 원래 있던 탭의 진행 상황을 그 탭 전용 자동저장에 남겨둠
                    setActiveSlotId(savedId); input.value = ''; renderSaveTabUI();
                }
                else alert('저장에 실패했습니다. (브라우저 저장 공간이 부족할 수 있습니다)');
            };
            const existing = namedSlots.find(s => s.name === name);
            if(existing) showCustomConfirm(`"${name}" 슬롯이 이미 있습니다. 덮어쓸까요?`, doSave);
            else if(namedSlots.length >= MAX_SAVE_SLOTS) alert(`저장 슬롯은 최대 ${MAX_SAVE_SLOTS}개까지 만들 수 있습니다. 기존 슬롯을 삭제한 뒤 다시 시도하세요.`);
            else doSave();
        }

        // 새 세이브 생성 흐름(main.html)에서 넘어온 이름으로, 방금 초기화된 현재 상태를 그대로 첫 저장으로 등록
        function createNamedSlotFromCurrentState(name) {
            if(!localStorageAvailable || !name) return;
            const slots = loadSaveSlots();
            if(slots.some(s => !s.isAutosave && s.name === name)) return; // 이미 있으면 조용히 건너뜀
            const id = 'slot'+Date.now();
            slots.push({ id, name, isAutosave: false, createdAt: new Date().toISOString(), savedAt: new Date().toISOString(), state: getAppState() });
            persistSaveSlots(slots);
            setActiveSlotId(id);
            renderSaveTabUI();
        }

        // 자동저장/이름 붙은 슬롯 공용 — 인게임에서도 이 목록의 "불러오기"로 바로 다른 세이브로 전환 가능.
        // 어떤 슬롯을 불러오든 그 세이브(전용 자동저장을 불러온 경우 그 부모 세이브)가 활성 상태가 됨.
        function loadNamedSlot(id) {
            const slot = loadSaveSlots().find(s => s.id === id); if(!slot) return;
            showCustomConfirm(`"${slot.name}" 슬롯을 불러올까요?\n현재 화면의 저장하지 않은 변경사항은 사라집니다.`, () => {
                if(autosaveEnabled) autosaveNow(); // 지금 탭의 진행 상황을 먼저 그 탭 전용 자동저장에 남겨둠
                applyStateSafely(slot.state);
                setActiveSlotId(slot.isAutosave ? (slot.parentId || null) : slot.id);
                simulate(); refreshUI();
                renderSaveTabUI();
                showCustomAlert(`"${slot.name}" 슬롯을 불러왔습니다.`);
            });
        }

        // 이름 붙은 세이브를 지우면 그 세이브 전용 자동저장("OO 자동저장")도 함께 정리됨
        function deleteNamedSlot(id) {
            const slots = loadSaveSlots();
            const slot = slots.find(s => s.id === id); if(!slot || slot.isAutosave) return;
            showCustomConfirm(`"${slot.name}" 슬롯을 삭제할까요?\n(연결된 "${slot.name} 자동저장"도 함께 삭제됩니다)`, () => {
                persistSaveSlots(slots.filter(s => s.id !== id && s.parentId !== id));
                if(activeSlotId === id) setActiveSlotId(null);
                renderSaveTabUI();
            });
        }

        // ===== 국가 > 저장: 현재 세이브 카드 · 세이브 목록 =====
        // 즐겨찾기는 시작 화면(main.html)과 같은 저장소를 쓴다 — 어느 쪽에서 ★를 눌러도 양쪽에 반영
        const SAVE_FAVORITES_KEY = 'dnoSaveFavorites';
        function loadSaveFavorites() {
            try { return new Set(JSON.parse(localStorage.getItem(SAVE_FAVORITES_KEY) || '[]')); } catch(e) { return new Set(); }
        }
        function toggleSaveFavorite(id) {
            const fav = loadSaveFavorites();
            if(fav.has(id)) fav.delete(id); else fav.add(id);
            try { localStorage.setItem(SAVE_FAVORITES_KEY, JSON.stringify(Array.from(fav))); } catch(e) {}
            renderSaveSlotList();
        }

        // 지금 진행 중인 세이브 — 이름, 마지막 저장 시각, 지금 저장(Ctrl+S와 같음), 이름 변경
        function renderSaveCurrentCard() {
            const card = document.getElementById('saveCurrentCard');
            if(!card) return;
            if(!localStorageAvailable) { card.innerHTML = '<div style="color:#666;font-size:0.8rem;">이 환경에서는 브라우저 저장을 사용할 수 없습니다. 아래 "파일로 저장"을 쓰세요.</div>'; return; }
            const all = loadSaveSlots();
            const named = activeSlotId ? all.find(s => s.id === activeSlotId && !s.isAutosave) : null;
            const latest = activeSlotId ? (getNamedAutosaveSlot(all, activeSlotId) || named) : getAutosaveSlot(all);
            const name = named ? named.name : AUTOSAVE_SLOT_NAME;
            const when = latest?.savedAt ? new Date(latest.savedAt).toLocaleString('ko-KR') : '아직 저장 안 됨';
            card.innerHTML = `
                <div style="color:#666;font-size:0.72rem;letter-spacing:1px;margin-bottom:2px;">현재 세이브</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;min-width:0;">
                        <div class="save-current-name" style="color:var(--tno-neon);font-size:1.05rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtmlText(name)}</div>
                        <div style="color:#666;font-size:0.72rem;">마지막 저장: ${when}</div>
                    </div>
                    ${named ? `<button class="dup-btn" title="이름 변경" onclick="startRenameCurrentSave()">✎</button>` : ''}
                    <button class="add-btn" style="width:auto;margin-top:0;padding:6px 12px;white-space:nowrap;" onclick="saveCurrentNow()" title="Ctrl+S">💾 지금 저장</button>
                </div>`;
        }
        function saveCurrentNow() {
            autosaveNow();
            if(typeof showKbdToast === 'function') showKbdToast('✔ 저장됨');
            renderSaveTabUI();
        }
        function startRenameCurrentSave() {
            if(!activeSlotId) return;
            const slot = loadSaveSlots().find(s => s.id === activeSlotId && !s.isAutosave);
            const nameEl = document.querySelector('#saveCurrentCard .save-current-name');
            if(slot && nameEl) inlineRenameEdit(nameEl, slot.name, v => renameNamedSlot(activeSlotId, v));
        }

        // 목록에서 고른 저장 지점을 그대로 연다 (시작 화면의 "이어하기"와 같음) — 지금 진행 상황은 먼저 자동저장에 남겨 두고,
        // 세이브(수동 저장 지점)를 고르면 그 시점, "OO 자동저장"을 고르면 가장 최근 상태가 열린다
        function openSaveSlot(id) {
            const slot = loadSaveSlots().find(s => s.id === id); if(!slot) return;
            const go = () => {
                if(autosaveEnabled) autosaveNow();
                try { applyStateSafely(slot.state); }
                catch(e) { showCustomAlert('세이브를 불러오지 못했습니다.'); return; }
                setActiveSlotId(slot.isAutosave ? (slot.parentId || null) : slot.id);
                simulate(); refreshUI();
                renderSaveTabUI();
                if(typeof showKbdToast === 'function') showKbdToast(`"${slot.name}" 열림`);
            };
            // 자동저장이 꺼져 있으면 지금 화면이 저장되지 않으므로 한 번 묻는다
            if(autosaveEnabled) go();
            else showCustomConfirm(`"${slot.name}" 슬롯을 불러올까요?\n현재 화면의 저장하지 않은 변경사항은 사라집니다.`, go);
        }

        function renderSaveSlotList() {
            const container = document.getElementById('saveSlotList');
            if(!container) return;
            if(!localStorageAvailable) { container.innerHTML = ''; return; }
            const all = loadSaveSlots();
            const fav = loadSaveFavorites();
            const query = (document.getElementById('saveSlotSearchInput')?.value || '').trim().toLowerCase();
            const byTime = (a, b) => new Date(b.savedAt||0) - new Date(a.savedAt||0);
            const defaultAuto = getAutosaveSlot(all);
            const named = all.filter(s => !s.isAutosave).sort(byTime);
            // 시작 화면과 같은 순서: 즐겨찾기 → 기본 자동저장 → 최근 저장 순, 전용 자동저장은 부모 바로 아래
            const tops = [...named.filter(n => fav.has(n.id)), ...(defaultAuto ? [defaultAuto] : []), ...named.filter(n => !fav.has(n.id))];
            if(defaultAuto && fav.has(defaultAuto.id)) { tops.splice(tops.indexOf(defaultAuto), 1); tops.unshift(defaultAuto); }
            const ordered = [];
            tops.forEach(n => {
                ordered.push(n);
                if(!n.isAutosave) { const companion = getNamedAutosaveSlot(all, n.id); if(companion) ordered.push(companion); }
            });
            const shown = ordered.filter(s => !query || String(s.name || '').toLowerCase().includes(query));
            if(ordered.length === 0) { container.innerHTML = '<div style="color:#444;font-size:0.78rem;padding:6px 0;">저장된 세이브가 없습니다</div>'; return; }
            if(shown.length === 0) { container.innerHTML = '<div style="color:#444;font-size:0.78rem;padding:6px 0;">검색 결과가 없습니다</div>'; return; }
            // "현재" 표시: 지금 진행 중인 세이브(기본 세션이면 기본 자동저장)
            const isCurrent = s => s.isAutosave ? (!s.parentId && !activeSlotId) : s.id === activeSlotId;
            container.innerHTML = shown.map(s => {
                const isFav = fav.has(s.id);
                const isCompanion = s.isAutosave && s.parentId;
                const cur = isCurrent(s);
                return `
                <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#0a0c10;border:1px solid ${cur ? 'var(--tno-neon)' : (s.isAutosave ? '#2a4444' : '#222')};margin-bottom:4px;${isCompanion ? 'margin-left:18px;' : ''}">
                    ${isCompanion ? '' : `<button class="save-fav-btn${isFav ? ' on' : ''}" onclick="toggleSaveFavorite('${s.id}')" title="${isFav ? '즐겨찾기 해제' : '즐겨찾기'}" aria-pressed="${isFav}" style="background:transparent;border:none;cursor:pointer;font-size:1rem;padding:0 2px;color:${isFav ? 'var(--tno-gold)' : '#555'};">${isFav ? '★' : '☆'}</button>`}
                    <div style="flex:1;min-width:0;overflow:hidden;cursor:pointer;" onclick="openSaveSlot('${s.id}')" title="클릭하면 이 저장 지점을 엽니다">
                        <div class="save-slot-name" data-slot-id="${s.id}" style="color:${s.isAutosave ? 'var(--tno-neon)' : '#ccc'};font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.isAutosave ? '🔄 ' : ''}${escapeHtmlText(s.name)}${cur ? ' <span style="color:var(--tno-gold);font-size:0.72rem;">● 현재</span>' : ''}</div>
                        <div style="color:#555;font-size:0.7rem;">${s.savedAt ? new Date(s.savedAt).toLocaleString('ko-KR') : '-'}</div>
                    </div>
                    ${s.isAutosave ? '' : `<button class="dup-btn" title="이름 변경" onclick="startRenameSaveSlotInList('${s.id}')">✎</button>`}
                    ${s.isAutosave ? '' : `<button class="remove-btn" title="삭제" onclick="deleteNamedSlot('${s.id}')">X</button>`}
                </div>`;
            }).join('');
        }

        // ===== 세이브 이름 바꾸기 =====
        // 이름 붙은 세이브만 바꿀 수 있고("새 의회 (1)"은 예약), 연결된 전용 자동저장("{이름} 자동저장")도 함께 바뀐다.
        // 세이브 id는 그대로라 즐겨찾기·활성 탭 등 id로 연결된 정보는 유지된다.
        function renameNamedSlot(id, newName) {
            const name = (newName || '').trim();
            const slots = loadSaveSlots();
            const slot = slots.find(s => s.id === id && !s.isAutosave);
            if(!slot) return false;
            if(!name || name === slot.name) return true;
            if(name === AUTOSAVE_SLOT_NAME) { showCustomAlert(`"${AUTOSAVE_SLOT_NAME}"은(는) 예약된 이름입니다. 다른 이름을 입력하세요.`); return false; }
            if(slots.some(s => !s.isAutosave && s.id !== id && s.name === name)) { showCustomAlert(`"${name}" 세이브가 이미 있습니다. 다른 이름을 입력하세요.`); return false; }
            slot.name = name;
            const companion = getNamedAutosaveSlot(slots, id);
            if(companion) companion.name = `${name} 자동저장`;
            if(!persistSaveSlots(slots)) { showCustomAlert('이름을 바꾸지 못했습니다. (브라우저 저장 공간이 부족할 수 있습니다)'); return false; }
            renderSaveTabUI();
            return true;
        }

        // 요소 안의 이름 글자를 입력칸으로 바꿔 그 자리에서 수정 — Enter/바깥 클릭은 확정, Esc는 취소
        function inlineRenameEdit(el, currentName, onCommit) {
            if(!el || el.querySelector('input')) return;
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 40;
            input.value = currentName;
            input.className = 'save-rename-input';
            let done = false;
            const finish = commit => {
                if(done) return;
                done = true;
                if(!commit || !onCommit(input.value)) renderSaveTabUI();
            };
            input.addEventListener('keydown', e => {
                e.stopPropagation();
                if(e.key === 'Enter') { e.preventDefault(); finish(true); }
                else if(e.key === 'Escape') { e.preventDefault(); finish(false); }
            });
            input.addEventListener('click', e => e.stopPropagation());
            input.addEventListener('dblclick', e => e.stopPropagation());
            input.addEventListener('blur', () => finish(true));
            el.replaceChildren(input);
            input.focus();
            input.select();
        }

        function startRenameSaveTab(id) {
            const slot = loadSaveSlots().find(s => s.id === id && !s.isAutosave);
            const nameEl = document.querySelector(`.save-tab[data-slot-id="${id}"] .save-tab-name`);
            if(slot && nameEl) inlineRenameEdit(nameEl, slot.name, v => renameNamedSlot(id, v));
        }

        function startRenameSaveSlotInList(id) {
            const slot = loadSaveSlots().find(s => s.id === id && !s.isAutosave);
            const nameEl = document.querySelector(`.save-slot-name[data-slot-id="${id}"]`);
            if(slot && nameEl) inlineRenameEdit(nameEl, slot.name, v => renameNamedSlot(id, v));
        }

        // ===== 최상단 세이브 탭 바 (데스크톱 앱: 크롬 탭처럼 클릭으로 즉시 전환) =====
        // 이름 붙은 세이브마다 탭 하나씩, 맨 앞엔 항상 "새 의회 (1)"(특정 세이브에 속하지 않은
        // 기본 세션) 탭이 고정. 탭을 클릭하면 지금 탭의 상태를 그 탭 전용 자동저장에 즉시
        // 남겨두고(autosaveNow), 목적지 탭의 최신 상태(전용 자동저장이 있으면 그것, 없으면
        // 수동 저장 지점)를 그대로 불러온다 — 확인창 없이 즉시 전환되는 게 핵심.
        function renderSaveTabBar() {
            const bar = document.getElementById('saveTabBar');
            if(!bar) return;
            const all = loadSaveSlots();
            const openIds = loadOpenTabs(all);
            const cur = noOpenTab ? null : currentTabId();
            const tabsHtml = openIds.map(id => {
                const close = `<span class="save-tab-close" role="button" title="탭 닫기" onclick="event.stopPropagation();closeSaveTab('${id}')">×</span>`;
                if(id === AUTOSAVE_SLOT_ID) return `
                    <div class="save-tab${cur===id?' active':''}" onclick="switchToSaveTab('${AUTOSAVE_SLOT_ID}')" title="${AUTOSAVE_SLOT_NAME}">
                        <span class="save-tab-name">${AUTOSAVE_SLOT_NAME}</span>${close}
                    </div>`;
                const n = all.find(s => s.id === id);
                return `
                    <div class="save-tab${cur===id?' active':''}" data-slot-id="${n.id}" onclick="switchToSaveTab('${n.id}')" ondblclick="startRenameSaveTab('${n.id}')" title="${escapeHtmlText(n.name)} — 더블클릭하면 이름 변경">
                        <span class="save-tab-name">${escapeHtmlText(n.name)}</span>${close}
                    </div>`;
            }).join('');
            bar.innerHTML = `
                <a class="save-tab-home" href="main.html" onclick="return goHomeScreen()" title="메인 화면으로" aria-label="메인 화면으로">
                    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2.8 9.6 10 3.4l7.2 6.2"/><path d="M4.9 8v8.6h3.6v-4.7h3v4.7h3.6V8"/>
                    </svg>
                </a>
                <div class="save-tab-list">${tabsHtml}</div>
                <div class="save-tab-new-wrap">
                <div class="save-tab-new" id="saveTabNewBtn" onclick="showSaveTabNewMenu()" title="새 탭">+</div>
                <div class="save-tab-new-menu" id="saveTabNewMenu" style="display:none;">
                    <div class="save-tab-new-menu-item" onclick="pendingPresetId=null;showSaveTabNewInput();">🆕 새로 생성</div>
                    <div class="save-tab-new-menu-item" onclick="showSaveTabPresetList()">📦 프리셋에서 생성</div>
                    <div class="save-tab-new-menu-item" onclick="showSaveTabOpenList()">📂 닫은 탭 다시 열기</div>
                </div>
                <div class="save-tab-preset-list" id="saveTabPresetList" style="display:none;"></div>
                <div class="save-tab-new-input-wrap" id="saveTabNewInputWrap" style="display:none;">
                    <input type="text" id="saveTabNewInput" maxlength="40" placeholder="새 세이브 이름"
                        onkeydown="if(event.key==='Enter'){confirmSaveTabNew();}else if(event.key==='Escape'){hideSaveTabNewInput();}">
                    <button onclick="confirmSaveTabNew()">✓</button>
                    <button onclick="hideSaveTabNewInput()">✕</button>
                </div>
                </div>
                <div class="save-tab-spacer"></div>
                <button type="button" class="save-tab-save" id="saveTabSaveBtn" onclick="event.stopPropagation();toggleSavePanel()" title="저장 · 자동저장 · 세이브 목록 · 파일" aria-haspopup="dialog">
                    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3.5 4.5a1 1 0 0 1 1-1h9l3 3v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/><path d="M6.5 3.5v4h6v-4M6 16.5v-5h8v5"/></svg>
                    <span>저장</span>
                </button>
            `;
        }

        // ===== 저장 창 (탭 바 오른쪽 "저장" 버튼) — 구 국가 > 저장을 떠 있는 창으로 =====
        function openSavePanel() {
            const ov = document.getElementById('savePanelLayer');
            if(!ov) return;
            if(typeof closeDatePanel === 'function') closeDatePanel();
            hideSaveTabAllPopups();
            renderSaveTabUI();
            ov.style.display = '';
            document.getElementById('saveTabSaveBtn')?.classList.add('active');
            ov.querySelector('.save-panel-close')?.focus({ preventScroll: true });
        }
        function closeSavePanel() {
            const ov = document.getElementById('savePanelLayer');
            if(ov) ov.style.display = 'none';
            document.getElementById('saveTabSaveBtn')?.classList.remove('active');
        }
        function isSavePanelOpen() {
            const ov = document.getElementById('savePanelLayer');
            return !!ov && ov.style.display !== 'none';
        }
        function toggleSavePanel() { isSavePanelOpen() ? closeSavePanel() : openSavePanel(); }

        // 상단 탭 바 맨 왼쪽 집 아이콘 — 지금 상태를 바로 저장한 뒤 메인 화면(main.html)으로 돌아간다
        function goHomeScreen() {
            try { autosaveNow(); } catch(e) { /* 저장 실패해도 이동은 계속 */ }
            location.href = 'main.html';
            return false;
        }

        function hideSaveTabAllPopups() {
            const menu = document.getElementById('saveTabNewMenu');
            const presetList = document.getElementById('saveTabPresetList');
            if(menu) menu.style.display = 'none';
            if(presetList) presetList.style.display = 'none';
        }

        function showSaveTabNewMenu() {
            hideSaveTabAllPopups();
            pendingPresetId = null;
            const menu = document.getElementById('saveTabNewMenu');
            if(menu) menu.style.display = 'flex';
        }

        function showSaveTabNewInput() {
            hideSaveTabAllPopups();
            document.getElementById('saveTabNewBtn').style.display = 'none';
            const wrap = document.getElementById('saveTabNewInputWrap');
            wrap.style.display = 'flex';
            const input = document.getElementById('saveTabNewInput');
            if(!pendingPresetId) input.value = '';
            input.focus();
            input.select();
        }

        function hideSaveTabNewInput() {
            pendingPresetId = null;
            hideSaveTabAllPopups();
            const btn = document.getElementById('saveTabNewBtn');
            const wrap = document.getElementById('saveTabNewInputWrap');
            if(btn) btn.style.display = '';
            if(wrap) wrap.style.display = 'none';
        }

        // ===== 프리셋에서 새 세이브 만들기 =====
        // presets/index.json에 등록된 [{file, title}] 목록을 읽어 제목을 보여주고,
        // 고르면 presets/<file>을 그 상태 그대로 새 탭(세이브)에 담아 즉시 전환한다.
        // 개발자/배포자가 presets/ 폴더에 .json 파일을 추가하고 index.json에
        // 등록하기만 하면 누구나 그 프리셋을 쓸 수 있다 (자세한 방법은 README 참고).
        // (목록·불러오기는 js/presets.js의 DnoPresets가 담당 — 내장 프리셋 + presets/index.json)
        let presetListCache = null;
        let pendingPresetId = null;

        async function loadPresetList() {
            if(!presetListCache) presetListCache = window.DnoPresets ? await DnoPresets.list() : [];
            return presetListCache;
        }

        async function showSaveTabPresetList() {
            hideSaveTabAllPopups();
            const wrap = document.getElementById('saveTabPresetList');
            wrap.style.display = 'flex';
            wrap.innerHTML = `<div class="save-tab-preset-empty">불러오는 중...</div>`;
            const list = await loadPresetList();
            if(wrap.style.display === 'none') return; // 로딩 중 닫혔으면 무시
            if(list.length === 0) {
                wrap.innerHTML = `<div class="save-tab-preset-empty">등록된 프리셋이 없습니다</div>`;
                return;
            }
            wrap.innerHTML = list.map((p, i) => `<div class="save-tab-preset-item" onclick="selectPresetForNewTab(${i})">${escapeHtmlText(p.title)}</div>`).join('');
        }

        // 닫아 둔 탭(세이브) 다시 열기 — 목록에서 고르면 그 탭을 다시 띄우고 바로 전환
        function showSaveTabOpenList() {
            hideSaveTabAllPopups();
            const wrap = document.getElementById('saveTabPresetList');
            const all = loadSaveSlots();
            const openIds = new Set(loadOpenTabs(all));
            const closed = [
                ...(!openIds.has(AUTOSAVE_SLOT_ID) ? [{ id: AUTOSAVE_SLOT_ID, name: AUTOSAVE_SLOT_NAME }] : []),
                ...all.filter(s => !s.isAutosave && !openIds.has(s.id)).sort((a,b) => new Date(b.savedAt||0) - new Date(a.savedAt||0)),
            ];
            wrap.style.display = 'flex';
            wrap.innerHTML = closed.length
                ? closed.map(s => `<div class="save-tab-preset-item" onclick="reopenSaveTab('${s.id}')">${escapeHtmlText(s.name)}</div>`).join('')
                : `<div class="save-tab-preset-empty">닫은 탭이 없습니다</div>`;
        }
        function reopenSaveTab(id) {
            hideSaveTabAllPopups();
            ensureTabOpen(id);
            if(noOpenTab || id !== currentTabId()) switchToSaveTab(id);
            else renderSaveTabBar();
        }

        function selectPresetForNewTab(index) {
            const preset = (presetListCache || [])[index];
            if(!preset) return;
            pendingPresetId = preset.id;
            showSaveTabNewInput();
            const input = document.getElementById('saveTabNewInput');
            input.value = uniqueSaveName(preset.title);
        }

        // "+" 탭에서 새 이름을 입력해 확인 — saveNamedSlot()과 동일한 검증(예약어/중복/최대 개수)을
        // 거친 뒤, 프리셋이 선택되어 있으면 그 프리셋 상태로, 아니면 현재 화면 상태 그대로
        // 새 탭을 등록하고 그 탭으로 전환한다.
        async function confirmSaveTabNew() {
            const input = document.getElementById('saveTabNewInput');
            const name = (input?.value || '').trim();
            if(!name) return;
            if(name === AUTOSAVE_SLOT_NAME) { showCustomAlert(`"${AUTOSAVE_SLOT_NAME}"은(는) 예약된 이름입니다. 다른 이름을 입력하세요.`); return; }
            const namedSlotsCheck = loadSaveSlots().filter(s => !s.isAutosave);
            if(namedSlotsCheck.some(s => s.name === name)) { showCustomAlert(`"${name}" 세이브가 이미 있습니다. 다른 이름을 입력하세요.`); return; }
            if(namedSlotsCheck.length >= MAX_SAVE_SLOTS) { showCustomAlert(`저장 슬롯은 최대 ${MAX_SAVE_SLOTS}개까지 만들 수 있습니다. 기존 슬롯을 삭제한 뒤 다시 시도하세요.`); return; }

            const presetId = pendingPresetId;
            let presetState = null, presetMeta = null;
            if(presetId) {
                try {
                    presetMeta = await DnoPresets.find(presetId);
                    presetState = await DnoPresets.loadState(presetMeta);
                } catch(e) { showCustomAlert('프리셋을 불러오지 못했습니다.'); return; }
            }

            if(autosaveEnabled) autosaveNow(); // 지금 탭(있다면)의 진행 상황을 먼저 그 탭 전용 자동저장에 남겨둠
            // 새 세이브는 지금 화면을 복사하지 않고 완전히 처음(기본 상태)부터 — 프리셋이면 기본 상태 위에 프리셋을 적용
            const prevState = getAppState();
            try { applyStateFromScratch(presetId ? presetState : null); }
            catch(e) {
                try { setAppState(prevState); } catch(e2) { /* 되돌리기 실패 — 아래 안내만 */ }
                showCustomAlert(presetId ? '프리셋 데이터 형식이 올바르지 않습니다.' : '새 세이브를 만들지 못했습니다.');
                return;
            }
            simulate(); refreshUI();
            const state = getAppState();
            const slots = loadSaveSlots();
            const id = 'slot'+Date.now();
            const now = new Date().toISOString();
            slots.push({ id, name, isAutosave: false, createdAt: now, savedAt: now, state });
            persistSaveSlots(slots);
            setActiveSlotId(id);
            hideSaveTabNewInput();
            renderSaveTabUI();
            if(presetMeta && presetMeta.tutorial && window.DnoTutorial) window.DnoTutorial.start();
        }

        function deleteSaveTab(id) {
            deleteNamedSlot(id);
        }

        // 탭 클릭 시 즉시 전환 — 나가는 탭의 상태는 자동저장으로 남기고, 확인창 없이 대상 탭으로 교체
        function switchToSaveTab(id) {
            const toDefault = (id === AUTOSAVE_SLOT_ID);
            const alreadyThere = !noOpenTab && (toDefault ? !activeSlotId : (activeSlotId === id));
            if(alreadyThere) return;
            autosaveNow();

            const slots = loadSaveSlots();
            let target = null;
            if(toDefault) {
                target = getAutosaveSlot(slots);
            } else {
                const parent = slots.find(s => s.id === id && !s.isAutosave);
                if(!parent) return;
                target = getNamedAutosaveSlot(slots, id) || parent;
            }
            try {
                if(target) applyStateSafely(target.state);
                else applyStateFromScratch(null); // 기본 세션에 자동저장이 아직 없으면 처음 상태로
            }
            catch(e) { showCustomAlert('세이브를 불러오지 못했습니다.'); return; }
            setActiveSlotId(toDefault ? null : id);
            simulate(); refreshUI();
            renderSaveTabUI();
        }

        // 탭 바 바깥을 클릭하면 "+" 드롭다운(메뉴/프리셋 목록)을 닫음 — 이름 입력 중인 상자는
        // 실수로 날아가지 않도록 그대로 둔다.
        document.addEventListener('click', (e) => {
            const bar = document.getElementById('saveTabBar');
            if(!bar || bar.contains(e.target)) return;
            hideSaveTabAllPopups();
        });

        // ===== 실행 취소 / 다시 실행 (Ctrl+Z / Ctrl+Shift+Z) =====
        // 개별 변경마다 undo 지점을 만들지 않고, 전체 상태 스냅샷 방식으로 구현.
        // mousedown/focusin 시점(실제 값이 바뀌기 전)에 "이전 상태"를 잡아두고,
        // 짧은 시간 안에 이어지는 조작(연속 타이핑 등)은 하나의 undo 단위로 묶는다.
        const UNDO_HISTORY_LIMIT = 50;
        const UNDO_BATCH_DEBOUNCE_MS = 600;
        let undoStack = [];
        let redoStack = [];
        let pendingUndoSnapshot = null;
        let undoBatchTimer = null;
        let isApplyingHistory = false;

        function captureUndoSnapshot() {
            if(isApplyingHistory) return;
            if(pendingUndoSnapshot === null) pendingUndoSnapshot = JSON.stringify(getAppState());
            clearTimeout(undoBatchTimer);
            undoBatchTimer = setTimeout(commitUndoBatch, UNDO_BATCH_DEBOUNCE_MS);
        }

        function commitUndoBatch() {
            clearTimeout(undoBatchTimer);
            undoBatchTimer = null;
            if(pendingUndoSnapshot === null) return;
            const current = JSON.stringify(getAppState());
            if(current !== pendingUndoSnapshot) {
                undoStack.push(pendingUndoSnapshot);
                if(undoStack.length > UNDO_HISTORY_LIMIT) undoStack.shift();
                redoStack = [];
            }
            pendingUndoSnapshot = null;
        }

        function applyHistorySnapshot(json) {
            isApplyingHistory = true;
            try { setAppState(JSON.parse(json)); }
            catch(e) { /* 손상된 스냅샷 — 조용히 무시 */ }
            finally { isApplyingHistory = false; }
        }

        function performUndo() {
            commitUndoBatch();
            if(undoStack.length === 0) return;
            const prev = undoStack.pop();
            redoStack.push(JSON.stringify(getAppState()));
            if(redoStack.length > UNDO_HISTORY_LIMIT) redoStack.shift();
            applyHistorySnapshot(prev);
        }

        function performRedo() {
            commitUndoBatch();
            if(redoStack.length === 0) return;
            const next = redoStack.pop();
            undoStack.push(JSON.stringify(getAppState()));
            if(undoStack.length > UNDO_HISTORY_LIMIT) undoStack.shift();
            applyHistorySnapshot(next);
        }

        function initUndoRedoTracking() {
            document.addEventListener('mousedown', captureUndoSnapshot, true);
            document.addEventListener('focusin', captureUndoSnapshot, true);
            document.addEventListener('focusout', commitUndoBatch, true);
            window.addEventListener('keydown', (e) => {
                const key = e.key.toLowerCase();
                if(!(e.ctrlKey || e.metaKey) || key !== 'z') return;
                e.preventDefault();
                if(e.shiftKey) performRedo(); else performUndo();
            });
        }

        // ===== 키보드 단축키 (Ctrl+S 저장 / Enter 실행 / Esc 닫기) =====
        // 화면 하단에 잠깐 떴다 사라지는 토스트 — showCustomAlert처럼 확인 클릭을 요구하면
        // Ctrl+S 같은 빈번한 단축키에는 너무 무거우므로 가볍게 자동 소멸되는 알림을 별도로 둔다
        let kbdToastTimer = null;
        function showKbdToast(message) {
            let el = document.getElementById('kbdToast');
            if(!el) {
                el = document.createElement('div');
                el.id = 'kbdToast';
                el.className = 'kbd-toast';
                document.body.appendChild(el);
            }
            el.textContent = message;
            el.classList.add('show');
            clearTimeout(kbdToastTimer);
            kbdToastTimer = setTimeout(() => el.classList.remove('show'), 1500);
        }

        // Esc로 닫을 대상 중 실제로 열려 있는 것 하나만(우선순위대로) 닫는다
        function handleGlobalEscape() {
            const isVisible = el => el && getComputedStyle(el).display !== 'none';
            if(isSavePanelOpen()) { closeSavePanel(); return; }
            if(isDatePanelOpen()) { closeDatePanel(); return; }
            const exportOverlay = document.getElementById('exportDialogOverlay');
            if(isVisible(exportOverlay)) { closeExportDialog(); return; }
            const seatCard = document.getElementById('seatInfoCard');
            if(isVisible(seatCard)) { closeSeatInfoCard(); return; }
        }

        function initKeyboardShortcuts() {
            window.addEventListener('keydown', (e) => {
                const key = e.key.toLowerCase();
                const tag = document.activeElement?.tagName;
                const isFormField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

                if((e.ctrlKey || e.metaKey) && key === 's') {
                    e.preventDefault();
                    autosaveNow();
                    showKbdToast('✔ 저장됨');
                    return;
                }
                if(key === 'escape') {
                    handleGlobalEscape();
                    return;
                }
                // 입력창/선택 상자에 포커스가 있을 때는 Enter의 기본 동작(줄바꿈 등)을 건드리지 않음
                if(key === 'enter' && !isFormField && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    simulate();
                    showKbdToast('>> PROTOCOL EXECUTE <<');
                }
            });
        }

        // ── 조작 탭(.controls)/시각 탭(.display-area) 사이 경계를 드래그해 폭 조절 ──────────────
        const PANEL_RESIZER_WIDTH_KEY = 'dnoControlsPanelWidth';
        const PANEL_RESIZER_DEFAULT_WIDTH = 400; // .controls의 CSS 기본값(flex: 0 0 400px)과 일치시켜야 "초기화"가 실제 기본 폭으로 돌아감
        function safeGetLocal(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }
        function safeSetLocal(k, v) { try { localStorage.setItem(k, v); return true; } catch(e) { return false; } }

        function applyControlsPanelWidth(px) {
            const controls = document.querySelector('.controls');
            if(controls) controls.style.flexBasis = px + 'px';
        }

        // 패널 폭이 바뀌면 반원 좌석 캔버스는 부모 컨테이너 폭에 맞춰 다시 그려줘야
        // 기존 해상도가 늘어난/줄어든 박스에 그대로 늘려져 찌그러지지 않음 — 드래그 중 매 프레임 다시
        // 그리면 버벅이므로 requestAnimationFrame으로 한 프레임당 한 번만 실행되게 묶는다
        let panelResizeRedrawScheduled = false;
        function schedulePanelResizeRedraw() {
            if(panelResizeRedrawScheduled) return;
            panelResizeRedrawScheduled = true;
            requestAnimationFrame(() => { panelResizeRedrawScheduled = false; simulate(); });
        }

        function initPanelResizer() {
            const resizer = document.getElementById('panelResizer');
            const controls = document.querySelector('.controls');
            if(!resizer || !controls) return;

            const MIN_WIDTH = 280, MIN_DISPLAY_WIDTH = 300;
            const saved = parseInt(safeGetLocal(PANEL_RESIZER_WIDTH_KEY), 10);
            if(saved) applyControlsPanelWidth(Math.max(MIN_WIDTH, saved));

            let dragging = false;
            resizer.addEventListener('pointerdown', e => {
                dragging = true;
                resizer.classList.add('dragging');
                resizer.setPointerCapture(e.pointerId);
                e.preventDefault();
            });
            resizer.addEventListener('pointermove', e => {
                if(!dragging) return;
                // 패널 왼쪽 끝 기준으로 폭을 잰다 — 모던 모드에선 왼쪽에 세로 탭 사이드바가 있어 body 왼쪽과 다름
                const controlsLeft = controls.getBoundingClientRect().left;
                const maxWidth = window.innerWidth - controlsLeft - MIN_DISPLAY_WIDTH - Math.round(resizer.getBoundingClientRect().width);
                const width = Math.max(MIN_WIDTH, Math.min(maxWidth, e.clientX - controlsLeft));
                applyControlsPanelWidth(width);
                schedulePanelResizeRedraw();
            });
            function endDrag(e) {
                if(!dragging) return;
                dragging = false;
                resizer.classList.remove('dragging');
                if(resizer.hasPointerCapture?.(e.pointerId)) resizer.releasePointerCapture(e.pointerId);
                safeSetLocal(PANEL_RESIZER_WIDTH_KEY, Math.round(controls.getBoundingClientRect().width));
                schedulePanelResizeRedraw();
            }
            // 더블클릭하면 드래그로 바꾼 폭을 기본값으로 초기화
            resizer.addEventListener('dblclick', () => {
                applyControlsPanelWidth(PANEL_RESIZER_DEFAULT_WIDTH);
                safeSetLocal(PANEL_RESIZER_WIDTH_KEY, PANEL_RESIZER_DEFAULT_WIDTH);
                schedulePanelResizeRedraw();
            });
            resizer.addEventListener('pointerup', endDrag);
            resizer.addEventListener('pointercancel', endDrag);
        }

        window.addEventListener("load", () => {
            initUndoRedoTracking();
            initPanelResizer();
            initKeyboardShortcuts();
            const fileInputTab = document.getElementById("fileLoadJsonTab");
            if(fileInputTab) {
                fileInputTab.addEventListener("change", async () => {
                    const file = fileInputTab.files?.[0];
                    if(!file) return;
                    try { await loadJSONFromFile(file); }
                    catch(e) { showCustomAlert("불러오기 실패: 저장 파일이 깨졌거나 형식이 다릅니다."); }
                    finally { fileInputTab.value = ""; }
                });
            }

            // Canvas event binding
            document.getElementById('houseCanvas').addEventListener('click', e => handleCanvasClick(e, 'house'));
            document.getElementById('senateCanvas').addEventListener('click', e => handleCanvasClick(e, 'senate'));
            document.getElementById('thirdCanvas').addEventListener('click', e => handleCanvasClick(e, 'third'));
            document.getElementById('houseCanvas').addEventListener('mousemove', e => handleCanvasMouseMove(e, 'house'));
            document.getElementById('senateCanvas').addEventListener('mousemove', e => handleCanvasMouseMove(e, 'senate'));
            document.getElementById('thirdCanvas').addEventListener('mousemove', e => handleCanvasMouseMove(e, 'third'));
            document.getElementById('houseCanvas').addEventListener('mouseleave', e => handleCanvasMouseLeave(e, 'house'));
            document.getElementById('senateCanvas').addEventListener('mouseleave', e => handleCanvasMouseLeave(e, 'senate'));
            document.getElementById('thirdCanvas').addEventListener('mouseleave', e => handleCanvasMouseLeave(e, 'third'));
        });

        // ===== 2단 탭 전환 =====
        let currentMainTab = 'nation';
        let currentSubTab = { setup: 'party', nation: 'symbol' };

        // 표결 탭을 벗어날 때, 선택된 법안이 완전히 결론(가결/부결) 났으면 선택 초기화
        function checkResetVoteSelectionOnLeave() {
            if(currentMainTab === 'law' && currentSubTab['law'] === 'vote' && activeBillId) {
                const bill = bills.find(b=>b.id===activeBillId);
                if(bill && getBillOverallStatus(bill) !== 'pending') {
                    activeBillId = null;
                }
            }
        }

        // 국무회의 탭을 벗어날 때, 심의 중이던 법안이 이미 결론(가결/부결) 났으면 선택 초기화 (표결 탭과 동일한 패턴)
        function checkResetCouncilSelectionOnLeave() {
            if(currentMainTab === 'cabinet' && currentSubTab['cabinet'] === 'council' && activeCouncilBillId) {
                const bill = bills.find(b=>b.id===activeCouncilBillId);
                if(bill && getBillOverallStatus(bill) !== 'pending') {
                    activeCouncilBillId = null;
                }
            }
        }

        function switchMainTab(main) {
            checkResetVoteSelectionOnLeave();
            checkResetCouncilSelectionOnLeave();
            closeSeatInfoCard();
            currentMainTab = main;
            document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('mainTab' + main.charAt(0).toUpperCase() + main.slice(1)).classList.add('active');
            document.querySelectorAll('.main-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('mainContent' + main.charAt(0).toUpperCase() + main.slice(1)).classList.add('active');
            if(main === 'election') { elecRenderList(); elecRenderRecords(); return; }
            switchSubTab(main, currentSubTab[main] || defaultSubTabFor(main), false);
        }
        function defaultSubTabFor(main) {
            return main === 'setup' ? 'party' : main === 'cabinet' ? 'system' : main === 'help' ? 'helpsetup' : main === 'vote' ? 'elecGeneral' : main === 'law' ? 'bill' : 'symbol';
        }

        function switchSubTab(main, sub, doMainSwitch = true) {
            // 구 위치(국가 > 선거 / ⚠) 호환 — 선거 메인탭으로 옮겨짐
            if(main === 'nation' && sub === 'election') { main = 'vote'; sub = 'elec' + electionInnerTab.charAt(0).toUpperCase() + electionInnerTab.slice(1); doMainSwitch = true; }
            if(main === 'nation' && sub === 'fraud') { main = 'vote'; doMainSwitch = true; }
            // 구 위치(국가 > 입법 > 국무회의) 호환 — 내각 > 국무회의로 옮겨짐
            if(main === 'nation' && sub === 'council') { main = 'cabinet'; doMainSwitch = true; }
            // 구 위치(국가 > 설정 > 의회/상징/날짜/저장) 호환 — 국가의 하위탭으로 펼쳐짐
            if(main === 'nation' && sub === 'config') sub = configInnerTab;
            // 구 위치(국가 > 저장) 호환 — 탭 바 오른쪽 "저장" 창으로 옮겨짐
            if(main === 'nation' && sub === 'save') { openSavePanel(); return; }
            // 구 위치(국가 > 날짜) 호환 — 날짜 줄의 ⚙로 여는 날짜 · 회기 설정 창으로 옮겨짐
            if(main === 'nation' && sub === 'date') { openDatePanel(); return; }
            // 구 위치(국가 > 의회) 호환 — 의회 > 의회 설정으로 옮겨짐
            if(main === 'nation' && sub === 'assembly') { main = 'setup'; doMainSwitch = true; }
            // 구 위치(국가 > 입법 / 기록) 호환 — 입법 메인탭으로 옮겨짐
            if(main === 'nation' && sub === 'legislation') { main = 'law'; sub = legislationInnerTab; doMainSwitch = true; }
            if(main === 'nation' && sub === 'record') { main = 'law'; sub = 'archive'; doMainSwitch = true; }
            if(main === 'law' && sub !== 'vote') checkResetVoteSelectionOnLeave();
            if(doMainSwitch && currentMainTab !== main) switchMainTab(main);
            if(sub !== 'council') checkResetCouncilSelectionOnLeave();
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
            if(main === 'nation') onConfigSubTabShown(sub);
            if(sub === 'assembly') renderChamberLeaders();
            if(main === 'law') onLegislationSubTabShown(sub);
            if(sub === 'elecPresidential') onElectionSubTabShown('presidential');
            if(sub === 'elecGeneral') onElectionSubTabShown('general');
            if(sub === 'elecSettings') onElectionSubTabShown('settings');
            if(sub === 'elecRecord') elecRenderRecords();
            if(sub === 'fraud') { renderFraudTab(); }
            if(sub === 'party') { switchPartyGroupInnerTab('info'); }
            if(sub === 'ideology') { renderIdeologyList(); }
            if(sub === 'settings') { switchSetupInnerTab('house'); }
            if(sub === 'system') {
                setGovType(govType); setVetoHolder(vetoHolder);
                Object.keys(EMERGENCY_POWERS).forEach(k => setEmergencyHolder(k, emergencyPowers[k].holder));
            }
            if(sub === 'president') { renderPresidentSection(); renderEmergencyPowers(); }
            if(sub === 'pm') { renderPmSection(); renderDeputyPmsList(); renderEmergencyPowers(); }
            if(sub === 'cabinetmembers') { renderCabinetMembersList(); renderChairSection(); renderEmergencyPowers(); }
            if(sub === 'councilArchive') renderArchiveList('council');
            if(sub === 'council') { syncCouncilBillSelect(); renderCouncilActiveBillDisplay(); renderCouncilThresholdUI(); renderCabinetDisplay(); }
            if(sub === 'coalition') { renderCoalitions(); }
            if(sub === 'list') { listMemberInnerTab = 'house'; switchListMemberInnerTab('house'); }
            if(sub === 'members') { membersInnerTab = 'house'; switchMembersInnerTab('house'); }
        }

        // 국가 하위탭 (상징/날짜/저장) — 구 국가 > 설정의 내부 탭. 의회는 의회 > 의회 설정으로 옮겨짐
        let configInnerTab = 'symbol';
        // 예전 호출 호환: 국가의 해당 하위탭(의회는 의회 > 의회 설정)으로 이동
        function switchConfigInnerTab(inner) {
            if(inner === 'assembly') { switchSubTab('setup', 'assembly'); return; }
            if(inner === 'save') { openSavePanel(); return; }
            if(inner === 'date') { openDatePanel(); return; }
            if(!['symbol','nationSettings'].includes(inner)) inner = 'symbol';
            switchSubTab('nation', inner);
        }
        // 국가 하위탭이 열릴 때 그 화면을 그린다 (switchSubTab에서 호출)
        function onConfigSubTabShown(sub) {
            if(!['symbol','nationSettings'].includes(sub)) return;
            configInnerTab = sub;
            if(sub === 'symbol') renderNationConfig();
        }

        // 입법 메인탭 (제출/상정/표결/기록) — 구 국가 > 입법 · 기록. 국무회의는 내각 > 국무회의
        let legislationInnerTab = 'bill';
        // 예전 호출 호환: 입법 메인탭의 해당 하위탭으로 이동
        function switchLegislationInnerTab(inner) {
            if(inner === 'council') { switchSubTab('cabinet', 'council'); return; }
            if(!['bill','table','vote'].includes(inner)) inner = 'bill';
            switchSubTab('law', inner);
        }
        // 입법 하위탭이 열릴 때 그 화면을 그린다 (switchSubTab에서 호출)
        function onLegislationSubTabShown(sub) {
            if(['bill','table','vote'].includes(sub)) legislationInnerTab = sub;
            if(sub === 'vote') { renderBulkPartyList(); syncBillSelect(); renderActiveBillDisplay(); updateConfirmButtons(); }
            if(sub === 'bill' || sub === 'table') renderBillList();
            if(sub === 'archive') renderArchiveList();
        }

        // 예전 호출 호환: 입법 기록은 입법 > 기록, 선거 기록은 선거 > 기록
        function switchRecordInnerTab(inner) {
            if(inner === 'elecRecord') { switchSubTab('vote', 'elecRecord'); return; }
            switchSubTab('law', 'archive');
        }

        // 구버전 switchTab 호환
        function switchTab(tabName) {
            if(['ideology','house','senate','coalition'].includes(tabName)) switchSubTab('setup', tabName==='house'||tabName==='senate'?'settings':tabName);
            else if(['bill','table','vote','archive'].includes(tabName)) switchSubTab('law', tabName);
        }

        // 의회 > 설정 내부 탭 (하원/상원/삼원)
        let setupInnerTab = 'house';
        function switchSetupInnerTab(ch) {
            setupInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabSetup'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
                document.getElementById('content'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
        }

        // 의회 > 정당 내부 탭 (정보/당수) — 구 정당 메인탭이 의회로 통합됨. 이념은 의회 > 이념으로 분리
        let partyGroupInnerTab = 'info';
        function switchPartyGroupInnerTab(inner) {
            if(inner === 'ideology') { switchSubTab('setup', 'ideology'); return; } // 구버전 호출 호환
            partyGroupInnerTab = inner;
            ['info','leader'].forEach(k => {
                document.getElementById('innerTabParty'+k.charAt(0).toUpperCase()+k.slice(1))?.classList.toggle('active', k===inner);
                document.getElementById('innerContentParty'+k.charAt(0).toUpperCase()+k.slice(1))?.classList.toggle('active', k===inner);
            });
            if(inner==='info') renderPartyInfoList();
            else renderLeaderList();
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
            // 설정 탭 내부(하원/상원/삼원)에서 더 이상 존재하지 않는 의원실을 보고 있었다면 하원으로 전환
            if(!hasSenate && setupInnerTab === 'senate') switchSetupInnerTab('house');
            if(!hasThird && setupInnerTab === 'third') switchSetupInnerTab('house');
            // 비례 탭의 내부 탭도 동기화
            const listSenateBtn = document.getElementById('innerTabListSenate');
            if(listSenateBtn) listSenateBtn.style.display = hasSenate ? '' : 'none';
            const listThirdBtn = document.getElementById('innerTabListThird');
            if(listThirdBtn) listThirdBtn.style.display = hasThird ? '' : 'none';
            // 의회 > 의회 설정의 원별 반원 중앙 표시(의석 수/로고) 설정 블록도 동기화
            const centerSenateWrap = document.getElementById('chamberCenterSenateWrap');
            if(centerSenateWrap) centerSenateWrap.style.display = hasSenate ? '' : 'none';
            const centerThirdWrap = document.getElementById('chamberCenterThirdWrap');
            if(centerThirdWrap) centerThirdWrap.style.display = hasThird ? '' : 'none';
            // 디스플레이 탭 숨김
            const dispSenate = document.getElementById('dispTabSenate');
            if(dispSenate) dispSenate.style.display = hasSenate ? '' : 'none';
            const dispThird = document.getElementById('dispTabThird');
            if(dispThird) dispThird.style.display = hasThird ? '' : 'none';
            if(!hasSenate && document.querySelector('.disp-panel.active')?.id === 'dispPanelSenate') switchDispTab('house');
            if(!hasThird && document.querySelector('.disp-panel.active')?.id === 'dispPanelThird') switchDispTab('house');
            // 지역구 선택 버튼 숨기고 자동으로 하원 지역구 모드로 전환
            const senDistBtn = document.getElementById('districtChamberSenateBtn');
            if(senDistBtn) senDistBtn.style.display = hasSenate ? '' : 'none';
            const thirdDistBtn = document.getElementById('districtChamberThirdBtn');
            if(thirdDistBtn) thirdDistBtn.style.display = hasThird ? '' : 'none';
            if(!hasSenate && districtChamber === 'senate') districtSetChamber('house');
            if(!hasThird && districtChamber === 'third') districtSetChamber('house');
            // 존재하지 않는 의원실의 지역구 데이터 자체를 삭제 (뉴 지역구는 지도 자체는 유지, 그 원의 의석 수만 0으로)
            if(!hasSenate && districtGrid.senate && Object.keys(districtGrid.senate).length > 0) {
                districtGrid.senate = {};
                districtMembers.senate = {};
                Object.values(districtSeatCounts).forEach(s => { if(s) s.senate = 0; });
                districtRenderMap();
                elecUpdateDistrictInfo();
            }
            if(!hasThird && districtGrid.third && Object.keys(districtGrid.third).length > 0) {
                districtGrid.third = {};
                districtMembers.third = {};
                Object.values(districtSeatCounts).forEach(s => { if(s) s.third = 0; });
                districtRenderMap();
                elecUpdateDistrictInfo();
            }
            renderBillList(); renderArchiveList(); syncBillSelect(); updateNames();
            elecUpdateLabels();
            elecUpdateDistrictInfo();
            renderChamberLeaders();
            applyMartialLawEffects();
            updateSplitDissolutionUI();
        }

        // 네온 모드의 터미널 표기("> 제목", ">> 버튼 <<")에서 기호만 span.tno-prompt로 감싼다 —
        // 네온 모드에선 글자 그대로 보이고, 모던(라이트/다크) 모드는 css/modern.css가 기호를 숨긴다
        function setPromptText(el, text, withSuffix = false) {
            if(!el) return;
            const pre = document.createElement('span');
            pre.className = 'tno-prompt';
            pre.textContent = withSuffix ? '>> ' : '> ';
            const parts = [pre, text];
            if(withSuffix) {
                const suf = document.createElement('span');
                suf.className = 'tno-prompt';
                suf.textContent = ' <<';
                parts.push(suf);
            }
            el.replaceChildren(...parts);
        }

        function updateNames() {
            const sName = document.getElementById('senateNameInput').value;
            const hName = document.getElementById('houseNameInput').value;
            const tNameEl = document.getElementById('thirdNameInput');
            const tName = tNameEl ? tNameEl.value : '삼원';
            setPromptText(document.getElementById('senateTitle'), sName);
            setPromptText(document.getElementById('houseTitle'), hName);
            const thirdTitleEl = document.getElementById('thirdTitle');
            if(thirdTitleEl) setPromptText(thirdTitleEl, tName);
            document.getElementById('houseVoteResultTitle').textContent = `[ ${hName} 표결 결과 ]`;
            document.getElementById('senateVoteResultTitle').textContent = `[ ${sName} 표결 결과 ]`;
            const thirdVoteResultTitle = document.getElementById('thirdVoteResultTitle');
            if(thirdVoteResultTitle) thirdVoteResultTitle.textContent = `[ ${tName} 표결 결과 ]`;
            const innerSetupH = document.getElementById('innerTabSetupHouse');
            if(innerSetupH) innerSetupH.innerText = hName;
            const innerSetupS = document.getElementById('innerTabSetupSenate');
            if(innerSetupS) innerSetupS.innerText = sName;
            const innerSetupT = document.getElementById('innerTabSetupThird');
            if(innerSetupT) innerSetupT.innerText = tName;
            // 디스플레이 탭 이름
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
            const probH = document.getElementById('innerTabElecProbHouse');
            const probS = document.getElementById('innerTabElecProbSenate');
            const probT = document.getElementById('innerTabElecProbThird');
            if(probH) probH.textContent = hName;
            if(probS) probS.textContent = sName;
            if(probT) probT.textContent = tName;
            elecRenderProbBars(); // 선거 탭의 읽기전용 지지율 바 제목도 즉시 갱신
            const membersH = document.getElementById('innerTabMembersHouse');
            const membersS = document.getElementById('innerTabMembersSenate');
            const membersT = document.getElementById('innerTabMembersThird');
            if(membersH) membersH.textContent = hName;
            if(membersS) membersS.textContent = sName;
            if(membersT) membersT.textContent = tName;
            const listH = document.getElementById('innerTabListHouse');
            const listS = document.getElementById('innerTabListSenate');
            const listT = document.getElementById('innerTabListThird');
            if(listH) listH.textContent = hName;
            if(listS) listS.textContent = sName;
            if(listT) listT.textContent = tName;
            const centerLabelH = document.getElementById('chamberCenterLabelHouse');
            const centerLabelS = document.getElementById('chamberCenterLabelSenate');
            const centerLabelT = document.getElementById('chamberCenterLabelThird');
            if(centerLabelH) centerLabelH.textContent = `${hName} 반원 중앙 표시`;
            if(centerLabelS) centerLabelS.textContent = `${sName} 반원 중앙 표시`;
            if(centerLabelT) centerLabelT.textContent = `${tName} 반원 중앙 표시`;
            const distListH = document.getElementById('innerTabDistListHouse');
            const distListS = document.getElementById('innerTabDistListSenate');
            const distListT = document.getElementById('innerTabDistListThird');
            if(distListH) distListH.textContent = hName;
            if(distListS) distListS.textContent = sName;
            if(distListT) distListT.textContent = tName;
            // 카드 안 의석 레이블도 갱신 (renderCoalitions 제외로 무한루프 방지)
            renderIdeologyList();
            renderPartyList('house');
            renderPartyList('senate');
            renderPartyList('third');
            renderPartyInfoList();
            updateConfirmButtons();
            // 해산권 분할 체크박스 문구 및 비상 권한 선포 버튼("◯◯ 해산" 등)에 쓰인 원 이름도 함께 갱신
            const splitSenateLabel = document.getElementById('splitDissolutionSenateLabel');
            const splitHouseLabel = document.getElementById('splitDissolutionHouseLabel');
            if(splitSenateLabel) splitSenateLabel.textContent = sName;
            if(splitHouseLabel) splitHouseLabel.textContent = hName;
            renderEmergencyPowers();
            // 그동안 원 이름이 바뀌어도 갱신되지 않던 고정 버튼들 — 대선/총리선거 "기준 원" 선택,
            // 성향(SVG) 탭·여론>권역 탭의 원 선택 버튼 (전체 재렌더 대신 텍스트만 가볍게 갱신)
            const presElecH = document.getElementById('presElecChamberHouseBtn');
            const presElecS = document.getElementById('presElecChamberSenateBtn');
            const presElecT = document.getElementById('presElecChamberThirdBtn');
            if(presElecH) presElecH.textContent = hName;
            if(presElecS) presElecS.textContent = sName;
            if(presElecT) presElecT.textContent = tName;
            const tendSvgH = document.getElementById('tendencySvgChamberHouseBtn');
            const tendSvgS = document.getElementById('tendencySvgChamberSenateBtn');
            const tendSvgT = document.getElementById('tendencySvgChamberThirdBtn');
            if(tendSvgH) tendSvgH.textContent = hName;
            if(tendSvgS) tendSvgS.textContent = sName;
            if(tendSvgT) tendSvgT.textContent = tName;
            const regionH = document.getElementById('innerTabRegionHouse');
            const regionS = document.getElementById('innerTabRegionSenate');
            const regionT = document.getElementById('innerTabRegionThird');
            if(regionH) regionH.textContent = hName;
            if(regionS) regionS.textContent = sName;
            if(regionT) regionT.textContent = tName;
        }

        function refreshUI() {
            syncDistrictIndependentLinks();
            syncIndependents();
            syncListMembers();
            renderIdeologyList();
            renderPartyList('house');
            renderPartyList('senate');
            renderPartyList('third');
            renderCoalitions();
            renderPartyInfoList();
            renderLeaderList();
            renderListMemberList();
            renderMembersList();
        }

        function isValidHex(hex) { return /^#[0-9A-F]{6}$/i.test(hex); }

        // ── 공통 드래그 정렬 유틸리티 ──────────────
        // handleEl: 드래그 시작점(⋮⋮ 아이콘), containerId: 카드들이 들어있는 컨테이너 id,
        // cardSelector: 카드 클래스 선택자, arr: 재정렬할 배열, renderFn: 재정렬 후 다시 그릴 함수
        function startDragReorder(handleEl, containerId, cardSelector, arr, renderFn) {
            handleEl.addEventListener('pointerdown', e => {
                e.preventDefault();
                let card = handleEl.closest(cardSelector);
                if(!card) return;
                let idx = Array.from(card.parentElement.querySelectorAll(cardSelector)).indexOf(card);
                const startY = e.clientY;
                card.classList.add('drag-lifted');

                // 카드가 포인터를 따라 실시간으로 움직여야 "잡고 옮기는" 느낌이 나므로,
                // 재정렬이 일어나기 전까지는 translateY로 포인터 이동량만큼 계속 따라가게 함.
                // .drag-lifted의 transform 트랜지션(0.12s)이 걸려 있으면 포인터를 따라가는 게 아니라
                // 뒤늦게 쫓아오는 것처럼 보여 오히려 둔하게 느껴지므로, 드래그 중엔 트랜지션을 끔
                function followPointer(dy) {
                    card.style.transition = 'none';
                    card.style.transform = `translateY(${dy}px) scale(1.02)`;
                }
                followPointer(0);

                function onMove(ev) {
                    followPointer(ev.clientY - startY);

                    const container = document.getElementById(containerId);
                    if(!container) return;
                    const cards = Array.from(container.querySelectorAll(cardSelector));
                    const mouseY = ev.clientY;
                    // 드래그 중인 카드 자신은 포인터를 따라 계속 움직이므로(translateY), 그 카드의
                    // getBoundingClientRect()도 그만큼 이동해 있어 기준으로 삼으면 안 됨 — 나머지
                    // 카드들의 "원래" 위치만 보고, 그중 마우스보다 위에 있는 개수로 새 자리를 정함
                    let newIdx = 0;
                    cards.forEach((c, i) => {
                        if(i === idx) return;
                        const rect = c.getBoundingClientRect();
                        const mid = rect.top + rect.height/2;
                        if(mouseY >= mid) newIdx++;
                    });
                    newIdx = Math.max(0, Math.min(newIdx, arr.length-1));
                    if(newIdx !== idx) {
                        const [moved] = arr.splice(idx, 1);
                        arr.splice(newIdx, 0, moved);
                        idx = newIdx;
                        // 정당 목록을 드래그로 옮기면 이념순 자동정렬이 그 순서를 되돌리지 않도록 수동정렬로 전환
                        // (화살표 버튼으로 옮길 때의 moveParty()와 동일한 처리)
                        if(arr === parties) manualSort = true;
                        renderFn();
                        requestAnimationFrame(() => {
                            const newCards = document.getElementById(containerId)?.querySelectorAll(cardSelector);
                            if(newCards && newCards[idx]) {
                                card = newCards[idx]; // renderFn이 DOM을 새로 만들었으므로 카드 참조를 다시 잡음
                                card.classList.add('drag-lifted');
                                followPointer(0); // 새 카드는 이미 해당 자리에 놓였으므로 오프셋 없이 시작
                            }
                        });
                    }
                }
                function onUp() {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => { el.classList.remove('drag-lifted'); el.style.transform = ''; });
                    renderFn();
                    if(typeof simulate === 'function') simulate();
                }
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
            });
        }


        // ===== 정당 순서 =====
        let manualSort = false; // false: 이념 자동정렬, true: 수동정렬

        function autoSortParties() {
            manualSort = false;
            parties.sort((a,b) => {
                const ia = ideologySortKey(a.ideologyId);
                const ib = ideologySortKey(b.ideologyId);
                if(a.ideologyId===IND_IDEOLOGY_ID && b.ideologyId!==IND_IDEOLOGY_ID) return 1;
                if(b.ideologyId===IND_IDEOLOGY_ID && a.ideologyId!==IND_IDEOLOGY_ID) return -1;
                return ia - ib;
            });
            simulate(); refreshUI();
        }

        function moveParty(idx, dir) {
            manualSort = true;
            const target = idx + dir;
            if(target < 0 || target >= parties.length) return;
            [parties[idx], parties[target]] = [parties[target], parties[idx]];
            simulate(); refreshUI();
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
                div.style.flexWrap = 'wrap';
                const isInd = ide.id === IND_IDEOLOGY_ID;
                const subs = ide.subs || [];
                // 서브 이념: 부모 카드 안에 들여 써서 표시 (드래그 정렬은 부모 이념만, 서브는 ▲▼로)
                const subsHtml = subs.map((sub, si) => `
                    <div style="display:flex;gap:5px;align-items:center;width:100%;padding-left:28px;box-sizing:border-box;">
                        <span style="color:#555;flex-shrink:0;">└</span>
                        <input type="text" value="${sub.name}" style="flex:1;min-width:0;font-size:0.9rem;" onchange="updateSubIdeology(${ide.id}, ${sub.id}, this.value)">
                        <button class="order-btn" onclick="moveSubIdeology(${ide.id}, ${sub.id}, -1)" ${si===0?'disabled style="opacity:0.2"':''}>▲</button>
                        <button class="order-btn" onclick="moveSubIdeology(${ide.id}, ${sub.id}, 1)" ${si===subs.length-1?'disabled style="opacity:0.2"':''}>▼</button>
                        <button class="remove-btn" onclick="removeSubIdeology(${ide.id}, ${sub.id})">X</button>
                    </div>`).join('');
                div.innerHTML = `
                    <span class="drag-handle">⋮⋮</span>
                    <input type="text" value="${ide.name}" style="flex:1;min-width:0;" onchange="updateIdeology(${index}, 'name', this.value)">
                    ${isInd ? '' : `<button class="dup-btn" title="서브 이념 추가" onclick="addSubIdeology(${ide.id})">+ 서브</button>`}
                    ${isInd ? '' : `<button class="remove-btn" onclick="removeIdeology(${index})">X</button>`}
                    ${subsHtml}
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

            const hName = document.getElementById('houseNameInput')?.value || '하원';
            const sName = document.getElementById('senateNameInput')?.value || '상원';
            const tNameEl = document.getElementById('thirdNameInput');
            const tName = tNameEl ? tNameEl.value : '삼원';
            const thisChamberName = type === 'house' ? hName : type === 'senate' ? sName : tName;
            const inKey = inKeyFor(type);

            const visibleParties = parties.map((p,idx)=>({...p,originalIdx:idx}))
                .filter(p => p[inKey]);

            if(visibleParties.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[배정된 정당 없음]</div>';
                return;
            }
            const sumLine = document.createElement('div');
            sumLine.dataset.seatSum = type;
            container.appendChild(sumLine);
            fillSeatSumLine(sumLine, type);
            visibleParties.forEach(p => {
                const idx = p.originalIdx;
                const seatKey = seatKeyFor(type);
                const photo = p.logoPhoto || '';
                const ideoLabel = ideologyName(p.ideologyId) || '';
                const div = document.createElement('div');
                div.className = `card-item drag-card-partylist-${type} ${p.isRuling?'is-ruling':''}`;
                div.dataset.pid = p.id;
                div.style.borderLeftColor = p.color;
                div.innerHTML = `
                    <div style="display:grid;grid-template-columns:auto auto 1fr;grid-template-rows:auto auto;column-gap:8px;row-gap:3px;align-items:center;">
                        <span class="drag-handle" style="grid-row:1/3;">⋮⋮</span>
                        <!-- 당 로고 (정사각형, 업로드 가능, 2행에 걸쳐 표시) -->
                        <div class="leader-photo-box" title="당 로고 업로드" style="grid-row:1/3;width:45px;height:45px;flex-shrink:0;">
                            ${photo
                                ? `<img src="${photo}" alt="로고" style="width:100%;height:100%;object-fit:cover;display:block;">`
                                : `<div style="width:100%;height:100%;background:${p.color}22;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:${p.color}88;">⚑</div>`
                            }
                            <input type="file" accept="image/*" onchange="uploadLogoPhoto(this,${p.id})">
                        </div>
                        <!-- 1행: 정당명 + 상태 뱃지 -->
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;">
                            <span style="display:flex;align-items:center;gap:6px;min-width:0;">
                                <span style="width:9px;height:9px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="font-size:1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
                            </span>
                            ${partyStatusBadge(p)}
                        </div>
                        <!-- 2행: 이념 + 의석 수 입력 -->
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;">
                            <span style="color:#666;font-size:0.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${ideoLabel}</span>
                            <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                                <label style="color:#555;font-size:0.75rem;white-space:nowrap;">${thisChamberName} 의석</label>
                                <input type="number" value="${p[seatKey]}" min="0" max="${Math.max(p[seatKey]||0, chamberTotalSeats(type) - chamberSeatSum(type, p.id))}"
                                    onchange="setPartySeats(${idx},'${type}',this.value)"
                                    ${p.status==='dissolved'?'disabled':''}
                                    style="width:65px;${p.status==='dissolved'?'opacity:0.5;cursor:not-allowed;':''}">
                            </div>
                        </div>
                    </div>
                    ${(p.factions||[]).length>0?`
                    <div style="margin-top:6px;border-top:1px solid #1a1d22;padding-top:5px;">
                        ${(p.factions||[]).map((f,fi)=>{
                            const fSeatKey = seatKeyFor(type);
                            return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #111;">
                                <span style="width:6px;height:6px;background:${f.usePartyColor?p.color:f.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="flex:1;font-size:0.8rem;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span>
                                <input type="number" value="${f[fSeatKey]||0}" min="0" style="width:55px;font-size:0.8rem;${p.status==='dissolved'?'opacity:0.5;cursor:not-allowed;':''}"
                                    onchange="updateFactionById(${p.id},'${f.id}','${fSeatKey}',parseInt(this.value)||0)"
                                    ${p.status==='dissolved'?'disabled':''}>
                            </div>`;
                        }).join('')}
                        ${(()=>{
                            const fSeatKey = seatKeyFor(type);
                            const sum = (p.factions||[]).reduce((s,f)=>s+(f[fSeatKey]||0),0);
                            const ok = sum===p[seatKey];
                            return `<div data-faction-sum data-party-id="${p.id}" data-seat-key="${fSeatKey}"
                                style="text-align:right;font-size:0.75rem;margin-top:3px;color:${ok?'#00cc66':'#cc3333'};">합계 ${sum}/${p[seatKey]}석 ${ok?'✓':'✗'}</div>`;
                        })()}
                    </div>`:''}
                    `;
                container.appendChild(div);
                startPartyListDragReorder(div.querySelector('.drag-handle'), containerId, `.drag-card-partylist-${type}`, type);
            });
        }

        // 의회>설정 하원/상원/삼원 리스트는 전체 정당 중 필터링된 부분집합만 보여주므로,
        // 화면상 순서를 전역 parties 배열에 정확히 반영하는 전용 드래그 유틸리티
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

        // 무소속 의원 순서 변경: 배열 위치가 아니라 seatIndex를 재할당 (getMap이 seatIndex 기준 정렬로 좌석 배정하므로)
        function startIndependentDragReorder(handleEl, containerId, cardSelector, chamber, renderFn) {
            if(!handleEl) return;
            handleEl.addEventListener('pointerdown', e => {
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
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => el.classList.remove('drag-lifted'));
                    applyOrder();
                    renderFn();
                    simulate();
                }
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
            });
        }

        function startPartyListDragReorder(handleEl, containerId, cardSelector, type) {
            if(!handleEl) return;
            handleEl.addEventListener('pointerdown', e => {
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
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    document.querySelectorAll('.drag-lifted').forEach(el => el.classList.remove('drag-lifted'));
                    renderPartyList(type);
                    simulate();
                }
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
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
                // "무소속" 정당은 여러 무소속 의원을 뭉뚱그린 가상 정당이라 연정 체크박스 목록에서는 제외 —
                // 개별 무소속 의원 배정은 아래 memberIndRows/extIndRows(무소속 탭 관리)로만 표시한다.
                const nonIndParties = parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID);
                const memberParties = nonIndParties.filter(p=>coal.members.includes(p.id));
                let memberChecks = nonIndParties.map(p=>{
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
                const extChecks = nonIndParties
                    .filter(p => !coal.members.includes(p.id))
                    .map(p => `
                    <div style="display:flex;align-items:center;border-bottom:1px solid #222;padding:3px 0;">
                        <span style="width:9px;height:9px;background:${p.color};border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0;"></span>
                        <label style="flex:1;margin:0;cursor:pointer;font-size:0.9rem;color:#aaa;" for="c${cIdx}_ext${p.id}">${p.name}</label>
                        <input type="checkbox" id="c${cIdx}_ext${p.id}" ${coal.externalSupporters.includes(p.id)?'checked':''} onchange="toggleCoalitionExternalSupport('${coal.id}',${p.id},this.checked)">
                    </div>`).join('');

                // 무소속 탭에서 개별 배정된 의원(indKey) — 정당 체크박스로는 안 잡히므로 이름/좌석번호로 별도 표시
                const indLabelFor = (indKey) => {
                    const ind = independents.find(x => 'ind__'+x.id === indKey);
                    if(!ind) return indKey;
                    return ind.name ? ind.name : `#${computeIndependentOffset(ind.chamber) + ind.seatIndex}`;
                };
                const memberIndKeys = coal.members.filter(m => typeof m === 'string' && m.startsWith('ind__'));
                const extIndKeys = coal.externalSupporters.filter(m => typeof m === 'string' && m.startsWith('ind__'));
                const memberIndRows = memberIndKeys.map(k => `
                    <div style="display:flex;align-items:center;border-bottom:1px solid #222;padding:3px 0;">
                        <span style="width:9px;height:9px;background:#999;border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0;"></span>
                        <label style="flex:1;margin:0;font-size:0.9rem;color:#ccc;">${indLabelFor(k)}</label>
                        <span style="color:#555;font-size:0.75rem;" title="무소속 탭에서 관리">무소속</span>
                    </div>`).join('');
                const extIndRows = extIndKeys.map(k => `
                    <div style="display:flex;align-items:center;border-bottom:1px solid #222;padding:3px 0;">
                        <span style="width:9px;height:9px;background:#999;border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0;"></span>
                        <label style="flex:1;margin:0;font-size:0.9rem;color:#aaa;">${indLabelFor(k)}</label>
                        <span style="color:#555;font-size:0.75rem;" title="무소속 탭에서 관리">무소속</span>
                    </div>`).join('');
                const memberCount = memberParties.length + memberIndKeys.length;
                const membersCollapsed = coal._membersCollapsed ?? false;
                const extCollapsed = coal._extCollapsed ?? true; // 각외협력은 기본 접힘
                // 각외협력(신임과 보완)은 정부 지지를 의미하므로 집권 연정에만 실제 효과가 있다.
                // 비집권 연정에서 체크해도 아무 데도 반영되지 않아 혼란을 주므로, 아예 노출하지 않는다.
                const extSectionHtml = coal.isRuling ? `
                    <!-- 각외협력 (접기 가능) -->
                    <div onclick="toggleCoalitionSection('${coal.id}','ext')" style="display:flex;align-items:center;gap:6px;margin-top:10px;cursor:pointer;user-select:none;">
                        <span style="color:#888;font-size:0.8rem;">${extCollapsed?'▶':'▼'}</span>
                        <span style="color:#555;font-size:0.78rem;letter-spacing:1px;" title="연정에 정식 참여하지 않지만 신임투표·예산안 등에서 정부를 지지하는 정당">▌ ${coal.externalSupportLabel ?? '각외협력'} (${coal.externalSupporters.length})</span>
                    </div>
                    <div style="display:${extCollapsed?'none':'block'};">
                        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;" onclick="event.stopPropagation()">
                            <span style="color:#555;font-size:0.78rem;letter-spacing:1px;white-space:nowrap;">▌ 명칭</span>
                            <input type="text" value="${coal.externalSupportLabel ?? '각외협력'}" placeholder="각외협력"
                                style="flex:1;background:#000;border:1px solid #443300;color:#cc9900;font-family:inherit;font-size:0.78rem;padding:2px 6px;"
                                title="명칭 커스터마이징 (예: 신임과 보완, 보완과 신임 등)"
                                onchange="updateCoalition('${coal.id}','externalSupportLabel',this.value.trim()||'각외협력')">
                        </div>
                        <div class="coalition-members" style="border-color:#443300;margin-top:6px;">${extChecks}${extIndRows}${(!extChecks && !extIndRows) ? '<div style="color:#333;font-size:0.8rem;padding:4px 0;">비멤버 정당 없음</div>' : ''}</div>
                    </div>` : `
                    <div style="margin-top:10px;color:#444;font-size:0.75rem;letter-spacing:0.5px;" title="신임투표·예산안 등에서 정부를 지지하는 각외협력은 집권 연정에만 설정할 수 있습니다.">▌ 각외협력은 집권 연정에서만 설정 가능</div>`;
                div.innerHTML = `
                    <div style="display:flex;gap:8px;align-items:center;">
                        <!-- 햄버거 드래그 핸들 -->
                        <span class="drag-handle" title="드래그로 순서 변경">⋮⋮</span>
                        <!-- 연정명 색상 X -->
                        <div style="flex:1;display:flex;gap:4px;align-items:center;min-width:0;">
                            <input type="text" value="${coal.name}" onchange="updateCoalition('${coal.id}','name',this.value)" style="flex:1;min-width:0;">
                            <div class="color-input-group" style="flex-shrink:0;">
                                <input type="text" class="hex-input" value="${coal.color}" onchange="updateCoalitionColorText(this,'${coal.id}')">
                                <input type="color" value="${coal.color}" oninput="updateCoalitionColorPicker(this,'${coal.id}')">
                            </div>
                            <button class="remove-btn" onclick="removeCoalition('${coal.id}')">X</button>
                        </div>
                    </div>
                    <!-- 대표당 + 집권 -->
                    <div style="display:flex;gap:6px;align-items:center;margin-top:6px;">
                        ${memberParties.length>0?`<select onchange="updateCoalition('${coal.id}','leadPartyId',parseInt(this.value)||null)"
                            style="flex:1;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:3px;min-width:0;">
                            <option value="">-- 대표당 미지정 --</option>
                            ${memberParties.map(p=>`<option value="${p.id}" ${coal.leadPartyId===p.id?'selected':''}>${p.name}</option>`).join('')}
                        </select>`:'<span style="flex:1;color:#444;font-size:0.8rem;">멤버 없음</span>'}
                        <div class="ruling-selector ${coal.isRuling?'active':''}" onclick="setRuling('coalition','${coal.id}')" style="padding:3px 8px;white-space:nowrap;flex-shrink:0;font-size:0.85rem;">
                            ${coal.isRuling?'★ 집권':'집권 설정'}
                        </div>
                    </div>
                    <!-- 멤버 (접기 가능) -->
                    <div onclick="toggleCoalitionSection('${coal.id}','members')" style="display:flex;align-items:center;gap:6px;margin-top:10px;cursor:pointer;user-select:none;">
                        <span style="color:#888;font-size:0.8rem;">${membersCollapsed?'▶':'▼'}</span>
                        <span style="color:#555;font-size:0.78rem;letter-spacing:1px;">▌ 멤버 (${memberCount})</span>
                    </div>
                    <div class="coalition-members" style="display:${membersCollapsed?'none':'block'};">${memberChecks}${memberIndRows}</div>
                    ${extSectionHtml}`;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'coalitionList', '.drag-card-coalition', coalitions, renderCoalitions);
            });
            const singleHeader = document.createElement('div');
            singleHeader.style.cssText = 'margin-top:20px;border-top:1px dashed #444;color:#666;padding-top:8px;';
            singleHeader.innerText = "단독 집권 (SINGLE PARTY RULE)";
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

        // 사진 업로드
        function uploadLogoPhoto(input, pid) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const p = parties.find(x=>x.id===pid);
                if(p){ p.logoPhoto = e.target.result; simulate(); refreshUI(); }
            };
            reader.readAsDataURL(file);
        }

        // ─────────────────────────────────────────
        // 하원/상원 탭 - 반원/지역구 view 전환
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
            const svgWrap = document.getElementById(chamber+'DistrictSvgWrap');
            if(!cvs) return;
            if(districtMapMode === 'svg') {
                cvs.style.display = 'none';
                if(svgWrap) {
                    svgWrap.style.display = '';
                    const lastRecord = [...elecRecords].reverse().find(r => r.chamberType===chamber && r.districtResults?.length>0);
                    const breakdown = elecBuildDistrictSeatBreakdown(lastRecord?.districtResults);
                    const result = elecSvgBuildResultFill(breakdown, chamber);
                    renderDistrictSvgInto(svgWrap, { getFill: result.getFill, title: result.getTitle, seatBadges: result.getBadges, defs: result.defs });
                }
                return;
            }
            if(svgWrap) svgWrap.style.display = 'none';
            cvs.style.display = '';
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
                ctx.fillStyle = tc('#444', '--m-text-4');
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('설정된 지역구가 없습니다', w/2, h/2);
                return;
            }

            // 이 의원실의 마지막 지역구 선거 결과 찾기
            const lastRecord = [...elecRecords].reverse().find(r => r.chamberType===chamber && r.districtResults?.length>0);
            const resultMap = {};
            if(lastRecord) lastRecord.districtResults.forEach(d => { resultMap[d.key] = d.partyId; });

            let minQ=Infinity,maxQ=-Infinity,minR=Infinity,maxR=-Infinity;
            keys.forEach(k=>{ const [q,r]=k.split(',').map(Number); if(q<minQ)minQ=q; if(q>maxQ)maxQ=q; if(r<minR)minR=r; if(r>maxR)maxR=r; });
            const spanQ=(maxQ-minQ+1)+2, spanR=(maxR-minR+1)+2;
            const sizeByW = w/(spanQ*1.5+0.5);
            const sizeByH = h/(spanR*Math.sqrt(3)+Math.sqrt(3)/2+1);
            // 지역구 맵 편집 화면(HEX_SIZE*3 캡)과 동일한 크기 상한을 사용해 미리보기가 지나치게 작아지지 않게 함
            const size = Math.min(sizeByW, sizeByH, HEX_SIZE * 3);
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

                // 집권 세력 강조: 여당(정당/연정 소속)은 골드 실선+글로우, 각외협력은 골드 점선
                if(p && highlightGov) {
                    const coal = coalitions.find(c=>c.members.includes(p.id));
                    const isGov = p.isRuling || (coal && coal.isRuling);
                    const isExtSupport = !isGov && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
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
                ctx.fillText('지역구 선거 기록이 없어 배경만 표시됩니다', w/2, h-9);
            }
        }

        // 사진 박스 크기를 기준 요소(dyn-ref) 실측 높이에 맞춰 JS로 직접 px 지정
        // (CSS align-items:stretch + aspect-ratio 조합이 일부 환경에서 렌더 실패하므로 JS로 대체)
        function fitDynPhotos(scopeEl, rows) {
            if(!scopeEl) return;
            // 높이를 전부 먼저 읽고 나서 한꺼번에 쓴다 — 카드마다 읽기/쓰기를 번갈아 하면 매번 레이아웃을 다시 계산해
            // 카드가 수백 장(예: 비례 300석)일 때 화면이 멈춘 듯 느려진다
            const measured = (rows || Array.from(scopeEl.querySelectorAll('.dyn-row'))).map(row => {
                const ref = row.querySelector('.dyn-ref');
                return [row, ref ? (ref.offsetHeight || 0) : 0];
            });
            measured.forEach(([row, h]) => {
                if(h <= 0) return;

                // 스택형 그룹(세로로 쌓인 여러 사진이 기준 높이를 나눠 가짐)
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

                // 스택에 속하지 않은 단일 사진: 기준 높이 전체 사용
                row.querySelectorAll('.dyn-photo').forEach(box => {
                    if(box.closest('.dyn-stack')) return; // 이미 처리됨
                    const ratio = parseFloat(box.dataset.ratio) || 1;
                    box.style.height = h + 'px';
                    box.style.width  = Math.round(h * ratio) + 'px';
                });
            });
        }

        function uploadLeaderPhoto(input, pid) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const p = parties.find(x=>x.id===pid);
                if(p){ p.leaderPhoto=e.target.result; simulate(); refreshUI(); }
            };
            reader.readAsDataURL(file);
        }

        function updateLeaderField(pid, field, val) {
            const p = parties.find(x=>x.id===pid);
            if(p){ p[field]=val; simulate(); }
        }

        // ── 당수 ↔ 의석 정보 복사: 당수 탭에서 편집한 이름·사진을 고른 의석에 붙여넣거나,
        // 반대로 의원 카드에서 "당수로 지정"을 눌러 그 의원 정보를 당수로 끌어올림. 양쪽 다 1회성 복사이며
        // 이후에는 서로 독립적으로 값이 유지됨 (자동 동기화하지 않음) ──────────────
        function writeLinkedSeatInfo(link, name, photo) {
            if(!link) return;
            if(link.type === 'district') {
                const m = districtMembers[link.chamber]?.[link.key];
                if(!m) return;
                const party = parties.find(p => p.id === m.partyId);
                if(party?.ideologyId === IND_IDEOLOGY_ID) {
                    const ind = independents.find(x => x.chamber === link.chamber && x.districtKey === link.key);
                    if(ind) { ind.name = name; ind.photo = photo; }
                } else {
                    m.name = name; m.photo = photo;
                }
                renderMembersList();
            } else if(link.type === 'list') {
                const m = listMembers[link.chamber]?.[link.partyId]?.find(x => x.id === link.memberId);
                if(!m) return;
                m.name = name; m.photo = photo;
                renderListMemberList();
            } else if(link.type === 'independent') {
                const ind = independents.find(x => x.id === link.memberId);
                if(!ind) return;
                ind.name = name; ind.photo = photo;
                rerenderIndependentOwner(ind);
            }
        }

        // 당수 탭에서 고른 의석 선택 드롭다운 — 해당 정당 소속 의원만 나열
        function partyMemberPickerOptionsHtml(partyId) {
            const party = parties.find(p => p.id === partyId);
            const opts = ['<option value="">-- 의석 선택 (붙여넣기 대상) --</option>'];
            chamberList().forEach(ch => {
                const chLabel = chamberDisplayName(ch);
                districtSortedKeys(ch).forEach((key, i) => {
                    const m = districtMembers[ch]?.[key];
                    if(!m || m.vacant || m.partyId !== partyId) return;
                    const isInd = party?.ideologyId === IND_IDEOLOGY_ID;
                    const ind = isInd ? independents.find(x => x.chamber === ch && x.districtKey === key) : null;
                    const nm = isInd ? (ind?.name || '무소속') : (m.name || '(이름 없음)');
                    opts.push(`<option value="district:${ch}:${key}">[${chLabel}] #${i+1} ${nm}</option>`);
                });
                (listMembers[ch]?.[partyId]||[]).forEach(m => {
                    if(m.vacant) return;
                    opts.push(`<option value="list:${ch}:${partyId}:${m.id}">[${chLabel} 비례] ${m.name||'(이름 없음)'}</option>`);
                });
                if(party?.ideologyId === IND_IDEOLOGY_ID) {
                    independents.filter(x => x.chamber === ch && !x.districtKey).forEach(ind => {
                        const label = ind.name || `#${computeIndependentOffset(ch) + ind.seatIndex}`;
                        opts.push(`<option value="independent:${ind.id}">[${chLabel} 비례·무소속] ${label}</option>`);
                    });
                }
            });
            return opts.join('');
        }

        // 당수 탭에서 편집 중인 이름·사진을 고른 의석에 1회 붙여넣기
        function pasteLeaderToSeat(pid, val) {
            const link = parseMemberPickerValue(val);
            if(!link) return;
            const p = parties.find(x => x.id === pid);
            if(!p) return;
            writeLinkedSeatInfo(link, p.leaderName || '', p.leaderPhoto || '');
            refreshUI();
        }

        function pasteFloorLeaderToSeat(pid, val) {
            const link = parseMemberPickerValue(val);
            if(!link) return;
            const p = parties.find(x => x.id === pid);
            if(!p) return;
            writeLinkedSeatInfo(link, p.floorLeaderName || '', p.floorLeaderPhoto || '');
            refreshUI();
        }

        // 이 의원의 이름·사진이 현재 당수 정보와 일치하는지 — 일치하면 "당수로 지정" 버튼을 숨겨서
        // 이미 당수인 사람에게 다시 버튼을 보여주지 않는다 (이름 없는 빈 카드끼리의 우연한 일치는 제외)
        function isPartyLeaderMatch(partyId, name, photo) {
            const p = parties.find(x => x.id === partyId);
            if(!p || !name) return false;
            return (p.leaderName || '') === name && (p.leaderPhoto || '') === (photo || '');
        }

        // 의원 카드의 "당수로 지정" 버튼 — 그 의원의 이름·사진을 당수로 1회 복사
        function designatePartyLeader(partyId, name, photo) {
            const p = parties.find(x => x.id === partyId);
            if(!p) return;
            p.leaderName = name || '';
            p.leaderPhoto = photo || '';
            renderLeaderList();
            refreshUI();
        }

        function designatePartyLeaderFromDistrictSeat(ch, key) {
            const m = districtMembers[ch]?.[key];
            if(!m) return;
            const party = parties.find(p => p.id === m.partyId);
            if(!party) return;
            let name = m.name || '', photo = m.photo || '';
            if(party.ideologyId === IND_IDEOLOGY_ID) {
                const ind = independents.find(x => x.chamber === ch && x.districtKey === key);
                name = ind?.name || ''; photo = ind?.photo || '';
            }
            designatePartyLeader(party.id, name, photo);
        }

        function designatePartyLeaderFromListSeat(ch, partyId, memberId) {
            const m = listMembers[ch]?.[partyId]?.find(x => String(x.id) === String(memberId));
            if(!m) return;
            designatePartyLeader(parseInt(partyId), m.name || '', m.photo || '');
        }

        function designatePartyLeaderFromIndependent(indId) {
            const ind = independents.find(x => String(x.id) === String(indId));
            if(!ind) return;
            const party = getIndependentParty();
            if(!party) return;
            designatePartyLeader(party.id, ind.name || '', ind.photo || '');
        }

        function addIdeology() { ideologies.push({ id: Date.now(), name: window.DnoLang ? DnoLang.t("새 이념") : "새 이념" }); refreshUI(); }
        function addIndependentIdeology() {
            if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) ideologies.push({id:IND_IDEOLOGY_ID, name:"무소속"});
            simulate(); refreshUI();
        }
        function removeIdeology(idx) {
            if(ideologies.length<=1) return;
            const ide = ideologies[idx];
            const gone = new Set([ide.id, ...(ide.subs || []).map(s => s.id)]);
            ideologies.splice(idx,1);
            parties.forEach(p=>{if(gone.has(p.ideologyId))p.ideologyId=ideologies[0].id;});
            reassignIdeologyRefs(gone, null);
            simulate(); refreshUI();
        }
        // 이념이 지워졌을 때 파벌·무소속 의원이 가리키던 이념을 바꾼다 (toId가 null이면 파벌은 정당 이념을 따르게)
        function reassignIdeologyRefs(goneIds, toId) {
            parties.forEach(p => (p.factions || []).forEach(f => { if(gone(f.ideologyId)) f.ideologyId = toId ?? p.ideologyId; }));
            independents.forEach(ind => { if(gone(ind.ideologyId)) ind.ideologyId = toId; });
            function gone(id) { return goneIds.has(id); }
        }
        function addSubIdeology(parentId) {
            const ide = ideologies.find(i => i.id === parentId); if(!ide) return;
            if(!ide.subs) ide.subs = [];
            ide.subs.push({ id: Date.now(), name: window.DnoLang ? DnoLang.t('새 서브 이념') : '새 서브 이념' }); // 영어 모드면 기본 이름도 번역
            refreshUI();
        }
        function updateSubIdeology(parentId, subId, name) {
            const sub = ideologies.find(i => i.id === parentId)?.subs?.find(s => s.id === subId);
            if(sub) { sub.name = name; simulate(); refreshUI(); }
        }
        function moveSubIdeology(parentId, subId, dir) {
            const subs = ideologies.find(i => i.id === parentId)?.subs; if(!subs) return;
            const i = subs.findIndex(s => s.id === subId), j = i + dir;
            if(i < 0 || j < 0 || j >= subs.length) return;
            [subs[i], subs[j]] = [subs[j], subs[i]];
            simulate(); refreshUI();
        }
        // 서브 이념을 지우면 그 서브를 고른 정당·파벌·무소속 의원은 부모 이념으로 돌아간다
        function removeSubIdeology(parentId, subId) {
            const ide = ideologies.find(i => i.id === parentId); if(!ide?.subs) return;
            ide.subs = ide.subs.filter(s => s.id !== subId);
            parties.forEach(p => { if(p.ideologyId === subId) p.ideologyId = parentId; });
            reassignIdeologyRefs(new Set([subId]), parentId);
            simulate(); refreshUI();
        }
        function updateIdeology(i,k,v) { ideologies[i][k]=v; simulate(); refreshUI(); }
        function moveIdeology(i,d) { if((d===-1&&i>0)||(d===1&&i<ideologies.length-1)){ [ideologies[i], ideologies[i+d]] = [ideologies[i+d], ideologies[i]]; simulate(); refreshUI(); }}
        function addParty(chamber) {
            const flags = { inHouse:false, inSenate:false, inThird:false };
            if(chamber === 'house') flags.inHouse = true;
            else if(chamber === 'senate') flags.inSenate = true;
            else if(chamber === 'third') flags.inThird = true;
            else flags.inHouse = true; // 정당 탭 등 컨텍스트 없을 때 기본값
            // 새 정당의 기본 이념: 무소속 이념은 제외하고 마지막 일반 이념을 사용 (무소속은 목록 맨 뒤에 자동 추가되므로)
            const nonIndIdeologies = ideologies.filter(i => i.id !== IND_IDEOLOGY_ID);
            const defaultIdeologyId = nonIndIdeologies.length > 0 ? nonIndIdeologies[nonIndIdeologies.length - 1].id : ideologies[0]?.id;
            parties.push({id:Date.now(), name:"신당", color:"#555555", seatsHouse:0, seatsSenate:0, seatsThird:0, ideologyId:defaultIdeologyId, isRuling:false, ...flags, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, hideStatsPhoto: false, factions: [] }); refreshUI(); }
        function addIndependentParty() {
            if(!ideologies.find(i=>i.id===IND_IDEOLOGY_ID)) addIndependentIdeology();
            parties.push({id:Date.now(), name:"무소속", color:"#999999", seatsHouse:1, seatsSenate:0, seatsThird:0, ideologyId:IND_IDEOLOGY_ID, isRuling:false, inHouse:true, inSenate:true, inThird:false, leaderName: "", leaderPhoto: "", logoPhoto: "", showLogoInStats: false, hideStatsPhoto: false, factions: [] });
            simulate(); refreshUI();
        }
        function removeParty(i) { const pid=parties[i].id; parties.splice(i,1); coalitions.forEach(c=>c.members=c.members.filter(x=>x!==pid)); simulate(); refreshUI(); }

        // ===== 합당 (흡수합당 / 신설합당) =====
        // 흡수합당: 존속 정당 하나가 다른 정당들을 흡수 — 존속 정당의 이름·색·당수는 그대로
        // 신설합당: 여러 정당이 합쳐 새 정당을 창당 — 합쳐진 정당들은 모두 사라진다
        // 의석·의원(비례 명단·지역구)·파벌·연정·지지율/성향·내각 소속은 모두 합쳐지는 쪽(대상 정당)으로 옮기고,
        // 선거 기록·지난 표결처럼 이미 지나간 기록은 당시 정당 이름 그대로 남긴다.
        let partyMergeMode = 'absorb';
        let partyMergeChecked = new Set(); // 통째로 합쳐지는 정당 id
        let partyMergeFactionSel = {};     // { 정당 id: Set(파벌 id) } — 정당 일부(고른 파벌만)가 떨어져 나와 합쳐지는 경우
        let partyMergeIdeologyTouched = false; // 사용자가 새 정당 이념을 직접 고르기 전까진 합쳐지는 최대 정당의 이념을 따라감

        function mergeablePartyList() { return parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID); }

        function partySeatSummaryText(p) {
            return chamberList().map(ch => `${chamberDisplayName(ch)} ${p[seatKeyFor(ch)] || 0}`).join(' · ');
        }

        function openPartyMergeDialog() {
            const list = mergeablePartyList();
            if(list.length < 2) { showCustomAlert('합당하려면 정당이 2개 이상 있어야 합니다.'); return; }
            partyMergeChecked = new Set();
            partyMergeFactionSel = {};
            const survivorSel = document.getElementById('mergeSurvivorSelect');
            const largest = list.reduce((a, b) => ((b.seatsHouse || 0) > (a.seatsHouse || 0) ? b : a), list[0]);
            survivorSel.innerHTML = list.map(p => `<option value="${p.id}">${escapeHtmlText(p.name)}</option>`).join('');
            survivorSel.value = String(largest.id);
            document.getElementById('mergeNewName').value = '';
            document.getElementById('mergeNewAbbr').value = '';
            document.getElementById('mergeNewColor').value = '#6a5acd';
            const ideoSel = document.getElementById('mergeNewIdeology');
            ideoSel.innerHTML = ideologyOptionsHtml(null);
            ideoSel.value = String(largest.ideologyId);
            partyMergeIdeologyTouched = false;
            document.getElementById('mergeKeepAsFaction').checked = true;
            setPartyMergeMode('absorb');
            document.getElementById('partyMergeOverlay').style.display = 'flex';
        }

        function closePartyMergeDialog() {
            document.getElementById('partyMergeOverlay').style.display = 'none';
        }

        function setPartyMergeMode(mode) {
            partyMergeMode = mode === 'new' ? 'new' : 'absorb';
            const isNew = partyMergeMode === 'new';
            document.getElementById('mergeModeAbsorbBtn').classList.toggle('active', !isNew);
            document.getElementById('mergeModeNewBtn').classList.toggle('active', isNew);
            document.getElementById('mergeAbsorbSection').style.display = isNew ? 'none' : '';
            document.getElementById('mergeNewSection').style.display = isNew ? '' : 'none';
            document.getElementById('mergeSourcesLabel').textContent = isNew ? '합칠 정당 · 파벌 (2개 이상 — 파벌만 골라 떼어 올 수도 있어요)' : '흡수될 정당 · 파벌 (파벌만 골라 떼어 올 수도 있어요)';
            document.getElementById('mergeKeepAsFactionText').textContent = isNew ? '합쳐지는 정당들을 새 정당의 계파로 남기기' : '흡수되는 정당을 계파로 남기기';
            document.getElementById('mergeModeHint').textContent = isNew
                ? '고른 정당들이 모두 해산하고 새 정당으로 합쳐집니다. 의석·의원·연정·지지율이 새 정당으로 옮겨집니다.'
                : '존속 정당이 이름·색·당수를 유지한 채 다른 정당들을 흡수합니다. 흡수된 정당의 의석·의원·연정·지지율이 존속 정당으로 옮겨집니다.';
            renderPartyMergeDialog();
        }

        function renderPartyMergeDialog() {
            const isNew = partyMergeMode === 'new';
            const survivorId = Number(document.getElementById('mergeSurvivorSelect').value);
            const list = mergeablePartyList().filter(p => isNew || p.id !== survivorId);
            if(!isNew) { partyMergeChecked.delete(survivorId); delete partyMergeFactionSel[survivorId]; }
            // 파벌이 있는 정당은 그 아래에 파벌 체크박스를 둔다 — 정당을 체크하면 파벌 전체 선택(=정당 통째로 합당),
            // 파벌 일부만 체크하면 그 파벌들만 원래 정당에서 떨어져 나와 합쳐진다
            document.getElementById('mergeSourceList').innerHTML = list.map(p => {
                const facs = p.factions || [];
                const whole = partyMergeChecked.has(p.id);
                const sel = partyMergeFactionSel[p.id];
                const partial = !whole && sel && sel.size > 0;
                const facHtml = facs.map(f => `
                    <label style="display:flex;align-items:center;gap:8px;padding:4px 8px 4px 30px;border:1px solid #1a1a1a;border-top:none;margin:-4px 0 4px;cursor:pointer;">
                        <input type="checkbox" ${(whole || sel?.has(f.id)) ? 'checked' : ''} onchange="togglePartyMergeFaction(${p.id}, '${f.id}', this.checked)">
                        <span style="width:8px;height:8px;display:inline-block;flex-shrink:0;background:${f.usePartyColor ? p.color : f.color};"></span>
                        <span style="flex:1;min-width:0;color:#999;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtmlText(f.name)}</span>
                        <span style="color:#555;font-size:0.72rem;white-space:nowrap;">${partySeatSummaryText(f)}</span>
                    </label>`).join('');
                return `
                <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid #222;margin-bottom:4px;cursor:pointer;">
                    <input type="checkbox" ${whole ? 'checked' : ''} ${partial ? 'data-partial="1"' : ''} onchange="togglePartyMergeSource(${p.id}, this.checked)">
                    <span style="width:10px;height:10px;display:inline-block;flex-shrink:0;background:${p.color};"></span>
                    <span style="flex:1;min-width:0;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtmlText(p.name)}</span>
                    <span style="color:#666;font-size:0.75rem;white-space:nowrap;">${partySeatSummaryText(p)}</span>
                </label>${facHtml}`;
            }).join('');
            document.querySelectorAll('#mergeSourceList input[data-partial]').forEach(el => { el.indeterminate = true; });
            renderPartyMergePreview();
        }

        function togglePartyMergeSource(id, on) {
            delete partyMergeFactionSel[id];
            if(on) partyMergeChecked.add(id); else partyMergeChecked.delete(id);
            renderPartyMergeDialog();
        }

        function togglePartyMergeFaction(pid, fid, on) {
            const p = parties.find(x => x.id === pid);
            if(!p) return;
            const all = (p.factions || []).map(f => f.id);
            const sel = partyMergeChecked.has(pid) ? new Set(all) : new Set(partyMergeFactionSel[pid] || []);
            if(on) sel.add(fid); else sel.delete(fid);
            partyMergeChecked.delete(pid);
            delete partyMergeFactionSel[pid];
            if(all.length && all.every(x => sel.has(x))) partyMergeChecked.add(pid); // 파벌을 전부 고르면 정당 통째로
            else if(sel.size) partyMergeFactionSel[pid] = sel;
            renderPartyMergeDialog();
        }

        // 일부 파벌만 고른 정당들 → [{ party, factions: [...] }]
        function partyMergeFactionPicks() {
            return mergeablePartyList()
                .filter(p => !partyMergeChecked.has(p.id) && partyMergeFactionSel[p.id]?.size)
                .map(p => ({ party: p, factions: (p.factions || []).filter(f => partyMergeFactionSel[p.id].has(f.id)) }))
                .filter(x => x.factions.length);
        }

        // 현재 선택으로 합당했을 때 결과를 미리 보여주고, 실행 가능 여부(에러 메시지)를 돌려준다
        function partyMergePlan() {
            const isNew = partyMergeMode === 'new';
            const sources = mergeablePartyList().filter(p => partyMergeChecked.has(p.id));
            const factionPicks = partyMergeFactionPicks();
            if(isNew) {
                const name = document.getElementById('mergeNewName').value.trim();
                if(sources.length + factionPicks.length < 2) return { error: '합칠 정당(또는 파벌)을 2개 이상 고르세요.', sources, factionPicks };
                if(!name) return { error: '새 정당 이름을 입력하세요.', sources, factionPicks };
                const srcIds = new Set(sources.map(p => p.id));
                if(parties.some(p => !srcIds.has(p.id) && p.name === name)) return { error: `"${name}" 정당이 이미 있습니다.`, sources, factionPicks };
                return { sources, factionPicks, targetName: name };
            }
            const survivor = parties.find(p => p.id === Number(document.getElementById('mergeSurvivorSelect').value));
            if(!survivor) return { error: '존속 정당을 고르세요.' };
            if(sources.length + factionPicks.length < 1) return { error: '흡수될 정당(또는 파벌)을 1개 이상 고르세요.', survivor, sources, factionPicks };
            return { sources, factionPicks, survivor, targetName: survivor.name };
        }

        function renderPartyMergePreview() {
            const el = document.getElementById('mergePreview');
            const plan = partyMergePlan();
            const picks = plan.factionPicks || [];
            // 합쳐지는 단위: 정당 통째 + (정당 이름 › 파벌) 묶음 — 이념 기본값·미리보기 계산에 같이 쓴다
            const units = [...(plan.sources || []).map(p => ({ ideologyId: p.ideologyId, seats: p })),
                ...picks.flatMap(x => x.factions.map(f => ({ ideologyId: f.ideologyId || x.party.ideologyId, seats: f })))];
            if(partyMergeMode === 'new' && !partyMergeIdeologyTouched && units.length) {
                const biggest = units.reduce((a, b) => ((b.seats.seatsHouse || 0) > (a.seats.seatsHouse || 0) ? b : a), units[0]);
                document.getElementById('mergeNewIdeology').value = String(biggest.ideologyId);
            }
            const seatObjs = [...(plan.survivor ? [plan.survivor] : []), ...units.map(u => u.seats)];
            const totals = chamberList().map(ch => `${chamberDisplayName(ch)} ${seatObjs.reduce((a, p) => a + (p[seatKeyFor(ch)] || 0), 0)}석`).join(' · ');
            const names = [...(plan.survivor ? [plan.survivor] : []), ...(plan.sources || [])].map(p => escapeHtmlText(p.name))
                .concat(picks.map(x => `${escapeHtmlText(x.party.name)} › ${x.factions.map(f => escapeHtmlText(f.name)).join(', ')}`))
                .join(' + ');
            el.innerHTML = plan.error
                ? `<span style="color:#888;">${escapeHtmlText(plan.error)}</span>`
                : `<div style="color:#aaa;">${names}</div><div style="color:var(--tno-neon);margin-top:4px;">→ ${escapeHtmlText(plan.targetName)} : ${totals}</div>`;
            document.getElementById('mergeConfirmBtn').disabled = !!plan.error;
        }

        function executePartyMerge() {
            const plan = partyMergePlan();
            if(plan.error) { showCustomAlert(plan.error); return; }
            const keepAsFaction = document.getElementById('mergeKeepAsFaction').checked;
            let target;
            if(partyMergeMode === 'new') {
                target = {
                    id: Date.now(), name: plan.targetName,
                    abbr: document.getElementById('mergeNewAbbr').value.trim(),
                    color: document.getElementById('mergeNewColor').value || '#6a5acd',
                    ideologyId: Number(document.getElementById('mergeNewIdeology').value),
                    seatsHouse: 0, seatsSenate: 0, seatsThird: 0, inHouse: false, inSenate: false, inThird: false,
                    isRuling: false, leaderName: '', leaderPhoto: '', logoPhoto: '', showLogoInStats: false, hideStatsPhoto: false,
                    description: '', factions: [],
                };
            } else {
                target = plan.survivor;
            }
            const srcNames = plan.sources.map(p => p.name).concat(plan.factionPicks.map(x => `${x.party.name}(${x.factions.map(f => f.name).join(', ')})`));
            mergePartiesInto(target, plan.sources, keepAsFaction, partyMergeMode === 'new');
            plan.factionPicks.forEach(x => moveFactionsToParty(x.party, x.factions, target));
            closePartyMergeDialog();
            syncListMembers();
            simulate(); refreshUI();
            showCustomAlert(partyMergeMode === 'new'
                ? `${srcNames.join(', ')}이(가) 합당해 "${target.name}"을(를) 창당했습니다.`
                : `"${target.name}"이(가) ${srcNames.join(', ')}을(를) 흡수했습니다.`);
        }

        // 합당의 실제 데이터 이동 — target이 새 정당이면(isNewParty) 첫 번째로 합쳐지는 정당 자리에 끼워 넣는다
        function mergePartiesInto(target, sources, keepAsFaction, isNewParty) {
            const srcIds = new Set(sources.map(p => p.id));
            const mapId = id => (srcIds.has(id) ? target.id : id);
            const dedupe = arr => arr.filter((v, i) => arr.indexOf(v) === i);
            const chambers = ['house', 'senate', 'third'];
            if(!target.factions) target.factions = [];

            // 연정: 대상 정당이 원래 속한 연정(새 정당이면 합쳐지는 정당이 처음 속한 연정)에만 남긴다
            const homeCoalition = coalitions.find(c => !isNewParty && (c.members || []).includes(target.id))
                || coalitions.find(c => (c.members || []).some(m => srcIds.has(m)));

            // 파벌·의원 이동 (정당별로 파벌 id가 겹치면 새 id로 바꾸고 의원 소속도 함께 바꿈)
            sources.forEach(src => {
                const factionRemap = {};
                (src.factions || []).forEach(f => {
                    let fid = f.id;
                    if(target.factions.some(x => x.id === fid)) { fid = `${f.id}_${target.id}_${Math.random().toString(36).slice(2, 7)}`; factionRemap[f.id] = fid; }
                    target.factions.push({ ...f, id: fid });
                });
                let asFactionId = null;
                if(keepAsFaction) {
                    asFactionId = `f${Date.now()}_${src.id}`;
                    const fac = { id: asFactionId, name: src.name, color: src.color, ideologyId: src.ideologyId,
                        seatsHouse: 0, seatsSenate: 0, seatsThird: 0, leaderName: src.leaderName || '', leaderPhoto: src.leaderPhoto || '',
                        logoPhoto: src.logoPhoto || '', usePartyColor: false };
                    // 원래 파벌에 속하지 않았던 나머지 의석만 이 계파 몫
                    chambers.forEach(ch => {
                        const k = seatKeyFor(ch);
                        const inFactions = (src.factions || []).reduce((a, f) => a + (f[k] || 0), 0);
                        fac[k] = Math.max(0, (src[k] || 0) - inFactions);
                    });
                    target.factions.push(fac);
                }
                const remapFaction = fid => (fid == null ? asFactionId : (factionRemap[fid] || fid));
                chambers.forEach(ch => {
                    const lm = listMembers[ch] || (listMembers[ch] = {});
                    const moved = (lm[src.id] || []).map(m => ({ ...m, factionId: remapFaction(m.factionId) }));
                    lm[target.id] = [...(lm[target.id] || []), ...moved];
                    delete lm[src.id];
                    Object.values(districtMembers[ch] || {}).forEach(m => {
                        if(m && m.partyId === src.id) { m.partyId = target.id; m.factionId = remapFaction(m.factionId); }
                    });
                });
            });

            // 의석 합산
            chambers.forEach(ch => {
                const k = seatKeyFor(ch), ik = inKeyFor(ch);
                target[k] = (target[k] || 0) + sources.reduce((a, p) => a + (p[k] || 0), 0);
                target[ik] = !!target[ik] || sources.some(p => p[ik]);
            });
            target.isRuling = !!target.isRuling || sources.some(p => p.isRuling);

            // 연정 구성원·대표당·각외협력 정리
            coalitions.forEach(c => {
                let members = dedupe((c.members || []).map(mapId));
                if(c !== homeCoalition) members = members.filter(m => m !== target.id);
                c.members = members;
                if(c.leadPartyId != null) {
                    c.leadPartyId = mapId(c.leadPartyId);
                    if(!members.includes(c.leadPartyId)) c.leadPartyId = null;
                }
                c.externalSupporters = dedupe((c.externalSupporters || []).map(mapId)).filter(x => !members.includes(x));
            });

            // 지지율(전국·권역)·지역구 성향은 합산 (성향은 100 상한)
            chambers.forEach(ch => {
                const st = elecStore[ch] || {};
                let prob = st[target.id]?.prob || 0, err = st[target.id]?.err || 0, had = !!st[target.id];
                sources.forEach(p => { if(st[p.id]) { prob += st[p.id].prob || 0; err = Math.max(err, st[p.id].err || 0); had = true; delete st[p.id]; } });
                if(had) st[target.id] = { ...(st[target.id] || {}), prob, err };
                Object.values(regionVoteStore[ch] || {}).forEach(byParty => {
                    let p2 = byParty[target.id]?.prob || 0, had2 = !!byParty[target.id];
                    sources.forEach(p => { if(byParty[p.id]) { p2 += byParty[p.id].prob || 0; had2 = true; delete byParty[p.id]; } });
                    if(had2) byParty[target.id] = { ...(byParty[target.id] || {}), prob: p2 };
                });
            });
            Object.values(districtSvgTendency).forEach(byCh => Object.values(byCh || {}).forEach(byParty => {
                let v = byParty[target.id] || 0, had = target.id in byParty;
                sources.forEach(p => { if(p.id in byParty) { v += Number(byParty[p.id]) || 0; had = true; delete byParty[p.id]; } });
                if(had) byParty[target.id] = Math.min(100, v);
            }));
            const mergedTendency = { ...(tendencyData[target.id] || {}) };
            let hadTendency = !!tendencyData[target.id];
            sources.forEach(p => {
                Object.entries(tendencyData[p.id] || {}).forEach(([key, v]) => { mergedTendency[key] = Math.min(100, (mergedTendency[key] || 0) + (Number(v) || 0)); hadTendency = true; });
                delete tendencyData[p.id];
            });
            if(hadTendency) tendencyData[target.id] = mergedTendency;

            // 내각·대통령 등 소속 정당과 좌석 연결
            [president, pm, collectiveChair, pmNominee, ...deputyPms, ...cabinetMembers].forEach(o => {
                if(!o) return;
                if(srcIds.has(o.partyId)) o.partyId = target.id;
                if(o.linkedSeat && srcIds.has(o.linkedSeat.partyId)) o.linkedSeat = { ...o.linkedSeat, partyId: target.id };
            });
            sources.forEach(p => {
                if(presElectionCandidateOverrides[p.id] && !presElectionCandidateOverrides[target.id]) presElectionCandidateOverrides[target.id] = presElectionCandidateOverrides[p.id];
                delete presElectionCandidateOverrides[p.id];
            });

            // 정당 목록에서 합쳐진 정당 제거, 새 정당은 첫 번째로 합쳐진 정당 자리에
            const firstIdx = parties.findIndex(p => srcIds.has(p.id));
            for(let i = parties.length - 1; i >= 0; i--) if(srcIds.has(parties[i].id)) parties.splice(i, 1);
            if(isNewParty) parties.splice(firstIdx < 0 ? parties.length : Math.min(firstIdx, parties.length), 0, target);
        }

        // 한 정당의 일부 파벌만 떼어 target 정당의 파벌로 옮긴다 — 그 파벌 몫의 의석과 소속 의원(비례·지역구)도 함께.
        // 원래 정당은 남으므로 지지율·성향·연정·내각 소속은 건드리지 않는다
        function moveFactionsToParty(src, factions, target) {
            if(!target.factions) target.factions = [];
            const ids = new Set(factions.map(f => f.id));
            const remap = {};
            factions.forEach(f => {
                let fid = f.id;
                if(target.factions.some(x => x.id === fid)) { fid = `${f.id}_${target.id}_${Math.random().toString(36).slice(2, 7)}`; }
                remap[f.id] = fid;
                target.factions.push({ ...f, id: fid, ideologyId: f.ideologyId || src.ideologyId });
            });
            ['house', 'senate', 'third'].forEach(ch => {
                const k = seatKeyFor(ch), ik = inKeyFor(ch);
                const moved = factions.reduce((a, f) => a + (f[k] || 0), 0);
                src[k] = Math.max(0, (src[k] || 0) - moved);
                target[k] = (target[k] || 0) + moved;
                if(moved > 0) target[ik] = true;
                const lm = listMembers[ch] || (listMembers[ch] = {});
                const stay = [], go = [];
                (lm[src.id] || []).forEach(m => (ids.has(m.factionId) ? go : stay).push(m));
                if(lm[src.id]) lm[src.id] = stay;
                if(go.length) lm[target.id] = [...(lm[target.id] || []), ...go.map(m => ({ ...m, factionId: remap[m.factionId] }))];
                Object.values(districtMembers[ch] || {}).forEach(m => {
                    if(m && m.partyId === src.id && ids.has(m.factionId)) { m.partyId = target.id; m.factionId = remap[m.factionId]; }
                });
            });
            src.factions = (src.factions || []).filter(f => !ids.has(f.id));
        }
        // 정당 복제 — 색상/로고/당수/파벌 구성 등 "정체성"은 그대로 복사하고, 의석 수·집권 여부·연정
        // 소속처럼 그 정당 고유의 정치적 상태는 복제하지 않고 초기화(0/없음)해 사용자가 새로 지정하게 한다
        function duplicateParty(i) {
            const src = parties[i]; if(!src) return;
            const clone = JSON.parse(JSON.stringify(src));
            clone.id = Date.now();
            clone.name = src.name + ' (사본)';
            clone.seatsHouse = 0; clone.seatsSenate = 0; clone.seatsThird = 0;
            clone.isRuling = false;
            if(Array.isArray(clone.factions)) {
                clone.factions.forEach((f, fi) => { f.id = 'f'+Date.now()+'_'+fi; f.seatsHouse = 0; f.seatsSenate = 0; f.seatsThird = 0; });
            }
            parties.splice(i+1, 0, clone);
            simulate(); refreshUI();
        }
        // simulate()가 (manualSort가 꺼져 있으면) parties 배열을 이념 순으로 재정렬하므로,
        // 반드시 정렬이 끝난 뒤에 refreshUI()를 호출해야 카드에 새겨진 인덱스(idx)가
        // 최신 배열 순서와 어긋나지 않는다. 순서가 바뀌면 그 다음 입력이 엉뚱한 정당에 적용된다.
        function updateParty(i,k,v) { parties[i][k]=v; simulate(); refreshUI(); }

        // ── 의회별 의석 합계 ──────────────────────
        // 한 의회에 속한 정당들의 의석 합이 총 의석 수를 넘으면 넘친 만큼은 반원에 그려지지 않는다(getMap이 총 의석에서 끊음).
        // 그래서 파벌 합계처럼 의회별 합계를 보여주고, 정당 의석 입력은 남은 자리까지만 받는다.
        function chamberTotalSeats(ch) {
            const el = document.getElementById(ch==='senate' ? 'senateTotal' : ch==='third' ? 'thirdTotal' : 'houseTotal');
            return el ? (parseInt(el.value) || 0) : 0;
        }
        function chamberSeatSum(ch, exceptPartyId) {
            const seatKey = seatKeyFor(ch), inKey = inKeyFor(ch);
            return parties.reduce((s, p) => s + ((p[inKey] && p.id !== exceptPartyId) ? (p[seatKey] || 0) : 0), 0);
        }
        function fillSeatSumLine(el, ch) {
            const total = chamberTotalSeats(ch), sum = chamberSeatSum(ch);
            const state = sum === total ? 'ok' : sum < total ? 'under' : 'over';
            el.className = `seat-sum-line ${state}`;
            el.innerHTML = `<span>배정 합계 <b>${sum}</b> / ${total}석</span><span>${
                state === 'ok' ? '✓' : state === 'under' ? `${total - sum}석 남음` : `✗ ${sum - total}석 초과 — 초과분은 화면에 안 보임`}</span>`;
        }
        function updateSeatSumLines() {
            document.querySelectorAll('[data-seat-sum]').forEach(el => fillSeatSumLine(el, el.dataset.seatSum));
        }
        function setPartySeats(idx, ch, value) {
            const p = parties[idx];
            if(!p) return;
            const seatKey = seatKeyFor(ch);
            const want = Math.max(0, parseInt(value) || 0);
            const cap = Math.max(0, chamberTotalSeats(ch) - chamberSeatSum(ch, p.id));
            const v = Math.min(want, cap);
            if(v < want) showKbdToast(cap === 0
                ? `남은 의석이 없습니다 — 총 의석 수를 늘리거나 다른 정당 의석을 줄이세요`
                : `남은 의석이 ${cap}석이라 ${cap}석으로 맞췄습니다`);
            updateParty(idx, seatKey, v);
        }

        // 정당 카드 "통계 표시" — 당수 사진/당 로고/표시 안 함(X) 중 하나를 고름. X를 고르면 그 정당의
        // leaderPhoto/logoPhoto 자체는 그대로 두고, 하원/상원/삼원 통계 카드에만 사진을 비워 보여준다.
        function setPartyStatsPhotoMode(idx, mode) {
            const p = parties[idx];
            if(!p) return;
            p.hideStatsPhoto = (mode === 'none');
            if(mode !== 'none') p.showLogoInStats = (mode === 'logo');
            simulate();
            refreshUI();
        }

        // ===== 원외정당 (의석 없는 정당) =====
        // 정당>정보에서 특정 의원실에 배정(inHouse/inSenate/inThird)되어 있으면서
        // 그 의원실 의석 수만 0인 정당 — 의원실별 통계 패널에 개별적으로 표시된다.
        // 예전에는 이런 정당이 해당 의원실 지도에 안 잡혀서 우측 정보 패널에서 그냥 사라졌는데,
        // 이제 그 자리에 "원외정당" 접기/펼치기 섹션으로 모아서 보여준다.
        function toggleExtraPartiesCollapse() { extraPartiesCollapsed = !extraPartiesCollapsed; simulate(); }
        function partyTotalSeats(p) {
            return (p.inHouse?p.seatsHouse||0:0) + (p.inSenate?p.seatsSenate||0:0) + (p.inThird?p.seatsThird||0:0);
        }
        function extraParliamentaryPartyList(chamber) {
            const inKey = inKeyFor(chamber);
            const seatKey = seatKeyFor(chamber);
            return parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID && p[inKey] && (p[seatKey]||0) === 0);
        }

        function renderExtraPartiesSection(chamber) {
            const list = extraParliamentaryPartyList(chamber);
            let h = `<div onclick="toggleExtraPartiesCollapse()" style="display:flex;align-items:center;gap:8px;margin:10px 0 6px;cursor:pointer;user-select:none;">
                <div style="flex:1;height:1px;background:#333;"></div>
                <span style="color:#666;font-size:0.78rem;letter-spacing:2px;white-space:nowrap;">${extraPartiesCollapsed?'▶':'▼'} 원외정당 (${list.length})</span>
                <div style="flex:1;height:1px;background:#333;"></div>
            </div>`;
            if(extraPartiesCollapsed || list.length === 0) return h;
            list.forEach(p => {
                const isLogo = p.showLogoInStats ?? false;
                const photo  = p.hideStatsPhoto ? '' : (isLogo ? (p.logoPhoto||p.leaderPhoto||'') : (p.leaderPhoto||p.logoPhoto||''));
                const ideoName = ideologyName(p.ideologyId) || '';
                h += `<div class="stat-block" style="border-left-color:${p.color};">
                    <div class="dyn-row" style="display:flex;gap:8px;align-items:stretch;">
                        ${p.hideStatsPhoto ? '' : `<div class="leader-photo-box dyn-photo" data-ratio="${isLogo?'1':'0.75'}" style="flex-shrink:0;background:#0a0c10;border:1px solid #222;overflow:hidden;">
                            ${photo?`<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`:''}
                        </div>`}
                        <div class="dyn-ref" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
                            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px;flex-wrap:wrap;">
                                <span style="font-size:1.1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${p.name}${p.abbr?` (${p.abbr})`:''}</span>
                                <span style="flex-shrink:0;font-size:0.9rem;">${partyStatusBadge(p)}</span>
                            </div>
                            <div style="color:#888;font-size:0.82rem;">${ideoName}</div>
                            <div style="color:#888;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.leaderName||'　'}</div>
                        </div>
                    </div>
                </div>`;
            });
            return h;
        }

        // 정당 해산/활동금지 표기 뱃지 — 활동중인 정당은 표기하지 않음
        function partyStatusBadge(p) {
            if(p.status === 'dissolved') return `<span class="party-status-badge status-dissolved">해산</span>`;
            if(p.status === 'banned') return `<span class="party-status-badge status-banned">활동 금지</span>`;
            return '';
        }

        // 정당 상태 전환 — 해산되면 이름·약칭을 저장해두고 "*해산됨*"으로 고정, 의석을 모두 비움.
        // 해산에서 벗어나면(활동중/활동금지) 저장해둔 원래 이름·약칭을 복원.
        function updatePartyStatus(i, newStatus) {
            const p = parties[i];
            if(!p) return;
            const oldStatus = p.status || 'active';
            if(oldStatus === newStatus) return;

            if(oldStatus === 'dissolved') {
                p.name = p._nameBeforeDissolution ?? p.name;
                p.abbr = p._abbrBeforeDissolution ?? p.abbr;
                delete p._nameBeforeDissolution;
                delete p._abbrBeforeDissolution;
            }
            if(newStatus === 'dissolved') {
                p._nameBeforeDissolution = p.name;
                p._abbrBeforeDissolution = p.abbr;
                p.name = '*해산됨*';
                p.abbr = '*해산됨*';
                p.seatsHouse = 0; p.seatsSenate = 0; p.seatsThird = 0;
                (p.factions||[]).forEach(f => { f.seatsHouse = 0; f.seatsSenate = 0; f.seatsThird = 0; });
            }
            p.status = newStatus;
            simulate(); refreshUI(); elecUpdateAllBars();
        }
        function togglePartyParticipation(i,f,v) { parties[i][f]=v; simulate(); refreshUI(); }
        function updatePartyColorText(e,i) { if(isValidHex(e.value)){ parties[i].color=e.value.toUpperCase(); e.nextElementSibling.value=parties[i].color; simulate(); refreshUI(); }}
        function updatePartyColorPicker(e,i) { parties[i].color=e.value.toUpperCase(); e.previousElementSibling.value=parties[i].color; simulate(); }

        function addCoalition() { coalitions.push({id:'c'+Date.now(), name:"새 연정", color:"#ffffff", members:[], isRuling:false, leadPartyId: null, externalSupporters: [], externalSupportLabel: "각외협력" }); refreshUI(); }
        function removeCoalition(id) { coalitions=coalitions.filter(c=>c.id!==id); simulate(); refreshUI(); }
        function updateCoalition(id,k,v) { const c=coalitions.find(x=>x.id===id); if(c){c[k]=v; simulate();} }
        function updateCoalitionColorText(e,id) { if(isValidHex(e.value)) { const c=coalitions.find(x=>x.id===id); if(c){ c.color=e.value.toUpperCase(); e.nextElementSibling.value=c.color; simulate(); }}}
        function updateCoalitionColorPicker(e,id) { const c=coalitions.find(x=>x.id===id); if(c){ c.color=e.value.toUpperCase(); e.previousElementSibling.value=c.color; simulate(); }}
        function toggleCoalitionMember(cid,pid,chk) {
            if(chk) { coalitions.forEach(c=>c.members=c.members.filter(x=>x!==pid)); coalitions.find(c=>c.id===cid).members.push(pid); }
            else { const c=coalitions.find(x=>x.id===cid); c.members=c.members.filter(x=>x!==pid); }
            simulate(); refreshUI();
        }
        // 각외협력(신임과 보완) — 연정에 정식 참여하지 않으면서 신임/예산 등에서만 정부를 지지하는 정당
        function toggleCoalitionExternalSupport(cid,pid,chk) {
            const c = coalitions.find(x=>x.id===cid); if(!c) return;
            if(!c.externalSupporters) c.externalSupporters = [];
            if(chk) { if(!c.externalSupporters.includes(pid)) c.externalSupporters.push(pid); }
            else c.externalSupporters = c.externalSupporters.filter(x=>x!==pid);
            simulate(); refreshUI();
        }
        function setRuling(t,id) {
            parties.forEach(p=>p.isRuling=false); coalitions.forEach(c=>c.isRuling=false);
            if(t==='party') parties.find(p=>p.id===id).isRuling=true;
            else coalitions.find(c=>c.id===id).isRuling=true;
            simulate(); refreshUI();
        }

        function setNoRuling() {
            parties.forEach(p=>p.isRuling=false);
            coalitions.forEach(c=>c.isRuling=false);
            simulate(); refreshUI();
        }

        // ===== 파벌 함수 =====
        function addFaction(partyId) {
            const p = parties.find(x=>x.id===partyId); if(!p) return;
            if(!p.factions) p.factions = [];
            p.factions.push({ id:'f'+Date.now(), name:'새 파벌', color:'#808080', ideologyId:p.ideologyId, seatsHouse:0, seatsSenate:0, seatsThird:0, leaderName:'', leaderPhoto:'', logoPhoto:'', usePartyColor:false });
            renderPartyInfoList();
        }
        function removeFaction(partyId, factionId) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            p.factions = p.factions.filter(f=>f.id!==factionId);
            refreshUI();
        }
        // 파벌 복제 — 의석 수는 0으로 초기화(합계가 정당 총 의석을 넘지 않도록)하고 나머지는 그대로 복사
        function duplicateFaction(partyId, factionId) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const idx = p.factions.findIndex(f=>f.id===factionId); if(idx===-1) return;
            const clone = JSON.parse(JSON.stringify(p.factions[idx]));
            clone.id = 'f'+Date.now();
            clone.name = clone.name + ' (사본)';
            clone.seatsHouse = 0; clone.seatsSenate = 0; clone.seatsThird = 0;
            p.factions.splice(idx+1, 0, clone);
            simulate(); refreshUI();
        }
        function updateFactionById(partyId, factionId, key, val) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const f = p.factions.find(x=>x.id===factionId); if(!f) return;
            f[key] = val;
            simulate();
            const sum = p.factions.reduce((s,x)=>s+(x[key]||0),0);
            const ok = sum === p[key];
            document.querySelectorAll(`[data-faction-sum][data-party-id="${partyId}"][data-seat-key="${key}"]`).forEach(el => {
                el.textContent = `합계 ${sum}/${p[key]}석 ${ok?'✓':'✗'}`;
                el.style.color = ok ? '#00cc66' : '#cc3333';
            });
        }
        function updateFaction(partyId, factionId, key, val) {
            const p = parties.find(x=>x.id===partyId); if(!p?.factions) return;
            const f = p.factions.find(f=>f.id===factionId); if(!f) return;
            f[key] = val;
            simulate(); renderPartyInfoList();
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
            showCustomConfirm(`"${f.name}" 파벌을 신당으로 분리하시겠습니까?\n\n신당: ${f.name}\n의석: 하원 ${f.seatsHouse}석, 상원 ${f.seatsSenate}석`, () => {
                p.seatsHouse  = Math.max(0, p.seatsHouse  - f.seatsHouse);
                p.seatsSenate = Math.max(0, p.seatsSenate - f.seatsSenate);
                p.factions = p.factions.filter(x=>x.id!==factionId);
                parties.push({ id:Date.now(), name:f.name, color:f.color, seatsHouse:f.seatsHouse, seatsSenate:f.seatsSenate,
                    ideologyId:f.ideologyId||p.ideologyId, isRuling:false, inHouse:p.inHouse, inSenate:p.inSenate,
                    leaderName:f.leaderName||'', leaderPhoto:f.leaderPhoto||'', logoPhoto:f.logoPhoto||'',
                    showLogoInStats:false, hideStatsPhoto:false, description:'', factions:[] });
                simulate(); refreshUI();
            });
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
            // chamberType: 'house' | 'senate' | undefined(정당탭=둘다)
            if(!p.factions) p.factions = [];
            const isBi = hasSenateChamber();
            const hName = document.getElementById('houseNameInput')?.value || '하원';
            const sName = document.getElementById('senateNameInput')?.value || '상원';

            // 합계 검증 — chamberType 있으면 해당 의원실만
            const showH = !chamberType || chamberType === 'house';
            const showS = isBi && (!chamberType || chamberType === 'senate');
            const sumH = p.factions.reduce((s,f)=>s+(f.seatsHouse||0),0);
            const sumS = p.factions.reduce((s,f)=>s+(f.seatsSenate||0),0);
            const okH = sumH === p.seatsHouse, okS = sumS === p.seatsSenate;
            const hasF = p.factions.length > 0;
            const sumHtml = ''; // 합계 검증은 의회 탭에서만 표시

            const factionCards = p.factions.map((f,fi)=>`
                <div class="faction-card" style="border-left-color:${f.usePartyColor?p.color:f.color};">
                    <!-- 행1: 순서 + 색상 + 이름 + X -->
                    <div style="display:flex;gap:4px;align-items:center;margin-bottom:5px;">
                        <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;">
                            <button class="order-btn" onclick="moveFaction(${p.id},'${f.id}',-1)" ${fi===0?'disabled style="opacity:0.2"':''}>▲</button>
                            <button class="order-btn" onclick="moveFaction(${p.id},'${f.id}',1)"  ${fi===p.factions.length-1?'disabled style="opacity:0.2"':''}>▼</button>
                        </div>
                        ${f.usePartyColor
                            ? `<div style="width:28px;height:20px;background:${p.color};border:1px solid #444;flex-shrink:0;" title="정당 색 사용 중"></div>`
                            : `<div class="color-input-group" style="flex-shrink:0;">
                                <input type="text" class="hex-input" value="${f.color}" onchange="updateFactionColorText(this,${p.id},'${f.id}')">
                                <input type="color" value="${f.color}" oninput="updateFactionColorPicker(this,${p.id},'${f.id}')">
                               </div>`
                        }
                        <input type="text" value="${f.name}" placeholder="파벌명" style="flex:1;font-size:0.9rem;"
                            onchange="updateFaction(${p.id},'${f.id}','name',this.value)">
                        <button class="dup-btn" style="font-size:0.8rem;padding:2px 6px;" title="파벌 복제" onclick="duplicateFaction(${p.id},'${f.id}')">⧉</button>
                        <button class="remove-btn" style="font-size:0.8rem;padding:2px 6px;" onclick="removeFaction(${p.id},'${f.id}')">X</button>
                    </div>
                    <!-- 행2: 이념만 (의석은 의회 탭에서) -->
                    <div style="display:flex;gap:5px;align-items:center;margin-bottom:5px;">
                        <select style="flex:1;font-size:0.8rem;" onchange="updateFaction(${p.id},'${f.id}','ideologyId',parseInt(this.value))">
                            ${ideologyOptionsHtml(f.ideologyId, { excludeInd: false })}
                        </select>
                    </div>
                    <!-- 행3: 색상 옵션 + 신당 분리 -->
                    <div style="display:flex;gap:5px;">
                        <label style="flex:1;display:flex;align-items:center;gap:5px;cursor:pointer;padding:3px 6px;background:#0a0c10;border:1px solid #222;font-size:0.78rem;color:#888;">
                            <input type="checkbox" ${f.usePartyColor?'checked':''}
                                onchange="updateFaction(${p.id},'${f.id}','usePartyColor',this.checked)"> 정당 색 사용
                        </label>
                        <button onclick="splitFaction(${p.id},'${f.id}')"
                            style="flex:1;background:transparent;border:1px solid #444;color:#888;font-family:inherit;font-size:0.78rem;padding:3px 6px;cursor:pointer;">↗ 신당으로 분리</button>
                    </div>
                </div>`).join('');

            return `<div style="margin-top:8px;border-top:1px dashed #222;padding-top:8px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <span style="color:#555;font-size:0.8rem;letter-spacing:1px;">▌ 파벌</span>
                    <button onclick="addFaction(${p.id})" style="background:transparent;border:1px solid #333;color:#666;font-family:inherit;font-size:0.78rem;padding:2px 8px;cursor:pointer;">+ 파벌 추가</button>
                </div>
                ${factionCards}${sumHtml}
            </div>`;
        }

        // ===== 국가 > 부정선거 탭 =====
        // ── 부정선거 시도 (정당별) — 다음 총선 개표 1회에만 적용되는 일회성 설정 ──────────────
        // p.fraudAttempt = { chamber, boostPct, catchChance, manualCatch, riggedDistricts: string[] } | null
        // 발각 확률은 기본적으로 득표율 부풀리기 폭 + 조작한 지역구 수에 비례해 자동 계산되지만,
        // "수동" 체크 시 직접 지정한 값을 그대로 사용한다.
        function computeAutoFraudCatchChance(fa) {
            const boostComponent = (fa.boostPct || 0) * 1.5;
            const districtComponent = (fa.riggedDistricts || []).length * 6;
            return Math.min(100, Math.round(boostComponent + districtComponent));
        }
        function toggleFraudAttempt(pid, checked) {
            const p = parties.find(x => x.id === pid);
            if(!p) return;
            if(checked) {
                const fa = { chamber: chamberList()[0], boostPct: 10, manualCatch: false, riggedDistricts: [] };
                fa.catchChance = computeAutoFraudCatchChance(fa);
                p.fraudAttempt = fa;
            } else {
                p.fraudAttempt = null;
            }
            renderFraudTab();
        }
        function updateFraudAttempt(pid, field, val) {
            const p = parties.find(x => x.id === pid);
            if(!p || !p.fraudAttempt) return;
            p.fraudAttempt[field] = val;
            if(field === 'chamber') p.fraudAttempt.riggedDistricts = []; // 원이 바뀌면 그 원에 없는 지역구 키가 남지 않도록 초기화
            if((field === 'chamber' || field === 'boostPct') && !p.fraudAttempt.manualCatch) {
                p.fraudAttempt.catchChance = computeAutoFraudCatchChance(p.fraudAttempt);
            }
            renderFraudTab();
        }
        function toggleFraudManualCatch(pid, checked) {
            const p = parties.find(x => x.id === pid);
            if(!p || !p.fraudAttempt) return;
            p.fraudAttempt.manualCatch = checked;
            if(!checked) p.fraudAttempt.catchChance = computeAutoFraudCatchChance(p.fraudAttempt);
            renderFraudTab();
        }
        function updateFraudRiggedDistricts(pid, selectEl) {
            const p = parties.find(x => x.id === pid);
            if(!p || !p.fraudAttempt) return;
            p.fraudAttempt.riggedDistricts = Array.from(selectEl.selectedOptions).map(o => o.value);
            // 선택 도중 목록 전체를 다시 그리면 <select multiple>의 선택 상태가 끊기므로,
            // 자동 발각 확률만 계산해 표시 요소를 직접 갱신한다 (전체 재렌더 없음)
            if(!p.fraudAttempt.manualCatch) {
                p.fraudAttempt.catchChance = computeAutoFraudCatchChance(p.fraudAttempt);
                const input = document.getElementById('fraudCatchInput_'+pid);
                if(input) input.value = p.fraudAttempt.catchChance;
                const note = document.getElementById('fraudCatchNote_'+pid);
                if(note) note.textContent = `자동 계산: 부풀리기·지역구 조작 규모에 비례 (현재 ${p.fraudAttempt.catchChance}%)`;
            }
        }
        function fraudDistrictOptionsHtml(chamber, selected) {
            const sel = new Set(selected || []);
            if(districtMapMode === 'svg') {
                if(!districtSvgMap) return '';
                return districtSvgMap.shapes.filter(s => districtGrid[chamber]?.[s.key]).map(s =>
                    `<option value="${s.key}" ${sel.has(s.key)?'selected':''}>${districtNames.house[s.key]||s.key}</option>`
                ).join('');
            }
            return districtSortedKeys(chamber).map(key =>
                `<option value="${key}" ${sel.has(key)?'selected':''}>${districtNames[chamber][key]||key}</option>`
            ).join('');
        }
        function renderFraudAttemptSection(p) {
            const fa = p.fraudAttempt;
            return `
                <div style="margin-bottom:6px;padding:8px;background:#0a0c10;border:1px solid #663333;">
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--tno-alert);font-size:0.85rem;${fa?'margin-bottom:8px;':''}">
                        <input type="checkbox" class="chk-alert" ${fa?'checked':''} onchange="toggleFraudAttempt(${p.id},this.checked)"> ⚠ 부정선거 시도<br>(다음 총선 개표 1회에 적용)
                    </label>
                    ${!fa ? '' : `
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="color:#888;font-size:0.78rem;width:100px;flex-shrink:0;">대상 의원실</span>
                            <select class="input-alert" onchange="updateFraudAttempt(${p.id},'chamber',this.value)" style="flex:1;min-width:0;">
                                ${chamberList().map(ch => `<option value="${ch}" ${fa.chamber===ch?'selected':''}>${chamberDisplayName(ch)}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="color:#888;font-size:0.78rem;width:100px;flex-shrink:0;">득표율 부풀리기</span>
                            <input type="number" class="input-alert" min="0" max="100" value="${fa.boostPct}" style="flex:1;min-width:0;" onchange="updateFraudAttempt(${p.id},'boostPct',parseFloat(this.value)||0)">
                            <span style="color:#666;font-size:0.78rem;flex-shrink:0;">%p</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="color:#888;font-size:0.78rem;width:100px;flex-shrink:0;">발각 확률</span>
                            <input type="number" class="input-alert" id="fraudCatchInput_${p.id}" min="0" max="100" value="${fa.catchChance}" ${fa.manualCatch?'':'disabled'}
                                style="flex:1;min-width:0;${fa.manualCatch?'':'opacity:0.5;'}" onchange="updateFraudAttempt(${p.id},'catchChance',parseFloat(this.value)||0)">
                            <span style="color:#666;font-size:0.78rem;flex-shrink:0;">%</span>
                            <label style="display:flex;align-items:center;gap:3px;color:#888;font-size:0.7rem;flex-shrink:0;cursor:pointer;white-space:nowrap;">
                                <input type="checkbox" class="chk-alert" ${fa.manualCatch?'checked':''} onchange="toggleFraudManualCatch(${p.id},this.checked)"> 수동
                            </label>
                        </div>
                        ${!fa.manualCatch ? `<div id="fraudCatchNote_${p.id}" style="color:#555;font-size:0.7rem;margin-left:106px;">자동 계산: 부풀리기·지역구 조작 규모에 비례 (현재 ${fa.catchChance}%)</div>` : ''}
                        <div>
                            <span style="color:#888;font-size:0.78rem;">지역구 개표 조작 (선택한 지역구는 실제 결과와 무관하게 이 정당이 승리)</span>
                            <select multiple class="input-alert" onchange="updateFraudRiggedDistricts(${p.id},this)" style="width:100%;box-sizing:border-box;height:84px;margin-top:4px;">
                                ${fraudDistrictOptionsHtml(fa.chamber, fa.riggedDistricts)}
                            </select>
                        </div>
                        <div style="color:#664444;font-size:0.72rem;line-height:1.5;">발각되면 이번 선거에는 부정 효과가 반영되지 않고 활동 금지 처분을 받습니다. 발각되지 않으면 효과가 그대로 반영됩니다. 결과와 무관하게 시도는 개표 1회로 소진됩니다.</div>
                    </div>`}
                </div>
            `;
        }

        // 국가 > 부정선거 탭 — 정당별 카드로 부정선거 시도를 한눈에 모아 설정 (정당 정보 탭에는 노출하지 않음)
        function renderFraudTab() {
            const container = document.getElementById('fraudPartyList');
            if(!container) return;
            const list = parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID);
            if(list.length === 0) { container.innerHTML = '<div style="color:#555;font-size:0.78rem;">정당이 없습니다.</div>'; return; }
            container.innerHTML = list.map(p => `
                <div style="border-left:3px solid ${p.color};padding:8px;margin-bottom:10px;background:#0a0c10;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span style="width:9px;height:9px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                        <span style="color:#ccc;font-size:0.9rem;">${p.name}</span>
                        ${p.status==='banned' ? '<span class="party-status-badge status-banned">활동 금지</span>' : ''}
                    </div>
                    ${renderFraudAttemptSection(p)}
                </div>
            `).join('');
        }

        function renderPartyInfoList() {
            const container = document.getElementById('partyInfoList');
            if(!container) return;
            container.innerHTML = '';
            const hName = document.getElementById('houseNameInput')?.value || '하원';
            const sName = document.getElementById('senateNameInput')?.value || '상원';
            const isBi  = hasSenateChamber();
            const isTri = hasThirdChamber();
            const tName = document.getElementById('thirdNameInput')?.value || '삼원';
            const sortBar = document.createElement('div');
            sortBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:5px 8px;background:#0a0c10;border:1px solid #222;font-size:0.8rem;';
            sortBar.innerHTML = `
                <span style="color:${manualSort?'var(--tno-gold)':'#555'};">${manualSort?'⚠ 수동 정렬 중':'✦ 이념 순 자동정렬'}</span>
                <button onclick="autoSortParties()" style="background:transparent;border:1px solid ${manualSort?'var(--tno-gold)':'#333'};color:${manualSort?'var(--tno-gold)':'#444'};font-family:'NeoDunggeunmo','VT323',monospace;font-size:0.75rem;padding:2px 8px;cursor:pointer;">↺ 자동정렬</button>
            `;
            container.appendChild(sortBar);
            // 무소속 이념 슬롯은 원래 시스템이 자동 관리하는 가상 정당(getIndependentParty()) 하나만 있어야 하는데,
            // 예전엔 이 목록의 이념 선택 드롭다운에 "무소속"이 실수로 노출되어 일반 정당에 잘못 지정될 수 있었음 —
            // 그렇게 잘못 지정된 정당은 무소속으로 취급돼 이 목록에서 통째로 숨겨져 삭제할 방법이 없었으므로,
            // 진짜 시스템 관리 무소속 정당(첫 번째로 찾은 것) 하나만 숨기고 나머지는 정상 노출해 삭제/재지정이 가능하게 함
            const canonicalIndParty = parties.find(x => x.ideologyId === IND_IDEOLOGY_ID);
            parties.forEach((p, idx) => {
                if(p === canonicalIndParty) return; // 무소속은 정당>무소속 탭에서 별도 관리
                const div = document.createElement('div');
                div.className = `card-item drag-card-party ${p.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor = p.color;
                const collapsed = p._collapsed ?? false;
                const bodyId = `partyBody_${p.id}`;
                div.innerHTML = `
                    <!-- 행1: 드래그핸들 + 접기토글 + 색상 + 약칭 + X (항상 보임) -->
                    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
                        <span class="drag-handle">⋮⋮</span>
                        <span onclick="togglePartyCollapse(${p.id})" style="cursor:pointer;color:#888;font-size:0.85rem;user-select:none;flex-shrink:0;">${collapsed?'▶':'▼'}</span>
                        <div class="color-input-group" style="flex-shrink:0;">
                            <input type="text" class="hex-input" value="${p.color}" onchange="updatePartyColorText(this,${idx})">
                            <input type="color" value="${p.color}" oninput="updatePartyColorPicker(this,${idx})">
                        </div>
                        <input type="text" value="${p.abbr||''}" onchange="updateParty(${idx},'abbr',this.value)" placeholder="약칭" title="정당 약자 표기 (예: SPD)"
                            ${p.status==='dissolved'?'disabled':''}
                            style="flex:1;min-width:0;font-size:0.85rem;text-align:center;color:${p.status==='dissolved'?'var(--tno-alert)':'#aaa'};${p.status==='dissolved'?'opacity:0.5;cursor:not-allowed;':''}">
                        <button class="dup-btn" title="정당 복제" onclick="duplicateParty(${idx})">⧉</button>
                        <button class="remove-btn" onclick="removeParty(${idx})">X</button>
                    </div>
                    <!-- 행2: 당명 (항상 보임) -->
                    <div style="margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                        <input type="text" value="${p.name}" onchange="updateParty(${idx},'name',this.value)" placeholder="정당명"
                            ${p.status==='dissolved'?'disabled':''}
                            style="flex:1;min-width:0;font-size:1rem;box-sizing:border-box;${p.status==='dissolved'?'opacity:0.5;cursor:not-allowed;':''}">
                        ${partyStatusBadge(p)}
                    </div>
                    <!-- 행3: 이념 (항상 보임) -->
                    <div style="margin-bottom:6px;">
                        <select onchange="updateParty(${idx},'ideologyId',parseInt(this.value))" style="width:100%;">
                            ${ideologyOptionsHtml(p.ideologyId)}
                        </select>
                    </div>
                    <!-- 행3.5: 정당 상태 (항상 보임) -->
                    <div style="margin-bottom:6px;">
                        <select onchange="updatePartyStatus(${idx},this.value)" style="width:100%;">
                            <option value="active" ${(!p.status||p.status==='active')?'selected':''}>활동중</option>
                            <option value="banned" ${p.status==='banned'?'selected':''}>활동 금지</option>
                            <option value="dissolved" ${p.status==='dissolved'?'selected':''}>해산</option>
                        </select>
                    </div>
                    <!-- 이 아래부터 접기 대상 -->
                    <div id="${bodyId}" style="display:${collapsed?'none':'block'};">
                    <!-- 소속 의원실 (세로 리스트, 이름이 길어도 안 깨짐) — 단원제면 선택할 게 없으므로 전체 숨김 -->
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
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--tno-neon);font-size:0.85rem;padding:4px 6px;background:color-mix(in srgb, var(--tno-neon) 10%, transparent);border:1px solid var(--tno-neon-dim);">
                            <input type="checkbox" id="partyChamberAll_${idx}" onchange="setAllPartyChambers(${idx},this.checked)"> 전체
                        </label>
                    </div>`:''}
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;padding:5px 8px;background:#0a0c10;border:1px solid #222;">
                        <span style="color:#555;font-size:0.8rem;white-space:nowrap;">통계 표시</span>
                        <div class="system-radio-group" style="margin-bottom:0;flex:1;">
                            <button type="button" class="system-radio-btn ${(!p.hideStatsPhoto && !p.showLogoInStats)?'active':''}"
                                onclick="setPartyStatsPhotoMode(${idx},'leader')" style="padding:4px 6px;font-size:0.8rem;">당수 사진</button>
                            <button type="button" class="system-radio-btn ${(!p.hideStatsPhoto && p.showLogoInStats)?'active':''}"
                                onclick="setPartyStatsPhotoMode(${idx},'logo')" style="padding:4px 6px;font-size:0.8rem;">당 로고</button>
                            <button type="button" class="system-radio-btn ${p.hideStatsPhoto?'active':''}"
                                onclick="setPartyStatsPhotoMode(${idx},'none')" style="padding:4px 6px;font-size:0.8rem;flex:0.5;">X</button>
                        </div>
                    </div>
                    <textarea placeholder="당에 대한 설명을 입력하세요..."
                        style="width:100%;box-sizing:border-box;background:#000;border:1px solid #2a2a2a;color:#bbb;font-family:'NeoDunggeunmo','VT323',monospace;font-size:0.85rem;padding:6px;resize:vertical;min-height:60px;outline:none;line-height:1.5;"
                        onchange="updateParty(${idx},'description',this.value)">${p.description||''}</textarea>
                    ${renderFactionSection(p, idx)}
                    </div>
                `;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'partyInfoList', '.drag-card-party', parties, renderPartyInfoList);
            });
            // 전체 체크박스 초기 동기화
            parties.forEach((p, idx) => syncPartyChamberAll(idx));
        }

        // 정당별 소속 의원실 "전체" 체크박스 동기화
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
            simulate(); refreshUI();
        }

        // ===== 정당 탭: 당수 =====
        function renderLeaderList() {
            const container = document.getElementById('leaderList');
            if(!container) return;
            container.innerHTML = '';
            parties.forEach((p, idx) => {
                const div = document.createElement('div');
                div.className = `card-item ${p.isRuling?'is-ruling':''}`;
                div.style.borderLeftColor = p.color;
                const name = p.leaderName;
                const photo = p.leaderPhoto||'';
                const hasFactions = (p.factions||[]).length > 0;

                // 원내대표 — 의회 안에서 당을 이끄는 사람 (당수와 따로 지정)
                const flPhoto = p.floorLeaderPhoto||'';
                const floorLeaderHtml = `<div class="dyn-row" style="display:flex;gap:8px;align-items:stretch;margin-top:8px;border-top:1px dashed #222;padding-top:8px;">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;">
                            <div class="leader-photo-box dyn-photo" data-ratio="0.8" title="클릭하여 사진 업로드" style="width:44px;height:55px;">
                                ${flPhoto?`<img src="${flPhoto}" alt="원내대표">`:'<div class="photo-ph" style="font-size:0.9rem;">👤</div>'}
                                <input type="file" accept="image/*" onchange="uploadFloorLeaderPhoto(this,${p.id})">
                            </div>
                            <span style="font-size:0.65rem;color:#444;flex-shrink:0;">원내대표</span>
                        </div>
                        <div class="dyn-ref" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;">
                            <input type="text" value="${p.floorLeaderName||''}" placeholder="원내대표 이름"
                                style="background:#000;border:1px solid #2a2a2a;color:#ccc;font-family:inherit;font-size:0.88rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateLeaderField(${p.id},'floorLeaderName',this.value);refreshUI();">
                            ${flPhoto?`<button onclick="removeFloorLeaderPhoto(${p.id})" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">✕ 사진 제거</button>`:''}
                            <div style="display:flex;gap:6px;">
                                <select id="floorLeaderSeatSelect_${p.id}"
                                    style="flex:1;min-width:0;box-sizing:border-box;background:#000;border:1px solid #333;color:#888;font-family:inherit;font-size:0.75rem;padding:4px;">
                                    ${partyMemberPickerOptionsHtml(p.id)}
                                </select>
                                <button onclick="pasteFloorLeaderToSeat(${p.id},document.getElementById('floorLeaderSeatSelect_${p.id}').value)"
                                    style="flex-shrink:0;background:transparent;border:1px solid #333;color:#6cf;font-family:inherit;font-size:0.72rem;padding:4px 8px;cursor:pointer;">붙여넣기</button>
                            </div>
                            <div style="color:#555;font-size:0.68rem;">◆ 위에서 의석을 고르고 "붙여넣기"를 누르면 현재 원내대표 이름·사진이 그 의석에 복사됩니다</div>
                        </div>
                    </div>`;

                // 파벌 섹션 HTML
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
                                <span style="font-size:0.65rem;color:#444;flex-shrink:0;">당수</span>
                            </div>
                            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;">
                                <div class="leader-photo-box dyn-photo" data-ratio="1" style="width:44px;height:44px;">
                                    ${fLogo?`<img src="${fLogo}" alt="" style="width:100%;height:100%;object-fit:cover;">`:'<div class="photo-ph" style="font-size:0.9rem;">⚑</div>'}
                                    <input type="file" accept="image/*" onchange="uploadFactionPhoto(this,${pIdx},'${f.id}','logoPhoto')">
                                </div>
                                <span style="font-size:0.65rem;color:#444;flex-shrink:0;">로고</span>
                            </div>
                            <div class="dyn-ref" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;">
                                <div style="display:flex;align-items:center;gap:5px;">
                                    <span style="width:8px;height:8px;background:${fc};border-radius:50%;flex-shrink:0;"></span>
                                    <span style="color:#aaa;font-size:0.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span>
                                </div>
                                <input type="text" value="${f.leaderName||''}" placeholder="파벌 당수 이름"
                                    style="background:#000;border:1px solid #2a2a2a;color:#ccc;font-family:inherit;font-size:0.88rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                    onchange="updateFaction(${p.id},'${f.id}','leaderName',this.value)">
                                ${fPhoto||fLogo?`<button onclick="(()=>{const pp=parties[${pIdx}];const ff=pp.factions.find(x=>x.id==='${f.id}');if(ff){ff.leaderPhoto='';ff.logoPhoto='';renderLeaderList();}})()"
                                    style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;">✕ 사진 제거</button>`:''}
                            </div>
                        </div>`;
                    }).join('');
                    factionHtml = `<div style="margin-top:8px;border-top:1px dashed #222;padding-top:6px;">
                        <div style="color:#555;font-size:0.75rem;margin-bottom:5px;letter-spacing:1px;">▌ 파벌</div>
                        ${fCards}
                    </div>`;
                }

                div.innerHTML = `
                    <div class="dyn-row" style="display:flex;gap:10px;align-items:stretch;">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;">
                            <div class="leader-photo-box dyn-photo" data-ratio="0.8" title="클릭하여 사진 업로드" style="width:52px;height:65px;">
                                ${photo?`<img src="${photo}" alt="당수">`:'<div class="photo-ph">👤</div>'}
                                <input type="file" accept="image/*" onchange="uploadLeaderPhoto(this,${p.id})">
                            </div>
                            <span style="font-size:0.75rem;color:#444;flex-shrink:0;">사진 업로드</span>
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span style="width:10px;height:10px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="color:var(--tno-neon);font-size:0.95rem;">${p.name}</span>
                            </div>
                            <input type="text" value="${name||''}" placeholder="당수 이름"
                                style="background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.95rem;padding:5px 8px;width:100%;box-sizing:border-box;"
                                onchange="updateLeaderField(${p.id},'leaderName',this.value)">
                            ${photo?`<button onclick="removeLeaderPhoto(${p.id})" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.8rem;padding:3px 8px;cursor:pointer;text-align:left;">✕ 사진 제거</button>`:''}
                            <div style="display:flex;gap:6px;">
                                <select id="leaderSeatSelect_${p.id}"
                                    style="flex:1;min-width:0;box-sizing:border-box;background:#000;border:1px solid #333;color:#888;font-family:inherit;font-size:0.75rem;padding:4px;">
                                    ${partyMemberPickerOptionsHtml(p.id)}
                                </select>
                                <button onclick="pasteLeaderToSeat(${p.id},document.getElementById('leaderSeatSelect_${p.id}').value)"
                                    style="flex-shrink:0;background:transparent;border:1px solid #333;color:#6cf;font-family:inherit;font-size:0.72rem;padding:4px 8px;cursor:pointer;">붙여넣기</button>
                            </div>
                            <div style="color:#555;font-size:0.68rem;">◆ 위에서 의석을 고르고 "붙여넣기"를 누르면 현재 당수 이름·사진이 그 의석에 복사됩니다</div>
                        </div>
                    </div>
                    ${floorLeaderHtml}
                    ${factionHtml}
                `;
                container.appendChild(div);
            });
            fitDynPhotos(container);
        }

        function removeLeaderPhoto(pid) {
            const p = parties.find(x=>x.id===pid);
            if(p){ p.leaderPhoto=''; simulate(); refreshUI(); }
        }

        function uploadFloorLeaderPhoto(input, pid) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const p = parties.find(x=>x.id===pid);
                if(p){ p.floorLeaderPhoto=e.target.result; simulate(); refreshUI(); }
            };
            reader.readAsDataURL(file);
        }

        function removeFloorLeaderPhoto(pid) {
            const p = parties.find(x=>x.id===pid);
            if(p){ p.floorLeaderPhoto=''; simulate(); refreshUI(); }
        }

        // ===== 정당 탭: 무소속 (의원 개별 정보) =====
        // 무소속 정당이 실제 렌더될 때 그 앞에 몇 석이 먼저 놓이는지 계산 (표기용 전역 의석 번호 오프셋)
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

        // 무소속 개별 정보는 지역구 연결 여부에 따라 의원 탭 또는 비례 탭 중 어디서 보이는지 갈리므로,
        // 수정 후 다시 그릴 때는 그 개별 정보가 실제로 표시되는 탭만 다시 그림
        function rerenderIndependentOwner(ind) {
            if(ind.districtKey) renderMembersList();
            else renderListMemberList();
        }

        function updateIndependent(id, key, val) {
            const ind = independents.find(x=>x.id===id);
            if(!ind) return;
            ind[key] = val;
            if(key === 'name' || key === 'status') rerenderIndependentOwner(ind);
            simulate();
        }

        function uploadIndependentPhoto(input, id) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const ind = independents.find(x=>x.id===id);
                if(ind){ ind.photo = e.target.result; rerenderIndependentOwner(ind); renderCabinetDisplay(); }
            };
            reader.readAsDataURL(file);
        }

        function removeIndependentPhoto(id) {
            const ind = independents.find(x=>x.id===id);
            if(ind){ ind.photo=''; rerenderIndependentOwner(ind); renderCabinetDisplay(); }
        }

        // ===== 의원/비례 탭 공용: 검색창 + 필터(팝업) UI, 무소속 카드 =====
        let memberFilterState = {
            members: { query:'', partyIds:new Set(), ideologyIds:new Set() },
            list:    { query:'', partyIds:new Set(), ideologyIds:new Set() }
        };
        function memberFilterRerender(ns) { if(ns==='members') renderMembersList(); else renderListMemberList(); }
        function onMemberSearchInput(ns, v) { memberFilterState[ns].query = v; memberFilterRerender(ns); }
        function toggleMemberFilterParty(ns, partyId, checked) {
            const set = memberFilterState[ns].partyIds;
            if(checked) set.add(String(partyId)); else set.delete(String(partyId));
            memberFilterRerender(ns);
        }
        function toggleMemberFilterIdeology(ns, ideoId, checked) {
            const set = memberFilterState[ns].ideologyIds;
            if(checked) set.add(String(ideoId)); else set.delete(String(ideoId));
            memberFilterRerender(ns);
        }
        function clearMemberFilters(ns) {
            memberFilterState[ns].partyIds.clear();
            memberFilterState[ns].ideologyIds.clear();
            memberFilterRerender(ns);
        }
        function toggleMemberFilterPopup(ns) {
            ['members','list'].forEach(k => {
                if(k===ns) return;
                const p = document.getElementById(k+'FilterPopup');
                if(p) p.style.display = 'none';
            });
            const popup = document.getElementById(ns+'FilterPopup');
            if(!popup) return;
            popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
        }
        document.addEventListener('click', (e) => {
            ['members','list'].forEach(ns => {
                const popup = document.getElementById(ns+'FilterPopup');
                const btn = document.getElementById(ns+'FilterBtn');
                if(popup && popup.style.display==='block' && !popup.contains(e.target) && e.target!==btn) popup.style.display = 'none';
            });
        });
        // 필터 버튼 스타일(활성 개수 표시) 갱신
        function updateMemberFilterBtn(ns) {
            const btn = document.getElementById(ns+'FilterBtn');
            if(!btn) return;
            const st = memberFilterState[ns];
            const n = st.partyIds.size + st.ideologyIds.size;
            btn.textContent = n>0 ? `필터 (${n})` : '필터';
            btn.style.background = n>0 ? '#1a1200' : '#000';
            btn.style.borderColor = n>0 ? 'var(--tno-gold)' : '#333';
            btn.style.color = n>0 ? 'var(--tno-gold)' : '#aaa';
        }
        // 필터 팝업 안의 정당/이념 체크박스 목록 갱신 (현재 의원실 기준)
        function updateMemberFilterPopup(ns, ch) {
            const popup = document.getElementById(ns+'FilterPopup');
            if(!popup) return;
            const st = memberFilterState[ns];
            const chamberParties = parties.filter(p=>p[inKeyFor(ch)]);
            const usedIdeologyIds = [...new Set(chamberParties.flatMap(p => [p.ideologyId, ...(p.factions||[]).map(f=>f.ideologyId)]).filter(Boolean))];
            popup.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="color:#888;font-size:0.78rem;letter-spacing:1px;">정당</span>
                    <span onclick="clearMemberFilters('${ns}')" style="color:#666;font-size:0.72rem;cursor:pointer;text-decoration:underline;">초기화</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto;margin-bottom:10px;">
                    ${chamberParties.map(p => `
                        <label style="display:flex;align-items:center;gap:6px;font-size:0.83rem;color:#ccc;cursor:pointer;">
                            <input type="checkbox" ${st.partyIds.has(String(p.id))?'checked':''} onchange="toggleMemberFilterParty('${ns}','${p.id}',this.checked)">
                            <span style="width:8px;height:8px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                            ${p.name}
                        </label>
                    `).join('') || '<div style="color:#444;font-size:0.78rem;">참여 정당 없음</div>'}
                </div>
                <div style="color:#888;font-size:0.78rem;letter-spacing:1px;margin-bottom:6px;">이념</div>
                <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto;">
                    ${ideologies.filter(i=>i.id!==IND_IDEOLOGY_ID).flatMap(i => {
                        const subs = (i.subs || []).filter(sb => usedIdeologyIds.includes(sb.id));
                        if(!usedIdeologyIds.includes(i.id) && !subs.length) return [];
                        return [{ i, sub:false }, ...subs.map(sb => ({ i: sb, sub:true }))];
                    }).map(({ i, sub }) => `
                        <label style="display:flex;align-items:center;gap:6px;font-size:0.83rem;color:#ccc;cursor:pointer;${sub?'padding-left:16px;':''}">
                            <input type="checkbox" ${st.ideologyIds.has(String(i.id))?'checked':''} onchange="toggleMemberFilterIdeology('${ns}','${i.id}',this.checked)">
                            ${sub?'└ ':''}${i.name}
                        </label>
                    `).join('') || '<div style="color:#444;font-size:0.78rem;">해당 이념 없음</div>'}
                </div>
            `;
            updateMemberFilterBtn(ns);
        }
        // 검색(이름 / #좌석번호) + 정당/이념 필터를 함께 적용
        function applyMemberFilters(ns, entries, ch) {
            const st = memberFilterState[ns];
            const query = (st.query||'').trim();
            let filtered = entries;
            if(query.startsWith('#')) {
                const numQ = query.slice(1).trim();
                if(numQ) filtered = filtered.filter(e => String(e.seatNo).includes(numQ));
            } else if(query) {
                const q = query.toLowerCase();
                filtered = filtered.filter(e => (e.name||'').toLowerCase().includes(q) || (e.personName||'').toLowerCase().includes(q));
            }
            if(st.partyIds.size>0) filtered = filtered.filter(e => st.partyIds.has(String(e.partyId)));
            // 부모 이념을 고르면 그 아래 서브 이념 의원도 함께 걸린다
            if(st.ideologyIds.size>0) filtered = filtered.filter(e => st.ideologyIds.has(String(e.effectiveIdeologyId)) || st.ideologyIds.has(String(ideologyParentId(e.effectiveIdeologyId))));
            return filtered;
        }

        // 무소속 개별 카드 본문(사진/이름/개별 이념/연정 소속) — 의원 탭(지역구 연결)과 비례 탭(비례) 공용
        function buildIndependentCardBody(ind, opts = {}) {
            const indKey = 'ind__' + ind.id;
            let currentValue = '';
            for(const coal of coalitions) {
                if(coal.members.includes(indKey)) { currentValue = 'm_'+coal.id; break; }
                if(coal.externalSupporters?.includes(indKey)) { currentValue = 'e_'+coal.id; break; }
            }
            const dis = opts.disabled ? 'disabled' : '';
            const coalitionField = coalitions.length === 0
                ? `<div style="color:#444;font-size:0.78rem;padding:5px 0;">연정 없음 — 연정 탭에서 먼저 연정을 만드세요</div>`
                : `<select ${dis} onchange="updateIndCoalitionMembership('${ind.id}',this.value)"
                    style="width:100%;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:5px;">
                    <option value="" ${currentValue===''?'selected':''}>-- 소속 없음 --</option>
                    ${coalitions.map(coal => `
                        <option value="m_${coal.id}" ${currentValue==='m_'+coal.id?'selected':''}>${coal.name} — 정식 참여</option>
                        <option value="e_${coal.id}" ${currentValue==='e_'+coal.id?'selected':''}>${coal.name} — ${coal.externalSupportLabel||'각외협력'}</option>
                    `).join('')}
                </select>`;
            const statusBadge = ind.status === 'banned' ? `<span class="party-status-badge status-banned">활동 금지</span>` : '';
            return `
                <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:52px;height:65px;flex-shrink:0;${opts.disabled?'opacity:0.5;':''}">
                    ${ind.photo?`<img src="${ind.photo}" alt="">`:'<div class="photo-ph">👤</div>'}
                    <input type="file" accept="image/*" ${dis} onchange="uploadIndependentPhoto(this,'${ind.id}')">
                </div>
                <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                    ${opts.topLabelHtml || ''}
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="color:#999;font-size:0.85rem;flex-shrink:0;" title="좌석 번호">#${opts.seatNo}</span>
                        <input type="text" value="${ind.name||''}" placeholder="의원 이름" ${dis}
                            style="flex:1;background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.95rem;padding:5px 8px;min-width:0;"
                            onchange="updateIndependent('${ind.id}','name',this.value)">
                        ${statusBadge}
                    </div>
                    <select ${dis} onchange="updateIndependent('${ind.id}','ideologyId',this.value?parseInt(this.value):null)"
                        style="width:100%;background:#000;border:1px solid #2a2a2a;color:#aaa;font-family:inherit;font-size:0.85rem;padding:4px;">
                        <option value="">이념 미지정</option>
                        ${ideologyOptionsHtml(ind.ideologyId)}
                    </select>
                    <select ${dis} onchange="updateIndependent('${ind.id}','status',this.value)"
                        style="width:100%;background:#000;border:1px solid #2a2a2a;color:#aaa;font-family:inherit;font-size:0.85rem;padding:4px;">
                        <option value="active" ${(!ind.status||ind.status==='active')?'selected':''}>활동중</option>
                        <option value="banned" ${ind.status==='banned'?'selected':''}>활동 금지</option>
                    </select>
                    ${(ind.photo && !opts.disabled)?`<button onclick="removeIndependentPhoto('${ind.id}')" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">✕ 사진 제거</button>`:''}
                    ${(!opts.disabled && !isPartyLeaderMatch(getIndependentParty()?.id, ind.name, ind.photo))?`<button onclick="designatePartyLeaderFromIndependent('${ind.id}')" style="background:transparent;border:1px solid #443300;color:#c9a227;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">👑 당수로 지정</button>`:''}
                    ${coalitionField}
                    ${opts.extraHtml || ''}
                </div>
            `;
        }

        function updateIndCoalitionMembership(indId, value) {
            const indKey = 'ind__' + indId;
            // 모든 연정에서 우선 제거
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
            simulate(); refreshUI();
        }

        // ===== 의회 > 의원 탭: 지역구 당선 의원 개별 관리 =====
        let membersInnerTab = 'house';
        function switchMembersInnerTab(ch) {
            membersInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabMembers'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
            renderMembersList();
        }

        // 특정 의원실의 지역구 당선자 목록을 좌석 번호(표시 순서 기준 1부터)와 함께 반환
        function getDistrictMemberEntries(ch) {
            const keys = districtSortedKeys(ch).filter(k => districtMembers[ch][k]);
            return keys.map((key, i) => ({ key, member: districtMembers[ch][key], name: districtNames[ch][key] || key, seatNo: i+1 }));
        }

        // 의원 카드의 유효 이념(파벌 지정 시 파벌 이념 우선) id 반환
        function memberEffectiveIdeologyId(member, party) {
            const faction = party?.factions?.find(f=>f.id===member.factionId);
            return faction?.ideologyId ?? party?.ideologyId ?? null;
        }

        function renderMembersList() {
            const container = document.getElementById('membersList');
            if(!container) return;
            if(!isSetupSubTabShown('Members')) return;
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
            updateMemberFilterPopup('members', ch);
            const rawEntries = getDistrictMemberEntries(ch);

            if(rawEntries.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[지역구 당선 의원이 없습니다 — 지역구+비례 방식으로 선거를 진행하고 의회에 반영하면 여기 표시됩니다]</div>';
                return;
            }

            const entries = rawEntries.map(e => {
                const party = parties.find(p=>p.id===e.member.partyId);
                const isInd = party?.ideologyId === IND_IDEOLOGY_ID;
                const ind = isInd ? independents.find(x=>x.chamber===ch && x.districtKey===e.key) : null;
                return { ...e, partyId: e.member.partyId, personName: ind ? ind.name : e.member.name,
                    effectiveIdeologyId: isInd ? (ind?.ideologyId ?? null) : memberEffectiveIdeologyId(e.member, party) };
            });

            const filtered = applyMemberFilters('members', entries, ch);
            if(filtered.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[검색/필터 조건에 맞는 의원이 없습니다]</div>';
                return;
            }

            filtered.forEach(({key, member, name, seatNo}) => {
                const party = parties.find(p=>p.id===member.partyId);
                const div = document.createElement('div');
                div.className = 'card-item';

                if(party?.ideologyId === IND_IDEOLOGY_ID) {
                    const ind = ensureDistrictIndependent(ch, key);
                    div.style.cssText = `display:flex;gap:10px;align-items:stretch;border-left-color:${member.vacant?'#663333':'#999'};margin-bottom:8px;`;
                    const vacantHtml = `
                        <div style="display:flex;gap:6px;margin-top:2px;">
                            ${member.vacant
                                ? `<button onclick="fillVacantSeat('${ch}','${key}')" style="flex:1;background:transparent;border:1px solid #00cc66;color:#00cc66;font-family:inherit;font-size:0.8rem;padding:5px;cursor:pointer;">보궐선거로 채우기</button>`
                                : `<button onclick="vacateSeat('${ch}','${key}')" style="flex:1;background:transparent;border:1px solid #663333;color:#cc6666;font-family:inherit;font-size:0.8rem;padding:5px;cursor:pointer;">궐석 처리 (사퇴/사망)</button>`
                            }
                        </div>`;
                    const topLabelHtml = `<div style="color:#888;font-size:0.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${key}">${name}${member.vacant?' <span style="color:#cc3333;">[궐석]</span>':''}</div>`;
                    div.innerHTML = buildIndependentCardBody(ind, { seatNo, topLabelHtml, disabled: member.vacant, extraHtml: vacantHtml });
                } else {
                    div.className = 'card-item dyn-row';
                    div.style.cssText = `display:flex;gap:10px;align-items:stretch;border-left-color:${member.vacant?'#663333':(party?.color||'#666')};margin-bottom:8px;${member.vacant?'opacity:0.6;':''}`;
                    div.innerHTML = `
                        <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:52px;height:65px;flex-shrink:0;${member.vacant?'opacity:0.5;':''}">
                            ${member.photo?`<img src="${member.photo}" alt="">`:'<div class="photo-ph">👤</div>'}
                            <input type="file" accept="image/*" ${member.vacant?'disabled':''} onchange="uploadDistrictMemberPhoto(this,'${ch}','${key}')">
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="color:#555;font-size:0.75rem;flex-shrink:0;" title="좌석 번호">#${seatNo}</span>
                                <span style="width:9px;height:9px;background:${party?.color||'#666'};border-radius:50%;flex-shrink:0;"></span>
                                <span style="color:#ccc;font-size:0.9rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${key}">${name}</span>
                                ${member.vacant?'<span style="color:#cc3333;font-size:0.75rem;">[궐석]</span>':''}
                            </div>
                            <input type="text" value="${member.name||''}" placeholder="의원 이름" ${member.vacant?'disabled':''}
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.9rem;padding:5px 8px;"
                                onchange="updateDistrictMember('${ch}','${key}','name',this.value)">
                            <select ${member.vacant?'disabled':''} onchange="updateDistrictMemberParty('${ch}','${key}',parseInt(this.value))"
                                style="width:100%;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:4px;">
                                ${parties.filter(p=>p[inKeyFor(ch)]).map(p=>`<option value="${p.id}" ${member.partyId===p.id?'selected':''}>${p.name}</option>`).join('')}
                            </select>
                            ${(party?.factions||[]).length>0?`
                            <select ${member.vacant?'disabled':''} onchange="updateDistrictMember('${ch}','${key}','factionId',this.value||null)"
                                style="width:100%;background:#000;border:1px solid #333;color:#aaa;font-family:inherit;font-size:0.85rem;padding:4px;">
                                <option value="">파벌 미지정</option>
                                ${party.factions.map(f=>`<option value="${f.id}" ${member.factionId===f.id?'selected':''}>${f.name}</option>`).join('')}
                            </select>`:''}
                            ${(member.photo && !member.vacant)?`<button onclick="removeDistrictMemberPhoto('${ch}','${key}')" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">✕ 사진 제거</button>`:''}
                            ${(!member.vacant && !isPartyLeaderMatch(member.partyId, member.name, member.photo))?`<button onclick="designatePartyLeaderFromDistrictSeat('${ch}','${key}')" style="background:transparent;border:1px solid #443300;color:#c9a227;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">👑 당수로 지정</button>`:''}
                            <div style="display:flex;gap:6px;">
                                ${member.vacant
                                    ? `<button onclick="fillVacantSeat('${ch}','${key}')" style="flex:1;background:transparent;border:1px solid #00cc66;color:#00cc66;font-family:inherit;font-size:0.8rem;padding:5px;cursor:pointer;">보궐선거로 채우기</button>`
                                    : `<button onclick="vacateSeat('${ch}','${key}')" style="flex:1;background:transparent;border:1px solid #663333;color:#cc6666;font-family:inherit;font-size:0.8rem;padding:5px;cursor:pointer;">궐석 처리 (사퇴/사망)</button>`
                                }
                            </div>
                        </div>
                    `;
                }
                container.appendChild(div);
            });
            fitDynPhotos(container);
        }

        function updateDistrictMember(ch, key, field, value) {
            const m = districtMembers[ch][key];
            if(!m) return;
            m[field] = value;
            if(field !== 'name') simulate();
            if(field === 'name') { renderMembersList(); renderCabinetDisplay(); }
        }

        // 지역구 의원 정당 변경 (당적 변경/이적) — 기존 정당 의석 -1, 새 정당 의석 +1
        function updateDistrictMemberParty(ch, key, newPartyId) {
            const m = districtMembers[ch][key];
            if(!m || m.partyId === newPartyId) return;
            const seatKey = seatKeyFor(ch);
            const oldParty = parties.find(p=>p.id===m.partyId);
            const newParty = parties.find(p=>p.id===newPartyId);
            if(oldParty) oldParty[seatKey] = Math.max(0, (oldParty[seatKey]||0) - 1);
            if(newParty) newParty[seatKey] = (newParty[seatKey]||0) + 1;
            m.partyId = newPartyId;
            m.factionId = null; // 이적 시 파벌 소속은 초기화
            simulate(); refreshUI();
        }

        function uploadDistrictMemberPhoto(input, ch, key) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const m = districtMembers[ch]?.[key];
                if(m) { m.photo = e.target.result; renderMembersList(); renderCabinetDisplay(); }
            };
            reader.readAsDataURL(file);
        }
        function removeDistrictMemberPhoto(ch, key) {
            const m = districtMembers[ch]?.[key];
            if(m) { m.photo = ''; renderMembersList(); renderCabinetDisplay(); }
        }

        // 궐석 처리: 의원이 사퇴/사망 등으로 빠짐 — 소속 정당 의석에서 -1 (보궐선거 전까지 공석)
        function vacateSeat(ch, key) {
            const m = districtMembers[ch][key];
            if(!m || m.vacant) return;
            showCustomConfirm('이 지역구를 궐석 처리하시겠습니까?\n(보궐선거로 다시 채울 때까지 소속 정당 의석에서 1석 감소합니다)', () => {
                const seatKey = seatKeyFor(ch);
                const party = parties.find(p=>p.id===m.partyId);
                if(party) party[seatKey] = Math.max(0, (party[seatKey]||0) - 1);
                m.vacant = true;
                simulate(); refreshUI();
            });
        }

        function fillVacantSeat(ch, key) {
            showCustomAlert(`선거 탭 > 지역구 체크박스에서 "보궐"을 선택하고 개표하면\n이 지역구(${districtNames[ch][key]||key})가 자동으로 대상에 포함됩니다.`);
        }

        // ===== 의회 > 비례 탭: 정당별 비례(지역구 외) 의석 개별 관리 (구 무소속 탭) =====
        // 무소속 정당의 비례 인원은 independents[] 중 지역구에 연결되지 않은 인원을 그대로 사용하고,
        // 그 외 정당은 listMembers[ch][partyId] 배열(총 의석 - 지역구 당선자 수만큼 자동 동기화)을 사용한다.
        let listMemberInnerTab = 'house';
        function switchListMemberInnerTab(ch) {
            listMemberInnerTab = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabList'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===ch);
            });
            renderListMemberList();
        }

        function updateListMember(ch, partyId, memberId, field, value) {
            const arr = listMembers[ch]?.[partyId];
            const m = arr?.find(x=>String(x.id)===String(memberId));
            if(!m) return;
            m[field] = value;
            if(field === 'name') { renderListMemberList(); renderCabinetDisplay(); }
            else simulate();
        }

        // 비례 의원 당적 변경 — 기존 정당 의석 -1, 새 정당 의석 +1 (이름은 새 소속의 빈 슬롯으로 이어받음)
        function updateListMemberParty(ch, oldPartyId, memberId, newPartyId) {
            const arr = listMembers[ch]?.[oldPartyId];
            const idx = arr?.findIndex(x=>String(x.id)===String(memberId));
            if(idx === undefined || idx === -1) return;
            const movedName = arr[idx].name;
            const movedPhoto = arr[idx].photo;
            const oldParty = parties.find(p=>String(p.id)===String(oldPartyId));
            const newParty = parties.find(p=>String(p.id)===String(newPartyId));
            if(!newParty || String(newParty.id)===String(oldPartyId)) return;
            arr.splice(idx, 1);
            const seatKey = seatKeyFor(ch);
            if(oldParty) oldParty[seatKey] = Math.max(0, (oldParty[seatKey]||0) - 1);
            newParty[seatKey] = (newParty[seatKey]||0) + 1;
            simulate();
            refreshUI();
            if(movedName || movedPhoto) {
                if(newParty.ideologyId === IND_IDEOLOGY_ID) {
                    const freeInd = independents.find(x=>x.chamber===ch && !x.districtKey && !x.name && !x.photo);
                    if(freeInd) { if(movedName) freeInd.name = movedName; if(movedPhoto) freeInd.photo = movedPhoto; }
                } else {
                    const newArr = listMembers[ch]?.[newParty.id] || [];
                    const target = [...newArr].reverse().find(x => !x.name && !x.photo);
                    if(target) { if(movedName) target.name = movedName; if(movedPhoto) target.photo = movedPhoto; }
                }
                renderListMemberList();
            }
        }

        function uploadListMemberPhoto(input, ch, partyId, memberId) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const arr = listMembers[ch]?.[partyId];
                const m = arr?.find(x=>String(x.id)===String(memberId));
                if(m) { m.photo = e.target.result; renderListMemberList(); renderCabinetDisplay(); }
            };
            reader.readAsDataURL(file);
        }
        function removeListMemberPhoto(ch, partyId, memberId) {
            const arr = listMembers[ch]?.[partyId];
            const m = arr?.find(x=>String(x.id)===String(memberId));
            if(m) { m.photo = ''; renderListMemberList(); renderCabinetDisplay(); }
        }

        // 의원 목록은 수백 장이 될 수 있어서, 탭이 안 보일 때(refreshUI 등)는 건너뛰고 탭을 열 때 그린다
        function isSetupSubTabShown(sub) {
            return currentMainTab === 'setup' && !!document.getElementById('content' + sub)?.classList.contains('active');
        }

        function renderListMemberList() {
            const container = document.getElementById('listMemberList');
            if(!container) return;
            if(!isSetupSubTabShown('List')) return;
            const token = ++listMemberRenderToken; // 이어 그리던 이전 작업이 있으면 멈춤
            container.innerHTML = '';

            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabList'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) btn.style.display = chambers.includes(c) ? '' : 'none';
            });
            if(!chambers.includes(listMemberInnerTab)) listMemberInnerTab = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabList'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===listMemberInnerTab);
            });

            const ch = listMemberInnerTab;
            updateMemberFilterPopup('list', ch);

            const chamberParties = parties.filter(p=>p[inKeyFor(ch)]);
            const raw = [];
            chamberParties.forEach(p => {
                if(p.ideologyId === IND_IDEOLOGY_ID) {
                    independents.filter(x=>x.chamber===ch && !x.districtKey).sort((a,b)=>a.seatIndex-b.seatIndex)
                        .forEach(ind => raw.push({ kind:'ind', ind, partyId:p.id }));
                } else {
                    (listMembers[ch]?.[p.id]||[]).forEach(m => raw.push({ kind:'list', member:m, partyId:p.id }));
                }
            });

            if(raw.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[비례 의석이 없습니다 — 정당의 총 의석 수가 지역구 당선자 수보다 많으면 여기 표시됩니다]</div>';
                return;
            }

            const entries = raw.map((e,i) => {
                const party = parties.find(p=>p.id===e.partyId);
                const personName = e.kind==='ind' ? e.ind.name : e.member.name;
                const effectiveIdeologyId = e.kind==='ind' ? (e.ind.ideologyId ?? null) : memberEffectiveIdeologyId(e.member, party);
                return { ...e, seatNo:i+1, name:null, personName, effectiveIdeologyId };
            });

            const filtered = applyMemberFilters('list', entries, ch);
            if(filtered.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#555;padding:20px;">[검색/필터 조건에 맞는 의원이 없습니다]</div>';
                return;
            }

            // 비례 의원이 수백 명이면 카드를 한 번에 다 그릴 때 화면이 한동안 멈춘다 — 앞쪽 카드는 바로 그리고
            // 나머지는 프레임마다 조금씩 이어 그린다. 그 사이에 다시 그리기가 시작되면 이전 작업은 멈춘다
            const chamberPartyOptions = parties.filter(p=>p[inKeyFor(ch)]);
            const buildCard = e => {
                const party = parties.find(p=>p.id===e.partyId);
                const div = document.createElement('div');

                if(e.kind === 'ind') {
                    const ind = e.ind;
                    div.className = 'card-item dyn-row drag-card-indmember';
                    div.dataset.indId = ind.id;
                    div.style.cssText = 'display:flex;gap:10px;align-items:stretch;border-left-color:#999;margin-bottom:8px;';
                    div.innerHTML = `<span class="drag-handle" style="align-self:center;">⋮⋮</span>` + buildIndependentCardBody(ind, { seatNo: e.seatNo });
                    container.appendChild(div);
                    startIndependentDragReorder(div.querySelector('.drag-handle'), 'listMemberList', '.drag-card-indmember', ch, renderListMemberList);
                } else {
                    const m = e.member;
                    div.className = 'card-item dyn-row';
                    div.style.cssText = `display:flex;gap:10px;align-items:stretch;border-left-color:${party?.color||'#666'};margin-bottom:8px;`;
                    div.innerHTML = `
                        <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:52px;height:65px;flex-shrink:0;">
                            ${m.photo?`<img src="${m.photo}" alt="">`:'<div class="photo-ph">👤</div>'}
                            <input type="file" accept="image/*" onchange="uploadListMemberPhoto(this,'${ch}','${e.partyId}','${m.id}')">
                        </div>
                        <div class="dyn-ref" style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="color:#555;font-size:0.75rem;flex-shrink:0;" title="좌석 번호">#${e.seatNo}</span>
                                <span style="width:9px;height:9px;background:${party?.color||'#666'};border-radius:50%;flex-shrink:0;"></span>
                                <span style="color:#888;font-size:0.8rem;">비례</span>
                            </div>
                            <input type="text" value="${m.name||''}" placeholder="의원 이름"
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.9rem;padding:5px 8px;"
                                onchange="updateListMember('${ch}','${e.partyId}','${m.id}','name',this.value)">
                            <select onchange="updateListMemberParty('${ch}','${e.partyId}','${m.id}',parseInt(this.value))"
                                style="width:100%;background:#000;border:1px solid #333;color:var(--tno-gold);font-family:inherit;font-size:0.85rem;padding:4px;">
                                ${chamberPartyOptions.map(p=>`<option value="${p.id}" ${String(e.partyId)===String(p.id)?'selected':''}>${p.name}</option>`).join('')}
                            </select>
                            ${(party?.factions||[]).length>0?`
                            <select onchange="updateListMember('${ch}','${e.partyId}','${m.id}','factionId',this.value||null)"
                                style="width:100%;background:#000;border:1px solid #333;color:#aaa;font-family:inherit;font-size:0.85rem;padding:4px;">
                                <option value="">파벌 미지정</option>
                                ${party.factions.map(f=>`<option value="${f.id}" ${m.factionId===f.id?'selected':''}>${f.name}</option>`).join('')}
                            </select>`:''}
                            ${m.photo?`<button onclick="removeListMemberPhoto('${ch}','${e.partyId}','${m.id}')" style="background:transparent;border:1px solid #333;color:#555;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">✕ 사진 제거</button>`:''}
                            ${!isPartyLeaderMatch(e.partyId, m.name, m.photo)?`<button onclick="designatePartyLeaderFromListSeat('${ch}','${e.partyId}','${m.id}')" style="background:transparent;border:1px solid #443300;color:#c9a227;font-family:inherit;font-size:0.75rem;padding:2px 8px;cursor:pointer;text-align:left;">👑 당수로 지정</button>`:''}
                        </div>
                    `;
                    container.appendChild(div);
                }
                return div;
            };
            const FIRST_CHUNK = 40, CHUNK = 60;
            const drawChunk = (from, size) => {
                if(token !== listMemberRenderToken || !container.isConnected) return;
                const divs = filtered.slice(from, from + size).map(buildCard);
                fitDynPhotos(container, divs.filter(d => d.classList.contains('dyn-row')));
                if(from + size < filtered.length) requestAnimationFrame(() => drawChunk(from + size, CHUNK));
            };
            drawChunk(0, FIRST_CHUNK);
        }
        let listMemberRenderToken = 0;








        // ═══════════════════════════════════════
        // 선거 시뮬레이션
        // ═══════════════════════════════════════
        const elecStore = { house:{}, senate:{}, third:{} };   // { chamber: { partyId: { prob, err } } } — 의원실별 독립 지지율 (정당 구성이 다를 수 있으므로)
        let elecProbChamber = 'house';  // 지지율 입력 탭에서 현재 편집 중인 의원실
        let elecRunning  = false;
        let elecPaused   = false;
        let elecSkipToEnd = false;
        let elecRecords  = [];         // 선거 기록 배열
        let elecLastResult = null;     // 마지막 개표 결과 (의원실별 순차 개표 시에는 마지막 의원실 결과만 참조용으로 담김)
        let elecLastResults = {};      // 반영 대기 중인 개표 결과 (의원실별) — 여러 의원실을 한 번에 개표해도 모두 반영되도록 의원실 키로 누적

        // ═══════════════════════════════════════
        // 선거 > 대선 (대통령 선거)
        // ═══════════════════════════════════════
        let electionInnerTab = 'general'; // 'presidential' | 'general' | 'settings'
        let electionKind = 'member'; // 총선 탭 내부 — 'member'(의원 선거) | 'pm'(총리 선거, 총리직선제 활성화 시에만 선택 가능)
        let presElectionMode = 'plurality'; // 'plurality'(단순 다수 대표제) | 'runoff'(결선투표제) | 'electoral'(선거인단제) — 대선/총리선거 공용
        let presElectionChamberBasis = 'house'; // 지지율(선거인단제는 지역구) 데이터를 가져올 원 — 대선/총리선거 공용
        let presElectionLastResult = null; // 대선 마지막 개표 결과
        let pmElectionLastResult = null;   // 총리 선거 마지막 개표 결과
        let presElectionRecords = []; // 대선/총리선거 기록 (office 필드로 구분)

        // 선거 메인탭의 대선/총선/방식 하위탭으로 이동 (구 국가 > 선거 내부 탭 — 예전 호출도 그대로 동작)
        function switchElectionInnerTab(inner) {
            if(!['presidential','general','settings'].includes(inner)) inner = 'general';
            switchSubTab('vote', 'elec' + inner.charAt(0).toUpperCase() + inner.slice(1));
        }
        // 대선/총선/방식 하위탭이 열릴 때 그 화면을 그린다 (switchSubTab에서 호출)
        function onElectionSubTabShown(inner) {
            electionInnerTab = inner;
            elecRenderList();
            if(inner === 'presidential') { updateElectionSettingsSummary(); renderPresElecResultPanel(); }
            if(inner === 'general') {
                const toggleGroup = document.getElementById('elecKindToggleGroup');
                if(toggleGroup) toggleGroup.style.display = pmDirectElectionEnabled ? 'flex' : 'none';
                if(!pmDirectElectionEnabled && electionKind === 'pm') electionKind = 'member';
                setElectionKind(electionKind);
            }
            if(inner === 'settings') applyPresElectionChamberRestrictions();
        }

        // 총선 탭 내부에서 "의원 선거"(기존 총선)와 "총리 선거"(총리직선제 활성화 시) 중 선택
        function setElectionKind(kind) {
            if(!['member','pm'].includes(kind)) return;
            electionKind = kind;
            document.getElementById('elecKindMemberBtn')?.classList.toggle('active', kind==='member');
            document.getElementById('elecKindPmBtn')?.classList.toggle('active', kind==='pm');
            const memberWrap = document.getElementById('electionKindMemberWrap');
            const pmWrap = document.getElementById('electionKindPmWrap');
            if(memberWrap) memberWrap.style.display = kind==='member' ? '' : 'none';
            if(pmWrap) pmWrap.style.display = kind==='pm' ? '' : 'none';
            if(kind === 'pm') { updateElectionSettingsSummary(); renderPmElecResultPanel(); }
        }

        function setPresElectionMode(mode) {
            if(!['plurality','runoff','electoral'].includes(mode)) return;
            presElectionMode = mode;
            document.getElementById('presElecModePluralityBtn')?.classList.toggle('active', mode==='plurality');
            document.getElementById('presElecModeRunoffBtn')?.classList.toggle('active', mode==='runoff');
            document.getElementById('presElecModeElectoralBtn')?.classList.toggle('active', mode==='electoral');
            const hint = document.getElementById('presElecModeHint');
            if(hint) hint.textContent = mode==='plurality' ? '1위 후보가 과반이 아니어도 최다 득표로 당선됩니다'
                : mode==='runoff' ? '1위가 과반을 넘지 못하면 상위 2명이 2차 투표로 다시 겨룹니다'
                : '기준 원의 지역구 결과를 선거인단(지역구별 승자)으로 집계해 당선자를 정합니다';
            updateElectionSettingsSummary();
        }

        function applyPresElectionChamberRestrictions() {
            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('presElecChamber'+c.charAt(0).toUpperCase()+c.slice(1)+'Btn');
                if(btn) { btn.style.display = chambers.includes(c) ? '' : 'none'; btn.textContent = chamberDisplayName(c); }
            });
            if(!chambers.includes(presElectionChamberBasis)) setPresElectionChamberBasis(chambers[0] || 'house');
            renderElectionCandidatesConfig();
        }

        function setPresElectionChamberBasis(ch) {
            if(!['house','senate','third'].includes(ch)) return;
            presElectionChamberBasis = ch;
            ['house','senate','third'].forEach(c => {
                document.getElementById('presElecChamber'+c.charAt(0).toUpperCase()+c.slice(1)+'Btn')?.classList.toggle('active', c===ch);
            });
            updateElectionSettingsSummary();
            renderElectionCandidatesConfig();
        }

        // 대선/총리선거 방식·기준원 요약 — 두 선거가 설정을 공유하므로 양쪽 표시를 함께 갱신
        function updateElectionSettingsSummary() {
            const modeLabel = { plurality:'단순 다수 대표제', runoff:'결선투표제', electoral:'선거인단제' }[presElectionMode];
            const chLabel = chamberDisplayName(presElectionChamberBasis);
            const modeEl = document.getElementById('presElecModeSummary');
            if(modeEl) modeEl.textContent = modeLabel;
            const chEl = document.getElementById('presElecChamberSummary');
            if(chEl) chEl.textContent = chLabel;
            const pmModeEl = document.getElementById('pmElecModeSummary');
            if(pmModeEl) pmModeEl.textContent = modeLabel;
            const pmChEl = document.getElementById('pmElecChamberSummary');
            if(pmChEl) pmChEl.textContent = chLabel;
        }

        // 대선/총리선거 후보 명단 — 기준 원에 참여 중이고 활동 금지되지 않은 정당들 (무소속도 정당 탭에서
        // "무소속" 항목을 추가해두었다면 다른 정당과 동일하게 후보로 출마 가능)
        function presElectionCandidates() {
            const ch = presElectionChamberBasis;
            return parties.filter(p => p[inKeyFor(ch)] && p.status !== 'banned');
        }

        // 각 정당의 실제 후보 — 기본은 당수, 후보 설정에서 의원 연결/직접 입력으로 재지정 가능
        let presElectionCandidateOverrides = {}; // partyId -> { name, photo, linkedSeat }
        function resolveElectionCandidate(party) {
            const ov = presElectionCandidateOverrides[party.id];
            if(ov) {
                if(ov.linkedSeat) {
                    const r = resolveLinkedSeat(ov.linkedSeat);
                    if(r) return { name: r.name, photo: r.photo };
                    ov.linkedSeat = null;
                }
                if(ov.name || ov.photo) return { name: ov.name || '', photo: ov.photo || '' };
            }
            return { name: party.leaderName || '', photo: party.leaderPhoto || '' };
        }

        function renderElectionCandidatesConfig() {
            const container = document.getElementById('electionCandidatesConfig');
            if(!container) return;
            const candidates = presElectionCandidates();
            if(candidates.length === 0) { container.innerHTML = '<div style="color:#555;font-size:0.78rem;">기준 원에 참여 중인 정당이 없습니다.</div>'; return; }
            container.innerHTML = candidates.map(p => {
                const ov = presElectionCandidateOverrides[p.id] || {};
                const resolved = ov.linkedSeat ? resolveLinkedSeat(ov.linkedSeat) : null;
                const usingDefault = !resolved && !ov.name && !ov.photo;
                const effPhoto = resolved ? resolved.photo : (ov.photo || (usingDefault ? p.leaderPhoto : '') || '');
                const inputVal = resolved ? resolved.name : (ov.name || '');
                const isInd = p.ideologyId === IND_IDEOLOGY_ID;
                const leaderLabel = isInd ? '대표' : '당수';
                return `
                    <div style="display:flex;gap:10px;align-items:stretch;border-left:3px solid ${p.color};padding:8px;margin-bottom:8px;background:#0a0c10;">
                        <div class="leader-photo-box dyn-photo" data-ratio="0.8" style="width:44px;height:55px;flex-shrink:0;">
                            ${effPhoto?`<img src="${effPhoto}" alt="">`:'<div class="photo-ph">👤</div>'}
                            <input type="file" accept="image/*" ${resolved?'disabled':''} onchange="uploadElectionCandidatePhoto(this,'${p.id}')">
                        </div>
                        <div style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0;">
                            <div style="color:#aaa;font-size:0.82rem;">${p.name}</div>
                            <input type="text" value="${inputVal}" placeholder="${p.leaderName ? p.leaderName+' ('+leaderLabel+')' : '후보 이름 (비우면 '+leaderLabel+')'}" ${resolved?'disabled':''}
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.85rem;padding:4px 6px;"
                                onchange="updateElectionCandidateOverride('${p.id}','name',this.value)">
                            <select onchange="linkElectionCandidateToMember('${p.id}',this.value)"
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid #333;color:#888;font-family:inherit;font-size:0.75rem;padding:3px;">
                                ${memberPickerOptionsHtml(p.id)}
                            </select>
                            <div style="display:flex;gap:6px;">
                                ${resolved?`<button onclick="unlinkElectionCandidate('${p.id}')" style="background:transparent;border:1px solid #333;color:#888;font-family:inherit;font-size:0.7rem;padding:2px 6px;cursor:pointer;">연결 해제</button>`:''}
                                ${(!usingDefault)?`<button onclick="resetElectionCandidateToLeader('${p.id}')" style="background:transparent;border:1px solid #333;color:#666;font-family:inherit;font-size:0.7rem;padding:2px 6px;cursor:pointer;">${leaderLabel}로 재설정</button>`:''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            fitDynPhotos(container);
        }

        function updateElectionCandidateOverride(partyId, key, val) {
            if(!presElectionCandidateOverrides[partyId]) presElectionCandidateOverrides[partyId] = {};
            presElectionCandidateOverrides[partyId][key] = val;
            renderElectionCandidatesConfig();
        }
        function uploadElectionCandidatePhoto(input, partyId) {
            const file = input.files?.[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = e => updateElectionCandidateOverride(partyId, 'photo', e.target.result);
            reader.readAsDataURL(file);
        }
        function linkElectionCandidateToMember(partyId, val) {
            const parsed = parseMemberPickerValue(val);
            if(!parsed) return;
            if(!presElectionCandidateOverrides[partyId]) presElectionCandidateOverrides[partyId] = {};
            presElectionCandidateOverrides[partyId].linkedSeat = parsed;
            renderElectionCandidatesConfig();
        }
        function unlinkElectionCandidate(partyId) {
            if(presElectionCandidateOverrides[partyId]) presElectionCandidateOverrides[partyId].linkedSeat = null;
            renderElectionCandidatesConfig();
        }
        function resetElectionCandidateToLeader(partyId) {
            delete presElectionCandidateOverrides[partyId];
            renderElectionCandidatesConfig();
        }

        // 단순 다수/결선투표: 기준 원의 지지율(elecStore) + 노이즈로 득표율 산출
        function presElectionPopularVote(candidates, chamberBasis) {
            const store = elecStore[chamberBasis] || {};
            const weighted = candidates.map(p => {
                const st = store[p.id] || { prob:0, err:0 };
                const w = Math.max(0, st.prob + (Math.random()*2-1)*(st.err||0));
                return { partyId: p.id, w };
            });
            const total = weighted.reduce((s,c) => s+c.w, 0);
            if(total <= 0) {
                const even = 100 / (weighted.length || 1);
                return weighted.map(c => ({ partyId: c.partyId, pct: even }));
            }
            return weighted.map(c => ({ partyId: c.partyId, pct: (c.w/total)*100 }));
        }

        // 선거인단제: 기준 원의 지역구 결과(elecSimulateDistricts)를 선거인단으로 집계
        function presElectionElectoralVote(candidates, chamberBasis) {
            const candidateIds = new Set(candidates.map(p=>p.id));
            const results = elecSimulateDistricts(chamberBasis); // [{key, partyId}]
            const electorCounts = {};
            let totalElectors = 0;
            results.forEach(r => {
                if(!candidateIds.has(r.partyId)) return; // 후보 자격 없는 정당(무소속/활동금지)이 가져간 지역구는 집계 제외
                electorCounts[r.partyId] = (electorCounts[r.partyId]||0) + 1;
                totalElectors++;
            });
            return candidates.map(p => ({ partyId: p.id, electors: electorCounts[p.id]||0, pct: totalElectors>0 ? (electorCounts[p.id]||0)/totalElectors*100 : 0 }));
        }

        // 대선/총리선거 공용 — mode/chamberBasis/candidates를 받아 라운드별 결과와 당선자를 계산
        function computeElectionRounds(mode, chamberBasis, candidates) {
            let round1, round2 = null, winnerPartyId;
            if(mode === 'electoral') {
                round1 = presElectionElectoralVote(candidates, chamberBasis);
                round1.sort((a,b) => b.electors - a.electors);
                winnerPartyId = round1[0]?.partyId ?? null;
            } else {
                round1 = presElectionPopularVote(candidates, chamberBasis);
                round1.sort((a,b) => b.pct - a.pct);
                winnerPartyId = round1[0]?.partyId ?? null;
                if(mode === 'runoff' && round1[0] && round1[0].pct < 50 && round1.length > 1) {
                    const top2Ids = [round1[0].partyId, round1[1].partyId];
                    const top2Candidates = candidates.filter(p => top2Ids.includes(p.id));
                    // 2차 투표: 1차 득표를 기준 삼아 노이즈를 더해 재정규화 (단순화된 결선 모델)
                    const weighted = top2Candidates.map(p => {
                        const base = round1.find(r => r.partyId === p.id)?.pct || 0;
                        return { partyId: p.id, w: Math.max(0, base + (Math.random()*20-10)) };
                    });
                    const total = weighted.reduce((s,c)=>s+c.w,0) || 1;
                    round2 = weighted.map(c => ({ partyId: c.partyId, pct: (c.w/total)*100 })).sort((a,b)=>b.pct-a.pct);
                    winnerPartyId = round2[0]?.partyId ?? winnerPartyId;
                }
            }
            return { round1, round2, winnerPartyId };
        }

        function runPresidentialElection() {
            const candidates = presElectionCandidates();
            if(candidates.length === 0) {
                showCustomAlert('기준 원에 참여 중인 정당이 없습니다. 정당 탭 또는 선거 > 방식 탭에서 기준 원을 확인하세요.');
                return;
            }
            const { round1, round2, winnerPartyId } = computeElectionRounds(presElectionMode, presElectionChamberBasis, candidates);
            presElectionLastResult = {
                mode: presElectionMode, chamber: presElectionChamberBasis, round1, round2, winnerPartyId,
                title: document.getElementById('presElecTitle')?.value || '',
                year: document.getElementById('presElecYear')?.value || '',
            };
            renderPresElecResultPanel();
        }

        function runPmElection() {
            const candidates = presElectionCandidates();
            if(candidates.length === 0) {
                showCustomAlert('기준 원에 참여 중인 정당이 없습니다. 정당 탭 또는 선거 > 방식 탭에서 기준 원을 확인하세요.');
                return;
            }
            const { round1, round2, winnerPartyId } = computeElectionRounds(presElectionMode, presElectionChamberBasis, candidates);
            pmElectionLastResult = {
                mode: presElectionMode, chamber: presElectionChamberBasis, round1, round2, winnerPartyId,
                title: document.getElementById('pmElecTitle')?.value || '',
                year: document.getElementById('pmElecYear')?.value || '',
            };
            renderPmElecResultPanel();
        }

        // 대선/총리선거 공용 결과 패널 렌더러
        function renderElectionResultPanel(result, panelId, applyFnName, officeLabel, runFnName) {
            const panel = document.getElementById(panelId);
            if(!panel) return;
            if(!result) { panel.style.display = 'none'; return; }
            panel.style.display = '';
            const isElectoral = result.mode === 'electoral';
            const rowHtml = (c, isWinner) => {
                const party = parties.find(p => p.id === c.partyId);
                const candidate = party ? resolveElectionCandidate(party) : null;
                const valLabel = isElectoral ? `선거인단 ${c.electors}명 (${c.pct.toFixed(1)}%)` : `${c.pct.toFixed(1)}%`;
                return `
                    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${isWinner?'color-mix(in srgb, var(--tno-neon) 10%, transparent)':'#0a0c10'};border:1px solid ${isWinner?'var(--tno-neon)':'#222'};margin-bottom:4px;">
                        <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:${party?.color||'#666'};"></span>
                        <span style="flex:1;color:${isWinner?'var(--tno-neon)':'#ccc'};font-size:0.88rem;">${candidate?.name || party?.name || '(후보 없음)'} <span style="color:#666;font-size:0.78rem;">(${party?.name||''})</span></span>
                        <span style="color:${isWinner?'var(--tno-neon)':'#888'};font-size:0.85rem;">${valLabel}</span>
                        ${isWinner?'<span style="color:var(--tno-neon);font-size:0.8rem;">★ 당선</span>':''}
                    </div>
                `;
            };
            let html = `<div style="color:#666;font-size:0.78rem;margin-bottom:6px;">${result.round2 ? '1차 투표' : '개표 결과'}</div>`;
            html += result.round1.map(c => rowHtml(c, !result.round2 && c.partyId === result.winnerPartyId)).join('');
            if(result.round2) {
                html += `<div style="color:#666;font-size:0.78rem;margin:10px 0 6px;">결선투표 (2차)</div>`;
                html += result.round2.map(c => rowHtml(c, c.partyId === result.winnerPartyId)).join('');
            }
            const winnerParty = parties.find(p => p.id === result.winnerPartyId);
            const winnerCandidate = winnerParty ? resolveElectionCandidate(winnerParty) : null;
            html += `
                <button onclick="${applyFnName}()" style="width:100%;margin-top:10px;background:var(--tno-neon);color:#000;border:none;padding:10px;font-family:inherit;font-size:0.95rem;cursor:pointer;letter-spacing:1px;">✔ ${winnerCandidate?.name || winnerParty?.name || '당선자'}를 ${officeLabel}으로 반영</button>
                <button onclick="${runFnName}()" style="width:100%;margin-top:6px;background:transparent;border:1px solid var(--tno-neon);color:var(--tno-neon);padding:9px;font-family:inherit;font-size:0.9rem;cursor:pointer;">↺ 재개표</button>
            `;
            panel.innerHTML = html;
        }

        function renderPresElecResultPanel() { renderElectionResultPanel(presElectionLastResult, 'presElecResultPanel', 'applyPresidentialWinner', effRoleLabel('president'), 'runPresidentialElection'); }
        function renderPmElecResultPanel() { renderElectionResultPanel(pmElectionLastResult, 'pmElecResultPanel', 'applyPmElectionWinner', effRoleLabel('pm'), 'runPmElection'); }

        function applyPresidentialWinner() {
            const r = presElectionLastResult;
            if(!r || !r.winnerPartyId) return;
            const party = parties.find(p => p.id === r.winnerPartyId);
            if(!party) return;
            const candidate = resolveElectionCandidate(party);
            president.linkedSeat = null;
            president.partyId = party.id;
            president.name = candidate.name || '';
            president.photo = candidate.photo || '';
            renderPresidentSection();
            renderCabinetDisplay();
            presElectionRecords.push({
                id: 'pe_'+Date.now(), office: 'president',
                title: r.title, year: r.year, mode: r.mode, chamber: r.chamber,
                winnerPartyId: r.winnerPartyId, winnerName: president.name,
                date: new Date().toISOString(),
            });
            showCustomAlert(`${president.name || party.name}이(가) ${effRoleLabel('president')}으로 취임했습니다.`);
        }

        function applyPmElectionWinner() {
            const r = pmElectionLastResult;
            if(!r || !r.winnerPartyId) return;
            const party = parties.find(p => p.id === r.winnerPartyId);
            if(!party) return;
            const candidate = resolveElectionCandidate(party);
            pm.linkedSeat = null;
            pm.partyId = party.id;
            pm.name = candidate.name || '';
            pm.photo = candidate.photo || '';
            renderPmSection();
            renderCabinetDisplay();
            presElectionRecords.push({
                id: 'pe_'+Date.now(), office: 'pm',
                title: r.title, year: r.year, mode: r.mode, chamber: r.chamber,
                winnerPartyId: r.winnerPartyId, winnerName: pm.name,
                date: new Date().toISOString(),
            });
            showCustomAlert(`${pm.name || party.name}이(가) ${effRoleLabel('pm')}으로 취임했습니다.`);
        }

        // ── 탭 전환 ────────────────────────────
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
                if(tab === 'cabinet') { renderCabinetDisplay(); }
            });
        }

        // 브라우저 탭처럼 × 눌러서 탭 닫기 — 닫은 탭이 활성 탭이었으면 남은 탭 중 가장 오른쪽으로 이동
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
        // 지역구 맵
        // ─────────────────────────────────────────
        let districtGrid = { house: {}, senate: {}, third: {} };
        let districtNames = { house: {}, senate: {}, third: {} }; // { "q,r": "이름" }
        let districtPopulation = { house: {}, senate: {}, third: {} }; // { "q,r"|svgKey: 인구(정수) } — SVG 지역구는 이름처럼 세 원이 공유
        let districtMembers = { house: {}, senate: {}, third: {} }; // { "q,r": {name, partyId, factionId, vacant} } — 지역구 당선 의원 개별 정보
        let districtOrder = { house: [], senate: [], third: [] }; // 목록 표시 순서 (드래그로 변경 가능)
        let selectedDistrictKey = null; // '이름' 모드에서 클릭 선택된 칸

        // ── 권역형(regional list) 비례대표 — 지역구를 권역으로 묶고, 권역별로 비례 의석을 배분 ──────────────
        let regions = { house: [], senate: [], third: [] }; // [{id, name, color}]
        let districtRegionMap = { house: {}, senate: {}, third: {} }; // { "q,r"|svgKey: regionId }
        let regionVoteMode = { house: 'auto', senate: 'auto', third: 'auto' }; // 'auto'(지역구 성향 자동 집계) | 'manual'(직접 입력)
        let regionVoteStore = { house: {}, senate: {}, third: {} }; // { regionId: { partyId: {prob} } }
        let regionActiveId = null; // 지도/그리드에서 클릭해 배정할 때 "칠하기" 대상으로 선택된 권역
        let regionPaintChamber = 'house'; // 권역 탭에서 편집 중인 원

        // ── 비례대표 배분 방식 (원별로 독립) — 병립형(0%)~완전연동형(100%)을 compensationPct로 절충, 전국형/권역형 선택 ──
        let electionSystem = {
            house:  { listScope: 'national', compensationPct: 100 },
            senate: { listScope: 'national', compensationPct: 100 },
            third:  { listScope: 'national', compensationPct: 100 },
        };
        function getElectionSystem(chamber) {
            if(!electionSystem[chamber]) electionSystem[chamber] = { listScope: 'national', compensationPct: 100 };
            return electionSystem[chamber];
        }

        function districtOrderSync(ch) {
            // districtGrid 변경사항을 districtOrder에 반영 (없는 항목 추가, 사라진 항목 제거)
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

        // ── 뉴 지역구 (SVG 기반 지도, 하원/상원/삼원이 하나의 지도를 공유) ──────────────
        let districtMapMode = 'svg'; // 'hex'(그리드, 구 지역구) | 'svg'(뉴 지역구, 기본값) — 지역구 시스템 전체의 방식
        // districtSvgMap = { viewBox, strokeColor, shapes:[{key, tag, attrs:{...}}] } | null — 세 원 공용
        let districtSvgMap = null;
        // districtSeatCounts[key] = { house, senate, third } — 그 지역구가 각 원에 배정하는 의석 수 (0이면 그 원엔 참여 안 함)
        let districtSeatCounts = {};
        // districtSvgTendency[key] = { house:{partyId:pct}, senate:{...}, third:{...} } — 지역구·원별 정당 지지도(%)
        let districtSvgTendency = {};
        // districtAbbr[key] = "약칭" — 설정하면 지도에서 그 지역구 도형 가운데에 표시됨
        let districtAbbr = {};
        // 지도 위 약칭/의석 배지 크기 배율(1=100%) — 슬라이더로 조정, 지역구 자체 크기와 무관하게 지도 전체에 균일 적용
        let districtLabelScale = 1;
        function setDistrictLabelScale(v) {
            districtLabelScale = Math.max(0.5, Math.min(2, (parseInt(v)||100) / 100));
            const val = document.getElementById('districtLabelScaleVal');
            if(val) val.textContent = `${Math.round(districtLabelScale*100)}%`;
            // 현재 화면에 지도가 떠 있을 수 있는 곳들을 다시 그림 (해당 없으면 각 함수 내부에서 조용히 무시됨)
            districtRenderMap();
            tendencyRenderMaps();
        }

        // SVG 지도를 지정된 컨테이너에 그리고, 도형별 채우기 색/클릭/툴팁을 옵션으로 받는다
        // (지역구 편집 패널·의회 화면 지역구 보기·선거 결과 지역구 보기가 모두 이 함수를 공유)
        function renderDistrictSvgInto(wrapEl, opts = {}) {
            if(!wrapEl) return;
            const map = districtSvgMap;
            wrapEl.innerHTML = '';
            if(!map || !Array.isArray(map.shapes) || map.shapes.length === 0) {
                wrapEl.innerHTML = '<div style="text-align:center;color:#444;font-size:0.85rem;padding:30px 10px;">SVG 지도가 없습니다 — 지역구 탭에서 업로드하세요</div>';
                return;
            }
            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', map.viewBox || '0 0 100 100');
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.display = 'block';
            // onClickBackground: 지역구가 아닌 지도 바탕을 누르면 (예: 선택 해제) — 도형 위 클릭은 도형이 먼저 받는다
            if(opts.onClickBackground) svg.addEventListener('click', e => { if(e.target === svg) opts.onClickBackground(); });
            // 정당 동률(경합) 빗금 패턴 등, getFill이 fill="url(#...)"로 참조할 <defs>가 필요할 때 사용
            if(opts.defs) {
                const defsWrap = document.createElementNS(svgNS, 'g');
                defsWrap.innerHTML = opts.defs;
                Array.from(defsWrap.childNodes).forEach(n => svg.appendChild(n));
            }
            const shapeEls = [];
            let selectedOverlayEl = null;
            // innerGlow 바탕: 라이트 모드는 흰 바탕에 옅게, 다크/네온은 어두운 바탕에 옅게 섞는다
            const glowOnLight = document.documentElement.getAttribute('data-theme-mode') === 'light';
            const glowMix = c => glowOnLight ? `color-mix(in srgb, ${c} 38%, #ffffff)` : `color-mix(in srgb, ${c} 22%, #06070a)`;
            // groupOf(key): 같은 묶음(예: 권역)끼리는 지역구 사이 경계선을 지우고 묶음 바깥 테두리만 그린다
            const groups = new Map(); // groupId → { color, shapes: [] }
            map.shapes.forEach(s => {
                const el = document.createElementNS(svgNS, s.tag);
                Object.entries(s.attrs||{}).forEach(([k,v]) => el.setAttribute(k, v));
                const fillColor = (opts.getFill ? opts.getFill(s.key) : null) || 'transparent';
                const groupId = opts.groupOf ? opts.groupOf(s.key) : null;
                if(groupId != null) {
                    if(!groups.has(groupId)) groups.set(groupId, { color: fillColor, shapes: [] });
                    groups.get(groupId).shapes.push(s);
                }
                // innerGlow: 도형 전체를 단색으로 칠하는 대신, 어두운 바탕 위에 경계 안쪽에서
                // 옅어지는 네온 광원만 보이도록 함 (권역 지도 등에서 사용)
                // ungroupedFill/ungroupedStroke: 묶음에 속하지 않은 칸(예: 권역 미배정)은 빛 효과 없이 단색 + 옅은 경계선으로
                const plainUngrouped = opts.groupOf && groupId == null && opts.ungroupedFill;
                const shownFill = plainUngrouped ? opts.ungroupedFill(s.key)
                    : (opts.innerGlow && fillColor !== 'transparent' ? glowMix(fillColor) : fillColor);
                el.setAttribute('fill', shownFill);
                // 묶음에 속한 지역구는 테두리를 채움색과 같게 해 이웃한 같은 묶음 지역구와의 경계선이 보이지 않게 한다
                el.setAttribute('stroke', groupId != null ? shownFill : (plainUngrouped && opts.ungroupedStroke ? opts.ungroupedStroke : districtSvgEffectiveStroke(map)));
                el.setAttribute('stroke-width', opts.strokeWidth || '1.5');
                // 지도 좌표 규모(viewBox)가 저장된 값과 다르거나 매우 클 수 있어, 테두리가 화면 픽셀
                // 기준 두께를 유지하도록 함 (확대해도 실선이 얇아지거나 안 보이지 않게)
                el.setAttribute('vector-effect', 'non-scaling-stroke');
                el.style.transition = 'fill 200ms, filter 120ms';
                if(opts.clickable) {
                    el.style.cursor = 'pointer';
                    el.addEventListener('click', () => opts.onClickKey?.(s.key));
                    if(opts.groupOf && shownFill !== 'transparent') {
                        // 권역 지도: 마우스를 올리면 채움색만 밝게 — 경계선은 그대로 둬서 옆 권역·지역구 경계가 계속 보이게
                        // 라이트는 어둡게(밝히면 흰 바탕에 묻힘), 다크·네온은 밝게
                        const hoverFill = glowOnLight ? `color-mix(in srgb, ${shownFill} 80%, #000000)` : `color-mix(in srgb, ${shownFill} 70%, #ffffff)`;
                        el.addEventListener('mouseenter', () => { el.setAttribute('fill', hoverFill); if(groupId != null) el.setAttribute('stroke', hoverFill); });
                        el.addEventListener('mouseleave', () => { el.setAttribute('fill', shownFill); if(groupId != null) el.setAttribute('stroke', shownFill); });
                    } else {
                        // 라이트 모드는 밝히면 흰 바탕과 구분이 안 되므로 어둡게
                        el.addEventListener('mouseenter', () => { el.style.filter = glowOnLight ? 'brightness(0.8)' : 'brightness(1.5)'; });
                        el.addEventListener('mouseleave', () => { el.style.filter = ''; });
                    }
                }
                // 브라우저 기본 <title> 툴팁 대신, 앱 전체에서 쓰는 네온 스타일 툴팁 박스(#tooltipBox)를 사용
                if(opts.title) {
                    el.addEventListener('mousemove', e => {
                        const tip = document.getElementById('tooltipBox');
                        if(tip) positionTooltip(tip, opts.title(s.key) || s.key, e.clientX, e.clientY);
                    });
                    el.addEventListener('mouseleave', () => {
                        const tip = document.getElementById('tooltipBox');
                        if(tip) tip.style.display = 'none';
                    });
                }
                svg.appendChild(el);
                shapeEls.push({ s, el });
                // innerGlow: 도형과 동일한 모양을 클립으로 삼아, 그 안에서만 보이는 흐린 네온 테두리를
                // 겹쳐 그림 — 경계 쪽은 밝고 중앙으로 갈수록 옅어지는 광원 느낌을 줌
                if(opts.innerGlow && fillColor !== 'transparent' && groupId == null && !plainUngrouped) {
                    const clipId = 'clip_' + Math.random().toString(36).slice(2, 10);
                    const clipPath = document.createElementNS(svgNS, 'clipPath');
                    clipPath.setAttribute('id', clipId);
                    const clipShape = document.createElementNS(svgNS, s.tag);
                    Object.entries(s.attrs||{}).forEach(([k,v]) => clipShape.setAttribute(k, v));
                    clipPath.appendChild(clipShape);
                    svg.appendChild(clipPath);
                    const glowG = document.createElementNS(svgNS, 'g');
                    glowG.setAttribute('clip-path', `url(#${clipId})`);
                    glowG.setAttribute('pointer-events', 'none');
                    glowG.setAttribute('data-decor', '1');
                    const glowShape = document.createElementNS(svgNS, s.tag);
                    Object.entries(s.attrs||{}).forEach(([k,v]) => glowShape.setAttribute(k, v));
                    glowShape.setAttribute('fill', 'none');
                    glowShape.setAttribute('stroke', fillColor);
                    glowShape.setAttribute('stroke-width', opts.innerGlowWidth || 8);
                    glowShape.setAttribute('vector-effect', 'non-scaling-stroke');
                    glowShape.setAttribute('opacity', '0.8');
                    glowShape.style.filter = 'blur(3px)';
                    glowG.appendChild(glowShape);
                    svg.appendChild(glowG);
                }
                // 선택된 지역구는 (지역구 탭과 동일하게) 노란색 반투명 박스를 겹쳐 표시 — 지역구/성향 탭이
                // selectedDistrictKey를 공유하므로 어느 쪽에서 선택해도 다른 탭에도 그대로 반영됨.
                // 다른 도형들에 가려지지 않도록 맨 위에 그려야 해서, 지금 만들지만 나중에 append한다
                if(opts.selectedKey && s.key === opts.selectedKey) {
                    const overlay = document.createElementNS(svgNS, s.tag);
                    Object.entries(s.attrs||{}).forEach(([k,v]) => overlay.setAttribute(k, v));
                    overlay.setAttribute('fill', 'rgba(255,215,0,0.3)');
                    overlay.setAttribute('stroke', 'rgba(255,215,0,0.9)');
                    overlay.setAttribute('stroke-width', (opts.strokeWidth || '1.5') * 1.6 || '2.4');
                    overlay.setAttribute('vector-effect', 'non-scaling-stroke');
                    overlay.setAttribute('pointer-events', 'none');
                    overlay.setAttribute('data-decor', '1');
                    selectedOverlayEl = overlay;
                }
            });
            // 묶음(권역)마다 테두리와 안쪽 빛을 그린다 — 테두리는 묶음 안쪽에만 그려서 이웃 권역으로 넘치지 않게 한다.
            // 묶음 모양(여러 지역구의 합집합)을 필터로 조금 깎아(erode) 원래 모양에서 빼면 둘레의 띠만 남는데,
            // 지역구 사이 경계는 합집합 안쪽이라 깎여도 띠가 생기지 않는다. 깎는 폭은 화면 픽셀 기준이라 지도를 그린 뒤 정한다
            const vbParts = String(map.viewBox || '0 0 100 100').split(/[\s,]+/).map(Number);
            const vb = { x: vbParts[0] || 0, y: vbParts[1] || 0, w: vbParts[2] || 100, h: vbParts[3] || 100 };
            const groupFilters = []; // { el: feMorphology, px } — 그린 뒤 화면 배율에 맞춰 radius를 정함
            const addFilter = (id, parts) => {
                const f = document.createElementNS(svgNS, 'filter');
                f.setAttribute('id', id);
                f.setAttribute('filterUnits', 'userSpaceOnUse');
                // 필터 영역은 지도 크기(+여유)로만 — 너무 넓으면 브라우저가 필터를 잘라 먹는다
                f.setAttribute('x', vb.x - vb.w * 0.05); f.setAttribute('y', vb.y - vb.h * 0.05);
                f.setAttribute('width', vb.w * 1.1); f.setAttribute('height', vb.h * 1.1);
                f.setAttribute('color-interpolation-filters', 'sRGB');
                parts.forEach(p => f.appendChild(p));
                svg.appendChild(f);
            };
            const fe = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v)); return e; };
            groups.forEach(g => {
                const uid = Math.random().toString(36).slice(2, 10);
                // 묶음 모양을 묶음 색으로 칠한 층 — 얇은 같은 색 테두리로 지역구 사이 안티앨리어싱 틈을 메운다
                const unionLayer = (filterId, opacity) => {
                    const layer = document.createElementNS(svgNS, 'g');
                    layer.setAttribute('filter', `url(#${filterId})`);
                    layer.setAttribute('pointer-events', 'none');
                    layer.setAttribute('data-decor', '1');
                    if(opacity != null) layer.setAttribute('opacity', opacity);
                    g.shapes.forEach(s => {
                        const c = document.createElementNS(svgNS, s.tag);
                        Object.entries(s.attrs||{}).forEach(([k,v]) => c.setAttribute(k, v));
                        c.setAttribute('fill', g.color);
                        c.setAttribute('stroke', g.color);
                        c.setAttribute('stroke-width', '1.5');
                        c.setAttribute('stroke-linejoin', 'round');
                        c.setAttribute('vector-effect', 'non-scaling-stroke');
                        layer.appendChild(c);
                    });
                    svg.appendChild(layer);
                };
                // (안쪽 빛 띠는 두껍고 옛날 느낌이라 그리지 않는다 — 단색 채움 + 얇은 테두리만)
                // 테두리: 둘레에서 조금 깎아 낸 띠
                const erodeLine = fe('feMorphology', { in: 'SourceAlpha', operator: 'erode', radius: '1', result: 'er' });
                addFilter('gline_' + uid, [
                    erodeLine,
                    fe('feComposite', { in: 'SourceGraphic', in2: 'er', operator: 'out' }),
                ]);
                groupFilters.push({ el: erodeLine, px: 2.5 });
                unionLayer('gline_' + uid);
            });
            if(selectedOverlayEl) svg.appendChild(selectedOverlayEl);
            wrapEl.appendChild(svg);
            // 묶음 테두리 두께를 화면 픽셀 기준으로 — 지도 좌표 1단위가 화면에서 몇 픽셀인지 재서 필터 반지름을 정한다
            if(groupFilters.length) {
                const applyFilterScale = () => {
                    const r = svg.getBoundingClientRect();
                    const cur = String(svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
                    const vw = cur[2] || vb.w, vh = cur[3] || vb.h;
                    const unitsPerPx = r.width > 0 && r.height > 0 ? Math.max(vw / r.width, vh / r.height) : vw / 600;
                    groupFilters.forEach(({ el, px }) => el.setAttribute('radius', String(px * unitsPerPx)));
                };
                applyFilterScale();
                // 확대/축소(viewBox 변경)나 창 크기 변화에도 두께가 유지되도록 다시 맞춘다
                new MutationObserver(applyFilterScale).observe(svg, { attributes: true, attributeFilter: ['viewBox'] });
                if(window.ResizeObserver) new ResizeObserver(applyFilterScale).observe(svg);
            }

            // 약칭 표시 + (선거 결과 지도라면) 정당별 획득 의석 수 배지 — 도형이 실제로 배치된 뒤에만
            // getBBox로 중심을 구할 수 있으므로 여기서 처리. 배지가 있으면 약칭은 위로, 배지는 아래로 배치
            if(!opts.hideAbbr || opts.seatBadges) {
                // 각 지역구 도형마다 크기가 달라 글씨·배지 크기가 제각각이 되지 않도록,
                // 전체 도형 크기의 중앙값을 기준 크기로 삼아 지도 전체에 일괄 적용함
                // (슬라이더로 사용자가 배율을 조정할 수 있음: districtLabelScale)
                let refSize = 10;
                try {
                    const sizes = shapeEls
                        .map(({ el }) => { try { const bb = el.getBBox(); return Math.min(bb.width, bb.height); } catch(e) { return 0; } })
                        .filter(v => v > 0)
                        .sort((a,b) => a-b);
                    if(sizes.length > 0) refSize = sizes[Math.floor(sizes.length/2)];
                } catch(e) {}
                refSize *= (typeof districtLabelScale === 'number' ? districtLabelScale : 1);
                shapeEls.forEach(({ s, el }) => {
                    const abbr = opts.hideAbbr ? null : districtAbbr[s.key];
                    const badges = opts.seatBadges ? opts.seatBadges(s.key) : null;
                    if(!abbr && !(badges && badges.length)) return;
                    try {
                        const b = el.getBBox();
                        if(!b || (b.width === 0 && b.height === 0)) return;
                        const cx = b.x + b.width/2;
                        const cy = b.y + b.height/2;
                        let abbrY = cy, badgeY = cy;
                        if(abbr && badges && badges.length) { abbrY = cy - b.height*0.16; badgeY = cy + b.height*0.16; }
                        if(abbr) {
                            // 지도 전체 기준 크기(refSize)를 우선 사용하되, 글자 수만큼 가로로 넓게
                            // 차지하는 경우나(가로 기준: 도형 너비 ÷ 글자 수) 도형 자체가 유난히 작은
                            // 경우(세로 기준: 도형 높이)엔 그 도형 밖으로 넘치지 않도록 상한을 둠
                            const fontSize = Math.max(Math.min(refSize * 0.32, b.height * 0.45, (b.width / Math.max(abbr.length, 1)) * 0.62), 0.1) * 0.9;
                            const textEl = document.createElementNS(svgNS, 'text');
                            textEl.setAttribute('x', cx);
                            textEl.setAttribute('y', abbrY);
                            textEl.setAttribute('text-anchor', 'middle');
                            textEl.setAttribute('dominant-baseline', 'central');
                            textEl.setAttribute('font-size', fontSize);
                            textEl.setAttribute('fill', '#fff');
                            textEl.setAttribute('paint-order', 'stroke');
                            textEl.setAttribute('stroke', map.abbrStrokeColor || districtSvgEffectiveStroke(map));
                            textEl.setAttribute('stroke-width', fontSize * 0.12);
                            textEl.setAttribute('pointer-events', 'none');
                            textEl.textContent = abbr;
                            svg.appendChild(textEl);
                        }
                        if(badges && badges.length) {
                            const shown = badges.slice(0, 5);
                            const badgeSize = Math.max(Math.min(refSize * 0.2, Math.min(b.width, b.height) * 0.45), 0.1);
                            const gap = badgeSize * 0.25;
                            const totalW = shown.length * badgeSize + (shown.length-1) * gap;
                            let bx = cx - totalW/2;
                            shown.forEach(entry => {
                                const rect = document.createElementNS(svgNS, 'rect');
                                rect.setAttribute('data-decor', '1'); // 실제 지역구 도형이 아니므로 아래 경계상자 자동보정 계산에서 제외되어야 함
                                rect.setAttribute('x', bx);
                                rect.setAttribute('y', badgeY - badgeSize/2);
                                rect.setAttribute('width', badgeSize);
                                rect.setAttribute('height', badgeSize);
                                rect.setAttribute('fill', entry.party.color);
                                rect.setAttribute('stroke', '#000');
                                rect.setAttribute('stroke-width', badgeSize*0.06);
                                rect.setAttribute('pointer-events', 'none');
                                svg.appendChild(rect);
                                const numEl = document.createElementNS(svgNS, 'text');
                                numEl.setAttribute('x', bx + badgeSize/2);
                                numEl.setAttribute('y', badgeY);
                                numEl.setAttribute('text-anchor', 'middle');
                                numEl.setAttribute('dominant-baseline', 'central');
                                numEl.setAttribute('font-size', badgeSize*0.62);
                                numEl.setAttribute('font-weight', 'bold');
                                numEl.setAttribute('font-family', "'NeoDunggeunmo','VT323',monospace");
                                numEl.setAttribute('fill', '#fff');
                                numEl.setAttribute('pointer-events', 'none');
                                numEl.textContent = entry.n;
                                svg.appendChild(numEl);
                                bx += badgeSize + gap;
                            });
                        }
                    } catch(e) {}
                });
            }

            // 저장된 viewBox가 실제 도형 좌표와 맞지 않으면(오래된 캐시로 내보낸 파일 등) 도형이 화면
            // 밖이나 점 하나 크기로 그려져 안 보일 수 있으므로, 실제 렌더링된 도형들의 경계 상자로 보정.
            // 배경/틀로 쓰인 거대한 사각형 하나가 섞여 있으면 그 도형이 경계 상자를 지배해 정작 실제
            // 지역구들은 한쪽 구석에 작게 몰리므로, 중간값보다 훨씬 큰 이상치 도형은 제외하고 계산
            try {
                const boxes = [];
                svg.querySelectorAll('path,circle,rect,polygon,polyline,ellipse').forEach(el => {
                    if(el.hasAttribute('data-decor')) return; // 약칭/의석 배지 장식용 rect는 실제 도형이 아니므로 제외
                    if(el.closest('pattern')) return; // 경합 빗금 <pattern> 안의 rect도 실제 도형이 아니며, 좌표가 0~1 사이라 경계상자를 심하게 왜곡시킴
                    const b = el.getBBox();
                    if(!b || (b.width === 0 && b.height === 0)) return;
                    boxes.push(b);
                });
                let useBoxes = boxes;
                if(boxes.length >= 4) {
                    const areas = boxes.map(b => b.width * b.height).sort((a,b) => a-b);
                    const median = areas[Math.floor(areas.length/2)];
                    if(median > 0) {
                        const filtered = boxes.filter(b => (b.width*b.height) <= median * 20);
                        if(filtered.length > 0) useBoxes = filtered;
                    }
                }
                let bbox = null;
                useBoxes.forEach(b => {
                    if(!bbox) bbox = { x: b.x, y: b.y, x2: b.x+b.width, y2: b.y+b.height };
                    else {
                        bbox.x  = Math.min(bbox.x,  b.x);
                        bbox.y  = Math.min(bbox.y,  b.y);
                        bbox.x2 = Math.max(bbox.x2, b.x+b.width);
                        bbox.y2 = Math.max(bbox.y2, b.y+b.height);
                    }
                });
                let naturalViewBox = null;
                if(bbox) {
                    const w = bbox.x2 - bbox.x, h = bbox.y2 - bbox.y;
                    const pad = Math.max(w, h, 1) * 0.04;
                    naturalViewBox = { x: bbox.x-pad, y: bbox.y-pad, w: w+pad*2, h: h+pad*2 };
                    svg.setAttribute('viewBox', `${naturalViewBox.x} ${naturalViewBox.y} ${naturalViewBox.w} ${naturalViewBox.h}`);
                }
                // 팬/줌 적용(지역구 편집 지도 전용) — 그리드(육각형) 방식처럼 확대·이동 가능하게, 위에서 구한
                // 자연 크기(naturalViewBox, 실제 도형 전체가 꼭 맞게 보이는 기본 위치)를 기준으로 계산
                if(opts.panZoom && naturalViewBox) {
                    const pz = opts.panZoom;
                    pz.baseViewBox = naturalViewBox;
                    const zoom = pz.zoom || 1;
                    const w = naturalViewBox.w / zoom, h = naturalViewBox.h / zoom;
                    const cx = pz.cx ?? (naturalViewBox.x + naturalViewBox.w/2);
                    const cy = pz.cy ?? (naturalViewBox.y + naturalViewBox.h/2);
                    svg.setAttribute('viewBox', `${cx - w/2} ${cy - h/2} ${w} ${h}`);
                }
            } catch(e) { /* getBBox 미지원 환경 등에서는 저장된 viewBox 그대로 사용 */ }
        }

        // 지역구 지도(SVG) 편집 화면 전용 팬/줌 상태 — 그리드(육각형)의 이동/확대와 같은 개념을
        // 실제 지도(SVG) 도형에도 적용. cx/cy는 뷰박스 좌표계 기준 현재 보기의 중심점(null=기본 위치=전체 보기)
        let districtSvgView = { zoom: 1, cx: null, cy: null, baseViewBox: null };

        function districtSvgResetView() {
            districtSvgView.zoom = 1;
            districtSvgView.cx = null;
            districtSvgView.cy = null;
            districtRenderMap();
        }

        // fracX/fracY(0~1): 지도 영역 안에서 마우스 커서 위치 비율 — 그 지점을 고정한 채 확대/축소
        function districtSvgZoom(factor, fracX = 0.5, fracY = 0.5) {
            const base = districtSvgView.baseViewBox;
            if(!base) return;
            const curZoom = districtSvgView.zoom || 1;
            const curW = base.w / curZoom, curH = base.h / curZoom;
            const curCx = districtSvgView.cx ?? (base.x + base.w/2);
            const curCy = districtSvgView.cy ?? (base.y + base.h/2);
            const vx = (curCx - curW/2) + fracX * curW;
            const vy = (curCy - curH/2) + fracY * curH;
            const newZoom = Math.max(1, Math.min(10, curZoom * factor));
            const newW = base.w / newZoom, newH = base.h / newZoom;
            districtSvgView.zoom = newZoom;
            districtSvgView.cx = Math.max(base.x, Math.min(base.x + base.w, vx - (fracX - 0.5) * newW));
            districtSvgView.cy = Math.max(base.y, Math.min(base.y + base.h, vy - (fracY - 0.5) * newH));
            districtRenderMap();
        }

        function districtSvgPanByPixels(wrapEl, dxPx, dyPx) {
            const base = districtSvgView.baseViewBox;
            if(!base) return;
            const rect = wrapEl.getBoundingClientRect();
            if(rect.width <= 0 || rect.height <= 0) return;
            const zoom = districtSvgView.zoom || 1;
            const curW = base.w / zoom, curH = base.h / zoom;
            const unitPerPxX = curW / rect.width, unitPerPxY = curH / rect.height;
            const curCx = districtSvgView.cx ?? (base.x + base.w/2);
            const curCy = districtSvgView.cy ?? (base.y + base.h/2);
            districtSvgView.cx = Math.max(base.x, Math.min(base.x + base.w, curCx - dxPx * unitPerPxX));
            districtSvgView.cy = Math.max(base.y, Math.min(base.y + base.h, curCy - dyPx * unitPerPxY));
            districtRenderMap();
        }

        // 휠클릭(가운데 버튼) 드래그로 이동, Shift+스크롤로 확대/축소 — 좌클릭은 지역구 선택에 그대로 사용
        function districtInitSvgPanZoom(wrapEl) {
            if(wrapEl._svgViewInited) return;
            wrapEl._svgViewInited = true;
            let isPanning = false, lastX = 0, lastY = 0;

            wrapEl.addEventListener('mousedown', e => {
                if(e.button !== 1) return;
                isPanning = true;
                lastX = e.clientX; lastY = e.clientY;
                wrapEl.style.cursor = 'grabbing';
                e.preventDefault();
            });
            window.addEventListener('mousemove', e => {
                if(!isPanning) return;
                const dx = e.clientX - lastX, dy = e.clientY - lastY;
                lastX = e.clientX; lastY = e.clientY;
                districtSvgPanByPixels(wrapEl, dx, dy);
            });
            window.addEventListener('mouseup', () => {
                if(!isPanning) return;
                isPanning = false;
                wrapEl.style.cursor = '';
            });
            wrapEl.addEventListener('wheel', e => {
                if(!e.shiftKey) return; // shift 없는 일반 스크롤은 페이지 스크롤 그대로 유지
                e.preventDefault();
                const rect = wrapEl.getBoundingClientRect();
                const fracX = (e.clientX - rect.left) / rect.width;
                const fracY = (e.clientY - rect.top) / rect.height;
                const factor = e.deltaY < 0 ? 1.15 : 1/1.15;
                districtSvgZoom(factor, fracX, fracY);
            }, { passive: false });
        }

        // 지역구 맵 패널을 지역구 시스템 전체 방식(육각형/SVG)에 맞춰 다시 그림 — 지역구 편집 관련 갱신은 모두 이 함수를 거친다
        function districtRenderMap() {
            const cvs = document.getElementById('districtCanvas');
            const svgWrap = document.getElementById('districtSvgWrap');
            if(!cvs || !svgWrap) return;
            const isSvg = districtMapMode === 'svg';
            cvs.style.display = isSvg ? 'none' : '';
            svgWrap.style.display = isSvg ? '' : 'none';
            const zoomControls = document.getElementById('districtZoomControls');
            if(zoomControls) zoomControls.style.display = isSvg ? 'none' : '';
            const svgViewControls = document.getElementById('districtSvgViewControls');
            if(svgViewControls) svgViewControls.style.display = isSvg ? 'inline-flex' : 'none';
            const svgViewHint = document.getElementById('districtSvgViewHint');
            if(svgViewHint) svgViewHint.style.display = isSvg ? '' : 'none';
            if(isSvg) {
                districtInitSvgPanZoom(svgWrap);
                // SVG 지역구는 도형이 파일에서 이미 정해져 있으므로 추가/제거 모드가 없고, 클릭하면 항상 편집 패널이 열림
                renderDistrictSvgInto(svgWrap, {
                    clickable: true,
                    getFill: key => key === selectedDistrictKey ? 'rgba(255,215,0,0.25)' : 'transparent',
                    title: key => (districtNames.house[key] || key) + (districtPopulation.house[key] != null ? ` · 인구 ${districtPopulation.house[key].toLocaleString()}` : ''),
                    onClickKey: key => {
                        selectedDistrictKey = key;
                        districtRenderNamePanel();
                        districtRenderMap();
                    },
                    onClickBackground: () => { if(selectedDistrictKey) clearSelectedDistrict(); },
                    panZoom: districtSvgView
                });
                const cntEl = document.getElementById('districtCount');
                if(cntEl) cntEl.textContent = `${districtSvgMap?.shapes?.length||0}개 지역구 (SVG)`;
            } else {
                districtDrawCanvas();
            }
        }

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
            districtRenderMap();
        }

        // "구 지역구"/"뉴 지역구" 탭의 표시를 지역구 시스템 전체 방식(육각형/SVG)에 맞춰 동기화
        function districtUpdateModeUI() {
            const isSvg = districtMapMode === 'svg';
            const hexUI = document.getElementById('districtHexEditUI');
            const svgUI = document.getElementById('districtSvgEditUI');
            if(hexUI) hexUI.style.display = isSvg ? 'none' : '';
            if(svgUI) svgUI.style.display = isSvg ? '' : 'none';
            // 지도(SVG) 방식은 세 원이 지도 하나를 공유하므로 "하원/상원/삼원 지역구" 선택 버튼이 필요 없음
            const chamberSelectRow = document.getElementById('districtChamberSelectRow');
            if(chamberSelectRow) chamberSelectRow.style.display = isSvg ? 'none' : '';

            // 국가>설정의 지역구 시스템 토글 버튼 상태 동기화
            document.getElementById('districtSystemModeHexBtn')?.classList.toggle('active', !isSvg);
            document.getElementById('districtSystemModeSvgBtn')?.classList.toggle('active', isSvg);

            const info = document.getElementById('districtSvgInfo');
            const fileName = document.getElementById('districtSvgFileName');
            const shapeCount = document.getElementById('districtSvgShapeCount');
            const strokeInput = document.getElementById('districtSvgStrokeColorInput');
            const strokeHexInput = document.getElementById('districtSvgStrokeColorHexInput');
            const abbrStrokeInput = document.getElementById('districtSvgAbbrStrokeColorInput');
            const abbrStrokeHexInput = document.getElementById('districtSvgAbbrStrokeColorHexInput');
            if(info) info.style.display = districtSvgMap ? '' : 'none';
            if(fileName) fileName.textContent = districtSvgMap ? '업로드됨' : '파일 없음';
            if(shapeCount) shapeCount.textContent = districtSvgMap ? String(districtSvgMap.shapes.length) : '0';
            if(districtSvgMap) {
                const color = districtSvgEffectiveStroke(districtSvgMap);
                const locked = districtStrokeLocked();
                if(strokeInput) { strokeInput.value = color.toLowerCase(); strokeInput.disabled = locked; }
                if(strokeHexInput) { strokeHexInput.value = color.toUpperCase(); strokeHexInput.disabled = locked; }
                const syncBtn = document.getElementById('districtSvgStrokeSyncBtn');
                if(syncBtn) syncBtn.style.display = locked ? 'none' : '';
                const lockNote = document.getElementById('districtSvgStrokeLockNote');
                if(lockNote) lockNote.style.display = locked ? '' : 'none';
                const abbrColor = districtSvgMap.abbrStrokeColor || color;
                if(abbrStrokeInput) abbrStrokeInput.value = abbrColor;
                if(abbrStrokeHexInput) abbrStrokeHexInput.value = abbrColor.toUpperCase();
            }
        }

        // 맵 메이커(map.html)가 내보낸 .jsx 텍스트에서 도형 정보와 viewBox를 추출
        function parseDistrictJsx(text) {
            const vbMatch = text.match(/\/\/\s*VIEWBOX:\s*(.+)/);
            const viewBox = vbMatch ? vbMatch[1].trim() : '0 0 100 100';
            const shapes = [];
            const usedKeys = new Set();
            const compRe = /export const (\w+)\s*=\s*\([^)]*\)\s*=>\s*\(\s*<(\w+)\s*([^>]*?)\/?>\s*\)/g;
            let m;
            while((m = compRe.exec(text))) {
                const [, name, tag, attrStr] = m;
                const attrs = {};
                let dataKey = null;
                const attrRe = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
                let am;
                while((am = attrRe.exec(attrStr))) {
                    const [, k, v] = am;
                    const decoded = v.replace(/&quot;/g, '"');
                    if(k === 'data-key') dataKey = decoded;
                    else if(['d','points','cx','cy','r','x','y','width','height','rx','ry','transform'].includes(k)) attrs[k] = decoded;
                }
                // data-key(원본 지역구 이름, 한글 등 포함)가 있으면 우선 사용 — 컴포넌트 이름(name)은
                // 한글이면 겹치기 쉬운 JS 식별자라 표시용으로 부적합함. 그래도 서로 겹치면 번호를 붙여 구분
                let key = dataKey || name;
                while(usedKeys.has(key)) key = `${key}_${shapes.length+1}`;
                usedKeys.add(key);
                shapes.push({ key, tag, attrs });
            }
            return { viewBox, shapes };
        }

        function districtSvgUpload(input) {
            const file = input.files?.[0]; if(!file) return;
            const hasExisting = districtMapMode === 'svg' || ['house','senate','third'].some(c => Object.keys(districtGrid[c]||{}).length > 0);
            if(hasExisting) {
                showCustomConfirm('기존 지역구 데이터가 모두 새 지도로 대체됩니다.\n(이름·의석 수·성향·당선자 정보 포함) 계속하시겠습니까?',
                    () => districtSvgUploadProceed(input, file),
                    () => { input.value = ''; });
                return;
            }
            districtSvgUploadProceed(input, file);
        }

        function districtSvgUploadProceed(input, file) {
            const reader = new FileReader();
            reader.onload = e => {
                const text = e.target.result;
                const { viewBox, shapes } = parseDistrictJsx(text);
                if(shapes.length === 0) { showCustomAlert('맵 메이커에서 내보낸 .jsx 파일에서 지역구로 쓸 도형을 찾을 수 없습니다.'); return; }

                const strokeColor = districtSvgMap?.strokeColor || '#00ffff';
                const abbrStrokeColor = districtSvgMap?.abbrStrokeColor || null;
                districtSvgMap = { viewBox, strokeColor, abbrStrokeColor, shapes };
                districtMapMode = 'svg';
                districtSeatCounts = {};
                districtSvgTendency = {};
                districtAbbr = {};
                ['house','senate','third'].forEach(ch => { districtGrid[ch] = {}; districtNames[ch] = {}; districtPopulation[ch] = {}; districtMembers[ch] = {}; });
                shapes.forEach(s => {
                    // 기본값: 하원은 1석, 상원/삼원은 해당 원이 존재하면 1석 (뒤에서 지역구별로 조정 가능)
                    districtSeatCounts[s.key] = { house: 1, senate: hasSenateChamber()?1:0, third: hasThirdChamber()?1:0 };
                    ['house','senate','third'].forEach(ch => {
                        if(districtSeatCounts[s.key][ch] > 0) districtGrid[ch][s.key] = true;
                        districtNames[ch][s.key] = s.key;
                    });
                });
                ['house','senate','third'].forEach(ch => districtOrderSync(ch));
                selectedDistrictKey = null;
                document.getElementById('districtNamePanel').style.display = 'none';

                districtUpdateModeUI();
                districtRenderMap();
                renderDistrictListPanel();
                elecUpdateDistrictInfo();
                input.value = '';
            };
            reader.readAsText(file);
        }

        // 지역구 지도 테두리 색 — 라이트/다크는 테마에 맞춘 고정색(바꿀 수 없음), 네온만 사용자가 고른 색
        const DISTRICT_STROKE_LIGHT = '#A3A3A3';
        const DISTRICT_STROKE_DARK = '#5C6370';
        function districtStrokeLocked() { return document.documentElement.getAttribute('data-theme-family') === 'modern'; }
        function districtSvgEffectiveStroke(map) {
            const mode = document.documentElement.getAttribute('data-theme-mode');
            if(mode === 'light') return DISTRICT_STROKE_LIGHT;
            if(mode === 'dark') return DISTRICT_STROKE_DARK;
            return (map && map.strokeColor) || '#00ffff';
        }

        function districtSvgSetStrokeColor(color) {
            if(districtStrokeLocked()) { districtUpdateModeUI(); return; }
            if(!districtSvgMap) return;
            districtSvgMap.strokeColor = color;
            districtUpdateModeUI();
            districtRenderMap();
        }

        function districtSvgSetStrokeColorHex(hex) {
            const v = hex.trim().startsWith('#') ? hex.trim() : '#' + hex.trim();
            if(typeof isValidHexColor === 'function' ? !isValidHexColor(v) : !/^#[0-9a-fA-F]{6}$/.test(v)) {
                districtUpdateModeUI(); // 잘못된 값이면 원래 값으로 되돌림
                return;
            }
            districtSvgSetStrokeColor(v);
        }

        // 지역구 테두리 색을 현재 사이트 테마 색(설정에서 고른 색)과 동일하게 맞춤
        function districtSvgSyncStrokeColorWithTheme() {
            if(typeof getThemeColor !== 'function') return;
            if(districtStrokeLocked()) return;
            districtSvgSetStrokeColor(getThemeColor());
        }

        function districtSvgSetAbbrStrokeColor(color) {
            if(!districtSvgMap) return;
            districtSvgMap.abbrStrokeColor = color;
            districtUpdateModeUI();
            districtRenderMap();
        }

        function districtSvgSetAbbrStrokeColorHex(hex) {
            const v = hex.trim().startsWith('#') ? hex.trim() : '#' + hex.trim();
            if(typeof isValidHexColor === 'function' ? !isValidHexColor(v) : !/^#[0-9a-fA-F]{6}$/.test(v)) {
                districtUpdateModeUI(); // 잘못된 값이면 원래 값으로 되돌림
                return;
            }
            districtSvgSetAbbrStrokeColor(v);
        }

        // 글씨 테두리 색을 현재 사이트 테마 색(설정에서 고른 색)과 동일하게 맞춤
        function districtSvgSyncAbbrStrokeColorWithTheme() {
            if(typeof getThemeColor !== 'function') return;
            districtSvgSetAbbrStrokeColor(getThemeColor());
        }

        function districtSvgRevertToHex() {
            showCustomConfirm('구 지역구(그리드) 방식으로 되돌립니다.\nSVG 지도로 만든 지역구/의석/성향/당선자 데이터가 모두 삭제됩니다. 계속하시겠습니까?', () => {
                districtMapMode = 'hex';
                districtSvgMap = null;
                districtSeatCounts = {};
                districtSvgTendency = {};
                districtAbbr = {};
                ['house','senate','third'].forEach(ch => { districtGrid[ch] = {}; districtNames[ch] = {}; districtPopulation[ch] = {}; districtMembers[ch] = {}; districtOrderSync(ch); });
                selectedDistrictKey = null;
                document.getElementById('districtNamePanel').style.display = 'none';
                districtUpdateModeUI();
                districtRenderMap();
                renderDistrictListPanel();
                elecUpdateDistrictInfo();
            });
        }

        // 국가>설정의 지역구 시스템 토글에서 호출 — 육각형 데이터는 지도로 바꿔도 그대로 보존되고
        // (SVG 지도를 업로드하는 순간 대체됨), 지도 데이터가 있는 상태에서 육각형으로 되돌릴 때만
        // 기존 되돌리기와 동일하게 확인 후 초기화한다
        function setDistrictMapMode(mode) {
            if(mode !== 'hex' && mode !== 'svg') return;
            if(mode === districtMapMode) return;
            if(mode === 'hex') {
                const hasSvgData = !!districtSvgMap || Object.keys(districtSeatCounts).length > 0;
                if(hasSvgData) { districtSvgRevertToHex(); return; }
                districtMapMode = 'hex';
            } else {
                districtMapMode = 'svg';
            }
            selectedDistrictKey = null;
            document.getElementById('districtNamePanel').style.display = 'none';
            districtUpdateModeUI();
            districtRenderMap();
            renderDistrictListPanel();
            elecUpdateDistrictInfo();
        }

        function districtSvgSetSeats(key, chamber, value) {
            const n = Math.max(0, parseInt(value)||0);
            districtSeatCounts[key] = districtSeatCounts[key] || { house:0, senate:0, third:0 };
            districtSeatCounts[key][chamber] = n;
            if(n > 0) districtGrid[chamber][key] = true;
            else { delete districtGrid[chamber][key]; delete districtMembers[chamber][key]; }
            districtOrderSync(chamber);
            districtRenderNamePanel(); // 성향 섹션이 늘거나 줄 수 있으므로 패널도 갱신
            districtRenderMap();
            renderDistrictListPanel();
            elecUpdateDistrictInfo();
        }

        // "전체에 반영" (성향 탭, 지지율 탭과 같은 방식) — 켜져 있으면 한 원에서 지역구 성향(%)을 바꿀 때
        // 같은 지역구의 다른 원에도 그대로 반영 (원마다 지역구 성향을 독립적으로 관리하기 때문에 필요)
        let tendencySvgSyncAll = false;

        function tendencySvgPropagateValue(key, fromChamber, partyId, value) {
            chamberList().forEach(c => {
                if(c === fromChamber) return;
                districtSvgTendency[key] = districtSvgTendency[key] || { house:{}, senate:{}, third:{} };
                districtSvgTendency[key][c] = districtSvgTendency[key][c] || {};
                districtSvgTendency[key][c][partyId] = value;
            });
        }

        function districtSvgSetTendency(key, chamber, partyId, value) {
            const v = Math.max(0, Math.min(100, parseFloat(value)||0));
            districtSvgTendency[key] = districtSvgTendency[key] || { house:{}, senate:{}, third:{} };
            districtSvgTendency[key][chamber] = districtSvgTendency[key][chamber] || {};
            districtSvgTendency[key][chamber][partyId] = v;
            if(tendencySvgSyncAll) tendencySvgPropagateValue(key, chamber, partyId, v);
        }

        // "전체에 반영" 체크박스 — 켜는 순간 현재 선택된 지역구의 현재 원 값을 다른 모든 원에 즉시 동기화
        function onTendencySvgSyncAllChange(checked) {
            tendencySvgSyncAll = checked;
            if(checked && selectedDistrictKey) {
                const key = selectedDistrictKey;
                const store = districtSvgTendency[key]?.[tendencySvgChamber] || {};
                Object.keys(store).forEach(partyId => tendencySvgPropagateValue(key, tendencySvgChamber, partyId, store[partyId]));
                tendencyRenderMaps();
            }
        }

        // 지도에 잘못 섞여 들어온 도형(예: 배경/틀 사각형)을 통째로 제거 — 지도 자체에서 삭제되며 복구 불가
        function districtSvgRemoveShape(key) {
            if(!districtSvgMap) return;
            showCustomConfirm(`"${key}" 도형을 지도에서 완전히 삭제합니다.\n(배경/틀처럼 잘못 포함된 도형을 뺄 때 사용) 계속하시겠습니까?`, () => {
                districtSvgMap.shapes = districtSvgMap.shapes.filter(s => s.key !== key);
                delete districtSeatCounts[key];
                delete districtSvgTendency[key];
                delete districtAbbr[key];
                ['house','senate','third'].forEach(ch => {
                    delete districtGrid[ch][key];
                    delete districtNames[ch][key];
                    delete districtPopulation[ch][key];
                    delete districtMembers[ch][key];
                    districtOrderSync(ch);
                });
                if(selectedDistrictKey === key) selectedDistrictKey = null;
                document.getElementById('districtNamePanel').style.display = 'none';
                districtUpdateModeUI();
                districtRenderMap();
                renderDistrictListPanel();
                elecUpdateDistrictInfo();
            });
        }

        // SVG 지역구의 이름은 세 원이 공유하므로 house/senate/third 이름 저장소에 동시 반영
        function districtSvgSetName(name) {
            if(!selectedDistrictKey) return;
            const key = selectedDistrictKey;
            ['house','senate','third'].forEach(ch => {
                if(name.trim()) districtNames[ch][key] = name.trim();
                else delete districtNames[ch][key];
            });
            renderDistrictListPanel();
        }

        // 지역구 약칭 — 설정하면 지도에서 그 지역구 도형 가운데에 표시됨 (이름과 마찬가지로 원 구분 없이 공유)
        function districtSvgSetAbbr(abbr) {
            if(!selectedDistrictKey) return;
            const key = selectedDistrictKey;
            if(abbr.trim()) districtAbbr[key] = abbr.trim();
            else delete districtAbbr[key];
            districtRenderMap();
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
            districtRenderMap();
        }

        function districtRenderNamePanel() {
            const panel = document.getElementById('districtNamePanel');
            if(!panel || !selectedDistrictKey) { if(panel) panel.style.display = 'none'; return; }
            panel.style.display = '';
            const key = selectedDistrictKey;

            if(districtMapMode !== 'svg') {
                // 구 지역구(육각형): 이름만 입력
                panel.innerHTML = `
                    <div style="color:#888;font-size:0.78rem;margin-bottom:5px;">선택한 지역구 <span style="color:#666;">(${key})</span></div>
                    <input type="text" placeholder="지역구 이름 (예: 종로구)" value="${districtNames[districtChamber][key]||''}"
                        style="width:100%;box-sizing:border-box;background:#000;border:1px solid #665500;color:var(--tno-gold);font-family:inherit;font-size:0.9rem;padding:6px;"
                        oninput="districtSetName(this.value)">
                    ${districtPopulationInputHtml(districtChamber, key, 'margin-top:6px;')}
                `;
                return;
            }

            // 뉴 지역구(SVG): 이름 + 의석 수(하원/상원/삼원). 정당별 성향(%)은 '성향' 탭에서 이 지도를 직접 클릭해 편집한다
            const chambers = chamberList();
            const chLabel = {
                house:  document.getElementById('houseNameInput')?.value  || '하원',
                senate: document.getElementById('senateNameInput')?.value || '상원',
                third:  document.getElementById('thirdNameInput')?.value  || '삼원',
            };
            const seats = districtSeatCounts[key] || { house:0, senate:0, third:0 };
            const activeChambers = chambers.filter(ch => (seats[ch]||0) > 0);

            panel.innerHTML = `
                <div style="color:#888;font-size:0.78rem;margin-bottom:5px;">선택한 지역구 <span style="color:#666;">(${key})</span></div>
                <input type="text" placeholder="지역구 이름 (예: 종로구)" value="${districtNames.house[key]||''}"
                    style="width:100%;box-sizing:border-box;background:#000;border:1px solid #665500;color:var(--tno-gold);font-family:inherit;font-size:0.9rem;padding:6px;margin-bottom:8px;"
                    oninput="districtSvgSetName(this.value)">
                <input type="text" placeholder="약칭 (예: 종로) — 지정하면 지도 가운데에 표시됩니다" value="${districtAbbr[key]||''}" maxlength="6"
                    style="width:100%;box-sizing:border-box;background:#000;border:1px solid #333;color:var(--tno-text);font-family:inherit;font-size:0.85rem;padding:6px;margin-bottom:8px;"
                    oninput="districtSvgSetAbbr(this.value)">
                ${districtPopulationInputHtml('house', key, 'margin-bottom:8px;')}
                <div style="color:#666;font-size:0.72rem;margin-bottom:4px;">의석 수 (원별, 0이면 그 원엔 없는 지역구)</div>
                <div style="display:grid;grid-template-columns:repeat(${chambers.length},1fr);gap:6px;margin-bottom:10px;">
                    ${chambers.map(ch => `
                        <div>
                            <div style="font-size:0.72rem;color:#666;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${chLabel[ch]}</div>
                            <input type="number" min="0" value="${seats[ch]||0}"
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid #333;color:var(--tno-neon);font-family:inherit;font-size:0.85rem;padding:5px;text-align:center;"
                                onchange="districtSvgSetSeats('${key}','${ch}',this.value)">
                        </div>
                    `).join('')}
                </div>
                ${activeChambers.length === 0
                    ? '<div style="color:#444;font-size:0.78rem;text-align:center;padding:10px;border-top:1px solid #222;">이 지역구에 배정된 의석이 없습니다 — 위에서 의석 수를 먼저 입력하세요</div>'
                    : '<div style="color:#555;font-size:0.75rem;padding:8px;background:#0a0c10;border:1px solid #222;">정당별 성향(%)은 위쪽 <b style="color:var(--tno-neon);">성향</b> 탭에서 이 지도를 클릭해 편집하세요</div>'
                }
                <div style="border-top:1px solid #222;margin-top:10px;padding-top:8px;display:flex;justify-content:space-between;gap:8px;">
                    <button onclick="clearSelectedDistrict()" style="background:transparent;border:1px solid #333;color:#888;padding:4px 10px;font-family:inherit;font-size:0.75rem;cursor:pointer;">선택 해제</button>
                    <button onclick="districtSvgRemoveShape('${key}')" style="background:transparent;border:1px solid #663333;color:#cc6666;padding:4px 10px;font-family:inherit;font-size:0.75rem;cursor:pointer;">이 도형 지도에서 삭제 (배경/틀 등 잘못 포함된 도형용)</button>
                </div>
            `;
        }

        // 지역구/성향 탭이 공유하는 선택 상태(selectedDistrictKey)를 해제 — 양쪽 탭에 모두 반영
        function clearSelectedDistrict() {
            selectedDistrictKey = null;
            districtRenderNamePanel();
            districtRenderMap();
            if(districtMapMode === 'svg') tendencyRenderMaps();
        }

        function districtSetName(name) {
            if(!selectedDistrictKey) return;
            if(name.trim()) districtNames[districtChamber][selectedDistrictKey] = name.trim();
            else delete districtNames[districtChamber][selectedDistrictKey];
            renderDistrictListPanel();
        }

        // ── 지역구 목록 패널 (하원/상원/삼원 3차 탭 + 드래그 정렬) ──
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
                container.innerHTML = '<div style="text-align:center;color:#555;padding:16px;font-size:0.85rem;">[활성화된 지역구가 없습니다]</div>';
                return;
            }

            const totalPop = keys.reduce((sum, k) => sum + (districtPopulation[ch][k] || 0), 0);
            if(totalPop > 0) {
                const sumEl = document.createElement('div');
                sumEl.style.cssText = 'color:#666;font-size:0.75rem;text-align:right;margin-bottom:5px;';
                sumEl.textContent = `총 인구: ${totalPop.toLocaleString()}`;
                container.appendChild(sumEl);
            }

            keys.forEach(key => {
                const div = document.createElement('div');
                div.className = 'drag-card-district';
                div.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px;background:#0a0c10;border:1px solid #222;margin-bottom:5px;';
                const name = districtNames[ch][key] || '';
                div.innerHTML = `
                    <span class="drag-handle">⋮⋮</span>
                    <span style="color:#555;font-size:0.75rem;flex-shrink:0;width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${key}">${key}</span>
                    <input type="text" value="${name}" placeholder="(이름 없음)"
                        style="flex:1;min-width:0;background:#000;border:1px solid #2a2a2a;color:#ddd;font-family:inherit;font-size:0.85rem;padding:4px 6px;"
                        onchange="districtSetNameByKey('${ch}','${key}',this.value)">
                    <input type="number" min="0" step="1" value="${districtPopulation[ch][key] ?? ''}" placeholder="인구" title="인구"
                        style="width:96px;flex-shrink:0;background:#000;border:1px solid #2a2a2a;color:#aaa;font-family:inherit;font-size:0.8rem;padding:4px 6px;text-align:right;"
                        onchange="districtSetPopulation('${ch}','${key}',this.value)">
                `;
                container.appendChild(div);
                startDragReorder(div.querySelector('.drag-handle'), 'districtListPanel', '.drag-card-district', districtOrder[ch], renderDistrictListPanel);
            });
        }

        // 지역구 인구 — 비우면 삭제. SVG 지역구는 이름처럼 세 원이 한 도형을 공유하므로 세 원에 함께 저장
        function districtSetPopulation(ch, key, value) {
            const n = Math.max(0, Math.floor(Number(String(value).replace(/,/g, ''))));
            const chs = districtMapMode === 'svg' ? ['house','senate','third'] : [ch];
            chs.forEach(c => {
                if(String(value).trim() === '' || !isFinite(n)) delete districtPopulation[c][key];
                else districtPopulation[c][key] = n;
            });
            renderDistrictListPanel();
            if(key === selectedDistrictKey) districtRenderNamePanel();
        }

        function districtPopulationInputHtml(ch, key, extraStyle) {
            return `<div style="display:flex;align-items:center;gap:6px;${extraStyle||''}">
                    <span style="color:#666;font-size:0.75rem;flex-shrink:0;">인구</span>
                    <input type="number" min="0" step="1" placeholder="예: 150000" value="${districtPopulation[ch]?.[key] ?? ''}"
                        style="flex:1;min-width:0;box-sizing:border-box;background:#000;border:1px solid #333;color:var(--tno-text);font-family:inherit;font-size:0.85rem;padding:6px;"
                        onchange="districtSetPopulation('${ch}','${key}',this.value)">
                </div>`;
        }

        function districtSetNameByKey(ch, key, name) {
            if(name.trim()) districtNames[ch][key] = name.trim();
            else delete districtNames[ch][key];
            if(ch === districtChamber && key === selectedDistrictKey) districtRenderNamePanel();
            districtRenderMap();
        }

        // 좌표가 어느 의원실 소속인지 찾아 이름(또는 빈 문자열) 반환, 활성 지역구가 아니면 null
        function districtNameFor(key) {
            for(const ch of ['house','senate','third']) {
                if(districtGrid[ch][key]) return districtNames[ch][key] || '';
            }
            return null;
        }

        function districtHexCorners(cx, cy, size) {
            return Array.from({length:6}, (_,i) => {
                const a = Math.PI/180 * (60*i);   // flat-top: 0°부터 시작
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

            // 화면 네 모서리의 axial 좌표를 모두 구해서 그리드 범위 결정
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
                        ctx.strokeStyle = tc('#1a1d22', '--m-border');
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
                let txt = `하원 ${cntH}칸`;
                if(isBi) txt += ` · 상원 ${cntS}칸`;
                if(isTri) txt += ` · 삼원 ${cntT}칸`;
                el.textContent = txt;
            }
        }

        function districtFitView() {
            if(districtMapMode === 'svg') return; // SVG는 뷰포트에 맞춰 자동으로 표시됨
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;
            const allKeys = [...new Set([...Object.keys(districtGrid.house), ...Object.keys(districtGrid.senate)])];
            if(allKeys.length === 0) return; // 활성 칸 없으면 그대로

            const w = cvs.offsetWidth  || 500;
            const h = cvs.offsetHeight || 400;

            // 활성 칸의 axial bounding box
            let minQ=Infinity, maxQ=-Infinity, minR=Infinity, maxR=-Infinity;
            allKeys.forEach(k => {
                const [q,r] = k.split(',').map(Number);
                if(q<minQ) minQ=q; if(q>maxQ) maxQ=q;
                if(r<minR) minR=r; if(r>maxR) maxR=r;
            });

            // padding: 활성 칸 주변 2칸 여백
            const PAD = 2;
            minQ -= PAD; maxQ += PAD;
            minR -= PAD; maxR += PAD;

            // 이 범위가 캔버스에 딱 맞는 size 계산 (flat-top)
            const spanX = (maxQ - minQ + 1) * 1.5 + 0.5;
            const spanY = (maxR - minR + 1) * Math.sqrt(3) + Math.sqrt(3)/2;
            const sizeByW = w / spanX;
            const sizeByH = h / spanY;
            const newSize = Math.min(sizeByW, sizeByH, HEX_SIZE * 3); // 너무 크지 않게 캡

            // 중심 axial 좌표 → 화면 중앙에 맞추기
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
            if(districtMapMode === 'svg') return;
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;
            const cx = districtView.panX, cy = districtView.panY;
            districtView.panX = cx + (districtView.panX - cx) * factor;
            districtView.panY = cy + (districtView.panY - cy) * factor;
            districtView.zoom = Math.max(0.3, Math.min(5, districtView.zoom * factor));
            districtDrawCanvas();
        }

        function districtResetView() {
            if(districtMapMode === 'svg') return;
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;
            const w = cvs.offsetWidth || 500;
            const h = cvs.offsetHeight || 400;
            districtView = { zoom: 1, panX: w/2, panY: h/2 };
            districtDrawCanvas();
        }

        function districtClearAll() {
            if(districtMapMode === 'svg') {
                // SVG 지도의 도형 자체는 업로드된 파일에서 오므로 유지하고, 이름만 초기화 (세 원 공유이므로 전부 초기화)
                const hasAnyName = ['house','senate','third'].some(ch => Object.keys(districtNames[ch]||{}).length > 0);
                if(!hasAnyName) return;
                showCustomConfirm('모든 지역구의 이름을 초기화하시겠습니까? (지도 도형·의석 수·성향은 유지됩니다)', () => {
                    ['house','senate','third'].forEach(ch => { districtNames[ch] = {}; });
                    selectedDistrictKey = null;
                    const namePanel = document.getElementById('districtNamePanel');
                    if(namePanel) namePanel.style.display = 'none';
                    districtRenderMap();
                    renderDistrictListPanel();
                });
                return;
            }
            districtGrid[districtChamber] = {};
            districtNames[districtChamber] = {};
            districtPopulation[districtChamber] = {};
            districtOrder[districtChamber] = [];
            selectedDistrictKey = null;
            const namePanel = document.getElementById('districtNamePanel');
            if(namePanel) namePanel.style.display = 'none';
            districtRenderMap();
            renderDistrictListPanel();
        }

        function districtInitCanvas() {
            const cvs = document.getElementById('districtCanvas');
            if(!cvs) return;

            if(districtMapMode === 'svg') { districtRenderMap(); return; }

            // 실제 너비 확보 (탭이 숨겨졌다 열려도 올바르게)
            let w = cvs.offsetWidth  || cvs.parentElement?.offsetWidth  || 500;
            const h = cvs.offsetHeight || cvs.parentElement?.offsetHeight || 400;

            if(districtView.panX === 0) {
                districtView.panX = w / 2;
                districtView.panY = h / 2;
                // 활성 칸 있으면 자동으로 맞추기
                const allKeys = [...Object.keys(districtGrid.house), ...Object.keys(districtGrid.senate)];
                if(allKeys.length > 0) {
                    setTimeout(() => districtFitView(), 0);
                }
            }

            // 이벤트는 한 번만 바인딩
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
                            // 선택 해제 모드: 좌클릭 드래그로 이동만 가능
                            isMiddle = true;
                            lastX = e.offsetX; lastY = e.offsetY;
                            return;
                        }
                        const size = HEX_SIZE * districtView.zoom;
                        const [q, r] = districtPixelToAxial(e.offsetX, e.offsetY, size, districtView.panX, districtView.panY);
                        const key = `${q},${r}`;
                        if(districtMode === 'name') {
                            // 이름 모드: 클릭으로 칸 선택 (드래그 아님)
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
                            // 다른 의원실에 이미 있으면 추가 불가
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
                    // 호버 툴팁 (그리기/이동 중이 아닐 때)
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
                            if(mem.vacant) text += ` — 궐석`;
                            else text += ` — ${mem.name||'(이름 미지정)'} (${memParty?.name||'?'})`;
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
        // 성향 맵
        // ─────────────────────────────────────────
        let tendencyData   = {};   // { partyId: { "q,r": 0|25|50|75|100 } }
        let tendencyStrength = 50;

        // 성향 %에 따라 정당 색을 흰색↔원래 색 사이로 보간 — 100%면 원래 색 그대로, 낮을수록 점점 연해짐(밝아짐)
        function tendencyColorForPct(baseColor, pct) {
            const ratio = Math.max(0, Math.min(100, pct)) / 100;
            const hex = baseColor.replace('#', '');
            const r = parseInt(hex.substr(0,2), 16) || 0;
            const g = parseInt(hex.substr(2,2), 16) || 0;
            const b = parseInt(hex.substr(4,2), 16) || 0;
            const mix = c => Math.round(255 - (255 - c) * ratio);
            const toHex = c => c.toString(16).padStart(2, '0');
            return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
        }

        // 여러 정당이 최고 %로 동률(경합)일 때 그 색들을 겹친 대각 빗금 캔버스 패턴을 만듦
        function tendencyMakeStripePattern(ctx, colors) {
            const stripeW = 8;
            const size = stripeW * colors.length;
            const off = document.createElement('canvas');
            off.width = size; off.height = size;
            const octx = off.getContext('2d');
            colors.forEach((c, i) => { octx.fillStyle = c; octx.fillRect(i*stripeW, 0, stripeW, size); });
            const pattern = ctx.createPattern(off, 'repeat');
            if(pattern && pattern.setTransform) {
                try { pattern.setTransform(new DOMMatrix().rotate(-45)); } catch(e) {}
            }
            return pattern;
        }
        let tendencySvgChamber = 'house'; // 지도(SVG) 지역구의 성향을 편집 중인 원 — 원별로 성향 데이터가 다르므로 필요

        function tendencySetSvgChamber(ch) {
            tendencySvgChamber = ch;
            tendencyRenderMaps();
        }

        // 성향 탭에서 지도를 직접 클릭하는 것 외에, 이름으로 골라 선택 지역구를 바꿀 때 사용
        // 선택 상태(selectedDistrictKey)는 지역구 탭과 공유되므로, 여기서 선택해도 지역구 탭의
        // 노란색 선택 표시·편집 패널에 그대로 반영되고 그 반대도 마찬가지다
        function tendencySvgSelectDistrict(key) {
            selectedDistrictKey = key || null;
            tendencyRenderMaps();
        }

        function tendencySetStrength(v) {
            tendencyStrength = v;
            [0,25,50,75,100].forEach(s => {
                document.getElementById(`tendStrBtn${s}`)?.classList.toggle('active', s===v);
            });
        }

        function tendencyGetBounds() {
            const keys = tendencyAllKeys();
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
            // SVG 지도(뉴 지역구)의 키는 육각형 좌표("q,r")가 아니므로, 성향/육각형 렌더링에 섞이지 않도록 육각형 모드일 때만 포함
            if(districtMapMode === 'svg') return [];
            return [...new Set(['house','senate','third'].flatMap(c => Object.keys(districtGrid[c])))];
        }

        function tendencyDrawMap(cvs, partyId) {
            // partyId === '__all__' 이면 종합 지도
            const isAll = partyId === '__all__';
            const w = cvs.clientWidth || 260;
            const bounds = tendencyGetBounds();
            if(!bounds) { cvs.width=w; cvs.height=60; const c=cvs.getContext('2d'); c.fillStyle=tc('#333', '--m-text-3'); c.font='12px monospace'; c.fillText('지역구를 먼저 설정하세요',8,35); return; }

            const { minQ, maxQ, minR, maxR } = bounds;
            // flat-top: x방향은 q, y방향은 r
            const spanQ = maxQ - minQ + 1;
            const spanR = maxR - minR + 1;
            // flat-top 픽셀 범위 계산
            const sizeByW = w / (spanQ * 1.5 + 0.5);
            const sizeByH = (w * 1.2) / (spanR * Math.sqrt(3) + Math.sqrt(3)/2 + 1);
            const size = Math.min(sizeByW, sizeByH, 20);
            const totalH = Math.ceil(size * (spanR * Math.sqrt(3) + Math.sqrt(3)) + size * 2);
            cvs.width = w; cvs.height = Math.max(totalH, 60);

            // 중심 칸을 캔버스 중앙에 맞추기
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
                        ctx.fillStyle = tendencyColorForPct(bestParty.color, bestVal);
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
                        ctx.fillStyle = tc('#111', '--m-surface-3'); ctx.fill();
                        ctx.strokeStyle = tc('#222', '--m-border'); ctx.lineWidth=0.8; ctx.stroke();
                    }
                } else {
                    const val = tendencyData[partyId]?.[key] || 0;
                    const p = parties.find(x=>x.id===partyId);
                    if(p && val > 0) {
                        ctx.fillStyle = tendencyColorForPct(p.color, val);
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
                        ctx.fillStyle = tc('#111', '--m-surface-3'); ctx.fill();
                        ctx.strokeStyle = tc('#1a1d22', '--m-border'); ctx.lineWidth=0.8; ctx.stroke();
                    }
                }
                // 지역구 구분 테두리 오버레이 (하원=네온, 상원=골드, 삼원=보라)
                if(isHouse || isSenate || isThird) {
                    const innerCorners = districtHexCorners(cx, cy, size*0.82);
                    ctx.beginPath();
                    ctx.moveTo(...innerCorners[0]);
                    innerCorners.slice(1).forEach(c=>ctx.lineTo(...c));
                    ctx.closePath();
                    const flags = [isHouse, isSenate, isThird].filter(Boolean).length;
                    if(flags > 1) {
                        // 둘 이상 겹치면: 네온 실선 + 나머지는 점선으로 겹쳐 그림
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

        let tendencyView = 'all'; // 'all'=전체, 'overall'=종합만, 그 외에는 정당 id (해당 정당만)

        function tendencyRenderViewButtons() {
            const box = document.getElementById('tendencyViewButtons');
            if(!box) return;
            if(tendencyView !== 'all' && tendencyView !== 'overall' && !parties.some(p => p.id === tendencyView)) {
                tendencyView = 'all'; // 선택돼 있던 정당이 삭제된 경우 대비
            }
            box.innerHTML = '';
            const opts = [{ key:'all', label:'전체' }, { key:'overall', label:'종합' }, ...parties.map(p => ({ key: p.id, label: p.name }))];
            opts.forEach(o => {
                const btn = document.createElement('button');
                btn.textContent = o.label;
                btn.className = 'sub-tab-btn-3' + (tendencyView === o.key ? ' active' : '');
                btn.onclick = () => { tendencyView = o.key; tendencyRenderMaps(); };
                box.appendChild(btn);
            });
        }

        // 정당 하나의 성향 맵(캔버스+편집 이벤트)을 만들어 반환.
        // allCvs가 있으면 이 맵을 칠할 때 종합 맵도 같이 갱신한다 (전체 뷰에서만 필요).
        function tendencyBuildPartyWrap(p, allCvs) {
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

            // 이벤트: 클릭/드래그로 칠하기, 휠클릭드래그로 이동
            let painting = false, middleDrag = false, mx=0, my=0;
            // 각 지도 자체 오프셋 저장
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
                        if(allCvs) tendencyDrawMap(allCvs, '__all__');
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
                        if(allCvs) tendencyDrawMap(allCvs, '__all__');
                    }
                    return;
                }
                // 호버 툴팁
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
                            if(mem.vacant) text += ` — 궐석`;
                            else text += ` — ${mem.name||'(이름 미지정)'} (${memParty?.name||'?'})`;
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
            requestAnimationFrame(() => { tendencyDrawMap(cvs, p.id); });
            return wrap;
        }

        // 지도(뉴 지역구) 방식일 때 성향 탭에서 쓸 원(하원/상원/삼원) 탭 버튼 + 육각형 전용 UI 표시 여부를 갱신
        function tendencyUpdateSvgChamberTabs() {
            const isSvg = districtMapMode === 'svg';
            const strBtns = document.getElementById('tendencyStrengthButtons');
            const hexHint = document.getElementById('tendencyHexHint');
            const viewBtns = document.getElementById('tendencyViewButtons');
            const svgPanel = document.getElementById('tendencySvgDistrictPanel');
            const syncAllRow = document.getElementById('tendencySvgSyncAllRow');
            if(strBtns) strBtns.style.display = isSvg ? 'none' : '';
            if(hexHint) hexHint.style.display = isSvg ? 'none' : '';
            if(viewBtns) viewBtns.style.display = isSvg ? 'none' : '';
            if(svgPanel) svgPanel.style.display = isSvg ? '' : 'none';
            if(syncAllRow) syncAllRow.style.display = isSvg ? 'flex' : 'none';
            const box = document.getElementById('tendencySvgChamberTabs');
            if(!box) return;
            box.style.display = isSvg ? '' : 'none';
            if(!isSvg) return;
            const chambers = chamberList();
            if(!chambers.includes(tendencySvgChamber)) tendencySvgChamber = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('tendencySvgChamber'+c.charAt(0).toUpperCase()+c.slice(1)+'Btn');
                if(!btn) return;
                btn.style.display = chambers.includes(c) ? '' : 'none';
                btn.classList.toggle('active', c === tendencySvgChamber);
                btn.textContent = chamberDisplayName(c);
            });
        }

        // 여러 정당이 최고 %로 동률(경합)일 때 겹쳐 표시할 빗금 패턴의 고유 id
        function tendencySvgTiePatternId(colors) {
            return 'tendTie_' + colors.map(c => c.replace('#','')).join('_');
        }

        // 동률(경합) 빗금 <pattern>을 patternDefs Map에 등록(이미 있으면 재사용)하고 fill="url(#..)" 값을 반환
        function tendencyRegisterTiePattern(patternDefs, colors) {
            const id = tendencySvgTiePatternId(colors);
            if(!patternDefs.has(id)) {
                // patternUnits를 도형 자신의 경계상자 기준(objectBoundingBox)으로 잡아, 지도의 좌표 규모가
                // 크든 작든(예: viewBox "0 0 2000 1600") 줄무늬가 항상 도형 크기에 비례해 또렷하게 보이도록 함
                // (고정 픽셀 크기로 하면 좌표 규모가 큰 지도에서 줄무늬가 너무 가늘어져 회색으로 뭉개져 보임)
                const n = colors.length;
                const tile = 0.3; // 도형 경계상자 대비 패턴 한 칸의 비율 — 작을수록 줄무늬가 촘촘해짐
                const bandW = tile / n;
                const rects = colors.map((c,i) => `<rect x="${i*bandW}" y="0" width="${bandW}" height="${tile}" fill="${c}"/>`).join('');
                patternDefs.set(id, `<pattern id="${id}" width="${tile}" height="${tile}" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" patternTransform="rotate(-45)">${rects}</pattern>`);
            }
            return `url(#${id})`;
        }

        // 종합(전체) 맵의 도형별 채우기를 한 번에 계산 — 최고 %가 여러 정당에 걸쳐 동률(경합)이면
        // 그 정당들의 색을 겹친 빗금 패턴(<pattern>, defs로 등록)으로 표시
        function tendencySvgBuildOverallFill() {
            const patternDefs = new Map();
            const fillMap = {};
            const titleMap = {};
            (districtSvgMap?.shapes || []).forEach(s => {
                const key = s.key;
                const nm = districtNames.house[key] || key;
                const seats = districtSeatCounts[key]?.[tendencySvgChamber] || 0;
                if(seats <= 0) { fillMap[key] = '#141414'; titleMap[key] = `${nm} (이 원에 의석 없음)`; return; }
                let bestVal = -1, tied = [];
                parties.forEach(p => {
                    const val = districtSvgTendency[key]?.[tendencySvgChamber]?.[p.id] || 0;
                    if(val > bestVal) { bestVal = val; tied = [p]; }
                    else if(val === bestVal && val > 0) tied.push(p);
                });
                // 툴팁에는 값이 매겨진 모든 정당의 %를 높은 순으로 나열 (경합이면 몇 당이 동률인지도 표시)
                const breakdown = parties
                    .map(p => ({ p, val: districtSvgTendency[key]?.[tendencySvgChamber]?.[p.id] || 0 }))
                    .filter(e => e.val > 0)
                    .sort((a,b) => b.val - a.val)
                    .map(e => `${e.p.name} ${e.val}%`)
                    .join(' · ');
                if(tied.length === 0 || bestVal <= 0) { fillMap[key] = 'rgba(255,255,255,0.05)'; titleMap[key] = `${nm}: 성향 미지정`; return; }
                if(tied.length === 1) { fillMap[key] = tendencyColorForPct(tied[0].color, bestVal); titleMap[key] = `${nm}: ${breakdown}`; return; }
                const colors = tied.map(p => tendencyColorForPct(p.color, bestVal));
                fillMap[key] = tendencyRegisterTiePattern(patternDefs, colors);
                titleMap[key] = `${nm} (경합): ${breakdown}`;
            });
            return {
                getFill: key => fillMap[key] || 'rgba(255,255,255,0.05)',
                getTitle: key => titleMap[key] || (districtNames.house[key] || key),
                defs: Array.from(patternDefs.values()).join('')
            };
        }

        // 특정 정당 하나의 성향(%) 값만으로 도형별 채우기를 계산 — 종합 지도 밑에 정당별로 나열되는 보조 지도용
        function tendencySvgBuildPartyFill(p) {
            const fillMap = {};
            const titleMap = {};
            (districtSvgMap?.shapes || []).forEach(s => {
                const key = s.key;
                const nm = districtNames.house[key] || key;
                const seats = districtSeatCounts[key]?.[tendencySvgChamber] || 0;
                if(seats <= 0) { fillMap[key] = '#141414'; titleMap[key] = `${nm} (이 원에 의석 없음)`; return; }
                const val = districtSvgTendency[key]?.[tendencySvgChamber]?.[p.id] || 0;
                fillMap[key] = val > 0 ? tendencyColorForPct(p.color, val) : 'rgba(255,255,255,0.05)';
                titleMap[key] = `${nm}: ${p.name} ${val}%`;
            });
            return {
                getFill: key => fillMap[key] || 'rgba(255,255,255,0.05)',
                getTitle: key => titleMap[key] || (districtNames.house[key] || key),
            };
        }

        // 지역구 시스템이 지도(SVG)일 때의 성향 탭 렌더링 — 우측엔 (구 지역구 방식의 "전체" 보기와 같은 구성으로)
        // 맨 위에 종합 지도, 그 아래 정당별 지도를 나열하고(모두 클릭해서 지역구 선택 가능),
        // 좌측 패널에 선택된 지역구의 의석 수 + 정당별 성향(%)을 목록(정당명 + 입력칸)으로 편집 — 지지율 탭과 같은 방식
        function tendencySvgRenderMaps() {
            const container = document.getElementById('tendencyMaps');
            const panel = document.getElementById('tendencySvgDistrictPanel');
            if(!container) return;
            container.innerHTML = '';
            if(!districtSvgMap) {
                container.innerHTML = '<div style="text-align:center;color:#444;font-size:0.85rem;padding:30px 10px;">지역구 탭에서 지도를 먼저 업로드하세요</div>';
                if(panel) panel.innerHTML = '';
                return;
            }

            const onSelect = key => { selectedDistrictKey = key; tendencyRenderMaps(); };
            // 지도 바탕(지역구 아닌 곳)을 누르면 선택 해제
            const onDeselect = () => { if(selectedDistrictKey) clearSelectedDistrict(); };

            const overall = tendencySvgBuildOverallFill();
            const overallWrap = document.createElement('div');
            overallWrap.style.cssText = 'margin-bottom:12px;';
            overallWrap.innerHTML = `<div style="color:#888;font-size:0.8rem;margin-bottom:4px;letter-spacing:1px;">▌ 종합</div>`;
            const overallMapDiv = document.createElement('div');
            overallWrap.appendChild(overallMapDiv);
            container.appendChild(overallWrap);
            renderDistrictSvgInto(overallMapDiv, {
                clickable: true,
                getFill: overall.getFill,
                title: overall.getTitle,
                defs: overall.defs,
                selectedKey: selectedDistrictKey,
                onClickKey: onSelect,
                onClickBackground: onDeselect
            });

            const partyGroup = document.createElement('div');
            partyGroup.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';
            container.appendChild(partyGroup);
            parties.forEach(p => {
                const pf = tendencySvgBuildPartyFill(p);
                const pWrap = document.createElement('div');
                pWrap.style.cssText = 'margin-bottom:12px;';
                pWrap.innerHTML = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="width:10px;height:10px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                    <span style="color:#aaa;font-size:0.8rem;">${p.name}</span>
                </div>`;
                const pMapDiv = document.createElement('div');
                pWrap.appendChild(pMapDiv);
                partyGroup.appendChild(pWrap);
                renderDistrictSvgInto(pMapDiv, {
                    clickable: true,
                    hideAbbr: true,
                    getFill: pf.getFill,
                    title: pf.getTitle,
                    selectedKey: selectedDistrictKey,
                    onClickKey: onSelect,
                    onClickBackground: onDeselect
                });
            });

            if(!panel) return;
            const key = selectedDistrictKey;
            // 지도에서 직접 클릭하는 것 외에, 이름으로 바로 찾아 바꿀 수 있는 선택 목록 — 항상 표시
            const pickerHtml = `
                <select onchange="tendencySvgSelectDistrict(this.value)" style="width:100%;box-sizing:border-box;background:#000;border:1px solid #333;color:var(--tno-neon);font-family:inherit;font-size:0.85rem;padding:6px;margin-bottom:8px;">
                    <option value="">— 지역구 선택 —</option>
                    ${districtSvgMap.shapes.map(s => `<option value="${s.key}"${s.key===key?' selected':''}>${districtNames.house[s.key]||s.key}</option>`).join('')}
                </select>
            `;
            if(!key || !districtSvgMap.shapes.some(s => s.key === key)) {
                panel.innerHTML = pickerHtml + '<div style="color:#444;font-size:0.78rem;text-align:center;padding:14px;border:1px solid #222;background:#0a0c10;">위 지도를 클릭하거나, 위 목록에서 지역구를 선택하세요</div>';
                return;
            }
            const nm = districtNames.house[key] || key;
            const seats = districtSeatCounts[key]?.[tendencySvgChamber] || 0;
            const chLabel = {
                house:  document.getElementById('houseNameInput')?.value  || '하원',
                senate: document.getElementById('senateNameInput')?.value || '상원',
                third:  document.getElementById('thirdNameInput')?.value  || '삼원',
            };
            panel.innerHTML = pickerHtml + `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
                    <span style="color:#888;font-size:0.78rem;">선택한 지역구 <span style="color:var(--tno-neon);">${nm}</span></span>
                    <button onclick="clearSelectedDistrict()" style="background:transparent;border:1px solid #333;color:#888;padding:3px 8px;font-family:inherit;font-size:0.72rem;cursor:pointer;flex-shrink:0;">선택 해제</button>
                </div>
                ${seats <= 0 ? `<div style="color:#664444;font-size:0.75rem;margin-bottom:6px;">지역구 탭에서 ${chLabel[tendencySvgChamber]}의 의석 수가 0으로 지정되어 있습니다</div>` : ''}
                <div style="display:grid;grid-template-columns:1fr 75px;gap:6px;padding:0 2px;margin-bottom:4px;color:#555;font-size:0.8rem;">
                    <span>정당명</span><span style="text-align:center;">지지율(%)</span>
                </div>
                ${parties.map(p => `
                    <div style="display:grid;grid-template-columns:1fr 75px;gap:6px;margin-bottom:7px;align-items:center;">
                        <div style="display:flex;align-items:center;gap:6px;min-width:0;">
                            <span style="width:10px;height:10px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                            <span style="font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.name}">${p.name}</span>
                        </div>
                        <input type="number" min="0" max="100" value="${districtSvgTendency[key]?.[tendencySvgChamber]?.[p.id]||0}"
                            style="width:100%;box-sizing:border-box;background:#000;border:1px solid #333;color:var(--tno-neon);font-family:inherit;font-size:0.9rem;padding:6px 4px;text-align:center;"
                            onchange="districtSvgSetTendency('${key}','${tendencySvgChamber}','${p.id}',this.value); tendencyRenderMaps();">
                    </div>
                `).join('')}
            `;
        }

        function tendencyRenderMaps() {
            tendencyUpdateSvgChamberTabs();
            if(districtMapMode === 'svg') { tendencySvgRenderMaps(); return; }
            tendencyRenderViewButtons();
            const container = document.getElementById('tendencyMaps');
            if(!container) return;
            container.innerHTML = '';
            // 오프셋 캐시 초기화 (맵 크기가 바뀔 수 있으니)
            parties.forEach(p => { p._tendOffset = { x: null, y: null }; });

            if(tendencyView === 'overall') {
                // 종합 지도만
                const allWrap = document.createElement('div');
                allWrap.innerHTML = `<div style="color:#888;font-size:0.8rem;margin-bottom:4px;letter-spacing:1px;">▌ 종합</div>`;
                const allCvs = document.createElement('canvas');
                allCvs.style.cssText = 'width:100%;display:block;background:#0a0c10;border:1px solid #222;cursor:default;';
                allWrap.appendChild(allCvs);
                container.appendChild(allWrap);
                requestAnimationFrame(() => { tendencyDrawMap(allCvs, '__all__'); });
                return;
            }

            if(tendencyView !== 'all') {
                // 특정 정당 지도만
                const p = parties.find(x => x.id === tendencyView);
                if(p) {
                    container.appendChild(tendencyBuildPartyWrap(p, null));
                    return;
                }
                tendencyView = 'all'; // 대상 정당이 없으면 전체로 폴백
            }

            // 전체 뷰: 종합(전체 너비) + 당별 지도(2열 그리드)
            const allWrap = document.createElement('div');
            allWrap.style.cssText = 'margin-bottom:12px;';
            allWrap.innerHTML = `<div style="color:#888;font-size:0.8rem;margin-bottom:4px;letter-spacing:1px;">▌ 종합</div>`;
            const allCvs = document.createElement('canvas');
            allCvs.style.cssText = 'width:100%;display:block;background:#0a0c10;border:1px solid #222;cursor:default;';
            allWrap.appendChild(allCvs);
            container.appendChild(allWrap);

            const partyGroup = document.createElement('div');
            partyGroup.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';
            container.appendChild(partyGroup);

            parties.forEach(p => {
                partyGroup.appendChild(tendencyBuildPartyWrap(p, allCvs));
            });

            requestAnimationFrame(() => { tendencyDrawMap(allCvs, '__all__'); });
        }

        // ─────────────────────────────────────────
        // 선거 결과 view 전환
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
        // 선거 하위탭 전환
        // ─────────────────────────────────────────
        function elecSwitchSub(sub) {
            ['district','tendency','region','prob'].forEach(s => {
                document.getElementById(`elecSubTab${s.charAt(0).toUpperCase()+s.slice(1)}`)?.classList.toggle('active', s===sub);
                document.getElementById(`elecSub${s.charAt(0).toUpperCase()+s.slice(1)}`)?.classList.toggle('active', s===sub);
            });
            // districtNamePanel(선택한 지역구 편집 패널)은 sub-tab-content 밖에 있어 자동으로 숨겨지지
            // 않으므로, 지역구 탭이 아닐 때는 항상 직접 숨긴다 (성향/지지율 탭에 겹쳐 보이던 버그 수정)
            if(sub !== 'district') document.getElementById('districtNamePanel').style.display = 'none';
            if(sub === 'district') {
                document.getElementById('dispTabDistrict').style.display = '';
                switchDispTab('district');
                districtUpdateModeUI();
                setTimeout(() => { districtInitCanvas(); }, 80);
                renderDistrictListPanel();
                // 성향 탭에서 선택해 둔 지역구(selectedDistrictKey는 두 탭이 공유)가 있으면
                // 여기서도 그 편집 패널을 그대로 이어서 보여준다
                districtRenderNamePanel();
            }
            if(sub === 'tendency') {
                document.getElementById('dispTabTendency').style.display = '';
                switchDispTab('tendency');
                setTimeout(() => { tendencyRenderMaps(); }, 80);
            }
            if(sub === 'region') {
                document.getElementById('dispTabRegion').style.display = '';
                switchDispTab('region');
                setTimeout(() => { renderRegionTab(); }, 80);
            }
            if(sub === 'prob') {
                // 지지율 탭은 지역구/성향 지도와 무관하므로, 그 지도들이 우측 패널에 남아 보이던 상태였다면 다른 탭으로 전환
                const activeDispTab = document.querySelector('.disp-tab-btn.active')?.dataset.tab;
                if(activeDispTab === 'district' || activeDispTab === 'tendency' || activeDispTab === 'region') switchDispTab('house');
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
                const isExtSupport = !isGov && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                // 각외협력 정당은 (다른 연정 소속이더라도) 그 연정 카드가 아니라 각외협력 항목으로 별도 집계
                const effectiveCoal = (isExtSupport || (isPartyRuling && !(coal && coal.isRuling))) ? null : coal;
                let stroke = highlightGov&&isGov ? 'var(--tno-gold)' : (effectiveCoal?effectiveCoal.color:null);
                let strokeDashed = false;
                if(isExtSupport && rulingCoal) { stroke = highlightGov ? '#ffd700' : rulingCoal.color; strokeDashed = true; }

                // 파벌 의석 배분
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
                            map.push({color:fc, partyName:p.name, factionName:f.name, partyStatus:p.status||'active',
                                ideology:ideologyName(f.ideologyId)||ideologyName(p.ideologyId)||'?',
                                coalitionName:fEffCoal?.name, strokeColor:fStroke, isRuling:fIsGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
                        }
                        placed += f[seatKey]||0;
                    });
                    // 파벌 합계 < 당 의석이면 나머지는 당 색으로
                    for(let k=placed; k<cnt; k++){
                        if(map.length>=total) break;
                        map.push({color:p.color, partyName:p.name, factionName:null, partyStatus:p.status||'active',
                            ideology:ideologyName(p.ideologyId)||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
                    }
                } else {
                    for(let k=0;k<cnt;k++){
                        if(map.length>=total) break;
                        map.push({color:p.color, partyName:p.name, factionName:null, partyStatus:p.status||'active',
                            ideology:ideologyName(p.ideologyId)||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
                    }
                }
            });
            while(map.length<total) map.push({color:'#222',partyName:'Vacant',factionName:null,ideology:'-',strokeColor:'#333',isRuling:false,externalSupport:false});
            return map;
        }

        // ── 이름 반영 ───────────────────────────
        function elecUpdateLabels() {
            const hName = document.getElementById('houseNameInput')?.value || '하원';
            const sName = document.getElementById('senateNameInput')?.value || '상원';
            const tName = document.getElementById('thirdNameInput')?.value || '삼원';
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
            if(bl)   bl.textContent   = '전체';
            const probH = document.getElementById('innerTabElecProbHouse');
            const probS = document.getElementById('innerTabElecProbSenate');
            const probT = document.getElementById('innerTabElecProbThird');
            if(probH) probH.textContent = hName;
            if(probS) probS.textContent = sName;
            if(probT) probT.textContent = tName;
            const dcH = document.getElementById('districtChamberHouseLabel');
            const dcS = document.getElementById('districtChamberSenateLabel');
            const dcT = document.getElementById('districtChamberThirdLabel');
            if(dcH) dcH.textContent = hName;
            if(dcS) dcS.textContent = sName;
            if(dcT) dcT.textContent = tName;
            if(sw)   sw.style.display = isBi ? '' : 'none';
            if(tw)   tw.style.display = isTri ? '' : 'none';
            if(bw)   bw.style.display = isBi ? '' : 'none';
            // 단원제: 선거 대상 선택 그룹 자체를 숨김 (선택할 게 없으므로)
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

        // ── 정당 목록 렌더 ─────────────────────
        // 색상이 어두운지 판단 (HSP 밝기)
        function elecIsColorDark(hex) {
            const r = parseInt(hex.slice(1,3),16);
            const g = parseInt(hex.slice(3,5),16);
            const b = parseInt(hex.slice(5,7),16);
            const hsp = Math.sqrt(0.299*r*r + 0.587*g*g + 0.114*b*b);
            return hsp < 128;
        }

        // 통합 바 업데이트 — 존재하는 모든 원의 바 인스턴스를 전부 갱신한다
        // (지지율 탭의 설정용 바 + 선거 탭의 읽기전용 바가 동시에 DOM에 있을 수 있음)
        function elecUpdateAllBars() {
            chamberList().forEach(c => updateProbBar(c));
        }

        // 특정 원(chamber)의 지지율 바 세그먼트/오차/레이블을 갱신한다.
        // 같은 chamber를 가리키는 바 인스턴스가 여러 개 동시에 존재할 수 있어(설정용+읽기전용),
        // document 전역이 아니라 [data-chamber] 컨테이너 단위로 찾아 전부 갱신한다.
        function updateProbBar(chamber) {
            const store = elecStore[chamber] || {};
            const inKey = inKeyFor(chamber);
            // 활동 금지된 정당은 저장된 수치와 무관하게 실제 반영(막대·계산)에서는 0으로 취급
            const allEntries = [
                ...parties.filter(p => p[inKey]).map(p => ({ id: p.id, prob: p.status==='banned' ? 0 : Math.max(0, store[p.id]?.prob||0), color: p.color })),
                { id: '__swing__', prob: Math.max(0, store['__swing__']?.prob||0), color: null }
            ];
            const total = allEntries.reduce((s,e)=>s+e.prob,0) || 1;

            // 각 세그먼트 위치/너비 계산
            let cursor = 0;
            const segs = allEntries.map(e => {
                const pct = e.prob / total * 100;
                const pos = cursor;
                cursor += pct;
                return { ...e, pct, pos };
            });

            document.querySelectorAll(`.elec-prob-bar[data-chamber="${chamber}"]`).forEach(barEl => {
                segs.forEach(seg => {
                    const errRaw = Math.max(0, store[seg.id]?.err||0);
                    const errPct = errRaw / total * 100;

                    // 세그먼트 바
                    const el = barEl.querySelector(`.elec-seg[data-id="${seg.id}"]`);
                    if(el) { el.style.left = seg.pos + '%'; el.style.width = seg.pct + '%'; }

                    // 레이블 색상: 어두운 색이면 흰색, 밝으면 검정
                    const lbl = barEl.querySelector(`.elec-seg-lbl[data-id="${seg.id}"]`);
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

                    // 오차범위: 절반씩 양옆, 한쪽 공간 부족하면 반대편으로 넘김
                    const half       = errPct / 2;
                    const leftSpace  = seg.pos;                    // 왼쪽 가용 공간
                    const rightSpace = 100 - (seg.pos + seg.pct);  // 오른쪽 가용 공간

                    let errLeft  = Math.min(half, leftSpace);
                    let errRight = Math.min(half, rightSpace);
                    // 부족분 반대편으로
                    errLeft  = Math.min(errLeft  + Math.max(0, half - errRight), leftSpace);
                    errRight = Math.min(errRight + Math.max(0, half - Math.min(half, leftSpace)), rightSpace);

                    const elL = barEl.querySelector(`.elec-seg-err-l[data-id="${seg.id}"]`);
                    const elR = barEl.querySelector(`.elec-seg-err-r[data-id="${seg.id}"]`);

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
            });
        }

        // 특정 원의 "지지율 분포" 바 HTML — 지지율 탭의 설정용 바와 선거 탭의 읽기전용 바가 함께 사용
        function buildProbBarHtml(chamber, opts = {}) {
            const inKey = inKeyFor(chamber);
            const chamberParties = parties.filter(p => p[inKey]);

            let lblHtml = '';
            chamberParties.forEach(p => {
                lblHtml += `<div class="elec-seg-lbl" data-id="${p.id}"
                    style="position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;
                    font-size:0.7rem;font-weight:bold;overflow:hidden;white-space:nowrap;pointer-events:none;opacity:0;z-index:3;"></div>`;
            });
            lblHtml += `<div class="elec-seg-lbl" data-id="__swing__"
                style="position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;
                font-size:0.7rem;font-weight:bold;overflow:hidden;white-space:nowrap;pointer-events:none;opacity:0;z-index:3;"></div>`;

            let errHtml = '', segHtml = '';
            chamberParties.forEach(p => {
                const hatch = `repeating-linear-gradient(45deg,${p.color}99,${p.color}99 2.5px,transparent 2.5px,transparent 5px)`;
                errHtml += `
                    <div class="elec-seg-err-l" data-id="${p.id}" style="position:absolute;top:0;bottom:0;background:${hatch};pointer-events:none;z-index:2;"></div>
                    <div class="elec-seg-err-r" data-id="${p.id}" style="position:absolute;top:0;bottom:0;background:${hatch};pointer-events:none;z-index:2;"></div>`;
                segHtml += `<div class="elec-seg" data-id="${p.id}" style="position:absolute;top:0;bottom:0;background:${p.color};border-right:1px solid #101218;box-sizing:border-box;z-index:1;"></div>`;
            });
            // 무당파 (오차는 왼쪽으로만 — err-r은 숨김)
            const swHatch = `repeating-linear-gradient(45deg,#88888899,#88888899 2.5px,transparent 2.5px,transparent 5px)`;
            errHtml += `
                <div class="elec-seg-err-l" data-id="__swing__" style="position:absolute;top:0;bottom:0;background:${swHatch};pointer-events:none;z-index:2;"></div>
                <div class="elec-seg-err-r" data-id="__swing__" style="position:absolute;top:0;bottom:0;background:${swHatch};pointer-events:none;z-index:2;"></div>`;
            segHtml += `<div class="elec-seg" data-id="__swing__" style="position:absolute;top:0;bottom:0;background:repeating-linear-gradient(45deg,#333,#333 3px,#444 3px,#444 6px);border-right:1px solid #101218;z-index:1;"></div>`;

            const legend = chamberParties.map(p=>`<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;color:#aaa;">
                        <span style="width:8px;height:8px;background:${p.color};display:inline-block;flex-shrink:0;"></span>${p.name}</span>`).join('')
                + `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;color:#aaa;">
                        <span style="width:8px;height:8px;background:repeating-linear-gradient(45deg,#333,#333 2px,#444 2px,#444 4px);display:inline-block;flex-shrink:0;"></span>무당파</span>`;

            const titleHtml = opts.title ? `<div style="font-size:0.75rem;color:#555;margin-bottom:4px;letter-spacing:1px;">▌ ${opts.title}</div>` : '';

            return `
                <div class="elec-prob-bar" data-chamber="${chamber}" style="${opts.wrapStyle || 'margin-bottom:14px;'}">
                    ${titleHtml}
                    <div style="position:relative;height:22px;background:#111;border:1px solid #333;overflow:visible;">
                        ${errHtml}${segHtml}${lblHtml}
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;">
                        ${legend}
                    </div>
                </div>`;
        }

        // 선거 > 선거 탭에 표시되는 읽기전용 지지율 바 묶음 — 존재하는 원만, 하원→상원→삼원 순으로 표시
        function elecRenderProbBars() {
            const container = document.getElementById('elecProbBars');
            if(!container) return;
            const chamberNames = {
                house:  document.getElementById('houseNameInput')?.value  || '하원',
                senate: document.getElementById('senateNameInput')?.value || '상원',
                third:  document.getElementById('thirdNameInput')?.value  || '삼원'
            };
            container.innerHTML = chamberList()
                .map(c => buildProbBarHtml(c, { title: `${chamberNames[c]} 지지율 분포` }))
                .join('');
        }

        // "전체에 반영" (지지율 탭) — 켜져 있으면 한 원에서 값을 바꿀 때 그 정당이 속한 다른 원에도 그대로 반영
        let elecProbSyncAll = false;

        function elecPropagateProb(fromChamber, partyId, entry) {
            const party = partyId === '__swing__' ? null : parties.find(p=>String(p.id)===String(partyId));
            chamberList().forEach(c => {
                if(c === fromChamber) return;
                if(party && !party[inKeyFor(c)]) return; // 그 원에 없는 정당이면 건너뜀
                if(!elecStore[c]) elecStore[c] = {};
                elecStore[c][partyId] = { prob: entry.prob, err: entry.err };
            });
        }

        function elecSetProb(chamber, partyId, val) {
            const store = elecStore[chamber] || (elecStore[chamber] = {});
            if(!store[partyId]) store[partyId] = { prob:0, err:0 };
            store[partyId].prob = val;
            if(elecProbSyncAll) elecPropagateProb(chamber, partyId, store[partyId]);
            elecUpdateAllBars();
        }

        function elecSetErr(chamber, partyId, val) {
            const store = elecStore[chamber] || (elecStore[chamber] = {});
            if(!store[partyId]) store[partyId] = { prob:0, err:0 };
            store[partyId].err = val;
            if(elecProbSyncAll) elecPropagateProb(chamber, partyId, store[partyId]);
            elecUpdateAllBars();
        }

        // "전체에 반영" 체크박스 — 켜는 순간 현재 탭(원)의 값을 다른 모든 원에 즉시 동기화
        function onElecProbSyncAllChange(checked) {
            elecProbSyncAll = checked;
            if(checked) {
                const store = elecStore[elecProbChamber] || {};
                Object.keys(store).forEach(partyId => elecPropagateProb(elecProbChamber, partyId, store[partyId]));
                elecUpdateAllBars();
            }
        }

        // 현재 화면에 표시된 지지율 입력 DOM 값을 지금의 elecProbChamber 저장소로 흘려보냄
        // (탭을 바꾸기 "직전"에 호출해야 함 — elecProbChamber가 바뀐 뒤 호출하면 이전 탭 값이 새 탭 저장소를 덮어씀)
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

        // 지지율 입력 탭(하원/상원/삼원) 전환 — 의원실마다 정당 구성이 다를 수 있어 지지율을 독립적으로 관리
        function switchElecProbChamber(ch) {
            elecSyncCurrentProbDom(); // 이전 탭에서 입력 중이던 값을 먼저 그 탭의 저장소에 반영
            elecProbChamber = ch;
            elecRenderList();
        }

        // 원별 비례대표 방식(전국형/권역형, 병립~연동 절충 비율) 설정 UI
        function setElectionSystemField(chamber, field, val) {
            getElectionSystem(chamber)[field] = val;
            elecRenderList();
        }
        function renderElecSystemSettings() {
            const container = document.getElementById('elecSystemSettings');
            if(!container) return;
            const ch = elecProbChamber;
            const sys = getElectionSystem(ch);
            const chName = document.getElementById(ch==='senate'?'senateNameInput':ch==='third'?'thirdNameInput':'houseNameInput')?.value
                || ({house:'하원',senate:'상원',third:'삼원'}[ch]);
            const pctLabel = sys.compensationPct <= 0 ? '병립형' : sys.compensationPct >= 100 ? '완전연동형' : `준연동형 ${sys.compensationPct}%`;
            container.innerHTML = `
                <div style="margin-bottom:10px;padding:8px;background:#0a0c10;border:1px solid #2a2a2a;">
                    <div style="color:#666;font-size:0.8rem;margin-bottom:6px;">비례대표 방식 (${chName}) — <span style="color:var(--tno-neon);">${pctLabel}</span></div>
                    <div style="display:flex;gap:6px;margin-bottom:8px;">
                        <button class="sub-tab-btn-3 ${sys.listScope==='national'?'active':''}" onclick="setElectionSystemField('${ch}','listScope','national')" style="flex:1;">전국형</button>
                        <button class="sub-tab-btn-3 ${sys.listScope==='regional'?'active':''}" onclick="setElectionSystemField('${ch}','listScope','regional')" style="flex:1;">권역형</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span style="color:#888;font-size:0.85rem;">연동 비율(%)</span>
                        <input type="number" min="0" max="100" value="${sys.compensationPct}"
                            style="width:70px;background:#000;border:1px solid #333;color:var(--tno-neon);font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;"
                            onchange="setElectionSystemField('${ch}','compensationPct', Math.max(0,Math.min(100,parseFloat(this.value)||0)))">
                        <button style="background:transparent;border:1px solid #333;color:#888;padding:4px 8px;font-family:inherit;font-size:0.75rem;cursor:pointer;" onclick="setElectionSystemField('${ch}','compensationPct',0)">병립형(0%)</button>
                        <button style="background:transparent;border:1px solid #333;color:#888;padding:4px 8px;font-family:inherit;font-size:0.75rem;cursor:pointer;" onclick="setElectionSystemField('${ch}','compensationPct',100)">완전연동형(100%)</button>
                    </div>
                    <div style="font-size:0.72rem;color:#555;margin-top:6px;">0% = 병립형(지역구·비례 독립 배분) · 100% = 완전연동형(전체 의석을 득표율에 맞춤) · 그 사이는 준연동형처럼 절충${sys.listScope==='regional' ? ' · 권역형은 <b style="color:var(--tno-neon);">여론 &gt; 권역</b> 탭에서 권역을 먼저 설정하세요' : ''}</div>
                </div>
            `;
        }

        function elecRenderList() {
            elecUpdateLabels();
            elecToggleMode();
            elecUpdateDistrictInfo();

            // 탭 가시성/활성 상태 동기화 (존재하지 않는 의원실 탭은 숨김)
            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabElecProb'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) btn.style.display = chambers.includes(c) ? '' : 'none';
            });
            if(!chambers.includes(elecProbChamber)) elecProbChamber = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabElecProb'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===elecProbChamber);
            });

            renderElecSystemSettings();

            const container = document.getElementById('elecInputList');
            if(!container) return;
            const store = elecStore[elecProbChamber] || (elecStore[elecProbChamber] = {});
            const inKey = inKeyFor(elecProbChamber);

            // (DOM → store 동기화는 oninput으로 매 입력마다 즉시 반영되고, 탭 전환 시에는
            //  elecSyncCurrentProbDom()이 전환 "직전"에 처리하므로 여기서는 다시 읽지 않는다 —
            //  전환 직후 이 시점의 DOM은 아직 재빌드 전, 이전 탭의 값을 그대로 담고 있어 여기서 읽으면 잘못 덮어써진다.)
            if(!store['__swing__']) store['__swing__']={prob:0,err:0};

            container.innerHTML = '';

            // ── 통합 바 (설정 탭용 + 선거 탭 읽기전용 바 공통 렌더러) ──
            container.insertAdjacentHTML('beforeend', buildProbBarHtml(elecProbChamber, { title: '지지율 분포' }));
            elecRenderProbBars(); // 선거 탭의 읽기전용 바 묶음도 함께 최신화

            // ── 헤더 (정당명/지지율/오차) — 지지율 분포 바로 아래, 입력 행 바로 위 ──
            const headerRow = document.createElement('div');
            headerRow.style.cssText = 'display:grid;grid-template-columns:1fr 75px 60px;gap:6px;padding:0 2px;margin-bottom:4px;color:#555;font-size:0.8rem;';
            headerRow.innerHTML = `<span>정당명</span><span style="text-align:center;">지지율(%)</span><span style="text-align:center;">오차(±%)</span>`;
            container.appendChild(headerRow);

            // ── 정당 행 (무소속 제외, 현재 탭 의원실에 참여하는 정당만) ──────────────
            const regularParties = parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID && p[inKey]);
            const indPartyForElec = parties.find(p => p.ideologyId === IND_IDEOLOGY_ID && p[inKey]);
            const ch = elecProbChamber;
            regularParties.forEach(p => {
                const st = store[p.id]||{prob:0,err:0};
                const banned = p.status === 'banned';
                const dim = banned ? 'opacity:0.45;' : '';
                const row = document.createElement('div');
                row.style.cssText = `display:grid;grid-template-columns:1fr 75px 60px;gap:6px;margin-bottom:7px;align-items:center;`;
                row.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;min-width:0;">
                        <span style="width:10px;height:10px;background:${p.color};border-radius:50%;flex-shrink:0;border:1px solid #444;${dim}"></span>
                        <span style="font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${dim}" title="${p.name}">${p.name}</span>
                        ${banned ? `<span class="party-status-badge status-banned" style="flex-shrink:0;">활동 금지</span>` : ''}
                    </div>
                    <input type="number" class="elec-prob" data-id="${p.id}" value="${st.prob}"
                        min="0" max="100" placeholder="0" ${banned?'disabled title="활동 금지된 정당은 지지율이 반영되지 않습니다"':''}
                        style="background:#000;border:1px solid var(--tno-border);color:var(--tno-neon);font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;${dim}"
                        oninput="elecSetProb('${ch}','${p.id}', parseFloat(this.value)||0)">
                    <input type="number" class="elec-err" data-id="${p.id}" value="${st.err}"
                        min="0" max="50" placeholder="0" ${banned?'disabled':''}
                        style="background:#000;border:1px solid #444;color:#888;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;${dim}"
                        oninput="elecSetErr('${ch}','${p.id}', parseFloat(this.value)||0)">
                `;
                container.appendChild(row);
            });

            // ── 구분선 (무소속 위) + 무소속 행 (색상 고정 회색) ──
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
                        oninput="elecSetProb('${ch}','${p.id}', parseFloat(this.value)||0)">
                    <input type="number" class="elec-err" data-id="${p.id}" value="${st.err}"
                        min="0" max="50" placeholder="0"
                        style="background:#000;border:1px solid #444;color:#888;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                        oninput="elecSetErr('${ch}','${p.id}', parseFloat(this.value)||0)">
                `;
                container.appendChild(row);
            }

            // ── 무당파 행 (구분선 없이 무소속 바로 아래) ──
            const sw = store['__swing__'];
            const swRow = document.createElement('div');
            swRow.style.cssText = 'display:grid;grid-template-columns:1fr 75px 60px;gap:6px;margin-bottom:7px;align-items:center;';
            swRow.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;background:repeating-linear-gradient(45deg,#555,#555 2px,#333 2px,#333 4px);border-radius:50%;flex-shrink:0;border:1px solid #666;"></span>
                    <span style="font-size:0.85rem;color:#aaa;">무당파</span>
                </div>
                <input type="number" class="elec-prob" data-id="__swing__" value="${sw.prob}"
                    min="0" max="100" placeholder="0"
                    style="background:#000;border:1px solid #555;color:#aaa;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                    oninput="elecSetProb('${ch}','__swing__', parseFloat(this.value)||0)">
                <input type="number" class="elec-err" data-id="__swing__" value="${sw.err}"
                    min="0" max="50" placeholder="0"
                    style="background:#000;border:1px solid #444;color:#555;font-family:inherit;font-size:0.9rem;padding:4px;text-align:center;width:100%;box-sizing:border-box;"
                    oninput="elecSetErr('${ch}','__swing__', parseFloat(this.value)||0)">
            `;
            container.appendChild(swRow);

            elecUpdateAllBars();
        }

        // ── 개표 일시정지 / 재개 ───────────────
        function elecTogglePause() {
            elecPaused = !elecPaused;
            const btn = document.getElementById('elecPauseBtn');
            if(btn) btn.textContent = elecPaused ? '▶ 재개' : '⏸ 일시정지';
        }

        // ── 즉시 완료 ──────────────────────────
        function elecFinishNow() {
            elecSkipToEnd = true;
            elecPaused = false;
        }

        // ── 의회 반영 ──────────────────────────
        // 보궐선거: 궐석 지역구만 대상으로 즉시 재선거 (애니메이션 없이 즉시 반영)
        async function elecRunByElection(chamber, vacantKeys, chamberName) {
            const allResults = elecSimulateDistricts(chamber); // 현재 활성 지역구 전체에 대한 결과
            const relevantResults = allResults.filter(r => vacantKeys.includes(r.key));
            const seatKey = seatKeyFor(chamber);
            const summary = [];
            relevantResults.forEach(({key, partyId}) => {
                const party = parties.find(p=>String(p.id)===String(partyId));
                if(party) party[seatKey] = (party[seatKey]||0) + 1;
                districtMembers[chamber][key] = { name:'', partyId, factionId:null, vacant:false };
                summary.push(`${districtNames[chamber][key]||key} : ${party?.name||'?'}`);
            });
            simulate(); refreshUI();
            switchDispTab(chamber);
            showCustomAlert(`보궐선거 결과 (${chamberName})\n\n${summary.join('\n')}\n\n의회>의원 탭에서 당선자 이름을 입력해 주세요.`);
        }

        function elecApplyToParliament() {
            // 여러 의원실을 한 번에 개표했을 경우 대기 중인 모든 의원실 결과를 순서대로 반영
            // (마지막 의원실 결과만 elecLastResult에 남아 있어, 예전에는 그 의원실만 반영되고
            // 나머지 의원실은 지역구 당선자 정보가 비어 있는 채로 남는 문제가 있었음)
            const pending = Object.keys(elecLastResults);
            if(pending.length === 0) { if(elecLastResult) pending.push(elecLastResult.chamber || (elecLastResult.isSenate?'senate':'house')); else return; }

            let hadFactions = false;
            let lastCh = null;
            pending.forEach(ch => {
                const result = elecLastResults[ch] || elecLastResult;
                if(!result) return;
                const { seatMap, districtResults } = result;
                const seatKey = seatKeyFor(ch);
                parties.forEach(p => {
                    const s = seatMap.find(x=>x.id===p.id);
                    p[seatKey] = s?.n||0;
                    // 파벌 의석은 선거 이전 분포이므로 무효화 (재분배 필요)
                    if((p.factions||[]).length > 0) {
                        hadFactions = true;
                        p.factions.forEach(f => { f[seatKey] = 0; });
                    }
                });
                // 지역구 당선자 개별 정보 생성 (이름은 비워둠 — 의회>의원 탭에서 입력)
                if(Array.isArray(districtResults) && districtResults.length > 0) {
                    districtResults.forEach(({key, partyId}) => {
                        districtMembers[ch][key] = { name: '', partyId, factionId: null, vacant: false };
                    });
                }
                lastCh = ch;
            });
            elecLastResults = {};
            // 총선 반영으로 의회가 새로 구성되므로, 선포돼 있던 의회 해산은 여기서만 해제된다.
            // 해산권이 원별로 분할돼 있으면, 이번에 반영된 원(pending)의 해산만 해제된다
            // 한 원만 해산한 경우엔 그 원의 선거가 반영될 때만 해제
            const dissolvedLabel = emergencyPowerLabel('dissolution');
            const scopeNow = dissolutionScope();
            const wasDissolved = emergencyPowers.dissolution.active && (scopeNow === 'all' || pending.includes(scopeNow));
            if(wasDissolved) emergencyPowers.dissolution.active = false;
            const releasedSenate = emergencyPowers.dissolutionSenate.active && pending.includes('senate');
            if(releasedSenate) emergencyPowers.dissolutionSenate.active = false;
            const releasedHouse = emergencyPowers.dissolutionHouse.active && pending.includes('house');
            if(releasedHouse) emergencyPowers.dissolutionHouse.active = false;
            if(wasDissolved || releasedSenate || releasedHouse) renderEmergencyPowers();
            simulate(); refreshUI();
            if(lastCh) switchDispTab(lastCh);
            if(hadFactions) {
                showCustomAlert('선거 결과가 반영되었습니다.\n\n파벌이 있는 정당의 파벌별 의석은 선거 전 분포가 무효화되어 0으로 초기화되었습니다.\n정당 탭에서 파벌 의석을 다시 배분해 주세요.');
            }
            if(wasDissolved) {
                showCustomAlert(`새 총선이 반영되어 ${dissolvedLabel} 상태가 해제되었습니다.`);
            } else if(releasedSenate && releasedHouse) {
                showCustomAlert('새 총선이 반영되어 상원·하원 해산 상태가 모두 해제되었습니다.');
            } else if(releasedSenate) {
                showCustomAlert('새 총선이 반영되어 상원 해산 상태가 해제되었습니다.');
            } else if(releasedHouse) {
                showCustomAlert('새 총선이 반영되어 하원 해산 상태가 해제되었습니다.');
            }
        }

        // ── 재개표 ────────────────────────────
        function elecRerun() {
            if(!elecLastResult) return;
            elecRun(true);
        }

        // ── 선거 기록 저장 ────────────────────
        function elecSaveRecord(title, year, chamber, seatMap, weightedResult, districtResults) {
            const hName = document.getElementById('houseNameInput')?.value||'하원';
            const sName = document.getElementById('senateNameInput')?.value||'상원';
            const tName = document.getElementById('thirdNameInput')?.value||'삼원';
            const chamberDisplayName = chamber==='senate'?sName:chamber==='third'?tName:hName;
            // 실제 개표에 쓰인 가중치 총합 대비 각 정당의 비중 = 그 선거의 실제 득표율(추정치가 아닌 결과 그 자체)
            const wTotal = (weightedResult||[]).reduce((s,x)=>s+(x.w||0),0);
            const record = {
                id: 'er'+Date.now(),
                title: title || '무제 선거',
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
                container.innerHTML = '<div style="color:#333;text-align:center;padding:16px;border:1px dashed #222;font-size:0.85rem;">저장된 선거 기록이 없습니다</div>';
                return;
            }
            container.innerHTML = '';
            elecRecords.forEach(r => {
                const div = document.createElement('div');
                div.style.cssText = 'background:#080b10;border:1px solid #2a2a2a;border-left:4px solid var(--tno-neon);padding:10px;margin-bottom:8px;';
                const partySummary = r.parties.filter(p=>p.seats>0)
                    .sort((a,b)=>b.seats-a.seats)
                    .map(p=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:6px;font-size:0.8rem;color:#aaa;"><span style="width:8px;height:8px;background:${p.color};border-radius:50%;display:inline-block;"></span>${p.name} ${p.seats}석</span>`)
                    .join('');
                const detailRows = r.parties.filter(p=>p.seats>0 || p.prob>0)
                    .sort((a,b)=>b.seats-a.seats)
                    .map(p=>`<div class="bill-history-entry">${p.name} — 의석 ${p.seats}석 · 득표율 ${(p.prob*100).toFixed(1)}%</div>`)
                    .join('') || '<div style="color:#444;">정당별 세부 데이터 없음</div>';
                div.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span style="color:var(--tno-gold);font-size:1rem;">${r.title}</span>
                        <span style="color:#555;font-size:0.85rem;">${r.year} · ${r.chamber}</span>
                    </div>
                    <div style="margin-bottom:4px;">${partySummary}</div>
                    <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                        <span class="elec-record-toggle" onclick="toggleElecRecordDetail('${r.id}')">▾ 세부 기록 (총 ${r.totalSeats}석)</span>
                    </div>
                    <div class="elec-record-detail" id="elecRecordDetail-${r.id}">${detailRows}</div>
                    <div style="display:flex;gap:6px;">
                        <button onclick="elecLoadRecord('${r.id}')" style="flex:1;background:transparent;border:1px solid var(--tno-neon);color:var(--tno-neon);padding:5px;font-family:inherit;font-size:0.85rem;cursor:pointer;">↻ 의회 반영</button>
                        <button onclick="elecViewRecord('${r.id}')" style="flex:1;background:transparent;border:1px solid #888;color:#aaa;padding:5px;font-family:inherit;font-size:0.85rem;cursor:pointer;">👁 보기</button>
                        <button onclick="elecDeleteRecord('${r.id}')" style="background:transparent;border:1px solid #333;color:#555;padding:5px 10px;font-family:inherit;font-size:0.85rem;cursor:pointer;">삭제</button>
                    </div>`;
                container.appendChild(div);
            });
        }

        function elecViewRecord(id) {
            const r = elecRecords.find(x=>x.id===id);
            if(!r) return;
            // 임시로 해당 기록의 의석을 map으로 빌드해서 통계만 표시
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
                    map.push({color:p.color, partyName:p.name, ideology:ideologyName(p.ideologyId)||'?', coalitionName:effectiveCoal?.name, strokeColor:stroke, isRuling:isGov});
                }
            });
            while(map.length < total) map.push({color:'#222', partyName:'Vacant', ideology:'-', strokeColor:'#333', isRuling:false});

            // 선거 결과 패널로 전환 (해당 의원실 전용 탭)
            const chType = r.chamberType || (r.isSenate ? 'senate' : 'house');
            const suf = chType.charAt(0).toUpperCase() + chType.slice(1);
            const tabName = 'elecResult' + suf;
            document.getElementById('dispTabElecResult'+suf).style.display = '';
            document.getElementById('dispTabElecResult'+suf).querySelector('.disp-tab-label').textContent = `${r.chamber} 선거결과`;
            switchDispTab(tabName);
            document.getElementById('elecResultTitle'+suf).innerText = `> ${r.title} (${r.year}) — ${r.chamber}`;
            document.getElementById('elecResultBar'+suf).style.width = '100%';
            elecSetView(r.districtResults?.length > 0 ? 'district' : 'arc', chType);

            // 캔버스 그리기
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

        // ── 메인 개표 함수 ────────────────────
        // ─────────────────────────────────────────
        // 선거 방식 전환
        // ─────────────────────────────────────────
        // 선거 방식: 비례/지역구 체크박스 조합 -> 'proportional'|'district'(지역구만)|'mixed'(둘다)
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

        // 선거 대상 체크박스 (다중 선택)
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
                if(wrap && wrap.style.display === 'none') return; // 존재하지 않는 의원실은 건너뜀
                el.checked = checked;
            });
            elecUpdateDistrictInfo();
        }

        // 지역구 개표 방식 — 'auto': 기존처럼 순서를 섞어 자동으로 하나씩 애니메이션, 'manual': 지도(SVG)에서 사용자가 직접 지역구를 클릭해 개표
        let elecCountMode = 'auto';
        function setElecCountMode(mode) {
            if(mode !== 'auto' && mode !== 'manual') return;
            elecCountMode = mode;
            document.getElementById('elecCountModeAutoBtn')?.classList.toggle('active', mode === 'auto');
            document.getElementById('elecCountModeManualBtn')?.classList.toggle('active', mode === 'manual');
            const hint = document.getElementById('elecCountModeHint');
            if(hint) hint.style.display = mode === 'manual' ? '' : 'none';
        }

        function elecUpdateDistrictInfo() {
            const countRow = document.getElementById('elecCountModeRow');
            if(countRow) countRow.style.display = districtMapMode === 'svg' ? 'flex' : 'none';
            if(districtMapMode !== 'svg' && elecCountMode === 'manual') setElecCountMode('auto');
            const targets = getElecTargets();
            const hName = document.getElementById('houseNameInput')?.value || '하원';
            const sName = document.getElementById('senateNameInput')?.value || '상원';
            const tName = document.getElementById('thirdNameInput')?.value || '삼원';
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
                const dist  = districtActiveSeatCount(ch);
                const distSeats = Math.min(dist, total);
                const propSeats = Math.max(0, total - distSeats);
                el.innerHTML = `<span style="color:${chColors[ch]}">${chNames[ch]}</span> 지역구 <b>${distSeats}</b>석 + 비례 <b>${propSeats}</b>석`;
                el.style.display = '';
            });
        }

        // ─────────────────────────────────────────
        // 비례대표 의석 배분 — 병립형(0%)~완전연동형(100%) 절충 × 전국형/권역형
        // ─────────────────────────────────────────
        // weights의 가중치 비례로 total석을 정수 배분(최대 잔여분 방식) — 합이 정확히 total이 되도록 보정
        function largestRemainderAlloc(weights, total) {
            const result = {};
            weights.forEach(w => { result[w.id] = 0; });
            const wTotal = weights.reduce((s,x)=>s+x.w,0);
            if(total <= 0 || wTotal <= 0) return result;
            const entries = weights.map(x => {
                const exact = (x.w/wTotal)*total;
                return { id:x.id, floor: Math.floor(exact), rem: exact - Math.floor(exact) };
            });
            entries.forEach(e => { result[e.id] = e.floor; });
            let alloc = entries.reduce((s,e)=>s+e.floor,0);
            const sorted = [...entries].sort((a,b)=>b.rem-a.rem);
            for(let i=0; alloc<total; i++, alloc++) result[sorted[i%sorted.length].id]++;
            return result;
        }

        // 병립형(propSeatsPool을 득표율대로만 배분)과 완전연동형(전체 의석 목표치에서 지역구 당선분을 뺀 만큼 배분)을
        // compensationPct(0~100)로 절충해, propSeatsPool 정수 의석으로 정확히 맞춰 반환 — { partyId: n }
        function computeListSeats(weights, districtWins, propSeatsPool, totalPoolForTarget, compensationPct) {
            const result = {};
            weights.forEach(w => { result[w.id] = 0; });
            if(propSeatsPool <= 0) return result;
            const parallelMap = largestRemainderAlloc(weights, propSeatsPool);
            const targetMap = largestRemainderAlloc(weights, totalPoolForTarget);
            const pct = Math.max(0, Math.min(100, compensationPct ?? 100)) / 100;
            const blended = weights.map(({id}) => {
                const compensatory = Math.max(0, (targetMap[id]||0) - (districtWins[id]||0));
                const exact = (parallelMap[id]||0) + (compensatory - (parallelMap[id]||0)) * pct;
                return { id, floor: Math.max(0, Math.floor(exact)), rem: exact - Math.floor(exact) };
            });
            blended.forEach(b => { result[b.id] = b.floor; });
            const sum = blended.reduce((s,b)=>s+b.floor,0);
            const diff = propSeatsPool - sum;
            if(diff > 0) {
                const order = [...blended].sort((a,b)=>b.rem-a.rem);
                for(let i=0; i<diff; i++) result[order[i%order.length].id]++;
            } else if(diff < 0) {
                const order = [...blended].sort((a,b)=>a.rem-b.rem);
                let need = -diff, idx = 0, guard = 0;
                while(need > 0 && guard < order.length*4 && order.length > 0) {
                    const id = order[idx % order.length].id;
                    if(result[id] > 0) { result[id]--; need--; }
                    idx++; guard++;
                }
            }
            return result;
        }

        // 해당 원의 특정 권역에 배정된 (실제로 존재하는) 지역구 키 목록
        function regionDistrictKeysOf(chamber, regionId) {
            const map = districtRegionMap[chamber] || {};
            return Object.keys(districtGrid[chamber]||{}).filter(k => districtGrid[chamber][k] && map[k] === regionId);
        }

        // 어느 권역에도 배정되지 않은 활성 지역구 키 목록
        function regionUnassignedDistrictKeys(chamber) {
            const map = districtRegionMap[chamber] || {};
            const validIds = new Set((regions[chamber]||[]).map(r=>r.id));
            return Object.keys(districtGrid[chamber]||{}).filter(k => districtGrid[chamber][k] && (!map[k] || !validIds.has(map[k])));
        }

        // 권역 자동 집계 득표(가중치) — 권역에 속한 지역구들의 성향(%) 평균
        function regionAutoVoteWeights(chamber, districtKeys) {
            if(districtKeys.length === 0) return parties.map(p => ({ id:p.id, w:0 }));
            return parties.map(p => {
                if(p.status === 'banned') return { id:p.id, w:0 };
                let sum = 0;
                districtKeys.forEach(k => {
                    sum += districtMapMode === 'svg' ? (districtSvgTendency[k]?.[chamber]?.[p.id]||0) : (tendencyData[p.id]?.[k]||0);
                });
                return { id:p.id, w: sum / districtKeys.length };
            });
        }
        function regionManualVoteWeights(chamber, regionId) {
            const store = (regionVoteStore[chamber]||{})[regionId] || {};
            return parties.map(p => ({ id:p.id, w: p.status==='banned' ? 0 : Math.max(0, store[p.id]?.prob||0) }));
        }
        function getRegionVoteWeights(chamber, regionId, districtKeys) {
            return (regionVoteMode[chamber]==='manual') ? regionManualVoteWeights(chamber, regionId) : regionAutoVoteWeights(chamber, districtKeys);
        }

        // 정당별 "비례 의석" 배분 — 전국형(national)/권역형(regional) × 병립~연동 절충을 모두 처리
        function allocateListSeats(chamber, weighted, districtResults, propSeats, totalSeats) {
            const sys = getElectionSystem(chamber);
            const districtWins = {};
            districtResults.forEach(({partyId}) => { districtWins[partyId] = (districtWins[partyId]||0) + 1; });

            if(sys.listScope !== 'regional') {
                return computeListSeats(weighted, districtWins, propSeats, totalSeats, sys.compensationPct);
            }

            const groups = (regions[chamber]||[]).map(r => ({ id:r.id, keys: regionDistrictKeysOf(chamber, r.id) }));
            const unassignedKeys = regionUnassignedDistrictKeys(chamber);
            if(unassignedKeys.length > 0) groups.push({ id:'__unassigned__', keys: unassignedKeys });
            if(groups.length === 0) return computeListSeats(weighted, districtWins, propSeats, totalSeats, sys.compensationPct);

            // 권역별 비례 의석 수(propSeats)는 그 권역의 지역구 수 비중으로 배분 — 지역구가 없는 신설 권역은 0석
            const groupWeights = groups.map(g => ({ id:g.id, w: g.keys.length }));
            const groupSeatMap = largestRemainderAlloc(groupWeights, propSeats);

            const result = {};
            weighted.forEach(w => { result[w.id] = 0; });
            groups.forEach(g => {
                const gPropSeats = groupSeatMap[g.id] || 0;
                const gDistrictWins = {};
                districtResults.filter(d => g.keys.includes(d.key)).forEach(({partyId}) => { gDistrictWins[partyId] = (gDistrictWins[partyId]||0)+1; });
                const gWeights = g.id === '__unassigned__' ? regionAutoVoteWeights(chamber, g.keys) : getRegionVoteWeights(chamber, g.id, g.keys);
                const gList = computeListSeats(gWeights, gDistrictWins, gPropSeats, g.keys.length + gPropSeats, sys.compensationPct);
                Object.keys(gList).forEach(id => { result[id] = (result[id]||0) + gList[id]; });
            });
            return result;
        }

        // 권역형일 때, 국가 단위 지지율(elecStore) 대신 권역별 득표 데이터가 하나라도 있는지 검사 —
        // 전국형과 달리 개표 진행 가능 여부를 이 데이터로 판단해야 함
        function regionScopeHasVoteData(chamber) {
            const groups = (regions[chamber]||[]).map(r => ({ id:r.id, keys: regionDistrictKeysOf(chamber, r.id) }));
            const unassignedKeys = regionUnassignedDistrictKeys(chamber);
            if(unassignedKeys.length > 0) groups.push({ id:'__unassigned__', keys: unassignedKeys });
            if(groups.length === 0) return false;
            return groups.some(g => {
                const w = g.id === '__unassigned__' ? regionAutoVoteWeights(chamber, g.keys) : getRegionVoteWeights(chamber, g.id, g.keys);
                return w.reduce((s,x)=>s+x.w,0) > 0;
            });
        }

        // ─────────────────────────────────────────
        // 권역(region) 배정 UI — 여론 > 권역 탭: 지역구를 클릭해 권역으로 묶고, 권역별 득표율(자동/수동)을 관리
        // ─────────────────────────────────────────
        function regionSetChamber(ch) {
            regionPaintChamber = ch;
            renderRegionTab();
        }

        function regionAddRegion() {
            const ch = regionPaintChamber;
            if(!regions[ch]) regions[ch] = [];
            const palette = ['#00ffff','#ff00ff','#ffcc00','#66ff66','#ff6666','#6699ff','#ff9933','#cc66ff'];
            const color = palette[regions[ch].length % palette.length];
            const r = { id: 'rg_'+Date.now()+'_'+Math.floor(Math.random()*1000), name: `권역${regions[ch].length+1}`, color };
            regions[ch].push(r);
            regionActiveId = r.id;
            renderRegionTab();
        }

        function regionRemoveRegion(ch, id) {
            regions[ch] = (regions[ch]||[]).filter(r => r.id !== id);
            Object.keys(districtRegionMap[ch]||{}).forEach(k => { if(districtRegionMap[ch][k] === id) delete districtRegionMap[ch][k]; });
            if(regionVoteStore[ch]) delete regionVoteStore[ch][id];
            if(regionActiveId === id) regionActiveId = (regions[ch][0]||{}).id || null;
            renderRegionTab();
        }

        function regionUpdateField(ch, id, field, val) {
            const r = (regions[ch]||[]).find(x => x.id === id);
            if(r) r[field] = val;
            renderRegionTab();
        }

        function regionSetActiveId(id) {
            regionActiveId = id;
            renderRegionTab();
        }

        function regionSetVoteMode(mode) {
            regionVoteMode[regionPaintChamber] = mode;
            renderRegionTab();
        }

        // 지도/그리드에서 지역구를 클릭했을 때: 이미 선택된(칠하기) 권역에 속해 있으면 해제, 아니면 배정
        function regionAssignDistrict(chamber, key) {
            if(!regionActiveId) return;
            if(!districtRegionMap[chamber]) districtRegionMap[chamber] = {};
            if(districtRegionMap[chamber][key] === regionActiveId) delete districtRegionMap[chamber][key];
            else districtRegionMap[chamber][key] = regionActiveId;
        }

        function renderRegionTab() {
            const chambers = chamberList();
            ['house','senate','third'].forEach(c => {
                const btn = document.getElementById('innerTabRegion'+c.charAt(0).toUpperCase()+c.slice(1));
                if(btn) { btn.style.display = chambers.includes(c) ? '' : 'none'; btn.textContent = chamberDisplayName(c); }
            });
            if(!chambers.includes(regionPaintChamber)) regionPaintChamber = chambers[0] || 'house';
            ['house','senate','third'].forEach(c => {
                document.getElementById('innerTabRegion'+c.charAt(0).toUpperCase()+c.slice(1))?.classList.toggle('active', c===regionPaintChamber);
            });
            const ch = regionPaintChamber;
            if(!regions[ch]) regions[ch] = [];
            if(regionActiveId && !regions[ch].some(r => r.id === regionActiveId)) regionActiveId = null;
            if(!regionActiveId && regions[ch].length > 0) regionActiveId = regions[ch][0].id;

            document.getElementById('regionVoteModeAutoBtn')?.classList.toggle('active', regionVoteMode[ch] !== 'manual');
            document.getElementById('regionVoteModeManualBtn')?.classList.toggle('active', regionVoteMode[ch] === 'manual');

            renderRegionList();
            renderRegionManualVotePanel();
            renderRegionMap();
        }

        function renderRegionList() {
            const ch = regionPaintChamber;
            const container = document.getElementById('regionList');
            if(!container) return;
            const list = regions[ch] || [];
            if(list.length === 0) {
                container.innerHTML = '<div style="color:#444;font-size:0.8rem;padding:10px;text-align:center;border:1px solid #222;background:#0a0c10;">아직 권역이 없습니다. 아래 [+] 버튼으로 추가하세요.</div>';
                return;
            }
            container.innerHTML = list.map(r => {
                const count = Object.values(districtRegionMap[ch]||{}).filter(v => v === r.id).length;
                const active = r.id === regionActiveId;
                return `
                <div class="card-item${active ? ' region-active' : ''}" style="--region-color:${r.color};border-left-color:${r.color};display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px 8px;cursor:pointer;" onclick="regionSetActiveId('${r.id}')" title="${active ? '지금 이 권역으로 칠하는 중' : '눌러서 이 권역으로 칠하기'}">
                    <input type="color" value="${r.color}" onclick="event.stopPropagation()" onchange="regionUpdateField('${ch}','${r.id}','color',this.value)" style="width:28px;height:28px;padding:0;border:1px solid #333;background:none;cursor:pointer;flex-shrink:0;">
                    <input type="text" value="${r.name}" onclick="event.stopPropagation()" onchange="regionUpdateField('${ch}','${r.id}','name',this.value)"
                        style="flex:1;min-width:0;background:#000;border:1px solid #2a2a2a;color:#e0e0e0;font-family:inherit;font-size:0.9rem;padding:5px 8px;box-sizing:border-box;">
                    ${active ? `<span class="region-active-badge" style="flex-shrink:0;">🖌 칠하는 중</span>` : ''}
                    <span style="color:#666;font-size:0.75rem;flex-shrink:0;">${count}개 지역구</span>
                    <button onclick="event.stopPropagation();regionRemoveRegion('${ch}','${r.id}')" style="background:transparent;border:1px solid #333;color:#a55;font-family:inherit;font-size:0.75rem;padding:3px 8px;cursor:pointer;flex-shrink:0;">삭제</button>
                </div>`;
            }).join('');
        }

        function renderRegionManualVotePanel() {
            const ch = regionPaintChamber;
            const panel = document.getElementById('regionVoteManualPanel');
            if(!panel) return;
            if(regionVoteMode[ch] !== 'manual') { panel.innerHTML = ''; return; }
            const list = regions[ch] || [];
            if(list.length === 0) { panel.innerHTML = '<div style="color:#444;font-size:0.78rem;">권역을 먼저 추가하세요.</div>'; return; }
            if(!regionVoteStore[ch]) regionVoteStore[ch] = {};
            const inKey = inKeyFor(ch);
            const votingParties = parties.filter(p => p.ideologyId !== IND_IDEOLOGY_ID && p[inKey]);
            panel.innerHTML = list.map(r => {
                if(!regionVoteStore[ch][r.id]) regionVoteStore[ch][r.id] = {};
                const store = regionVoteStore[ch][r.id];
                return `
                <div style="margin-bottom:10px;padding:8px;background:#0a0c10;border:1px solid #222;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span style="width:9px;height:9px;background:${r.color};border-radius:50%;flex-shrink:0;"></span>
                        <span style="color:#aaa;font-size:0.85rem;">${r.name}</span>
                    </div>
                    ${votingParties.map(p => `
                        <div style="display:grid;grid-template-columns:1fr 75px;gap:6px;margin-bottom:5px;align-items:center;">
                            <div style="display:flex;align-items:center;gap:6px;min-width:0;">
                                <span style="width:8px;height:8px;background:${p.color};border-radius:50%;flex-shrink:0;"></span>
                                <span style="font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.name}">${p.name}</span>
                            </div>
                            <input type="number" min="0" max="100" value="${store[p.id]?.prob||0}"
                                style="width:100%;box-sizing:border-box;background:#000;border:1px solid var(--tno-border);color:var(--tno-neon);font-family:inherit;font-size:0.85rem;padding:4px;text-align:center;"
                                onchange="regionSetManualVote('${ch}','${r.id}','${p.id}', parseFloat(this.value)||0)">
                        </div>
                    `).join('')}
                </div>`;
            }).join('');
        }

        function regionSetManualVote(ch, regionId, partyId, val) {
            if(!regionVoteStore[ch]) regionVoteStore[ch] = {};
            if(!regionVoteStore[ch][regionId]) regionVoteStore[ch][regionId] = {};
            regionVoteStore[ch][regionId][partyId] = { prob: val };
        }

        // 지도(맵) 렌더링 — 지역구 시스템에 따라 SVG 지도 또는 육각형 그리드로 분기
        function renderRegionMap() {
            const wrap = document.getElementById('regionMapWrap');
            if(!wrap) return;
            const ch = regionPaintChamber;
            if(districtMapMode === 'svg') {
                if(!districtSvgMap) { wrap.innerHTML = '<div style="text-align:center;color:#444;font-size:0.85rem;padding:30px 10px;">지역구 탭에서 지도를 먼저 업로드하세요</div>'; return; }
                wrap.innerHTML = '';
                renderDistrictSvgInto(wrap, {
                    clickable: true,
                    innerGlow: true,
                    getFill: key => {
                        if(!districtGrid[ch][key]) return 'transparent';
                        const regionId = districtRegionMap[ch]?.[key];
                        const region = (regions[ch]||[]).find(r => r.id === regionId);
                        // 미배정 칸: 라이트 모드는 흰 바탕에서 보이도록 어두운 회색, 다크/네온은 밝은 회색
                        return region ? region.color : (document.documentElement.getAttribute('data-theme-mode') === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)');
                    },
                    // 미배정 칸도 권역과 같은 결로 — 빛 효과 없는 단색 + 옅은 경계선 (어느 칸인지는 보이게)
                    ungroupedFill: key => !districtGrid[ch][key] ? 'transparent'
                        : (document.documentElement.getAttribute('data-theme-mode') === 'light' ? '#e4e6ea' : '#2b2f3a'),
                    ungroupedStroke: document.documentElement.getAttribute('data-theme-mode') === 'light' ? '#b8bcc4' : '#4d5462',
                    // 같은 권역의 지역구끼리는 경계선을 지우고 권역 둘레만 그린다
                    groupOf: key => {
                        if(!districtGrid[ch][key]) return null;
                        const regionId = districtRegionMap[ch]?.[key];
                        return (regions[ch]||[]).some(r => r.id === regionId) ? regionId : null;
                    },
                    title: key => {
                        const nm = districtNames.house[key] || key;
                        if(!districtGrid[ch][key]) return `${nm} (이 원에 없는 지역구)`;
                        const regionId = districtRegionMap[ch]?.[key];
                        const region = (regions[ch]||[]).find(r => r.id === regionId);
                        return `${nm}${region ? ' — '+region.name : ' — 미배정'}`;
                    },
                    onClickKey: key => {
                        if(!districtGrid[ch][key]) return;
                        regionAssignDistrict(ch, key);
                        renderRegionTab();
                    }
                });
                return;
            }
            // 육각형 그리드 모드
            wrap.innerHTML = '<canvas id="regionHexCanvas" style="width:100%;display:block;background:#0a0c10;border:1px solid #222;cursor:crosshair;"></canvas>';
            const cvs = document.getElementById('regionHexCanvas');
            regionDrawHexMap(cvs, ch);
            regionBindHexMapEvents(cvs, ch);
        }

        function regionChamberKeys(chamber) {
            return Object.keys(districtGrid[chamber] || {});
        }
        function regionGetBounds(chamber) {
            const keys = regionChamberKeys(chamber);
            if(keys.length === 0) return null;
            let minQ=Infinity, maxQ=-Infinity, minR=Infinity, maxR=-Infinity;
            keys.forEach(k => {
                const [q,r] = k.split(',').map(Number);
                if(q<minQ) minQ=q; if(q>maxQ) maxQ=q;
                if(r<minR) minR=r; if(r>maxR) maxR=r;
            });
            return { minQ, maxQ, minR, maxR };
        }

        function regionDrawHexMap(cvs, chamber) {
            const keys = regionChamberKeys(chamber);
            const w = cvs.clientWidth || 260;
            const bounds = regionGetBounds(chamber);
            if(!bounds) { cvs.width=w; cvs.height=60; const c=cvs.getContext('2d'); c.fillStyle=tc('#333', '--m-text-3'); c.font='12px monospace'; c.fillText('지역구를 먼저 설정하세요',8,35); return; }
            const { minQ, maxQ, minR, maxR } = bounds;
            const spanQ = maxQ - minQ + 1, spanR = maxR - minR + 1;
            const sizeByW = w / (spanQ * 1.5 + 0.5);
            const sizeByH = (w * 1.2) / (spanR * Math.sqrt(3) + Math.sqrt(3)/2 + 1);
            const size = Math.min(sizeByW, sizeByH, 20);
            const totalH = Math.ceil(size * (spanR * Math.sqrt(3) + Math.sqrt(3)) + size * 2);
            cvs.width = w; cvs.height = Math.max(totalH, 60);
            const cq = (minQ + maxQ) / 2, cr = (minR + maxR) / 2;
            const offX = cvs.width/2  - size * (3/2 * cq);
            const offY = cvs.height/2 - size * (Math.sqrt(3)/2 * cq + Math.sqrt(3) * cr);
            cvs._regionOffset = { x: offX, y: offY, size };

            const ctx = cvs.getContext('2d');
            ctx.clearRect(0,0,cvs.width,cvs.height);
            keys.forEach(key => {
                const [q,r] = key.split(',').map(Number);
                const [cx,cy] = districtAxialToPixel(q, r, size, offX, offY);
                const corners = districtHexCorners(cx, cy, size*0.93);
                ctx.beginPath();
                ctx.moveTo(...corners[0]);
                corners.slice(1).forEach(c=>ctx.lineTo(...c));
                ctx.closePath();
                const regionId = districtRegionMap[chamber]?.[key];
                const region = (regions[chamber]||[]).find(r => r.id === regionId);
                if(region) {
                    ctx.fillStyle = region.color;
                    ctx.fill();
                    const isActive = region.id === regionActiveId;
                    ctx.strokeStyle = isActive ? '#fff' : region.color;
                    ctx.lineWidth = isActive ? 2 : 1;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = tc('#111', '--m-surface-3'); ctx.fill();
                    ctx.strokeStyle = tc('#333', '--m-border'); ctx.lineWidth = 0.8; ctx.stroke();
                }
            });
        }

        function regionBindHexMapEvents(cvs, chamber) {
            if(!cvs || cvs._regionBound) return;
            cvs._regionBound = true;
            let painting = false, middleDrag = false, mx=0, my=0, paintMode = 'assign';
            cvs.addEventListener('mousedown', e => {
                if(e.button===1) { middleDrag=true; mx=e.offsetX; my=e.offsetY; e.preventDefault(); return; }
                if(e.button===0 && regionActiveId) {
                    const off = cvs._regionOffset; if(!off) return;
                    const [q,r] = districtPixelToAxial(e.offsetX, e.offsetY, off.size, off.x, off.y);
                    const key = `${q},${r}`;
                    if(!districtGrid[chamber][key]) return;
                    painting = true;
                    paintMode = (districtRegionMap[chamber]?.[key] === regionActiveId) ? 'erase' : 'assign';
                    if(paintMode === 'erase') delete districtRegionMap[chamber][key];
                    else { if(!districtRegionMap[chamber]) districtRegionMap[chamber]={}; districtRegionMap[chamber][key] = regionActiveId; }
                    regionDrawHexMap(cvs, chamber);
                }
            });
            cvs.addEventListener('mousemove', e => {
                if(middleDrag) {
                    const off = cvs._regionOffset; if(!off) return;
                    off.x += e.offsetX-mx; off.y += e.offsetY-my;
                    mx = e.offsetX; my = e.offsetY;
                    regionDrawHexMap(cvs, chamber);
                    return;
                }
                if(painting && regionActiveId) {
                    const off = cvs._regionOffset; if(!off) return;
                    const [q,r] = districtPixelToAxial(e.offsetX, e.offsetY, off.size, off.x, off.y);
                    const key = `${q},${r}`;
                    if(!districtGrid[chamber][key]) return;
                    if(paintMode === 'erase') { if(districtRegionMap[chamber]?.[key]===regionActiveId) delete districtRegionMap[chamber][key]; }
                    else { if(!districtRegionMap[chamber]) districtRegionMap[chamber]={}; districtRegionMap[chamber][key] = regionActiveId; }
                    regionDrawHexMap(cvs, chamber);
                }
            });
            cvs.addEventListener('mouseup', () => { if(painting) { painting=false; renderRegionList(); } middleDrag=false; });
            cvs.addEventListener('mouseleave', () => { if(painting) { painting=false; renderRegionList(); } middleDrag=false; });
        }

        // ─────────────────────────────────────────
        // 지역구 선거 시뮬레이션
        // ─────────────────────────────────────────
        function elecSimulateDistricts(chamber) {
            if(districtMapMode === 'svg') return elecSimulateDistrictsSvg(chamber);
            // 각 지역구마다 1위 결정 (성향 + 노이즈)
            // 반환: [{ key, partyId }] — 셔플 가능한 형태
            const results = [];
            const districtKeys = Object.keys(districtGrid[chamber] || {});
            districtKeys.forEach(key => {
                let bestParty = null, bestScore = -1;
                parties.forEach(p => {
                    const support = tendencyData[p.id]?.[key] || 0;
                    // 노이즈: ±15% 정도 랜덤
                    const noise = (Math.random() * 30 - 15);
                    const score = support + noise;
                    if(score > bestScore) { bestScore = score; bestParty = p; }
                });
                if(bestParty && bestScore > 0) {
                    results.push({ key, partyId: bestParty.id });
                } else {
                    // 지지도 없으면 랜덤 당
                    const p = parties[Math.floor(Math.random()*parties.length)];
                    results.push({ key, partyId: p.id });
                }
            });
            return results;
        }

        // 뉴 지역구(SVG): 지역구별로 배정된 원별 성향(%) + 노이즈를 "표"로 삼아, 그 지역구의 의석 수만큼
        // 최대 잔여분 방식(비례 의석 배분과 동일한 방식)으로 정당들에 나눠 배분 — 의석이 여러 개인
        // 지역구는 한 정당이 전부 가져가지 않고, 실제 개표처럼 지역구 안에서도 여러 정당이 나눠 가질 수 있음
        function elecSimulateDistrictsSvg(chamber) {
            const results = [];
            Object.keys(districtGrid[chamber] || {}).forEach(key => {
                const seatCount = districtSeatCounts[key]?.[chamber] || 0;
                if(seatCount <= 0) return;
                const scored = parties.map(p => {
                    const support = districtSvgTendency[key]?.[chamber]?.[p.id] || 0;
                    const noise = (Math.random() * 30 - 15);
                    return { id: p.id, score: Math.max(0, support + noise) };
                });
                const total = scored.reduce((s,p) => s + p.score, 0);
                if(total <= 0) {
                    // 지지도 데이터가 전혀 없으면 무작위 한 정당이 그 지역구 의석을 모두 차지
                    const p = parties[Math.floor(Math.random()*parties.length)];
                    for(let i=0; i<seatCount; i++) results.push({ key, partyId: p.id });
                    return;
                }
                const alloc = scored.map(p => ({ id: p.id, n: Math.floor((p.score/total)*seatCount) }));
                let allocated = alloc.reduce((s,p) => s + p.n, 0);
                if(allocated < seatCount) {
                    const rems = scored.map((p,i) => ({ i, rem: (p.score/total)*seatCount - alloc[i].n })).sort((a,b) => b.rem - a.rem);
                    for(let ri=0; allocated<seatCount; ri++, allocated++) alloc[rems[ri%rems.length].i].n++;
                }
                alloc.forEach(a => { for(let i=0; i<a.n; i++) results.push({ key, partyId: a.id }); });
            });
            return results;
        }

        // districtResults([{key,partyId}, ...]) → { key: { partyId: 그 지역구에서 얻은 의석 수 } }
        function elecBuildDistrictSeatBreakdown(results) {
            const map = {};
            (results || []).forEach(({key, partyId}) => {
                if(!map[key]) map[key] = {};
                map[key][partyId] = (map[key][partyId] || 0) + 1;
            });
            return map;
        }

        // 지역구(SVG) 개표 결과 지도 채우기 계산 — 그 지역구에서 1위 정당의 의석 점유율(%)에 따라
        // tendencyColorForPct로 밝기를 정함(100%면 원색 그대로, 낮을수록 연하게).
        // 1위가 동률(경합)이면 각 정당 색을 50% 밝기로 겹친 빗금 패턴으로 표시.
        // getBadges(key)로 지역구별 정당당 획득 의석 수 배지 정보도 함께 반환.
        function elecSvgBuildResultFill(breakdown, chamber) {
            const patternDefs = new Map();
            const fillMap = {};
            const titleMap = {};
            const badgeMap = {};
            (districtSvgMap?.shapes || []).forEach(s => {
                const key = s.key;
                const nm = districtNames[chamber]?.[key] || districtNames.house[key] || key;
                const seats = districtSeatCounts[key]?.[chamber] || 0;
                // 이 원에 의석이 배정되지 않은 지역구는 개표 결과가 없는 게 정상이므로, 완전히 투명하게(안 보이게)
                // 두지 않고 성향 지도와 같은 어두운 회색 + 안내 문구로 명확히 표시한다 (원마다 지역구 의석이
                // 다를 수 있어 하원/상원 중 한쪽에서만 이렇게 보이는 것은 버그가 아니라 의도된 동작)
                if(seats <= 0) { fillMap[key] = '#141414'; titleMap[key] = `${nm} (이 원에 의석 없음)`; return; }
                const dist = breakdown[key];
                if(!dist) { fillMap[key] = 'transparent'; titleMap[key] = nm; return; }
                const entries = Object.keys(dist).map(pid => ({ pid, n: dist[pid] }));
                const total = entries.reduce((s,e) => s + e.n, 0);
                if(total <= 0) { fillMap[key] = 'transparent'; titleMap[key] = nm; return; }
                const withParty = entries.map(e => ({ ...e, party: parties.find(p => String(p.id)===String(e.pid)) })).filter(e => e.party);
                badgeMap[key] = withParty.slice().sort((a,b) => b.n - a.n);
                if(withParty.length === 0) { fillMap[key] = 'transparent'; titleMap[key] = nm; return; }
                const maxN = Math.max(...withParty.map(e => e.n));
                const top = withParty.filter(e => e.n === maxN);
                const breakdownText = withParty.slice().sort((a,b) => b.n - a.n).map(e => `${e.party.name} ${e.n}석`).join(' · ');
                if(top.length === 1) {
                    const pct = (maxN/total) * 100;
                    fillMap[key] = tendencyColorForPct(top[0].party.color, pct);
                    titleMap[key] = `${nm}: ${breakdownText}`;
                } else {
                    // 50%로 섞으면 정당 원색이 옅을 때 검은 배경과 대비가 거의 없어 안 보이는 것처럼
                    // 보일 수 있어(예: #3498DB, #E74C3C), 경합 빗금은 확실히 알아볼 수 있도록 진하게 표시
                    const colors = top.map(e => tendencyColorForPct(e.party.color, 85));
                    fillMap[key] = tendencyRegisterTiePattern(patternDefs, colors);
                    titleMap[key] = `${nm} (경합): ${breakdownText}`;
                }
            });
            return {
                getFill: key => fillMap[key] || 'transparent',
                getTitle: key => titleMap[key] || (districtNames[chamber]?.[key] || key),
                getBadges: key => badgeMap[key] || null,
                defs: Array.from(patternDefs.values()).join('')
            };
        }

        // "선택 개표" 지도 렌더링 — 아직 공개 안 된 지역구는 클릭을 기다리는 중립색으로, 공개된 지역구만
        // elecSvgBuildResultFill과 동일한 색/빗금/배지로 표시. 미공개 지역구를 클릭하면 onReveal(key) 호출
        function elecDrawDistrictResultManualSvg(chamber, districtResults, revealedKeys, onReveal) {
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            const cvs = document.getElementById('elecDistrictResultCanvas'+suf);
            const svgWrap = document.getElementById('elecDistrictResultSvg'+suf);
            if(cvs) cvs.style.display = 'none';
            if(!svgWrap) return;
            svgWrap.style.display = '';
            const allKeys = new Set(districtResults.map(d => d.key));
            const revealedResults = districtResults.filter(d => revealedKeys.has(d.key));
            const result = elecSvgBuildResultFill(elecBuildDistrictSeatBreakdown(revealedResults), chamber);
            renderDistrictSvgInto(svgWrap, {
                clickable: true,
                getFill: key => {
                    if(revealedKeys.has(key)) return result.getFill(key);
                    if(allKeys.has(key)) return 'rgba(255,255,255,0.1)';
                    return (districtSeatCounts[key]?.[chamber] || 0) <= 0 ? '#141414' : 'transparent';
                },
                title: key => {
                    if(revealedKeys.has(key)) return result.getTitle(key);
                    const nm = districtNames[chamber]?.[key] || key;
                    if(allKeys.has(key)) return `${nm} — 클릭해서 개표`;
                    return (districtSeatCounts[key]?.[chamber] || 0) <= 0 ? `${nm} (이 원에 의석 없음)` : nm;
                },
                seatBadges: key => revealedKeys.has(key) ? result.getBadges(key) : null,
                defs: result.defs,
                onClickKey: key => { if(allKeys.has(key) && !revealedKeys.has(key)) onReveal(key); }
            });
        }

        // 지역구 시스템 방식에 관계없이 "그 의원실이 지역구에서 채울 수 있는 총 의석 수"를 반환
        // (육각형은 활성 칸 1개 = 1석, SVG는 지역구별 배정 의석 수의 합)
        function districtActiveSeatCount(chamber) {
            if(districtMapMode !== 'svg') return Object.keys(districtGrid[chamber]||{}).length;
            return Object.keys(districtGrid[chamber]||{}).reduce((sum, key) => sum + (districtSeatCounts[key]?.[chamber]||0), 0);
        }

        // 선거 결과 지역구 캔버스 호버용: 마지막으로 그려진 데이터(좌표→이름) 기억
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
            // 우측 elecDistrictResultCanvas에 지역구 색 칠하기
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            const cvs = document.getElementById('elecDistrictResultCanvas'+suf);
            const svgWrap = document.getElementById('elecDistrictResultSvg'+suf);
            if(!cvs) return;
            lastElecDistrictDraw[chamber] = { districtResults, progress };
            if(districtMapMode === 'svg') {
                cvs.style.display = 'none';
                if(svgWrap) {
                    svgWrap.style.display = '';
                    const revealed = districtResults.slice(0, progress);
                    const breakdown = elecBuildDistrictSeatBreakdown(revealed);
                    const result = elecSvgBuildResultFill(breakdown, chamber);
                    // 자동 개표는 지역구 순서가 아니라 의석 단위로 뒤섞여 진행되므로, 의석이 여럿인
                    // 지역구는 그 의석들이 개표 순서상 아직 하나도 나오지 않은 동안 결과가 없는 것처럼
                    // (의석 없음과 똑같이 안 보이게) 보일 수 있다. 아직 개표되지 않았을 뿐인 지역구는
                    // "선택 개표"의 대기 표시와 같은 중립색으로 구분해 보여준다
                    const isComplete = progress >= districtResults.length;
                    const countedSoFar = {};
                    if(!isComplete) revealed.forEach(r => { countedSoFar[r.key] = true; });
                    renderDistrictSvgInto(svgWrap, {
                        getFill: key => {
                            if(!isComplete && (districtSeatCounts[key]?.[chamber] || 0) > 0 && !countedSoFar[key]) return 'rgba(255,255,255,0.1)';
                            return result.getFill(key);
                        },
                        title: key => {
                            if(!isComplete && (districtSeatCounts[key]?.[chamber] || 0) > 0 && !countedSoFar[key]) {
                                return `${districtNames[chamber]?.[key] || key} — 개표 대기 중`;
                            }
                            return result.getTitle(key);
                        },
                        seatBadges: result.getBadges,
                        defs: result.defs
                    });
                }
                return;
            }
            if(svgWrap) svgWrap.style.display = 'none';
            cvs.style.display = '';
            elecDistrictBindHover(chamber);
            const w = cvs.offsetWidth;
            const h = cvs.offsetHeight;
            // 캔버스가 아직 숨겨져 있거나(0px) 레이아웃 전이면 다음 프레임에 재시도 (기본값으로 잘못 그리는 것 방지)
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
            // flat-top 공식 (districtAxialToPixel과 동일) — 여백 1칸씩 추가로 위아래/좌우 잘림 방지
            const spanQ = (maxQ - minQ + 1) + 2;
            const spanR = (maxR - minR + 1) + 2;
            const sizeByW = w / (spanQ * 1.5 + 0.5);
            const sizeByH = (h) / (spanR * Math.sqrt(3) + Math.sqrt(3)/2 + 1);
            const size = Math.min(sizeByW, sizeByH, 30);
            const cq = (minQ + maxQ) / 2;
            const cr = (minR + maxR) / 2;
            const offX = w/2 - size * (3/2 * cq);
            const offY = h/2 - size * (Math.sqrt(3)/2 * cq + Math.sqrt(3) * cr);

            // 호버 툴팁용 컨텍스트 저장 (기록 재생 시엔 고정된 districtName, 실시간이면 현재 이름)
            const nameMap = {};
            districtResults.forEach(d => { nameMap[d.key] = (d.districtName !== undefined ? d.districtName : districtNames[chamber][d.key]) || ''; });
            lastDistrictResultCtx[chamber] = { size, offX, offY, nameMap };

            // 모든 지역구를 배경으로 그리기
            tendencyAllKeys().forEach(key => {
                const [q, r] = key.split(',').map(Number);
                const [cx, cy] = districtAxialToPixel(q, r, size, offX, offY);
                const corners = districtHexCorners(cx, cy, size*0.93);
                ctx.beginPath();
                ctx.moveTo(...corners[0]);
                corners.slice(1).forEach(c => ctx.lineTo(...c));
                ctx.closePath();
                ctx.fillStyle = tc('#0a0c10', '--m-surface-2');
                ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            });

            // 진행도까지 결과 색 칠하기
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

                // 집권 세력 강조
                if(highlightGov) {
                    const coal = coalitions.find(c=>c.members.includes(p.id));
                    const isGov = p.isRuling || (coal && coal.isRuling);
                    const isExtSupport = !isGov && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
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

            // 지지율은 입력칸 oninput에서 elecStore[해당 의원실]에 실시간으로 이미 반영되어 있으므로
            // (다중 의원실 순차 개표 시 화면에는 다른 의원실 탭이 떠 있을 수 있어) 여기서 DOM을 다시 읽지 않는다.

            const targets = getElecTargets();
            const hName = document.getElementById('houseNameInput')?.value||'하원';
            const sName = document.getElementById('senateNameInput')?.value||'상원';
            const tName = document.getElementById('thirdNameInput')?.value||'삼원';
            const elecTitle = document.getElementById('elecTitle')?.value.trim() || '무제 선거';
            const elecYear  = document.getElementById('elecYear')?.value.trim()  || '?';
            const elecMode  = getElecMode(); // 'proportional' | 'district'(지역구만) | 'mixed'(지역구+비례)
            const isByElection = document.getElementById('elecModeByElection')?.checked ?? false;

            // 여러 의원실 선택 시: 순차적으로 하원→상원→삼원 순서로 실행
            if(targets.length > 1) {
                const order = chamberList().filter(c => targets.includes(c));
                // 원래 체크 상태 기억
                const prevChecked = {};
                document.querySelectorAll('input[name="elecTarget"]').forEach(el => prevChecked[el.value] = el.checked);
                for(let i=0; i<order.length; i++) {
                    document.querySelectorAll('input[name="elecTarget"]').forEach(el => { el.checked = (el.value === order[i]); });
                    await elecRun(false);
                    if(!elecRunning && i < order.length-1) {
                        await new Promise(r=>setTimeout(r,600));
                    } else if(elecRunning) {
                        break; // 도중 취소/에러 시 중단
                    }
                }
                // 원래 체크 상태 복원
                document.querySelectorAll('input[name="elecTarget"]').forEach(el => { el.checked = prevChecked[el.value]; });
                onElecTargetChange();
                return;
            }

            const chamber = targets[0]; // 'house' | 'senate' | 'third'
            const chamberName = chamber==='senate'?sName:chamber==='third'?tName:hName;
            const totalSeats = parseInt(document.getElementById(chamber==='senate'?'senateTotal':chamber==='third'?'thirdTotal':'houseTotal').value)||0;
            if(totalSeats<=0) { showCustomAlert('의석 수가 0입니다. 의회 설정에서 의석 수를 확인하세요.'); return; }

            // 보궐선거: 궐석 처리된 지역구만 대상으로 재선거
            if(isByElection) {
                const vacantKeys = Object.keys(districtMembers[chamber]).filter(k => districtMembers[chamber][k]?.vacant);
                if(vacantKeys.length === 0) {
                    showCustomAlert('궐석 처리된 지역구가 없습니다.\n의회 > 의원 탭에서 궐석 처리를 먼저 진행하세요.');
                    return;
                }
                await elecRunByElection(chamber, vacantKeys, chamberName);
                return;
            }

            // 모드별 의석 분리
            const activeDistrictCount = districtActiveSeatCount(chamber);
            let districtSeats, propSeats;
            if(elecMode === 'district') {
                // 지역구만: 비례 없이 지역구 수만큼만 채움 (전체 의석과 다를 수 있음)
                districtSeats = Math.min(activeDistrictCount, totalSeats);
                propSeats = 0;
            } else if(elecMode === 'mixed') {
                districtSeats = Math.min(activeDistrictCount, totalSeats);
                propSeats = totalSeats - districtSeats;
            } else {
                districtSeats = 0;
                propSeats = totalSeats;
            }

            // 비례 의석이 있으면 지지율 검사 (활동 금지된 정당은 저장된 수치가 있어도 반영 대상에서 제외)
            // 권역형은 국가 단위 지지율(elecStore)이 아니라 권역별 득표 데이터로 배분하므로 별도로 검사
            const isRegionalList = getElectionSystem(chamber).listScope === 'regional';
            const chamberStore = elecStore[chamber] || {};
            const partyProb = parties.reduce((s,p)=>s+(p.status==='banned'?0:(chamberStore[p.id]?.prob||0)),0);
            if(propSeats > 0 && !isRegionalList && partyProb<=0) {
                showCustomAlert('지지율을 입력해 주세요.\n각 정당의 지지율(%) 칸에 숫자를 입력하세요.');
                return;
            }
            if(propSeats > 0 && isRegionalList && !regionScopeHasVoteData(chamber)) {
                showCustomAlert('권역별 득표율이 없습니다.\n여론 > 권역 탭에서 권역을 만들고 지역구를 배정하거나(자동 집계), 득표율을 직접 입력하세요.');
                return;
            }
            // 지역구 모드인데 활성 지역구가 없으면 안내
            if((elecMode === 'district' || elecMode === 'mixed') && districtSeats === 0) {
                showCustomAlert('지역구 탭에서 활성화된 지역구가 없습니다.\n지역구를 먼저 추가하거나 비례 모드를 선택하세요.');
                return;
            }

            elecRunning   = true;
            elecPaused    = false;
            elecSkipToEnd = false;

            const runBtn   = document.getElementById('elecRunBtn');
            const midCtrl  = document.getElementById('elecMidControls');
            const postBtns = document.getElementById('elecPostBtns');
            runBtn.style.background='#222'; runBtn.style.color='#888'; runBtn.textContent='>> 개표 중... <<'; runBtn.dataset.modernLabel='개표 중...';
            if(midCtrl)  midCtrl.style.display='block';
            if(postBtns) postBtns.style.display='none';

            const speed = Math.round((101 - parseInt(document.getElementById('elecSpeed').value)) * 1.5);

            // ── 부정선거 시도 판정 — 이 원(chamber)을 대상으로 시도한 정당마다 발각 확률을 굴려,
            // 발각되면 부정 효과 없이 활동 금지 처분, 발각되지 않으면 득표율 부풀리기/지역구 조작이 그대로 반영됨.
            // 결과와 무관하게 시도는 이 개표 1회로 소진(초기화)됨.
            const effChamberStore = JSON.parse(JSON.stringify(chamberStore));
            const fraudRiggedByKey = {}; // { districtKey: partyId } — 발각되지 않은 시도만 반영
            const fraudNotices = [];
            parties.forEach(p => {
                const fa = p.fraudAttempt;
                if(!fa || fa.chamber !== chamber) return;
                const caught = Math.random()*100 < (fa.catchChance ?? 0);
                if(caught) {
                    p.status = 'banned';
                    fraudNotices.push(`⚠ ${p.name}의 부정선거 시도가 발각되어, 이번 선거 결과에 반영되지 않고 활동이 금지됩니다.`);
                } else {
                    if(!effChamberStore[p.id]) effChamberStore[p.id] = { prob: 0, err: 0 };
                    effChamberStore[p.id].prob = (effChamberStore[p.id].prob || 0) + (fa.boostPct || 0);
                    (fa.riggedDistricts || []).forEach(key => { fraudRiggedByKey[key] = p.id; });
                }
                p.fraudAttempt = null;
            });
            if(fraudNotices.length > 0) { showCustomAlert(fraudNotices.join('\n')); renderPartyInfoList(); }

            // ── 오차 적용 후 각 당 지지율 계산 (활동 금지된 정당은 저장된 지지율과 무관하게 가중치 0) ──
            const partyWeighted = parties.map(p => {
                const st = effChamberStore[p.id]||{prob:0,err:0};
                const w  = p.status==='banned' ? 0 : Math.max(0, st.prob + (Math.random()*2-1)*(st.err||0));
                return { id:p.id, w, origProb: st.prob };
            });

            // ── 무당파 계산 ───────────────────────
            const swingSt   = chamberStore['__swing__']||{prob:0,err:0};
            const swingRaw  = Math.max(0, swingSt.prob + (Math.random()*2-1)*(swingSt.err||0));

            // ── 무당파 분배 알고리즘 ──────────────
            // A/B 비율 랜덤 결정 (매 선거마다 다름)
            const ratioA = Math.random(); // 0~1 사이 랜덤 (그룹A 비율)
            const ratioB = 1 - ratioA;
            const swingA = swingRaw * ratioA; // 완전 랜덤 그룹
            const swingB = swingRaw * ratioB; // 지지율×친화도 그룹

            // 그룹A: 각 당에 균등 랜덤 분배 (난수 비중) — 활동 금지된 정당은 무당파 배분도 받지 않음
            const randWeights = parties.map(p => p.status==='banned' ? 0 : Math.random());
            const randTotal   = randWeights.reduce((a,b)=>a+b,0);

            // 그룹B: 각 당의 (지지율 × 친화도 계수) 비중으로 분배
            // 친화도 계수: 0.5~1.5 사이 랜덤 (매 선거 당마다 다름)
            const affinities = parties.map(() => 0.5 + Math.random());
            const bWeights   = partyWeighted.map((p,i) => Math.max(0, p.w) * affinities[i]);
            const bTotal     = bWeights.reduce((a,b)=>a+b,0);

            // 각 당에 무당파 배분량 합산
            const swingBonus = parties.map((p,i) => {
                const fromA = randTotal  > 0 ? swingA * (randWeights[i] / randTotal) : 0;
                const fromB = bTotal     > 0 ? swingB * (bWeights[i]    / bTotal)    : 0;
                return fromA + fromB;
            });

            // ── 최종 가중치 (정당 지지율 + 무당파 배분) ──
            const weighted = partyWeighted.map((p,i) => ({
                id: p.id,
                w:  p.w + swingBonus[i],
                origProb: p.origProb,
            }));
            const wTotal = weighted.reduce((s,p)=>s+p.w,0);
            // wTotal(지지율+무당파 가중치)은 비례 의석 배분에만 쓰이므로, 비례 의석이 0석인
            // 지역구 전용 개표에서는 지지율을 하나도 입력하지 않았어도 막을 이유가 없음
            // (이 조건 없이 막으면 지역구만 개표할 때 안내 문구 하나 없이 조용히 실패한 것처럼 보임)
            if(propSeats > 0 && !isRegionalList && wTotal<=0) {
                elecRunning=false;
                runBtn.style.background='var(--tno-neon)'; runBtn.style.color='#000'; runBtn.textContent='>> 개표 시작 <<'; runBtn.dataset.modernLabel='개표 시작';
                showCustomAlert('지지율을 입력해 주세요.\n각 정당의 지지율(%) 칸에 숫자를 입력하세요.');
                return;
            }

            // ── 지역구 선거 결과 먼저 계산 (연동형/권역형 비례 배분에 지역구 당선 결과가 필요) ──
            let districtResults = [];
            if(districtSeats > 0) districtResults = elecSimulateDistricts(chamber);
            // 발각되지 않은 부정선거 시도의 지역구 개표 조작 반영 — 실제 결과와 무관하게 지정된 정당으로 덮어씀
            if(Object.keys(fraudRiggedByKey).length > 0) {
                districtResults.forEach(d => { if(fraudRiggedByKey[d.key]) d.partyId = fraudRiggedByKey[d.key]; });
            }

            // ── 비례 의석 배분 (전국형/권역형 × 병립~연동 절충, 원별 설정) ────
            const listSeatMap = allocateListSeats(chamber, weighted, districtResults, propSeats, totalSeats);
            const districtWinCounts = {};
            districtResults.forEach(({partyId}) => { districtWinCounts[partyId] = (districtWinCounts[partyId]||0) + 1; });
            const seatMap = weighted.map(p => ({
                id: p.id,
                n: (districtWinCounts[p.id]||0) + (listSeatMap[p.id]||0),
                origProb: p.origProb,
            }));

            // 지역구 개표 순서 셔플 (연출용)
            for(let i=districtResults.length-1; i>0; i--) {
                const j = Math.floor(Math.random()*(i+1));
                [districtResults[i], districtResults[j]] = [districtResults[j], districtResults[i]];
            }

            const seatKey = seatKeyFor(chamber);

            // ── 결과 저장 (반영/재개표용) ───────
            // prevSeatMap: 개표로 이 원의 실제 의석(party[seatKey])이 리셋되기 직전의 스냅샷 —
            // 선거 결과 화면에서 "직전 대비 의석 변동"을 계산하는 기준이 된다
            const prevSeatMap = parties.map(p => ({ id: p.id, n: p[seatKey]||0 }));
            elecLastResult = { chamber, isSenate: chamber==='senate', seatMap: seatMap.map(x=>({...x})), weighted, districtResults: [...districtResults], mode: elecMode, prevSeatMap };
            elecLastResults[chamber] = elecLastResult;

            // ── 비례 풀 생성 + 셔플 ─────────────────
            parties.forEach(p=>{ p[seatKey]=0; });
            let pool=[];
            weighted.forEach(p => { const n = listSeatMap[p.id]||0; for(let i=0;i<n;i++) pool.push(p.id); });
            for(let i=pool.length-1;i>0;i--){
                const j=Math.floor(Math.random()*(i+1));
                [pool[i],pool[j]]=[pool[j],pool[i]];
            }

            // ── 선거 결과 탭으로 전환 (각 의원실별 독립된 탭) ──────
            const suf = chamber.charAt(0).toUpperCase() + chamber.slice(1);
            document.getElementById('dispTabElecResult'+suf).style.display='';
            document.getElementById('dispTabElecResult'+suf).querySelector('.disp-tab-label').textContent = `${chamberName} 선거결과`;
            switchDispTab('elecResult'+suf);
            document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName} 개표 중...`;
            document.getElementById('elecResultBar'+suf).style.width='0%';
            document.getElementById('elecProgressBar').style.width='0%';

            // 모드에 따라 view 자동 전환
            if(districtSeats > 0) elecSetView('district', chamber);
            else elecSetView('arc', chamber);

            await new Promise(r=>setTimeout(r,150));

            // ── 1단계: 지역구 개표 애니메이션 ─────
            if(districtSeats > 0 && districtMapMode === 'svg' && elecCountMode === 'manual') {
                // 선택 개표: 자동으로 순서를 섞어 넘기지 않고, 사용자가 결과 지도에서 지역구를 하나씩 클릭해 개표
                const pauseBtn = document.getElementById('elecPauseBtn');
                if(pauseBtn) pauseBtn.style.display = 'none'; // 자동 진행이 없으므로 일시정지는 의미가 없음
                const allDistrictKeys = [...new Set(districtResults.map(d => d.key))];
                const revealedKeys = new Set();
                let revealedSeats = 0;
                const revealOne = key => {
                    if(revealedKeys.has(key)) return;
                    revealedKeys.add(key);
                    districtResults.filter(d => d.key === key).forEach(({ partyId }) => {
                        const p = parties.find(x => x.id === partyId);
                        if(p) { p[seatKey]++; revealedSeats++; }
                    });
                    elecDrawDistrictResultManualSvg(chamber, districtResults, revealedKeys, revealOne);
                    const distName = districtNames[chamber][key];
                    document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName} 개표 중... (${distName || key})`;
                    const pct = (revealedSeats/totalSeats*100).toFixed(1)+'%';
                    document.getElementById('elecProgressBar').style.width = pct;
                    document.getElementById('elecResultBar'+suf).style.width = pct;
                    const map = buildElecMap(chamber, totalSeats);
                    updateStats('elecResultStats'+suf, map, totalSeats);
                };
                document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName}: 지도에서 지역구를 클릭해 개표하세요`;
                elecDrawDistrictResultManualSvg(chamber, districtResults, revealedKeys, revealOne);
                while(revealedKeys.size < allDistrictKeys.length && !elecSkipToEnd) {
                    await new Promise(r=>setTimeout(r,100));
                }
                if(elecSkipToEnd) allDistrictKeys.forEach(k => revealOne(k)); // 즉시 완료 시 남은 지역구 일괄 개표
                if(pauseBtn) pauseBtn.style.display = ''; // 비례 단계는 다시 자동 애니메이션이므로 복원
                if(propSeats > 0 && !elecSkipToEnd) {
                    await new Promise(r=>setTimeout(r,300));
                    elecSetView('arc', chamber);
                    await new Promise(r=>setTimeout(r,200));
                }
                elecDrawDistrictResult(districtResults, districtResults.length, chamber);
            } else if(districtSeats > 0) {
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
                    document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName} 개표 중... (${distName || key})`;

                    const pct = ((i+1)/totalSeats*100).toFixed(1)+'%';
                    document.getElementById('elecProgressBar').style.width = pct;
                    document.getElementById('elecResultBar'+suf).style.width   = pct;

                    if(i % Math.max(1, Math.floor(districtResults.length/30)) === 0 || i === districtResults.length-1) {
                        const map = buildElecMap(chamber, totalSeats);
                        updateStats('elecResultStats'+suf, map, totalSeats);
                    }
                    if(districtSpeed > 0) await new Promise(r=>setTimeout(r, districtSpeed));
                }
                // 지역구 끝나면 비례로 view 전환
                if(propSeats > 0 && !elecSkipToEnd) {
                    await new Promise(r=>setTimeout(r,300));
                    elecSetView('arc', chamber);
                    await new Promise(r=>setTimeout(r,200));
                }
                // 지역구 최종 렌더
                elecDrawDistrictResult(districtResults, districtResults.length, chamber);
            }

            // ── 2단계: 비례 개표 애니메이션 ─────
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

            // 최종 렌더
            document.getElementById('elecProgressBar').style.width='100%';
            document.getElementById('elecResultBar'+suf).style.width='100%';
            const finalMap = buildElecMap(chamber, totalSeats);
            drawChamber('elecCanvas'+suf, finalMap, totalSeats, '_elec');
            updateStats('elecResultStats'+suf, finalMap, totalSeats);
            if(districtSeats > 0) elecDrawDistrictResult(districtResults, districtResults.length, chamber);

            // ── 개표 완료 ──────────────────────
            document.getElementById('elecResultTitle'+suf).innerText = `> ${elecTitle} (${elecYear}) — ${chamberName} 결과 확정`;
            if(midCtrl)  midCtrl.style.display='none';
            if(postBtns) postBtns.style.display='block';

            // 기록 저장
            elecSaveRecord(elecTitle, elecYear, chamber, seatMap, weighted, districtResults);
            if(chamber === 'house' && !isByElection && !isRerun) autoAdvanceTermOnElection();

            elecRunning=false;
            runBtn.style.background='var(--tno-neon)'; runBtn.style.color='#000'; runBtn.textContent='>> 개표 시작 <<'; runBtn.dataset.modernLabel='개표 시작';
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
                const isExtSupport = !isGov && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                // 각외협력 정당은 (다른 연정 소속이더라도) 그 연정 카드가 아니라 각외협력 항목으로 별도 집계
                const effectiveCoal = (isExtSupport || (isPartyRuling && !(coal && coal.isRuling))) ? null : coal;
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
                                ideology:ideologyName(f.ideologyId)||ideologyName(p.ideologyId)||'?',
                                coalitionName:fEffCoal?.name, strokeColor:fStroke, isRuling:fIsGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
                        }
                        placed += f[seatKey]||0;
                    });
                    for(let k=placed; k<cnt; k++){
                        if(map.length>=totalSeats) break;
                        map.push({color:p.color, partyName:p.name, factionName:null,
                            ideology:ideologyName(p.ideologyId)||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
                    }
                } else {
                    for(let k=0;k<cnt;k++){
                        if(map.length>=totalSeats) break;
                        map.push({color:p.color, partyName:p.name, factionName:null,
                            ideology:ideologyName(p.ideologyId)||'?',
                            coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
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
                    const ia = ideologySortKey(a.ideologyId);
                    const ib = ideologySortKey(b.ideologyId);
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
                    const isExtSupport = !isGov && rulingCoal && rulingCoal.externalSupporters?.includes(p.id);
                    // 각외협력 정당은 (다른 연정 소속이더라도) 그 연정 카드가 아니라 각외협력 항목으로 별도 집계
                    const effectiveCoal = (isExtSupport || (isPartyRuling && !(coal && coal.isRuling))) ? null : coal;
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
                            // 파벌 자체가 연정 멤버인지만 체크 (당 연정 폴백 없음)
                            const fCoal = coalitions.find(c=>c.members.includes(fKey));
                            const fCoalRuling = !isPartyRuling && (fCoal && fCoal.isRuling);
                            const fIsGov = isPartyRuling || fCoalRuling;
                            const fEffCoal = (isPartyRuling && !(fCoal && fCoal.isRuling)) ? null : fCoal; // 당 연정 폴백 제거
                            const fStroke = highlightGov&&fIsGov ? 'var(--tno-gold)' : (fEffCoal?fEffCoal.color:null);
                            for(let k=0; k<(f[seatKey]||0); k++){
                                if(map.length>=targetTotal) break;
                                map.push({color:fc, partyName:p.name, factionName:f.name, partyStatus:p.status||'active',
                                    ideology:ideologyName(f.ideologyId)||ideologyName(p.ideologyId)||'?',
                                    coalitionName:fEffCoal?.name, strokeColor:fStroke, isRuling:fIsGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
                            }
                            placed += f[seatKey]||0;
                        });
                        for(let k=placed; k<cnt; k++){
                            if(map.length>=targetTotal) break;
                            map.push({color:p.color, partyName:p.name, factionName:null, partyStatus:p.status||'active',
                                ideology:ideologyName(p.ideologyId)||'?',
                                coalitionName:effectiveCoal?.name, strokeColor:stroke, strokeDashed, isRuling:isGov, externalSupport:isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false});
                        }
                    } else {
                        const isIndParty = p.ideologyId === IND_IDEOLOGY_ID;
                        const chName = chamberKey==='seatsHouse'?'house':chamberKey==='seatsSenate'?'senate':'third';
                        const indList = isIndParty ? independents.filter(x=>x.chamber===chName).sort((a,b)=>a.seatIndex-b.seatIndex) : [];
                        for(let k=0; k<cnt; k++) {
                            if(map.length >= targetTotal) break;
                            const indEntry = indList[k];
                            // 무소속 개별 의원: 소속 연정에 따라 테두리만 반영 (채우기 색은 회색 그대로 유지)
                            let indStroke = stroke, indDashed = strokeDashed, indIsGov = isGov, indCoalName = effectiveCoal?.name;
                            let indExtSupport = isExtSupport?(rulingCoal.externalSupportLabel||'각외협력'):false;
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
                                    indExtSupport = indExtCoal.externalSupportLabel || '각외협력';
                                } else {
                                    // 이 의원은 개별적으로 연정/각외협력 어디에도 속하지 않음 — 정당 전체 각외협력 여부와 무관하게 일반 무소속으로 표시
                                    indExtSupport = false;
                                }
                            }
                            map.push({color:p.color, partyName:p.name, factionName:null, partyStatus:indEntry?.status || p.status || 'active',
                                ideology:ideologyName(p.ideologyId)||'?',
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
            if(currentSubTab?.law === 'bill') renderBillList();
            checkPmConfirmationBills();
            checkNoConfidenceBills();
            checkMartialLawLiftBills();
            renderCabinetDisplay();
        }

        function drawChamber(cvsId, map, total, chamber) {
            const cvs = document.getElementById(cvsId);
            if(!cvs) return;
            lastChamberDraw[cvsId] = { map, total, chamber };
            // CSS width:100%는 유지한 채, 부모(래퍼)의 실제 렌더 너비만 측정
            // (cvs 자체의 style.width를 px로 고정하지 않아야 매번 컨테이너 크기 변화에 반응함)
            const parent = cvs.parentElement;
            let width = parent?.clientWidth || parent?.offsetWidth || cvs.clientWidth || 566;
            if(width <= 50) return; // 너무 좁으면 스킵
            const dpr = window.devicePixelRatio || 1;
            const heightBuffer = 160;
            const cssHeight = width / 2 + heightBuffer;
            cvs.width  = width * dpr;
            cvs.height = cssHeight * dpr;
            // style.width는 100%로 유지, height만 픽셀로 지정 (width는 항상 부모를 따라감)
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
            if(dotR <= 0) return; // 반지름이 0 이하면 그릴 수 없음
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
                partyStatus: map[i]?.partyStatus || 'active',
                ideology: map[i]?.ideology || '-',
                coalitionName: map[i]?.coalitionName || null,
                factionName: map[i]?.factionName || null,
                independentName: map[i]?.independentName || null,
                independentSeatIndex: map[i]?.independentSeatIndex || null,
            }));

            const highlightGov = document.getElementById('chkGovHighlight').checked;
            const chamberVoteState = voteState[chamber] || {};

            // Draw dots (with vote state)
            pts.forEach((pt, i) => {
                if(i >= map.length) return;
                const d = map[i];
                // 활동 금지된 정당은 표결에 참여할 수 없으므로 표결 색을 반영하지 않음
                const vote = d.partyStatus === 'banned' ? 'none' : (chamberVoteState[i] || 'none');
                const voteColor = getVoteColor(vote);
                const radius = Math.max(0.5, dotR * 0.85);

                ctx.beginPath();
                ctx.arc(pt.x, pt.y, radius, 0, Math.PI*2);
                ctx.fillStyle = voteColor || d.color;
                ctx.fill();

                // Stroke: party/coalition/gov
                if(d.partyStatus === 'banned') {
                    ctx.shadowColor = "rgba(255, 0, 85, 0.8)";
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = "#ff0055";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                } else if(d.isRuling && highlightGov) {
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

                // 호버 중인 좌석: 토성 고리처럼 좌석과 떨어진 흰색 고리
                if(hoveredSeat[chamber] === i) {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, dotR * 1.14, 0, Math.PI*2);
                    ctx.strokeStyle = tc('#fff', '--m-text');
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = 'rgba(255,255,255,0.6)';
                    ctx.shadowBlur = 6;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            });

            // Center label
            drawChamberCenter(ctx, CX, CY, total, chamber, cvsId, width);
        }

        // 통계 컨테이너 id로부터 의원실 추정 (houseStats/senateStats/thirdStats/elecResultStatsHouse 등)
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
            // 활동 금지된 정당은 표결에 참여할 수 없으므로 과반 기준 유효 의석에서 제외
            const bannedCount = map.filter(x=>x.partyStatus==='banned').length;
            const valid = total - vac - bannedCount;
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
                // partyColor: 당/연정 본래 색 (골드 stroke 아닌 실제 색)
                const party = parties.find(p=>p.name===m.partyName);
                const coalObjForColor = m.coalitionName ? coalitions.find(c=>c.name===m.coalitionName) : null;
                // legend-pill 등에는 멤버 정당의 실제 색을 그대로 사용 (연정 색과 무관)
                const partyColor = party?.color || m.color;
                // 카드 좌측 띠 색: 연정이면 연정 자체 색(집권 시 골드), 일반 정당이면 정당 색
                const cardStripColor = coalObjForColor ? coalObjForColor.color : partyColor;
                if(!stats[k]) stats[k] = { name: displayName, count:0, color: m.strokeColor||m.color, partyColor: cardStripColor, isRuling: m.isRuling, externalSupport: m.externalSupport, parties:{}, factions:{}, coalitionName: m.coalitionName };
                stats[k].count++;
                // parties: 당별 집계 (legend-pill용)
                if(!stats[k].parties[m.partyName]) stats[k].parties[m.partyName] = {n:0, c:partyColor, i:m.ideology};
                stats[k].parties[m.partyName].n++;
                // factions: 파벌별 집계
                if(m.factionName) {
                    const fKey = `${m.partyName}__${m.factionName}`;
                    if(!stats[k].factions[fKey]) stats[k].factions[fKey] = {n:0, name:m.factionName, partyName:m.partyName, c:m.color};
                    stats[k].factions[fKey].n++;
                }
            });
            const allStats = Object.values(stats);
            // 각외협력(신임과 보완) 정당들의 의석 합계 — 여당의 실질 과반 판정에 반영
            const extSupportTotal = allStats.reduce((sum,s)=> s.externalSupport ? sum+s.count : sum, 0);

            // 카테고리 분류: 여당 / 각외협력 / 야당
            const govArr = allStats.filter(s=>s.isRuling);
            const extArr = allStats.filter(s=>!s.isRuling && s.externalSupport).sort((a,b)=>b.count-a.count);
            const oppArr = allStats.filter(s=>!s.isRuling && !s.externalSupport).sort((a,b)=>b.count-a.count);
            // 여당(+각외협력) 실질 의석 — 이미 과반을 확보했다면 어떤 야당도 "여소야대"로 표시하지 않는다
            // (valid/maj 계산이 활동금지·궐석 등으로 왜곡돼도 여당·야당이 동시에 "과반"으로 표시되는 모순을 방지)
            const govEffectiveTotal = govArr.reduce((sum,s)=>sum+s.count, 0) + extSupportTotal;

            // 선거 결과 화면(elecResultStats*)에서만 의석 변동(▲▼)을 표시 — 이번 개표로 새로 계산된
            // 의석과, 개표 시작 전 해당 원의 실제 의석(elecLastResults[chamber].prevSeatMap)을 비교.
            // 평소 원 현황 탭(houseStats 등)에는 비교 기준(직전 선거)이 없으므로 표시하지 않는다
            const elecChamberForChange = id.startsWith('elecResultStats') ? inferChamberFromStatsId(id) : null;
            const prevSeatMap = elecChamberForChange ? elecLastResults[elecChamberForChange]?.prevSeatMap : null;
            function seatChangeHtml(s) {
                if(!prevSeatMap) return '';
                const prevCount = Object.keys(s.parties).reduce((sum, pname) => {
                    const p = parties.find(x => x.name === pname);
                    const prev = p ? prevSeatMap.find(x => x.id === p.id) : null;
                    return sum + (prev ? prev.n : 0);
                }, 0);
                const diff = s.count - prevCount;
                if(diff === 0) return ` <span style="color:#666;font-size:0.85rem;">(0)</span>`;
                const color = diff > 0 ? 'var(--vote-yea)' : 'var(--vote-nay)';
                const sign = diff > 0 ? '▲' : '▼';
                return ` <span style="color:${color};font-size:0.85rem;font-weight:bold;">(${sign}${Math.abs(diff)})</span>`;
            }

            function renderCard(s) {
                let statusHtml = '';
                let extNoteHtml = '';
                if(s.isRuling) {
                    const effectiveCount = s.count + extSupportTotal;
                    statusHtml = `<span style="color:var(--tno-gold);font-weight:bold;">[여당 GOV]</span> `;
                    statusHtml += effectiveCount>=maj ? `<span style="color:#0f0;font-weight:bold;">[과반 MAJ]</span>` : `<span style="color:#f00;font-weight:bold;">[소수 MIN]</span>`;
                    if(extSupportTotal > 0) {
                        const pct = ((effectiveCount/total)*100).toFixed(1);
                        const extLabel = extArr[0]?.externalSupport || '각외협력';
                        extNoteHtml = `<div style="color:var(--tno-gold);opacity:0.75;font-size:0.78rem;margin-top:2px;">+ ${extLabel} ${extSupportTotal}석 = 실질 ${effectiveCount}석 (${pct}%)</div>`;
                    }
                } else if(s.externalSupport) {
                    statusHtml = `<span style="color:var(--tno-gold);font-weight:bold;border-bottom:2px dashed var(--tno-gold);" title="연정에 정식 참여하지 않지만 신임투표·예산안 등에서 정부를 지지">[${s.externalSupport} C&S]</span>`;
                } else if(s.count>=maj && govArr.length > 0 && govEffectiveTotal < maj) {
                    statusHtml = `<span style="color:#f00;font-weight:bold;">[여소야대]</span>`;
                }

                // 대표당(leadPartyId) 조회 — 여당 연정 카드일 때 pill 순서에 사용
                const coalObj = s.coalitionName ? coalitions.find(x=>x.name===s.coalitionName) : null;
                const leadPartyName = coalObj?.leadPartyId ? parties.find(p=>p.id===coalObj.leadPartyId)?.name : null;

                // legend-pill: 파벌 있으면 파벌별, 없으면 당별 — 대표당 우선, 이후 의석 수 순
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
                    // 파벌 배정 안 된 나머지 의석
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

                // 사진/이름 결정
                let photo = '', leaderName = '', floorLeaderName = '', isLogo = false, hidePhotoBox = false;
                let isIndependentCard = false;
                if(s.coalitionName) {
                    const coal = coalObj;
                    if(coal) {
                        // 연정의 당수는 항상 대표당의 당수를 그대로 따른다
                        const leadP = coal.leadPartyId ? parties.find(p=>p.id===coal.leadPartyId) : null;
                        hidePhotoBox = !!leadP?.hideStatsPhoto;
                        photo      = hidePhotoBox ? '' : (leadP?.leaderPhoto || '');
                        leaderName = leadP?.leaderName  || '';
                    }
                } else {
                    const pName = Object.keys(s.parties)[0];
                    const party = parties.find(p=>p.name===pName);
                    isLogo     = party?.showLogoInStats ?? false;
                    hidePhotoBox = !!party?.hideStatsPhoto;
                    photo      = (party && !hidePhotoBox) ? (isLogo ? (party.logoPhoto||party.leaderPhoto||'') : (party.leaderPhoto||party.logoPhoto||'')) : '';
                    leaderName = party?.leaderName || '';
                    floorLeaderName = party?.floorLeaderName || '';
                    isIndependentCard = party?.ideologyId === IND_IDEOLOGY_ID;
                    // 무소속은 개별 의원만 있고 당대표 개념이 없으므로, 당수 탭에 값이 들어있어도
                    // (대선/총리 후보 지정 등 다른 용도로 쓰일 수 있음) 이 통계 카드에는 항상 숨김
                    if(isIndependentCard) { hidePhotoBox = true; photo = ''; leaderName = ''; floorLeaderName = ''; }
                }

                // 무소속 카드: 접고 펼 수 있는 개별 의원 리스트
                let independentToggleHtml = '';
                let independentListHtml = '';
                if(isIndependentCard) {
                    const chamber = inferChamberFromStatsId(id);
                    const listItems = independents.filter(x=>x.chamber===chamber).sort((a,b)=>a.seatIndex-b.seatIndex);
                    const panelId = `indPanel_${id}_${chamber}`;
                    independentToggleHtml = `<span onclick="event.stopPropagation();toggleIndependentPanel('${panelId}')" style="cursor:pointer;color:#888;font-size:0.85rem;user-select:none;flex-shrink:0;" id="${panelId}_arrow">▶</span>`;
                    independentListHtml = `<div id="${panelId}" style="display:none;margin-top:6px;border-top:1px dashed #333;padding-top:6px;">
                        ${listItems.length===0 ? '<div style="color:#444;font-size:0.78rem;">개별 정보 없음</div>' : listItems.map(ind => {
                            const indIdeo = ind.ideologyId ? ideologyName(ind.ideologyId) : null;
                            const districtLabel = ind.districtKey ? (districtNames[chamber]?.[ind.districtKey] || ind.districtKey) : null;
                            return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.8rem;color:#aaa;border-bottom:1px solid #1a1a1a;">
                                <div style="width:22px;height:27px;flex-shrink:0;background:#0a0c10;border:1px solid #333;overflow:hidden;">
                                    ${ind.photo?`<img src="${ind.photo}" style="width:100%;height:100%;object-fit:cover;">`:''}
                                </div>
                                <span style="width:24px;color:#666;flex-shrink:0;">#${ind.seatIndex}</span>
                                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ind.name||'(이름 미지정)'}</span>
                                <span style="color:#666;font-size:0.75rem;flex-shrink:0;">${indIdeo||'무소속'}${districtLabel?` (${districtLabel})`:''}</span>
                                ${ind.status==='banned' ? `<span class="party-status-badge status-banned" style="flex-shrink:0;">활동 금지</span>` : ''}
                            </div>`;
                        }).join('')}
                    </div>`;
                }

                return `<div class="stat-block" style="border-left-color:${(s.coalitionName && s.isRuling) ? 'var(--tno-gold)' : (s.partyColor||s.color)};">
                    <div class="dyn-row" style="display:flex;gap:8px;align-items:stretch;">
                        <!-- 사진: JS에서 오른쪽 텍스트 실측 높이에 맞춰 px로 직접 지정. "X"로 표시 안 함을 고르면 칸 자체를 없앰 -->
                        ${hidePhotoBox ? '' : `<div class="leader-photo-box dyn-photo" data-ratio="${isLogo?'1':'0.75'}" style="flex-shrink:0;background:#0a0c10;border:1px solid #222;overflow:hidden;">
                            ${photo?`<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`:''}
                        </div>`}
                        <!-- 오른쪽 3행 -->
                        <div class="dyn-ref" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
                            <!-- 행1: 연정/정당명 : 의석 (%) + 상태 -->
                            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px;flex-wrap:wrap;">
                                <span style="font-size:1.1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;display:flex;align-items:center;gap:6px;">${independentToggleHtml}${s.name} : ${s.count} <span style="color:#888;font-size:0.85rem;">(${((s.count/total)*100).toFixed(1)}%)</span>${seatChangeHtml(s)}</span>
                                <span style="flex-shrink:0;font-size:0.9rem;">${statusHtml}</span>
                            </div>
                            ${extNoteHtml}
                            <!-- 행2: 당수 이름 (원내대표가 있으면 옆에 함께) -->
                            <div style="color:#888;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${leaderName||(floorLeaderName?'':'　')}${floorLeaderName?`<span style="color:#666;">${leaderName?' · ':''}원내대표 ${floorLeaderName}</span>`:''}</div>
                            <!-- 행3: 당 목록 (줄바꿈 허용) -->
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
                html += renderSectionHeader('여당');
                govArr.forEach(s => html += renderCard(s));
            }
            if(extArr.length > 0) {
                html += renderSectionHeader(extArr[0]?.externalSupport || '각외협력');
                extArr.forEach(s => html += renderCard(s));
            }
            if(oppArr.length > 0) {
                html += renderSectionHeader('야당');
                oppArr.forEach(s => html += renderCard(s));
            }
            html += renderExtraPartiesSection(inferChamberFromStatsId(id));
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
    
