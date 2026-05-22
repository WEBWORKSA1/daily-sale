"""Shared HTTP client. Polite by default: 1 req / 2s per host, exponential retry."""
import time
from collections import defaultdict
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

# Full realistic Chrome header set — for sites that block bare requests (e.g. Metro/Food Basics)
BROWSER_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-CA,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "sec-ch-ua": '"Google Chrome";v="126", "Chromium";v="126", "Not?A_Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
}

_last_hit: dict[str, float] = defaultdict(lambda: 0.0)
MIN_DELAY = 2.0


def _wait(host: str) -> None:
    elapsed = time.time() - _last_hit[host]
    if elapsed < MIN_DELAY:
        time.sleep(MIN_DELAY - elapsed)
    _last_hit[host] = time.time()


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
def get(url: str, *, headers: Optional[dict] = None, timeout: float = 30) -> httpx.Response:
    host = httpx.URL(url).host
    _wait(host)
    h = {"User-Agent": USER_AGENT, "Accept-Language": "en-CA,en;q=0.9"}
    if headers:
        h.update(headers)
    with httpx.Client(http2=True, follow_redirects=True, timeout=timeout) as c:
        r = c.get(url, headers=h)
        r.raise_for_status()
        return r


def make_browser_session(timeout: float = 30) -> httpx.Client:
    """
    Returns a persistent httpx.Client that:
    - sends a full Chrome header set
    - keeps cookies across requests (needed for sites that gate on session cookies)

    Caller is responsible for closing it (use as context manager).
    """
    return httpx.Client(
        http2=True,
        follow_redirects=True,
        timeout=timeout,
        headers=BROWSER_HEADERS.copy(),
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
def session_get(client: httpx.Client, url: str, *, referer: Optional[str] = None) -> httpx.Response:
    """GET using an existing session client (cookies persist). Polite rate-limit per host."""
    host = httpx.URL(url).host
    _wait(host)
    headers = {}
    if referer:
        headers["Referer"] = referer
        headers["Sec-Fetch-Site"] = "same-origin"
    r = client.get(url, headers=headers)
    r.raise_for_status()
    return r


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
def post_json(url: str, payload: dict, *, headers: Optional[dict] = None, timeout: float = 30) -> httpx.Response:
    host = httpx.URL(url).host
    _wait(host)
    h = {"User-Agent": USER_AGENT, "Accept": "application/json", "Content-Type": "application/json"}
    if headers:
        h.update(headers)
    with httpx.Client(http2=True, follow_redirects=True, timeout=timeout) as c:
        r = c.post(url, json=payload, headers=h)
        r.raise_for_status()
        return r
