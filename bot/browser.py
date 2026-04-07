from __future__ import annotations

import asyncio
import sys

from playwright.async_api import async_playwright


async def open_manual_review(url: str) -> None:
    """Open a headed browser for operator-led page review."""
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        page = await browser.new_page(viewport={"width": 1440, "height": 960})
        await page.goto(url, wait_until="domcontentloaded")
        try:
            while True:
                await page.wait_for_timeout(1000)
        except KeyboardInterrupt:
            await browser.close()


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m bot.browser <url>")

    asyncio.run(open_manual_review(sys.argv[1]))


if __name__ == "__main__":
    main()

