# 🌐 조달청 입찰공고 조회 웹사이트 - 배포 & 운영 가이드

---

## 📋 목차
1. 로컬 테스트 (지금 바로)
2. AWS S3 배포
3. Lambda와 통합
4. 커스터마이징
5. 유지보수

---

## 1️⃣ 로컬 테스트 (지금 바로 하세요!)

### 구성 파일 (4개)
```
bid_website/
├── index.html       ← HTML (메인 페이지)
├── style.css        ← 스타일
├── script.js        ← JavaScript (기능)
└── bid_data.json    ← 샘플 데이터
```

### 테스트 방법

#### Windows
```powershell
# 방법 1: Python 간단 서버
cd C:\bid_website
python -m http.server 8000

# 또는 PowerShell
cd C:\bid_website
python -m http.server

# 브라우저에서 열기
http://localhost:8000
```

#### Mac/Linux
```bash
cd ~/bid_website
python3 -m http.server 8000

# 브라우저에서 열기
open http://localhost:8000
```

### 확인 사항
```
✅ 웹사이트 로드됨
✅ 샘플 데이터 테이블 표시됨
✅ 검색/필터 작동
✅ 통계 표시됨
✅ 페이지네이션 작동
```

---

## 2️⃣ AWS S3에서 호스팅

### Step 1: S3 버킷 생성

```bash
# AWS CLI 사용
aws s3 mb s3://bid-agent-website-${RANDOM} \
  --region ap-northeast-2

# 예: s3://bid-agent-website-12345
```

또는 AWS Console:
```
1. S3 → [Create bucket]
2. Bucket name: bid-agent-website-xxxxx
3. Region: ap-northeast-2 (서울)
4. Block public access: 해제 (웹사이트 공개용)
5. [Create bucket]
```

### Step 2: 웹사이트 호스팅 활성화

```
S3 → 해당 버킷 선택
├─ [Properties] 탭
├─ 아래로 스크롤 → "Static website hosting"
├─ [Edit]
├─ Enable: ON
├─ Index document: index.html
├─ Error document: index.html
└─ [Save changes]
```

### Step 3: 파일 업로드

```bash
# AWS CLI
aws s3 cp index.html s3://bid-agent-website-xxxxx/
aws s3 cp style.css s3://bid-agent-website-xxxxx/
aws s3 cp script.js s3://bid-agent-website-xxxxx/
aws s3 cp bid_data.json s3://bid-agent-website-xxxxx/

# 또는 한 번에
aws s3 sync . s3://bid-agent-website-xxxxx/
```

또는 AWS Console:
```
1. 버킷 선택
2. [Upload] 클릭
3. 4개 파일 드래그&드롭
4. [Upload]
```

### Step 4: 퍼블릭 접근 허용

