// 개찰 결과 조회 스크립트
let allOpeningBids = [];
let filteredOpeningBids = [];
let currentOpeningPage = 1;
const openingItemsPerPage = 30;

// 조달청 API 설정
const API_KEY = '8d8ea48a831eff6b90dbcab10ecf0673aa56ba6bdeec8a24bcfc4bf820cadcad';
const API_OPENING_URL = 'http://apis.data.go.kr/1230000/ProcurementInfoService/getProcurementInfoItemOpenning';

document.addEventListener('DOMContentLoaded', () => {
    loadOpeningData();
    setupOpeningEventListeners();
    setupOpeningAutoRefresh();
});

async function loadOpeningData() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 날짜 포맷: YYYY-MM-DD
    const toDate = now.toISOString().split('T')[0];
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];
    
    try {
        // API 호출 (개찰일 기준 D~D-7)
        const url = `${API_OPENING_URL}?serviceKey=${API_KEY}&inqryDiv=1&fromBidOpenngYmd=${fromDate}&toBidOpenngYmd=${toDate}&pageNo=1&numOfRows=1000`;
        
        // CORS 문제로 인해 샘플 데이터 사용 (실제 API 연동 시에는 백엔드에서 처리)
        loadOpeningSampleData();
        
    } catch (error) {
        console.error('개찰 결과 로드 오류:', error);
        loadOpeningSampleData(); // 에러 시 샘플 데이터 로드
    }
}

function loadOpeningSampleData() {
    // 샘플 개찰 결과 데이터
    allOpeningBids = [
        {
            "번호": 1,
            "개찰일": "2026-06-30",
            "공고번호": "202406001",
            "공고명": "에어컨 및 냉난방기 구매",
            "수요기관": "서울시 환경국",
            "소재지": "서울",
            "낙찰예정자": "(주)삼성전자",
            "사업자번호": "123-45-67890",
            "연락처": "02-1234-5678",
            "주소": "서울시 강남구 테헤란로 123, 삼성전자빌딩",
            "투찰금액": "47500000",
            "투찰율": "98.96%",
            "최종낙찰자": "(주)삼성전자",
            "낙찰금액": "47500000",
            "진행상황": "낙찰자 결정"
        },
        {
            "번호": 2,
            "개찰일": "2026-06-29",
            "공고번호": "202406002",
            "공고명": "GHP 히트펌프 설치공사",
            "수요기관": "부산시청 도시교통실",
            "소재지": "부산",
            "낙찰예정자": "(주)대우건설",
            "사업자번호": "234-56-78901",
            "연락처": "051-5555-6666",
            "주소": "부산시 중구 중앙대로 99, 대우건설빌딩",
            "투찰금액": "113500000",
            "투찰율": "98.69%",
            "최종낙찰자": "(주)한라건설",
            "낙찰금액": "112800000",
            "진행상황": "낙찰자 결정"
        },
        {
            "번호": 3,
            "개찰일": "2026-06-28",
            "공고번호": "202406003",
            "공고명": "냉방 시스템 교체 및 설치",
            "수요기관": "인천시 건축과",
            "소재지": "인천",
            "낙찰예정자": "(주)현대건설",
            "사업자번호": "345-67-89012",
            "연락처": "032-7777-8888",
            "주소": "인천시 남동구 인주대로 555, 현대건설센터",
            "투찰금액": "71200000",
            "투찰율": "98.89%",
            "최종낙찰자": "(주)현대건설",
            "낙찰금액": "71200000",
            "진행상황": "낙찰자 결정"
        },
        {
            "번호": 4,
            "개찰일": "2026-06-25",
            "공고번호": "202406004",
            "공고명": "실내 냉난방기 유지보수",
            "수요기관": "서울시청",
            "소재지": "서울",
            "낙찰예정자": "(주)SK에너지",
            "사업자번호": "456-78-90123",
            "연락처": "02-9999-1111",
            "주소": "서울시 중구 을지로 123, SK에너지빌딩",
            "투찰금액": "28500000",
            "투찰율": "98.28%",
            "최종낙찰자": "(주)GS에너지",
            "낙찰금액": "28200000",
            "진행상황": "낙찰자 결정"
        },
        {
            "번호": 5,
            "개찰일": "2026-06-24",
            "공고번호": "202406005",
            "공고명": "에어컨 실외기 설치공사",
            "수요기관": "인천시청",
            "소재지": "인천",
            "낙찰예정자": "(주)포스코건설",
            "사업자번호": "567-89-01234",
            "연락처": "032-5555-2222",
            "주소": "인천시 동구 중앙로 789, 포스코건설센터",
            "투찰금액": "42800000",
            "투찰율": "99.07%",
            "최종낙찰자": "(주)포스코건설",
            "낙찰금액": "42800000",
            "진행상황": "낙찰자 결정"
        }
    ];
    
    filteredOpeningBids = [...allOpeningBids];
    displayOpeningData();
    
    const now = new Date();
    document.getElementById('lastOpeningUpdate').textContent = now.toLocaleString('ko-KR');
}

