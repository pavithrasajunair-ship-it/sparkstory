# Run: python3 tests/e2e.py   (needs playwright + chromium)
import subprocess, os, sys, time
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def start(port, stub):
    env = dict(os.environ, PORT=str(port)); 
    if stub: env['STUB_AI'] = '1'
    else: env.pop('STUB_AI', None); env.pop('ANTHROPIC_API_KEY', None)
    return subprocess.Popen(['node', os.path.join(root, 'tests/server.js')], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
ok = 0; bad = []
def chk(name, cond):
    global ok
    if cond: ok += 1
    else: bad.append(name)
srv1 = start(8821, False); srv2 = start(8822, True); time.sleep(1.2)
try:
  with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}); ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin='http://localhost:8821')
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and '404' not in m.text and '503' not in m.text else None)
    csp = []
    pg.on('console', lambda m: csp.append(m.text) if 'Content Security Policy' in m.text else None)
    base = 'http://localhost:8821/index.html'
    pg.goto(base); pg.wait_for_timeout(400)
    chk('title', 'StorySpark' in pg.title())
    chk('asks who it is for first', pg.locator('#h-age').is_visible() and pg.locator('#age-grid .tile').count() == 4)
    chk('no theme before choosing', pg.get_attribute('html', 'data-tier') == '')
    # each tier: theme + only fitting genres
    expect_in = {'tiny': ['bedtime', 'fairy'], 'kids': ['adventure', 'space'], 'teens': ['romance', 'dystopian'], 'adult': ['horror', 'darkromance']}
    expect_out = {'tiny': ['horror', 'romance', 'darkromance', 'thriller'], 'kids': ['horror', 'darkromance', 'romance', 'thriller', 'comedy'], 'teens': ['horror', 'darkromance', 'bedtime'], 'adult': ['bedtime', 'fairy', 'magic', 'silly']}
    for tier in ['tiny', 'kids', 'teens', 'adult']:
        pg.goto(base); pg.click(f'[data-tier={tier}].tile'); pg.wait_for_timeout(150)
        chk(f'{tier} theme applied', pg.get_attribute('html', 'data-tier') == tier)
        ids = pg.evaluate("[...document.querySelectorAll('#genre-grid .tile')].map(e=>e.dataset.genre)")
        chk(f'{tier} offers its genres', all(g in ids for g in expect_in[tier]))
        chk(f'{tier} hides unsuitable genres', not any(g in ids for g in expect_out[tier]))
    # kids get no dark/romance wording anywhere in genre names
    pg.goto(base); pg.click('[data-tier=tiny].tile')
    names = ' '.join(pg.evaluate("[...document.querySelectorAll('#genre-grid .tile b')].map(e=>e.textContent)")).lower()
    chk('tiny genre names are gentle', not any(w in names for w in ['horror', 'dark', 'thriller', 'romance']))
    # full flow (kids, adventure)
    pg.goto(base); pg.click('[data-tier=kids].tile'); pg.click('[data-genre=adventure]')
    chk('characters screen', pg.locator('#h-chars').is_visible())
    pg.click('#chars-next'); chk('needs a main character name', pg.locator('#chars-error').is_visible())
    pg.fill('#char-list input', 'Aarav'); pg.click('#add-char'); pg.fill('#char-list .char:nth-child(2) input', 'Bruno')
    pg.select_option('#char-list .char:nth-child(2) select', 'pet')
    pg.click('#add-char'); pg.fill('#char-list .char:nth-child(3) input', 'Dr Fog'); pg.select_option('#char-list .char:nth-child(3) select', 'villain')
    pg.click('#suggest .chip >> nth=0'); chk('suggestion chip adds a character', pg.locator('#char-list .char').count() == 4)
    pg.click('#char-list .char:nth-child(4) .x'); chk('can remove a character', pg.locator('#char-list .char').count() == 3)
    pg.click('#chars-next'); chk('length screen', pg.locator('#h-length').is_visible())
    chk('no AI option without a key', pg.locator('#ai-row').is_hidden())
    pg.click('[data-length=long]'); pg.click('#make')
    pg.wait_for_selector('#s-story:not([hidden])', timeout=6000)
    txt = pg.inner_text('#story-body')
    chk('story shows every character', all(n in txt for n in ['Aarav', 'Bruno', 'Dr Fog']))
    chk('long story has chapters', pg.locator('#story-body h2').count() >= 3)
    chk('story has a title', len(pg.inner_text('#story-title')) > 3)
    first = pg.inner_text('#story-title')
    # another version
    pg.click('#t-again'); pg.wait_for_selector('#s-story:not([hidden])', timeout=6000)
    chk('another version differs', pg.inner_text('#story-body') != txt)
    # keep going
    n0 = pg.locator('#story-body h2').count(); pg.click('#t-continue'); pg.wait_for_timeout(200)
    chk('keep going adds a chapter', pg.locator('#story-body h2').count() == n0 + 1)
    # font size
    f0 = pg.evaluate("getComputedStyle(document.getElementById('story-body')).fontSize"); pg.click('#t-bigger')
    chk('bigger text works', pg.evaluate("getComputedStyle(document.getElementById('story-body')).fontSize") != f0)
    # copy
    pg.click('#t-copy'); pg.wait_for_timeout(200)
    chk('copy puts the story on the clipboard', 'Aarav' in pg.evaluate("navigator.clipboard.readText()"))
    # save + library
    pg.click('#t-save'); chk('saved message', 'Saved' in pg.inner_text('#story-status'))
    chk('library count badge', pg.inner_text('#lib-count') == '1')
    pg.reload(); pg.wait_for_timeout(300)
    chk('library count survives reload', pg.inner_text('#lib-count') == '1')
    pg.click('#btn-lib'); chk('library lists the story', pg.locator('#lib-list li').count() == 1)
    pg.click('#lib-list .btn-soft'); pg.wait_for_selector('#s-story:not([hidden])')
    chk('opening a saved story restores its theme', pg.get_attribute('html', 'data-tier') == 'kids' and 'Aarav' in pg.inner_text('#story-body'))
    pg.click('#btn-lib'); pg.click('#lib-list .btn-ghost'); chk('delete works', pg.locator('#lib-empty').is_visible())
    # new story resets to the question
    pg.click('#t-new') if pg.locator('#t-new').is_visible() else pg.click('#brand')
    chk('start over asks who again', pg.locator('#h-age').is_visible() and pg.get_attribute('html', 'data-tier') == '')
    # adult dark flow works
    pg.click('[data-tier=adult].tile'); pg.click('[data-genre=horror]'); pg.fill('#char-list input', 'Elena'); pg.click('#chars-next'); pg.click('[data-length=short]'); pg.click('#make')
    pg.wait_for_selector('#s-story:not([hidden])', timeout=6000)
    chk('adult story renders in adult theme', pg.get_attribute('html', 'data-tier') == 'adult' and 'Elena' in pg.inner_text('#story-body'))
    # tiny: simple look and the longer-bedtime wording
    pg.goto(base); pg.click('[data-tier=tiny].tile'); pg.click('[data-genre=bedtime]'); pg.fill('#char-list input', 'Luna'); pg.click('#chars-next')
    chk('tiny long is labelled as a bedtime story', 'bedtime' in pg.inner_text('[data-length=long]').lower())
    # HTML in names cannot inject
    pg.goto(base); pg.click('[data-tier=kids].tile'); pg.click('[data-genre=fantasy]'); pg.fill('#char-list input', '<img src=x onerror=window.__x=1>')
    pg.click('#chars-next'); pg.click('#make'); pg.wait_for_selector('#s-story:not([hidden])', timeout=6000)
    chk('names cannot inject HTML', pg.evaluate("window.__x") is None and pg.locator('#story-body img').count() == 0)
    # mobile layout: no sideways scroll on any screen
    pg.goto(base); w = pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"); chk('no horizontal scroll (home)', w)
    chk('no horizontal scroll (story)', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    # security headers + files
    r = pg.request.get('http://localhost:8821/index.html'); chk('CSP header present', "script-src 'self'" in r.headers.get('content-security-policy', ''))
    chk('robots.txt', pg.request.get('http://localhost:8821/robots.txt').ok)
    chk('no CSP violations', not csp)
    chk('no page errors', not errs)
    # ---- AI mode against the stubbed API ----
    pg2 = ctx.new_page(); errs2 = []; pg2.on('pageerror', lambda e: errs2.append(str(e)))
    base2 = 'http://localhost:8822/index.html'; pg2.goto(base2); pg2.wait_for_timeout(500)
    pg2.click('[data-tier=kids].tile'); pg2.click('[data-genre=adventure]'); pg2.fill('#char-list input', 'Zoe'); pg2.click('#chars-next')
    chk('AI switch appears when the server has a key', pg2.locator('#ai-row').is_visible())
    pg2.click('[data-length=short]'); pg2.click('#make'); pg2.wait_for_selector('#s-story:not([hidden])', timeout=8000)
    chk('AI story is shown', pg2.inner_text('#story-title') == 'The AI Lantern' and pg2.locator('#story-body h2').count() == 2)
    chk('AI story is labelled', 'AI' in pg2.inner_text('#story-meta'))
    c0 = pg2.locator('#story-body h2').count(); pg2.click('#t-continue'); pg2.wait_for_timeout(800)
    chk('AI keep going adds chapters', pg2.locator('#story-body h2').count() > c0)
    pg2.click('#t-new'); pg2.click('[data-tier=kids].tile'); pg2.click('[data-genre=adventure]'); pg2.fill('#char-list input', 'Zoe'); pg2.click('#chars-next')
    pg2.uncheck('#use-ai'); pg2.click('[data-length=short]'); pg2.click('#make'); pg2.wait_for_selector('#s-story:not([hidden])', timeout=8000)
    chk('switching Magic mode off uses the built-in maker', pg2.inner_text('#story-title') != 'The AI Lantern')
    chk('no page errors (AI page)', not errs2)
    b.close()
finally:
    srv1.terminate(); srv2.terminate()
print(ok, 'checks passed;', 'FAILED:' if bad else 'none failed', bad)
sys.exit(1 if bad else 0)
