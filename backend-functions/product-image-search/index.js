function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required app setting: ${name}`);
  }
  return String(value).trim();
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function scoreImageItem(item, query) {
  const normalizedQuery = String(query || "").toLowerCase().trim();
  const title = stripHtml(item.title).toLowerCase();
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

  if (title.includes("올리브영") || title.includes("olive")) {
    score += 12;
  }

  const noisyWords = ["세트", "기획", "증정", "묶음", "리필", "샘플", "미니"];
  noisyWords.forEach((word) => {
    if (title.includes(word)) {
      score -= 10;
    }
  });

  return score;
}

async function searchNaverImages(query) {
  const clientId = getRequiredEnv("NAVER_CLIENT_ID");
  const clientSecret = getRequiredEnv("NAVER_CLIENT_SECRET");
  const encodedQuery = encodeURIComponent(query);
  const url = `https://openapi.naver.com/v1/search/image?query=${encodedQuery}&display=20&sort=sim`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret
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
      const directImage = String(item.link || "").trim();
      const thumbImage = String(item.thumbnail || "").trim();
      const imageUrl = directImage || thumbImage;
      return {
        title: stripHtml(item.title),
        imageUrl,
        link: directImage,
        mallName: "",
        brand: "",
        lprice: "",
        hprice: "",
        productId: "",
        score: scoreImageItem(item, query)
      };
    })
    .filter((item) => item.imageUrl);

  mapped.sort((a, b) => b.score - a.score);
  return mapped.slice(0, 8);
}

module.exports = async function (context, req) {
  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers: corsHeaders()
    };
    return;
  }

  const query = String((req.query && req.query.q) || "").trim();
  if (!query) {
    context.res = {
      status: 400,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      },
      body: { ok: false, message: "q(제품명) 파라미터가 필요함" }
    };
    return;
  }

  try {
    const items = await searchNaverImages(query);
    context.res = {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      },
      body: {
        ok: true,
        query,
        count: items.length,
        items
      }
    };
  } catch (error) {
    context.log.error("Naver image search failed", error);
    context.res = {
      status: 500,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      },
      body: {
        ok: false,
        message: "네이버 이미지 검색 실패",
        detail: error.message
      }
    };
  }
};