function setupOpeningEventListeners() {
    document.getElementById('openingPrevBtn').addEventListener('click', () => {
        if (currentOpeningPage > 1) {
            currentOpeningPage--;
            displayOpeningData();
        }
    });
    
    document.getElementById('openingNextBtn').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredOpeningBids.length / openingItemsPerPage);
        if (currentOpeningPage < maxPage) {
            currentOpeningPage++;
            displayOpeningData();
        }
    });
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

function displayOpeningData() {
    const tableBody = document.getElementById('openingBody');
    const noDataMsg = document.getElementById('noOpeningDataMessage');
    const pagination = document.getElementById('openingPaginationContainer');
    
    if (filteredOpeningBids.length === 0) {
        tableBody.innerHTML = '';
        noDataMsg.style.display = 'block';
        pagination.style.display = 'none';
        document.getElementById('openingCount').textContent = '0';
        return;
    }
    
    noDataMsg.style.display = 'none';
    
    const totalPages = Math.ceil(filteredOpeningBids.length / openingItemsPerPage);
    const startIndex = (currentOpeningPage - 1) * openingItemsPerPage;
    const endIndex = Math.min(startIndex + openingItemsPerPage, filteredOpeningBids.length);
    const pageData = filteredOpeningBids.slice(startIndex, endIndex);
    
    tableBody.innerHTML = pageData.map((bid, index) => {
        const rowNum = startIndex + index + 1;
        
        // 낙찰예정자와 최종낙찰자 비교
        const isBidderDifferent = bid.낙찰예정자 !== bid.최종낙찰자;
        const finalBidderClass = isBidderDifferent ? 'highlight-red' : '';
        
        return `
            <tr>
                <td class="col-no">${rowNum}</td>
                <td class="col-opening-date">${bid.개찰일}</td>
                <td class="col-bid-no">${bid.공고번호}</td>
                <td class="col-title">${bid.공고명}</td>
                <td class="col-req-agency">
                    ${bid.수요기관 || '-'}
                    <span class="badge location-badge ${getLocationBadgeClass(bid.소재지)}">
                        ${bid.소재지 || '-'}
                    </span>
                </td>
                <td class="col-successful-bidder">
                    <strong class="bidder-link" onclick="showBidderInfo('${bid.낙찰예정자 || '-'}', '${bid.사업자번호 || '-'}', '${bid.연락처 || '-'}', '${bid.주소 || '-'}', '${bid.공고명}', '₩${formatOpeningNumber(bid.투찰금액)}')">
                        ${bid.낙찰예정자 || '-'}
                    </strong>
                </td>
                <td class="col-bid-amount">₩${formatOpeningNumber(bid.투찰금액)}</td>
                <td class="col-bid-rate">${bid.투찰율 || '-'}</td>
                <td class="col-progress">
                    <span class="badge normal">
                        ${bid.진행상황}
                    </span>
                </td>
                <td class="col-final-bidder ${finalBidderClass}">
                    <strong>${bid.최종낙찰자 || '-'}</strong>
                </td>
                <td class="col-final-amount ${finalBidderClass}">
                    ${bid.낙찰금액 ? '₩' + formatOpeningNumber(bid.낙찰금액) : '-'}
                </td>
            </tr>
        `;
    }).join('');
    
    updateOpeningPagination(totalPages);
    document.getElementById('openingCount').textContent = filteredOpeningBids.length;
}

