function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

const ALLOWED_IMAGE_HOSTS = new Set([
  "shopping-phinf.pstatic.net",
  "shopping-phinf.pstatic.net.cdn.ntruss.com",
  "images.unsplash.com",
  "source.unsplash.com",
  "plus.unsplash.com"
]);

function isAllowedImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    return false;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return false;
  }

  return ALLOWED_IMAGE_HOSTS.has(parsed.hostname.toLowerCase());
}

module.exports = async function (context, req) {
  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers: corsHeaders()
    };
    return;
  }

  const rawUrl = String((req.query && req.query.url) || "").trim();
  if (!rawUrl) {
    context.res = {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: { ok: false, message: "url 파라미터가 필요함" }
    };
    return;
  }

  if (!isAllowedImageUrl(rawUrl)) {
    context.res = {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: { ok: false, message: "허용되지 않은 이미지 URL" }
    };
    return;
  }

  try {
    const upstream = await fetch(rawUrl, {
      method: "GET",
      headers: { "User-Agent": "cocopau-image-proxy/1.0" }
    });

    if (!upstream.ok) {
      context.res = {
        status: upstream.status,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
        body: { ok: false, message: "원본 이미지 요청 실패" }
      };
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await upstream.arrayBuffer());

    context.res = {
      status: 200,
      isRaw: true,
      headers: {
        ...corsHeaders(),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400"
      },
      body: bytes
    };
  } catch (error) {
    context.log.error("Image proxy failed", error);
    context.res = {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: { ok: false, message: "이미지 프록시 실패", detail: error.message }
    };
  }
};
