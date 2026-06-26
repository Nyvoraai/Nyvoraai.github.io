#!/usr/bin/env python3
"""
generate_seo_files.py
======================
Regenerates sitemap.xml, sitemap.html, rss.xml, and llms.txt for NyvoraAI
by scanning the repo for real HTML pages and pulling title / description /
dates straight from each page's own <title>, <meta name="description">,
and Article JSON-LD schema.

Run this from the repo root:
    python3 scripts/generate_seo_files.py

In CI (GitHub Actions) it runs automatically on every push that touches
blog/ or ai-news/ — see .github/workflows/auto-seo.yml.

To add a new article: just drop the .html file into blog/ or ai-news/
with the normal <title>, meta description, and Article JSON-LD
(datePublished/dateModified) like every other article on the site.
This script picks it up automatically — no manual edits needed anywhere.
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────

BASE_URL = "https://nyvoraai.github.io"

ARTICLE_DIRS = ["ai-news", "blog"]

MAIN_PAGES = [
    ("index.html", "Home"),
    ("blog.html", "Blog"),
    ("ai-news.html", "AI News"),
    ("about.html", "About"),
    ("contact.html", "Contact"),
]

# Files to always skip even if found inside an article directory
# (stray duplicates, drafts, etc). Add filenames here as needed.
EXCLUDE_FILES = {
    "ai-news/ai-news.html",   # legacy stray duplicate of root ai-news.html
}

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sitemap_template.html")

TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────

def read(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        return f.read()


def clean_title(t):
    if not t:
        return ""
    t = re.sub(r"\s*[\|—]\s*NyvoraAI\s*$", "", t).strip()
    return t


def extract_page_data(rel_path):
    """Pull title, meta description, datePublished, dateModified from a page."""
    full_path = os.path.join(REPO_ROOT, rel_path)
    content = read(full_path)

    title_m = re.search(r"<title>([^<]*)</title>", content)
    desc_m = re.search(r'name="description"\s+content="([^"]*)"', content)
    dp_m = re.search(r'"datePublished"\s*:\s*"([^"]+)"', content)
    dm_m = re.search(r'"dateModified"\s*:\s*"([^"]+)"', content)

    title = title_m.group(1).strip() if title_m else ""
    desc = desc_m.group(1).strip() if desc_m else ""
    date_published = dp_m.group(1) if dp_m else None
    date_modified = dm_m.group(1) if dm_m else None

    # Safety net: brand-new article with no schema date yet -> use today.
    # (Articles should normally ship with real datePublished in their
    # Article JSON-LD — this is just a fallback so the build never breaks.)
    if not date_published:
        date_published = TODAY
    if not date_modified:
        date_modified = date_published

    return {
        "path": rel_path,
        "title": title,
        "desc": desc,
        "datePublished": date_published,
        "dateModified": date_modified,
    }


def discover_articles():
    """Find every real article HTML file in blog/ and ai-news/."""
    articles = []
    for d in ARTICLE_DIRS:
        dir_path = os.path.join(REPO_ROOT, d)
        if not os.path.isdir(dir_path):
            continue
        for fname in sorted(os.listdir(dir_path)):
            if not fname.endswith(".html"):
                continue
            rel_path = f"{d}/{fname}"
            if rel_path in EXCLUDE_FILES:
                continue
            articles.append(extract_page_data(rel_path))
    return articles


def discover_main_pages():
    pages = []
    for fname, label in MAIN_PAGES:
        full_path = os.path.join(REPO_ROOT, fname)
        if not os.path.exists(full_path):
            print(f"WARNING: main page {fname} not found, skipping", file=sys.stderr)
            continue
        data = extract_page_data(fname)
        data["label"] = label
        pages.append(data)
    return pages


def url_for(rel_path):
    if rel_path == "index.html":
        return BASE_URL + "/"
    return f"{BASE_URL}/{rel_path}"


def esc(s):
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def parse_date(d):
    try:
        return datetime.strptime(d, "%Y-%m-%d")
    except Exception:
        return datetime(2026, 1, 1)


def rfc822(d):
    return parse_date(d).strftime("%a, %d %b %Y 00:00:00 GMT")


# ─────────────────────────────────────────────────────────────────
# BUILDERS
# ─────────────────────────────────────────────────────────────────

def build_sitemap_xml(main_pages, articles):
    entries = []
    for p in main_pages:
        priority = "1.0" if p["path"] == "index.html" else "0.9"
        entries.append((url_for(p["path"]), TODAY, "weekly", priority))
    for a in articles:
        entries.append((url_for(a["path"]), a["dateModified"], "monthly", "0.7"))

    order = {p["path"]: i for i, p in enumerate(main_pages)}

    def sort_key(e):
        rel = e[0].replace(BASE_URL + "/", "")
        rel = "index.html" if rel == "" else rel
        return (order.get(rel, 99), rel)

    entries.sort(key=sort_key)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod, changefreq, priority in entries:
        lines += [
            "<url>",
            f"<loc>{loc}</loc>",
            f"<lastmod>{lastmod}</lastmod>",
            f"<changefreq>{changefreq}</changefreq>",
            f"<priority>{priority}</priority>",
            "</url>",
        ]
    lines.append("</urlset>")
    return "\n".join(lines) + "\n", len(entries)


def build_rss_xml(articles):
    items_with_date = [(a, a["dateModified"] or a["datePublished"]) for a in articles]
    items_with_date.sort(key=lambda x: parse_date(x[1]), reverse=True)

    rss_items = []
    for a, d in items_with_date:
        loc = url_for(a["path"])
        title = esc(clean_title(a["title"]) or a["path"])
        desc = esc(a["desc"])
        rss_items.append(
            f"<item>\n<title>{title}</title>\n<link>{loc}</link>\n"
            f'<guid isPermaLink="true">{loc}</guid>\n<pubDate>{rfc822(d)}</pubDate>\n'
            f"<description>{desc}</description>\n</item>"
        )

    build_date = rfc822(TODAY)
    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>NyvoraAI — AI News, Guides &amp; Explainers</title>
<link>{BASE_URL}/</link>
<description>Latest AI news, beginner guides, and explainers from NyvoraAI.</description>
<language>en-us</language>
<atom:link href="{BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
<lastBuildDate>{build_date}</lastBuildDate>
{chr(10).join(rss_items)}
</channel>
</rss>
"""
    return rss, len(rss_items)