```
S3 → 버킷 선택
├─ [Permissions] 탭
├─ "Block public access (bucket settings)" → [Edit]
├─ 모든 체크 해제
├─ [Save]
├─ "Bucket policy" → [Edit]
└─ 다음 정책 입력:
```

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::bid-agent-website-xxxxx/*"
        }
    ]
}
```

### Step 5: 웹사이트 URL 확인

```
S3 → 버킷 선택
├─ [Properties] 탭
├─ "Static website hosting"
└─ URL 복사: http://bid-agent-website-xxxxx.s3-website.ap-northeast-2.amazonaws.com
```

**이 URL로 웹사이트 접속 가능!**

---

## 3️⃣ Lambda와 통합

### 목표
```
Lambda (매일 9시) 
  ↓
API 조회 & 데이터 처리
  ↓
S3에 bid_data.json 저장
  ↓
웹사이트에서 자동 업데이트
```

### 수정 사항

#### A. Lambda 함수 수정 (bid_agent_local.py)

기존 Lambda 함수의 `generate_excel()` 함수 다음에 추가:

```python
def save_to_s3(filtered_bids, s3_client):
    """
    필터링된 공고를 S3에 JSON으로 저장
    웹사이트에서 이를 읽어서 표시함
    """
    import json
    
    # JSON 데이터 준비
    data = []
    for bid in filtered_bids:
        remaining_days = calculate_remaining_days(bid['마감일자'])
        
        item = {
            '공고번호': bid['공고번호'],
            '공고명': bid['공고명'],
            '공고기관': bid['공고기관'],
            '입찰유형': bid['입찰유형'],
            '기초금액': bid['기초금액'],
            '공고일자': bid['공고일자'],
            '마감일자': bid['마감일자'],
            '입찰방식': bid['입찰방식'],
            '상태': bid['상태'],
            '남은일수': remaining_days
        }
        data.append(item)
    
    # S3에 저장
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key='website/bid_data.json',
            Body=json.dumps(data, ensure_ascii=False, indent=2),
            ContentType='application/json'
        )
        logger.info(f"✅ S3에 JSON 저장: {len(data)}건")
        return True
    except Exception as e:
        logger.error(f"❌ S3 저장 오류: {e}")
        return False
```

#### B. Lambda Handler 수정

기존 `lambda_handler()` 함수에 추가:

```python
# Step 7. 웹사이트용 JSON 저장 (이메일 발송 전)
save_to_s3(filtered_bids, s3_client)

# Step 8. 이메일 발송 (선택사항, 생략 가능)
send_email(excel_file, filtered_bids, config)
```

#### C. script.js 수정

S3 경로로 변경:

```javascript
// script.js 상단 수정
const DATA_SOURCE = 'https://bid-agent-website-xxxxx.s3.ap-northeast-2.amazonaws.com/website/bid_data.json';

// CORS 에러 해결: S3 CORS 설정 필요 (아래 참조)
```

### S3 CORS 설정

```
S3 → 버킷 선택
├─ [Permissions] 탭
├─ "Cross-origin resource sharing (CORS)" → [Edit]
└─ 다음 입력:
```

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
    }
]
```

---

## 4️⃣ 커스터마이징

### 로고/제목 변경

**index.html:**
```html
<h1>🏗️ 조달청 입찰공고 조회 시스템</h1>
↓
<h1>🏭 냉방기기 입찰정보 시스템</h1>
```

### 컬러 변경

**style.css:**
```css
:root {
    --primary-color: #2954D1;        ← 메인 색상 변경
    --secondary-color: #1e40af;
    ...
}
```

예: 초록색으로 변경
```css
--primary-color: #10b981;
--secondary-color: #059669;
```

### 컬럼 추가

**script.js의 `displayData()` 함수:**

현재:
```javascript
<td class="col-status">
    <span class="badge ${getStatusClass(bid.상태)}">
        ${bid.상태}
    </span>
</td>
```

추가 예: 남은일수
```javascript
<td class="col-remaining">
    <span class="${getRemainingDaysClass(calculateRemainingDays(bid.마감일자))}">
        ${calculateRemainingDays(bid.마감일자)}일
    </span>
</td>
```

### 추가 필터 옵션

**index.html:**
```html
<div class="filter-group">
    <label for="amountFilter">기초금액:</label>
    <select id="amountFilter" class="select-box">
        <option value="">전체</option>
        <option value="0-50">~5천만원</option>
        <option value="50-100">5천만~1억</option>
        <option value="100-">1억 이상</option>
    </select>
</div>
```

**script.js:**
```javascript
// setupEventListeners()에 추가
document.getElementById('amountFilter').addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
});

// applyFilters()에 추가
const amountFilter = document.getElementById('amountFilter').value;
const matchesAmount = !amountFilter || (
    (amountFilter === '0-50' && bid.기초금액 < 50000000) ||
    (amountFilter === '50-100' && bid.기초금액 >= 50000000 && bid.기초금액 < 100000000) ||
    (amountFilter === '100-' && bid.기초금액 >= 100000000)
);
```

---

## 5️⃣ 유지보수

### 매일 자동 업데이트

Lambda에서 bid_data.json을 자동으로 생성:
```
매일 9시 → Lambda 실행 → S3에 JSON 저장 → 웹사이트 자동 갱신
```

### 사용자 접속 시 데이터 새로고침

**script.js:**
```javascript
// 페이지 로드 시 자동 새로고침
document.addEventListener('DOMContentLoaded', () => {
    loadData(); // 항상 최신 데이터 로드
});

// 새로고침 버튼 추가
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadData();
});
```

**index.html:**
```html
<button id="refreshBtn" class="btn-refresh">🔄 새로고침</button>
```

### 에러 모니터링

**script.js에 에러 로깅 추가:**
```javascript
try {
    const response = await fetch(DATA_SOURCE);
    // ...
} catch (error) {
    console.error('Error:', error);
    // Google Analytics나 AWS CloudWatch로 전송
}
```

### 성능 최적화

1. **데이터 캐싱**: 브라우저 localStorage 사용
   ```javascript
   // 1시간마다만 새로 로드
   const lastLoad = localStorage.getItem('lastLoadTime');
   if (Date.now() - lastLoad > 3600000) {
       loadData();
   }
   ```

2. **청크 로드**: 대용량 데이터는 페이지네이션 활용

3. **CDN**: CloudFront로 캐싱
   ```
   CloudFront Distribution 생성
   → S3를 Origin으로 설정
   → TTL 설정 (1시간)
   ```

---

## 📊 결과

### 로컬 환경
```
http://localhost:8000
```

### AWS S3 호스팅
```
http://bid-agent-website-xxxxx.s3-website.ap-northeast-2.amazonaws.com
```

### CloudFront (선택사항)
```
https://d1234abcd.cloudfront.net
```

---

## 🔒 보안

### 공개 범위 제한

```
현재: 누구나 접속 가능
제한하려면: CloudFront + Lambda@Edge로 인증 추가
```

### API 키 보안

```
Lambda에서 Service Key 사용 (S3 JSON 저장 시점에만)
웹사이트는 공개 JSON만 접근 (API 키 노출 X)
```

---

## 📞 트러블슈팅

| 문제 | 해결책 |
|------|--------|
| 웹사이트 로드 안 됨 | S3 "Static website hosting" 활성화 확인 |
| 데이터 안 보임 | bid_data.json 파일 존재 확인, 문법 검사 |
| CORS 에러 | S3 CORS 설정 추가 |
| 스타일 깨짐 | style.css 파일 업로드 확인 |
| JavaScript 안 작동 | script.js 파일 업로드 확인, 콘솔 에러 확인 |

---

## ✅ 체크리스트

- [ ] 로컬에서 웹사이트 테스트
- [ ] S3 버킷 생성
- [ ] Static website hosting 활성화
- [ ] 4개 파일 S3에 업로드
- [ ] 공개 접근 허용
- [ ] 웹사이트 URL 접속 확인
- [ ] Lambda와 통합 (bid_data.json 자동 생성)
- [ ] 매일 9시 자동 업데이트 확인

---

## 🎉 완성!

웹사이트에서 공고를 실시간으로 조회할 수 있습니다! 🌐

