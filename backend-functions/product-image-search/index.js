function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required app setting: ${name}`);
  }
  return String(value).trim();
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

const STORE_NOISE_WORDS = [
  '올리브영',
  'oliveyoung',
  'olive young',
  '무신사',
  'musinsa',
  '쿠팡',
  'coupang',
  '11번가',
  'g마켓',
  '지마켓',
  '브랜디',
  'brandi',
  '에이블리',
  'ably',
  '오늘의집',
  '스타일쉐어',
  'styleshare',
  '지그재그',
  'zigzag',
  'ssg',
  '신세계몰',
  '이마트몰',
  '롯데온',
  'wconcept',
  '29cm',
  'hmall',
  'gsshop',
  'auction',
  'interpark',
  'qoo10',
  'amazon',
  'aliexpress',
  '카카오쇼핑',
  'kakao shopping',
  '미라클 뷰',
  'miracle view',
  '까까보',
  'red band',
  'redband',
  'RED BAND',
  '네이버쇼핑',
  'naver shopping',
  '스마트스토어',
  'smartstore',
  '공식몰',
  '공식스토어',
  '스토어',
  'shop',
  'store',
  'mall',
  '몰',
  '샵',
  '브랜드관',
  '판매처',
  '직영',
  '정품',
  'be me',
  'BE ME'
];

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripNoise(value) {
  return String(value || '')
    .replace(/\s*\+.*$/g, ' ')
    .replace(/\s*[x×*]\s*2\b/gi, ' ')
    .replace(/곱하기\s*2/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:g|그램|ml|㎖|mL)\b/gi, ' ')
    .replace(/\d+\s*(?:개입|개|팩|p|pack|세트)/gi, ' ')
    .replace(/(?:^|\s)\S*유통(?=\s|$)/g, ' ')
    .replace(/\b(?:best|베스트|NEW|new|BE[:\s-]*ME|be[:\s-]*me|기획|증정|묶음|패키지|구성|한정|단독|정품)\b/gi, ' ')
    .replace(/\[(.*?)\]/g, ' $1 ')
    .replace(/\((.*?)\)/g, ' $1 ')
    .replace(/[,:;"'“”‘’|>•·]/g, ' ')
    .replace(/\s*[-/]\s*/g, ' ');
}
function collapseRepeatedPhrase(value) {
  const text = normalizeWhitespace(value);
  const tokens = text.split(' ').filter(Boolean);

  if (tokens.length >= 4 && tokens.length % 2 === 0) {
    const half = tokens.length / 2;
    const first = tokens.slice(0, half).join(' ');
    const second = tokens.slice(half).join(' ');
    if (first === second) {
      return first;
    }
  }

  const deduped = [];
  tokens.forEach((token) => {
    if (deduped[deduped.length - 1] !== token) {
      deduped.push(token);
    }
  });

  return deduped.join(' ');
}

function removeStoreNoise(value) {
  let text = String(value || '');
  STORE_NOISE_WORDS.forEach((word) => {
    const pattern = new RegExp(word, 'gi');
    text = text.replace(pattern, ' ');
  });
  return text;
}

function isCosmeticLikeTitle(value, query) {
  const title = normalizeWhitespace(stripHtml(value)).toLowerCase();
  if (!title) {
    return false;
  }

  const positivePattern = /(틴트|립밤|립스틱|립글로스|립오일|립라이너|립마스크|입|립|블러셔|페이스블러셔|치크|쿠션|파운데이션|파운|프라이머|컨실러|마스카라|아이라이너|아이브로우|브로우|아이브로|섀도우|아이섀도|아이섀도우|팔레트|아이크림|아이팩|아이젤|넥크림|넥팩|핸드크림|핸드팩|발크림|발팩|풋크림|바디크림|바디로션|바디버터|바디에센스|바디팩|바디스크럽|페이스팩|시트팩|수면팩|슬리핑마스크|딥클렌징|핑거팩|마스크|마스크팩|에센셜오일|동백오일|로즈힙오일|아르간오일|토너젤|젤로션|립스크럽|립팩|립케어|스킨|토너|로션|에센스|에센셜|세럼|앰플|크림|팩|미스트|선크림|선스틱|선케어|자외선|선블록|선스프레이|클렌징|폼클렌징|클렌징폼|클렌징밤|클렌징워터|클렌징톤|클렌징토너|토너패드|패드|밤|오일|향수|퍼퓸|비비|bb|cc|쿠션팩트|팩트|파우더|파우더팩트|글로우|매트|비비크림|cc크림|아이섀도팔레트|펜슬라이너|리퀴드라이너|젤라이너|매직라이너|브로우팩스|브로우팬슬|브로우파우더|브로우펜|컬마스카라|볼륨마스카라|매직마스카라|립라이너|립펜슬|립팬|립틴트|립매트|립그로우|입글로우|입글로우스틱|하이라이터|브라이트너|메이크업|메이크업리무버|메이크업클렌저|스킨케어|샴푸|린스|트리트먼트|헹굼유|헤어팩|헤어에센스|헤어오일|헤어|인니버|토너시트|엘릭서|나이트크림|슬라이딩톤|뷰티에센스|프라이밍|프라이머젤|리퀴드|스틱|화장품)/i;
  const negativePattern = /(과자|스낵|음료|커피|차|빵|쿠키|초콜릿|사탕|젤리|라면|국수|즉석밥|김치|떡|티셔츠|셔츠|바지|치마|원피스|후드|신발|가방|모자|의자|침대|책|노트|문구|세제|청소|휴지|주방|가전|전자|이어폰|핸드폰|스마트폰|노트북|컴퓨터|자동차|장난감)/i;

  if (negativePattern.test(title)) {
    return false;
  }

  if (positivePattern.test(title)) {
    return true;
  }

  const queryText = normalizeWhitespace(String(query || '')).toLowerCase();
  return positivePattern.test(queryText) && !negativePattern.test(queryText);
}

function isSingleProductImageTitle(value) {
  const title = normalizeWhitespace(stripHtml(value)).toLowerCase();
  if (!title) {
    return false;
  }

  const multiItemPattern = /(세트|기획|증정|묶음|패키지|구성|번들|bundle|set|kit|모음|대용량|리필|샘플|사은품|행사|특가|1\s*\+\s*1|2\s*\+\s*1|2종|3종|4종|5종|6종|7종|8종|9종|10종|\d+\s*(?:개|개입|팩|p|pack))/i;
  const multiVisualPattern = /(한번에|함께|같이|전구성|풀세트|올인원|콤보|세트구성|구성품|세트상품|묶음상품)/i;

  return !(multiItemPattern.test(title) || multiVisualPattern.test(title));
}

function cleanProductTitle(value, query) {
  let title = stripHtml(value);
  title = title.replace(/\s*\+.*$/g, ' ').trim();
  if (!title) {
    return '';
  }

  const segments = title
    .split(/[|>•·/+,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > 1) {
    const queryTokens = String(query || '')
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const ranked = segments.map((segment) => {
      const lower = segment.toLowerCase();
      let score = segment.length;

      queryTokens.forEach((token) => {
        if (lower.includes(token)) {
          score += 20;
        }
      });

      if (/(세트|기획|증정|묶음|패키지|구성|베스트|best|1\s*\+\s*1|2\s*\+\s*1)/i.test(segment)) {
        score -= 40;
      }

      if (STORE_NOISE_WORDS.some((word) => lower.includes(word))) {
        score -= 25;
      }

      return { segment, score };
    });

    ranked.sort((a, b) => b.score - a.score);
    title = ranked[0].segment;
  }

  title = removeStoreNoise(title);
  title = stripNoise(title)
    .replace(/^(?:올리브영|oliveyoung|olive young|무신사|musinsa|쿠팡|coupang|11번가|g마켓|지마켓|브랜디|brandi|에이블리|ably|오늘의집|네이버쇼핑|naver shopping|스마트스토어|smartstore|공식몰|공식스토어|스토어|shop|store|mall|몰|샵|브랜드관|판매처|직영|정품)\s*/i, '');
  title = normalizeWhitespace(title);
  title = collapseRepeatedPhrase(title);
  if (!isCosmeticLikeTitle(title, query)) {
    return '';
  }
    
  // 더 강한 필터: 최대 4~5개 단어만 유지 (브랜드 + 제품명 + 색상)
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length > 5) {
    title = words.slice(0, 5).join(' ');
  }
  return title;
}

function isBundleLikeTitle(value) {
  const title = stripHtml(value).toLowerCase();
  const blockedWords = [
    '세트',
    '기획',
    '증정',
    '묶음',
    '패키지',
    '구성',
    '베스트',
    'best',
    '1+1',
    '2+1',
    '1 + 1',
    '2 + 1'
  ];

  if (/\d+\s*\+\s*\d+/.test(title)) {
    return true;
  }

  return blockedWords.some((word) => title.includes(word));
}

function isReviewLikeTitle(value) {
  const title = stripHtml(value);
  return /(파워리뷰|언니의파우치|내돈내산|찐리뷰|광고\s*없는|리뷰|후기|사용기|님의\s|\bby\b)/i.test(title);
}
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function scoreImageItem(item, query) {
  const normalizedQuery = String(query || '').toLowerCase().trim();
  const title = cleanProductTitle(item.title, query).toLowerCase();
  let score = 0;

  if (normalizedQuery && title.includes(normalizedQuery)) {
    score += 80;
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  queryTokens.forEach((token) => {
    if (title.includes(token)) {
      score += 18;
    }
  });

  const noisyWords = ['세트', '기획', '증정', '묶음', '패키지', '구성', '1+1', '2+1', 'best', '베스트'];
  noisyWords.forEach((word) => {
    if (title.includes(word)) {
      score -= 10;
    }
  });

  return score;
}

async function searchNaverImages(query) {
  const clientId = getRequiredEnv('NAVER_CLIENT_ID');
  const clientSecret = getRequiredEnv('NAVER_CLIENT_SECRET');
  const encodedQuery = encodeURIComponent(query);
  const url = `https://openapi.naver.com/v1/search/image?query=${encodedQuery}&display=20&sort=sim`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Naver image search failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  const mapped = items
    .map((item) => {
      const directImage = String(item.link || '').trim();
      const thumbImage = String(item.thumbnail || '').trim();
      const imageUrl = thumbImage || directImage;
      const rawTitle = stripHtml(item.title);
      const cleanedTitle = cleanProductTitle(item.title, query);
      return {
        rawTitle,
        title: cleanedTitle,
        imageUrl,
        link: directImage,
        mallName: '',
        brand: '',
        lprice: '',
        hprice: '',
        productId: '',
        score: scoreImageItem(item, query)
      };
    })
    .filter((item) => item.imageUrl)
    .filter((item) => item.title)
    .filter((item) => !isBundleLikeTitle(item.rawTitle))
    .filter((item) => !isReviewLikeTitle(item.rawTitle))
    .map(({ rawTitle, ...rest }) => rest);

  mapped.sort((a, b) => b.score - a.score);
  return mapped.slice(0, 8);
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: corsHeaders()
    };
    return;
  }

  const query = String((req.query && req.query.q) || '').trim();
  if (!query) {
    context.res = {
      status: 400,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      },
      body: { ok: false, message: 'q(제품명) 파라미터가 필요함' }
    };
    return;
  }

  try {
    const items = await searchNaverImages(query);
    context.res = {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      },
      body: {
        ok: true,
        query,
        count: items.length,
        items
      }
    };
  } catch (error) {
    context.log.error('Naver image search failed', error);
    context.res = {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      },
      body: {
        ok: false,
        message: '네이버 이미지 검색 실패',
        detail: error.message
      }
    };
  }
};