def build_llms_txt(main_pages, articles):
    ai_news = sorted(
        [a for a in articles if a["path"].startswith("ai-news/")],
        key=lambda a: clean_title(a["title"]).lower(),
    )
    blog = sorted(
        [a for a in articles if a["path"].startswith("blog/")],
        key=lambda a: clean_title(a["title"]).lower(),
    )

    lines = []
    lines.append("# NyvoraAI")
    lines.append("")
    lines.append(
        "> NyvoraAI is an independent publication covering AI news, "
        "beginner-friendly guides, and explainers — written in plain "
        "language for readers of any technical background, from total "
        "beginners to professionals."
    )
    lines.append("")
    lines.append(
        "NyvoraAI publishes original articles only. Content is organized "
        "into two sections: AI News (current events, model releases, "
        "policy, and analysis) and Blog (evergreen beginner guides, "
        "explainers, and tool reviews). All content is free to read, "
        "with no paywall."
    )
    lines.append("")
    lines.append("## Main Pages")
    lines.append("")
    for p in main_pages:
        lines.append(f"- [{p['label']}]({url_for(p['path'])}): {p['desc'] or p['label']}")
    lines.append("")
    lines.append(f"## AI News ({len(ai_news)} articles)")
    lines.append("")
    for a in ai_news:
        lines.append(f"- [{clean_title(a['title'])}]({url_for(a['path'])}): {a['desc']}")
    lines.append("")
    lines.append(f"## Blog ({len(blog)} articles)")
    lines.append("")
    for a in blog:
        lines.append(f"- [{clean_title(a['title'])}]({url_for(a['path'])}): {a['desc']}")
    lines.append("")
    lines.append("## Optional")
    lines.append("")
    lines.append(f"- [Sitemap]({url_for('sitemap.html')}): Full human-readable sitemap")
    lines.append(f"- [XML Sitemap]({url_for('sitemap.xml')})")
    lines.append(f"- [RSS Feed]({url_for('rss.xml')})")

    return "\n".join(lines) + "\n", len(ai_news) + len(blog)


def build_sitemap_html(main_pages, articles):
    ai_news = sorted(
        [a for a in articles if a["path"].startswith("ai-news/")],
        key=lambda a: clean_title(a["title"]).lower(),
    )
    blog = sorted(
        [a for a in articles if a["path"].startswith("blog/")],
        key=lambda a: clean_title(a["title"]).lower(),
    )

    def li(rel_path, title):
        data_title = title.lower().replace('"', "&quot;")
        return f'<li class="sm-item" data-title="{data_title}"><a href="{rel_path}">{title}</a></li>'

    main_items = "\n".join("          " + li(p["path"], p["label"]) for p in main_pages) + "\n"
    ainews_items = "\n".join("          " + li(a["path"], clean_title(a["title"])) for a in ai_news) + "\n"
    blog_items = "\n".join("          " + li(a["path"], clean_title(a["title"])) for a in blog) + "\n"

    total = len(main_pages) + len(ai_news) + len(blog)

    with open(TEMPLATE_PATH, encoding="utf-8") as f:
        template = f.read()

    out = (
        template.replace("__TOTAL__", str(total))
        .replace("__MAIN_COUNT__", str(len(main_pages)))
        .replace("__AINEWS_COUNT__", str(len(ai_news)))
        .replace("__BLOG_COUNT__", str(len(blog)))
        .replace("__MAIN_ITEMS__", main_items)
        .replace("__AINEWS_ITEMS__", ainews_items)
        .replace("__BLOG_ITEMS__", blog_items)
    )
    return out, total


# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────

def main():
    main_pages = discover_main_pages()
    articles = discover_articles()

    if not articles:
        print("ERROR: no articles found in blog/ or ai-news/ — aborting, "
              "not overwriting existing files.", file=sys.stderr)
        sys.exit(1)

    sitemap_xml, n_urls = build_sitemap_xml(main_pages, articles)
    rss_xml, n_items = build_rss_xml(articles)
    llms_txt, n_llms = build_llms_txt(main_pages, articles)
    sitemap_html, n_total = build_sitemap_html(main_pages, articles)

    with open(os.path.join(REPO_ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(sitemap_xml)
    with open(os.path.join(REPO_ROOT, "rss.xml"), "w", encoding="utf-8") as f:
        f.write(rss_xml)
    with open(os.path.join(REPO_ROOT, "llms.txt"), "w", encoding="utf-8") as f:
        f.write(llms_txt)
    with open(os.path.join(REPO_ROOT, "sitemap.html"), "w", encoding="utf-8") as f:
        f.write(sitemap_html)

    print(f"sitemap.xml   -> {n_urls} URLs")
    print(f"rss.xml       -> {n_items} items")
    print(f"llms.txt      -> {n_llms} articles listed")
    print(f"sitemap.html  -> {n_total} pages listed")


if __name__ == "__main__":
    main()
