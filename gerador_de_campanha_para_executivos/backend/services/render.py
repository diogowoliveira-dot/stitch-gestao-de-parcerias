"""Renderização HTML → PNG via Playwright — validado no MASTER §5.1"""
import os
from uuid import uuid4
from playwright.sync_api import sync_playwright


def html_to_png(html: str, width: int, height: int, output_path: str) -> str:
    """
    Renderiza HTML em PNG usando Playwright/Chromium.
    CRÍTICO: wait_for_timeout(3000) aguarda Google Fonts — não reduzir.
    """
    tmp_path = f"/tmp/render_{uuid4()}.html"
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(html)
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(f"file://{tmp_path}")
            page.wait_for_timeout(3000)   # aguarda Google Fonts
            page.screenshot(path=output_path, full_page=False)
            browser.close()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    return output_path


def render_story(html: str, output_path: str) -> str:
    return html_to_png(html, width=1080, height=1920, output_path=output_path)


def render_post(html: str, output_path: str) -> str:
    return html_to_png(html, width=1080, height=1080, output_path=output_path)
