let allBids = [];
let filteredBids = [];
let currentPage = 1;
const itemsPerPage = 30;
const DATA_SOURCE = 'bid_data.json';

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    setupAutoRefresh();
});

async function loadData() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'flex';
    
    try {
        const response = await fetch(DATA_SOURCE);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        allBids = data;
        filteredBids = [...allBids];
        
        // 참가지역 필터 select box 채우기
        const regions = getUniqueRegions();
        const regionSelect = document.getElementById('regionFilter');
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });
        
        // 소재지 필터 select box 채우기
        const locations = getUniqueDepartmentLocations();
        const locationSelect = document.getElementById('locationFilter');
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationSelect.appendChild(option);
        });
        
        // 업종 제한 사항 필터 select box 채우기
        const industries = getUniqueIndustries();
        const industrySelect = document.getElementById('industryFilter');
        industries.forEach(industry => {
            const option = document.createElement('option');
            option.value = industry;
            option.textContent = industry;
            industrySelect.appendChild(option);
        });
        
        displayData();
        updateStats();
        
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleString('ko-KR');
        
    } catch (error) {
        console.error('데이터 로드 오류:', error);
    }
    
    spinner.style.display = 'none';
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', () => {
        currentPage = 1;
        applyFilters();
    });
    
    document.getElementById('typeFilter').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
    
    document.getElementById('statusFilter').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });

    document.getElementById('regionFilter').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });

    document.getElementById('locationFilter').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });

    document.getElementById('industryFilter').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('regionFilter').value = '';
        document.getElementById('locationFilter').value = '';
        document.getElementById('industryFilter').value = '';
        currentPage = 1;
        applyFilters();
    });
    
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayData();
        }
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredBids.length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            displayData();
        }
    });
}

function applyFilters() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const regionFilter = document.getElementById('regionFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    const industryFilter = document.getElementById('industryFilter').value;
    
    filteredBids = allBids.filter(bid => {
        const matchesSearch = bid.공고명.toLowerCase().includes(searchText) ||
                            bid.공고기관.toLowerCase().includes(searchText) ||
                            bid.입찰공고번호.includes(searchText);
        const matchesType = !typeFilter || bid.입찰유형 === typeFilter;
        const matchesStatus = !statusFilter || bid.상태 === statusFilter;
        const matchesRegion = !regionFilter || 
                            (bid.참가가능지역 && bid.참가가능지역.includes(regionFilter));
        const matchesLocation = !locationFilter || bid.소재지 === locationFilter;
        const matchesIndustry = !industryFilter || 
                              (bid.업종제한사항 && bid.업종제한사항.includes(industryFilter));
        
        return matchesSearch && matchesType && matchesStatus && matchesRegion && matchesLocation && matchesIndustry;
    });
    
    currentPage = 1;
    displayData();
    updateStats();
}