function updateOpeningPagination(totalPages) {
    const container = document.getElementById('openingPaginationContainer');
    const pageInfo = document.getElementById('openingPageInfo');
    const prevBtn = document.getElementById('openingPrevBtn');
    const nextBtn = document.getElementById('openingNextBtn');
    
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    pageInfo.textContent = `${currentOpeningPage} / ${totalPages}`;
    prevBtn.disabled = currentOpeningPage <= 1;
    nextBtn.disabled = currentOpeningPage >= totalPages;
}

function formatOpeningNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function setupOpeningAutoRefresh() {
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
            console.log(`✅ 다음 개찰결과 업데이트: ${nextRefresh.nextHour}:00 (${Math.round(nextRefresh.time / 1000)}초 후)`);
            
            setTimeout(() => {
                console.log(`🔄 자동 개찰결과 업데이트 (${new Date().toLocaleString('ko-KR')})`);
                loadOpeningData();
                scheduleNextRefresh(); // 다시 스케줄
            }, nextRefresh.time);
        } else {
            // 09:00 전이면 09:00까지 대기
            console.log(`⏳ 개찰결과 업데이트 예약: 09:00 ~ 18:00 (매시간)`);
            setTimeout(() => {
                scheduleNextRefresh();
            }, nextRefresh.time);
        }
    }
    
    scheduleNextRefresh();
}

// 낙찰예정자 정보 모달 제어 함수
function showBidderInfo(name, bizNumber, phone, address, bidTitle, bidAmount) {
    document.getElementById('modalBidderName').textContent = name;
    document.getElementById('modalBidderNumber').textContent = bizNumber;
    document.getElementById('modalBidderAddress').textContent = address;
    document.getElementById('modalBidTitle').textContent = bidTitle;
    document.getElementById('modalBidAmount').textContent = bidAmount;
    
    // 전화번호 링크 설정 (tel: 프로토콜)
    const phoneLink = document.getElementById('modalBidderPhone');
    const phoneNumber = phone.replace(/[^0-9]/g, ''); // 숫자만 추출
    const formattedPhone = '+82' + phoneNumber.substring(1); // 국제 형식 변환 (02 → 82)
    phoneLink.href = `tel:${formattedPhone}`;
    phoneLink.textContent = phone;
    
    // 전역 변수에 주소 저장 (복사/맵 검색용)
    window.currentBidderAddress = address;
    window.currentBidderName = name;
    
    document.getElementById('bidderModal').style.display = 'flex';
}

function closeBidderModal() {
    document.getElementById('bidderModal').style.display = 'none';
}

// 주소 복사 함수
function copyAddress() {
    const address = window.currentBidderAddress || '-';
    
    // 클립보드에 복사
    navigator.clipboard.writeText(address).then(() => {
        // 복사 성공 알림
        showCopyNotification('📋 주소가 복사되었습니다!');
    }).catch(err => {
        console.error('복사 실패:', err);
        alert('복사 실패: ' + address);
    });
}

// 구글 맵에서 주소 검색
function openGoogleMaps() {
    const address = window.currentBidderAddress || '';
    if (!address || address === '-') {
        alert('주소 정보가 없습니다.');
        return;
    }
    
    // 구글 맵 검색 URL
    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank');
}

// 복사 알림 표시 (토스트 알림)
function showCopyNotification(message) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    // 새로운 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('bidderModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
