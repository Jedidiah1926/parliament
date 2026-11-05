// Shared maker project storage. Existing campaign/challenge databases stay intact.
(function () {
    'use strict';
    const types = {
        map: { db: 'hemicycleMaps', last: 'hemicycleMapLast', editor: 'map.html', name: '맵', list: 'mapSelectList' },
        campaign: { db: 'hemicycleCampaigns', last: 'hemicycleCampaignLast', editor: 'scenario.html', name: '캠페인', list: 'campaignSelectList' },
        challenge: { db: 'hemicycleScenarios', last: 'hemicycleScenarioLast', editor: 'challenge.html', name: '챌린지', list: 'challengeSelectList' },
    };
    async function transaction(kind, mode, run) {
        if (!Object.hasOwn(types, kind)) throw Error('알 수 없는 제작물 종류입니다.');
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(types[kind].db, 1);
            request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('items')) request.result.createObjectStore('items', { keyPath: 'id' }); };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        try {
            return await new Promise((resolve, reject) => {
                const tx = db.transaction('items', mode), result = run(tx.objectStore('items'));
                tx.oncomplete = () => resolve(result.result);
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error || Error('저장 작업이 취소되었습니다.'));
            });
        } finally { db.close(); }
    }
    async function remove(kind, id) {
        await transaction(kind, 'readwrite', store => store.delete(id));
        if (localStorage.getItem(types[kind].last) === id) localStorage.removeItem(types[kind].last);
    }
    window.HemiMakerStore = {
        types,
        list: kind => transaction(kind, 'readonly', store => store.getAll()),
        get: (kind, id) => transaction(kind, 'readonly', store => store.get(id)),
        put: (kind, item) => transaction(kind, 'readwrite', store => store.put(item)),
        remove,
        url: (kind, id) => types[kind].editor + (id ? '?item=' + encodeURIComponent(id) : '?new=1'),
    };
})();