function displayData() {
    const tableBody = document.getElementById('tableBody');
    const noDataMsg = document.getElementById('noDataMessage');
    const pagination = document.getElementById('paginationContainer');
    
    if (filteredBids.length === 0) {
        tableBody.innerHTML = '';
        noDataMsg.style.display = 'block';
        pagination.style.display = 'none';
        document.getElementById('filteredCount').textContent = '0';
        return;
    }
    
    noDataMsg.style.display = 'none';
    
    const totalPages = Math.ceil(filteredBids.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredBids.length);
    const pageData = filteredBids.slice(startIndex, endIndex);
    
    tableBody.innerHTML = pageData.map((bid, index) => {
        const rowNum = startIndex + index + 1;
        const remainingDays = bid.남은일수;
        const remainingClass = getRemainingDaysClass(remainingDays);
        
        return `
            <tr>
                <td class="col-no">${rowNum}</td>
                <td class="col-pub-date">${bid.게시일시}</td>
                <td class="col-deadline">${bid.마감일자}</td>
                <td class="col-remaining">
                    <span class="${remainingClass}">
                        ${remainingDays < 0 ? '마감' : remainingDays + '일'}
                    </span>
                </td>
                <td class="col-bid-no">${bid.입찰공고번호}</td>
                <td class="col-title">${bid.공고명}</td>
                <td class="col-agency">${bid.공고기관}</td>
                <td class="col-req-agency">
                    ${bid.수요기관 || '-'}
                    <span class="badge location-badge ${getLocationBadgeClass(bid.소재지)}">
                        ${bid.소재지 || '-'}
                    </span>
                </td>
                <td class="col-amount">₩${formatNumber(bid.기초금액)}</td>
                <td class="col-est-amount">₩${formatNumber(bid.추정가격)}</td>
                <td class="col-region">${bid.참가가능지역 || '전국'}</td>
                <td class="col-industry">${bid.업종제한사항 || '-'}</td>
                <td class="col-procedure">${bid.세부절차 || '-'}</td>
                <td class="col-contact">${bid.공고담당자 || '-'}</td>
                <td class="col-person">${bid.수요기관담당자 || '-'}</td>
                <td class="col-phone">${bid.수요기관전화번호 || '-'}</td>
                <td class="col-status">
                    <span class="badge ${getStatusClass(bid.상태)}">
                        ${bid.상태}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    updatePagination(totalPages);
    document.getElementById('filteredCount').textContent = filteredBids.length;
}

function updatePagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

function updateStats() {
    const total = filteredBids.length;
    const construction = filteredBids.filter(b => b.입찰유형 === '공사').length;
    const goods = filteredBids.filter(b => b.입찰유형 === '물품').length;
    const urgent = filteredBids.filter(b => b.남은일수 >= 0 && b.남은일수 <= 3).length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('constructionCount').textContent = construction;
    document.getElementById('goodsCount').textContent = goods;
    document.getElementById('urgentCount').textContent = urgent;
}

function getUniqueIndustries() {
    const industries = new Set();
    allBids.forEach(bid => {
        if (bid.업종제한사항 && bid.업종제한사항 !== '-') {
            const items = bid.업종제한사항.split(',').map(item => item.trim());
            items.forEach(item => industries.add(item));
        }
    });
    return Array.from(industries).sort();
}

function getUniqueRegions() {
    const regions = new Set();
    allBids.forEach(bid => {
        if (bid.참가가능지역 && bid.참가가능지역 !== '-') {
            const items = bid.참가가능지역.split(',').map(item => item.trim());
            items.forEach(item => regions.add(item));
        }
    });
    return Array.from(regions).sort();
}

function getUniqueDepartmentLocations() {
    const locations = new Set();
    allBids.forEach(bid => {
        if (bid.소재지 && bid.소재지 !== '-') {
            locations.add(bid.소재지);
        }
    });
    return Array.from(locations).sort();
}

function getLocationBadgeClass(location) {
    const locationClasses = {
        '서울': 'location-seoul',
        '경기': 'location-gyeonggi',
        '인천': 'location-incheon',
        '강원': 'location-gangwon',
        '대전': 'location-daejeon',
        '세종': 'location-sejong',
        '광주': 'location-gwangju',
        '충남': 'location-chungnam',
        '충북': 'location-chungbuk',
        '대구': 'location-daegu',
        '부산': 'location-busan',
        '경북': 'location-gyeongbuk',
        '경남': 'location-gyeongnam',
        '울산': 'location-ulsan',
        '제주': 'location-jeju'
    };
    return locationClasses[location] || 'location-default';
}

function setupAutoRefresh() {
    // 다음 업데이트 시간 계산
    function calculateNextRefreshTime() {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const sec = now.getSeconds();
        
        // 09:00 ~ 18:00 사이만 자동 새로고침
        if (hour >= 9 && hour < 18) {
            // 다음 정각까지의 시간 계산
            const nextHour = hour + 1;
            const msUntilNextHour = ((60 - min) * 60 - sec) * 1000;
            
            return { time: msUntilNextHour, nextHour: nextHour };
        } else if (hour < 9) {
            // 09:00까지 대기
            const msUntil9 = ((9 - hour) * 60 - min) * 60 * 1000 - sec * 1000;
            return { time: msUntil9, nextHour: 9 };
        } else {
            // 다음날 09:00까지 대기
            const msUntil9Tomorrow = ((24 - hour + 9) * 60 - min) * 60 * 1000 - sec * 1000;
            return { time: msUntil9Tomorrow, nextHour: 9 };
        }
    }
    
    function scheduleNextRefresh() {
        const nextRefresh = calculateNextRefreshTime();
        const now = new Date();
        const hour = now.getHours();
        
        // 09:00~18:00 사이일 때만 스케줄
        if (hour >= 9 && hour < 18) {
            console.log(`✅ 다음 입찰공고 업데이트: ${nextRefresh.nextHour}:00 (${Math.round(nextRefresh.time / 1000)}초 후)`);
            
            setTimeout(() => {
                console.log(`🔄 자동 입찰공고 업데이트 (${new Date().toLocaleString('ko-KR')})`);
                loadData();
                scheduleNextRefresh(); // 다시 스케줄
            }, nextRefresh.time);
        } else {
            // 09:00 전이면 09:00까지 대기
            console.log(`⏳ 입찰공고 업데이트 예약: 09:00 ~ 18:00 (매시간)`);
            setTimeout(() => {
                scheduleNextRefresh();
            }, nextRefresh.time);
        }
    }
    
    scheduleNextRefresh();
}

function getRemainingDaysClass(days) {
    if (days < 0) return 'urgent expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'warning';
    return 'safe';
}

function getStatusClass(status) {
    const classMap = {'정상': 'normal', '취소': 'cancelled', '무효': 'cancelled'};
    return classMap[status] || 'normal';
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
