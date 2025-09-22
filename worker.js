export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Get target m3u8 URL from query param ?url=
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("Missing ?url= parameter", { status: 400 });
    }

    // Optional: add cookie header if provided
    const cookie = url.searchParams.get("cookie");

    const headers = new Headers(request.headers);
    headers.delete("host"); // prevent host mismatch
    if (cookie) {
      headers.set("Cookie", cookie);
    }

    try {
      const res = await fetch(target, { headers });
      return new Response(res.body, {
        status: res.status,
        headers: res.headers,
      });
    } catch (err) {
      return new Response("Error fetching stream: " + err.message, { status: 500 });
    }
  },
};
