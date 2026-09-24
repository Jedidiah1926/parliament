#!/usr/bin/env python3
"""css/modern.css의 [자동 생성] 색 매핑 구역을 다시 만든다.

네온(레트로) 화면용으로 하드코딩된 색(각 페이지 CSS 클래스 규칙 + HTML/JS의 인라인 style="")을
모던(라이트/다크) 디자인 토큰으로 역할별로 옮기는 규칙을 만들어, modern.css의
/*@@GENERATED-REMAP-BEGIN@@*/ ~ /*@@GENERATED-REMAP-END@@*/ 사이를 통째로 교체한다.
새 화면을 만들며 하드코딩 색을 추가했다면 저장소 루트에서 다시 실행:

    python3 tools/gen-modern-remap.py
"""
import re, colorsys, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = 'html[data-theme-family="modern"]'

CSS_FILES = ['css/dno.css', 'css/teaser.css', 'css/main.css', 'css/roadmap.css', 'css/index.css']
INLINE_FILES = ['dno.html', 'js/dno.js', 'teaser.html', 'js/teaser.js', 'main.html', 'settings.html',
                'roadmap.html', 'js/roadmap.js', 'index.html', 'map.html']


def read(f):
    return open(os.path.join(ROOT, f), encoding='utf-8').read()


def hex_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    if len(h) != 6:
        return None
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def analyze(rgb):
    r, g, b = [x / 255 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    grey = (max(rgb) - min(rgb)) < 30
    return h * 360, l, s, grey


def hue_token(h):
    if h < 20 or h >= 330: return '--m-danger'
    if h < 65: return '--m-gold'
    if h < 170: return '--m-success'
    if h < 260: return '--m-info'
    return '--m-purple'


def role_text(rgb):
    h, l, s, grey = analyze(rgb)
    if grey:
        if l >= 0.73: return 'var(--m-text)'
        if l >= 0.5: return 'var(--m-text-2)'
        if l >= 0.3: return 'var(--m-text-3)'
        if l > 0.06: return 'var(--m-text-4)'
        return 'var(--m-on-accent)'
    if l < 0.3: return 'var(--m-text-3)'
    return f'var({hue_token(h)})'


def role_bg(rgb):
    h, l, s, grey = analyze(rgb)
    if grey:
        if l < 0.2: return 'var(--m-surface-2)'
        if l < 0.45: return 'var(--m-surface-3)'
        return None
    if l < 0.2:
        return f'color-mix(in srgb, var({hue_token(h)}) 10%, var(--m-surface))'
    return None


def role_border(rgb):
    h, l, s, grey = analyze(rgb)
    if grey:
        if l < 0.3: return 'var(--m-border)'
        if l < 0.62: return 'var(--m-border-strong)'
        return None
    if l < 0.35:
        return f'color-mix(in srgb, var({hue_token(h)}) 40%, var(--m-border))'
    return f'var({hue_token(h)})'


def role_rgba_bg(r, g, b, a):
    if r == g == b == 255 and a < 0.3:
        return f'color-mix(in srgb, var(--m-text) {round(min(a * 2, 0.3) * 100)}%, transparent)'
    return None


COLOR_RE = re.compile(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b')

# ---------------------------------------------------------------- class rules
COLOR_GUARD = ':not(:where([style^="color"],[style*=";color"],[style*="; color"],[style*=" color"]))'
BG_GUARD = ':not(:where([style*="background"]))'


def side_guard(side):
    return f':not(:where([style*="border-{side}"]))'


def prefix_selector(part, guard=''):
    part = part.strip()
    if not part or part.startswith(':root') or part.startswith('@'):
        return None
    # split trailing pseudo-element so the guard lands before it
    pe = ''
    m = re.search(r'(::?(?:before|after|placeholder|-webkit-[\w-]+|selection))$', part)
    if m and (part.endswith('::' + m.group(1).lstrip(':')) or m.group(1) in (':before', ':after')):
        pe = m.group(1)
        base = part[:m.start()]
    else:
        base = part
    if base.startswith('::'):  # bare pseudo-element e.g. ::-webkit-scrollbar
        return f'{P} {base}{pe}' if not guard else None
    if base.startswith('html'):
        rest = base[4:]
        sel = f'{P}{rest}'
    elif base.startswith('body'):
        sel = f'{P} {base}'
    elif base.startswith('*'):
        sel = f'{P} {base}'
    else:
        sel = f'{P} {base}'
    if guard and not sel.endswith(' '):
        # guards only make sense on an element that can carry style=""; skip html-level selectors
        if re.search(r'\]$', sel) and sel == P:
            return None
        sel += guard
    return sel + pe


def parse_rules(css):
    """Yield (media_prefix, selector, body) for rules, depth-aware; skips @keyframes/@font-face."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    i, n = 0, len(css)
    stack = []  # at-rule contexts
    while i < n:
        j = css.find('{', i)
        k = css.find('}', i)
        if j == -1 and k == -1:
            break
        if k != -1 and (j == -1 or k < j):
            if stack: stack.pop()
            i = k + 1
            continue
        head = css[i:j].strip()
        if head.startswith('@'):
            if head.startswith('@media') or head.startswith('@supports'):
                stack.append(head)
                i = j + 1
                continue
            # skip whole block (keyframes etc.)
            depth, p = 1, j + 1
            while depth and p < n:
                if css[p] == '{': depth += 1
                elif css[p] == '}': depth -= 1
                p += 1
            i = p
            continue
        end = css.find('}', j)
        body = css[j + 1:end]
        yield (stack[-1] if stack else None, head, body)
        i = end + 1


def decls(body):
    for d in body.split(';'):
        if ':' not in d: continue
        prop, val = d.split(':', 1)
        yield prop.strip().lower(), val.strip()


class_out = {}  # (media, prop_block_key) -> set(selectors)


def add(media, sel, decl):
    class_out.setdefault((media, decl), set()).add(sel)


for f in CSS_FILES:
    for media, head, body in parse_rules(read(f)):
        parts = [p for p in head.split(',')]
        for prop, val in decls(body):
            val_nc = re.sub(r'!important', '', val).strip()
            if prop == 'color':
                m = COLOR_RE.fullmatch(val_nc)
                if m:
                    rgb = hex_rgb(val_nc)
                    tok = role_text(rgb) if rgb else None
                    if tok:
                        for p in parts:
                            s = prefix_selector(p, COLOR_GUARD)
                            if s: add(media, s, f'color: {tok} !important;')
            elif prop in ('background', 'background-color'):
                m = COLOR_RE.fullmatch(val_nc)
                tok = None
                if m:
                    rgb = hex_rgb(val_nc)
                    tok = role_bg(rgb) if rgb else None
                else:
                    mm = re.fullmatch(r'rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)', val_nc)
                    if mm:
                        tok = role_rgba_bg(*map(int, mm.groups()[:3]), float(mm.group(4)))
                    elif ('gradient' in val_nc) and ('#000' in val_nc or '#1a202c' in val_nc or '#222' in val_nc or '#0a0c10' in val_nc):
                        tok = 'var(--m-surface-2)'
                if tok:
                    for p in parts:
                        s = prefix_selector(p, BG_GUARD)
                        if s: add(media, s, f'background: {tok} !important;')
            elif prop.startswith('border') and prop not in ('border-radius', 'border-width', 'border-collapse', 'border-spacing') \
                    and not prop.endswith('-width') and not prop.endswith('-style') and 'radius' not in prop:
                colors = COLOR_RE.findall(val_nc)
                if len(colors) != 1: continue
                rgb = hex_rgb(colors[0])
                tok = role_border(rgb) if rgb else None
                if not tok: continue
                sides = ['top', 'right', 'bottom', 'left']
                if prop in ('border', 'border-color'):
                    target = sides
                else:
                    side = prop.replace('border-', '').replace('-color', '')
                    target = [side] if side in sides else []
                for side in target:
                    for p in parts:
                        s = prefix_selector(p, side_guard(side))
                        if s: add(media, s, f'border-{side}-color: {tok} !important;')

# ---------------------------------------------------------------- inline style attributes
inline_text = '\n'.join(read(f) for f in INLINE_FILES)
styles = re.findall(r'style\s*=\s*"([^"]*)"', inline_text) + re.findall(r"style\s*=\s*'([^']*)'", inline_text)
styles += re.findall(r'style\s*=\s*\\"([^"\\]*)\\"', inline_text)

inline_rules = {}  # decl -> set(attribute selectors)


def attr_variants(substr, hexlen):
    """Attribute selectors matching substr as a whole declaration value."""
    subs = [substr]
    out = []
    for s in subs:
        esc = s.replace('"', '\\"')
        if hexlen == 3:
            for t in (';', ' ', '!'):
                out.append(f'[style*="{esc}{t}" i]')
            out.append(f'[style$="{esc}" i]')
        else:
            out.append(f'[style*="{esc}" i]')
    return out


def add_inline(sel_list, decl):
    inline_rules.setdefault(decl, set()).update(sel_list)


for st in styles:
    # color:
    for m in re.finditer(r'(^|[;\s"])(color\s*:\s*)(#[0-9a-fA-F]{3,6})\b', st):
        hx = m.group(3)
        rgb = hex_rgb(hx)
        if not rgb: continue
        tok = role_text(rgb)
        if not tok: continue
        lit = (m.group(2) + hx)
        pre = m.group(1)
        variants = []
        for v in attr_variants(lit, len(hx) - 1):
            # ensure not preceded by '-' (background-color / border-color): require ; or space or start
            base_lit = v
            variants.append(v.replace('[style*="', '[style*=";').replace('[style$="', '[style$=";'))
            variants.append(v.replace('[style*="', '[style*=" ').replace('[style$="', '[style$=" '))
            variants.append(v.replace('[style*="', '[style^="').replace('[style$="', '[style="'))
        add_inline(variants, f'color: {tok} !important;')
    # background:
    for m in re.finditer(r'(background(?:-color)?\s*:\s*)(#[0-9a-fA-F]{3,6})\b', st):
        hx = m.group(2)
        rgb = hex_rgb(hx)
        tok = role_bg(rgb) if rgb else None
        if not tok: continue
        add_inline(attr_variants(m.group(1) + hx, len(hx) - 1), f'background: {tok} !important;')
    for m in re.finditer(r'(background(?:-color)?\s*:\s*)(rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*[\d.]+\s*\))', st):
        mm = re.search(r'([\d.]+)\s*\)$', m.group(2))
        tok = role_rgba_bg(255, 255, 255, float(mm.group(1)))
        if tok: add_inline([f'[style*="{m.group(1) + m.group(2)}" i]'], f'background: {tok} !important;')
    # borders: exact "border[-side]: ... #hex" substrings
    for m in re.finditer(r'(border(?:-(top|right|bottom|left))?(?:-color)?\s*:\s*[^;"#]*?)(#[0-9a-fA-F]{3,6})\b', st):
        hx = m.group(3)
        rgb = hex_rgb(hx)
        tok = role_border(rgb) if rgb else None
        if not tok: continue
        side = m.group(2)
        lit = m.group(1) + hx
        sels = attr_variants(lit, len(hx) - 1)
        # avoid "border:..." matching inside "border-left:..." etc. — require a boundary before
        bounded = []
        for v in sels:
            bounded.append(v.replace('[style*="', '[style*=";').replace('[style$="', '[style$=";'))
            bounded.append(v.replace('[style*="', '[style*=" ').replace('[style$="', '[style$=" '))
            bounded.append(v.replace('[style*="', '[style^="').replace('[style$="', '[style="'))
        if side:
            add_inline(bounded, f'border-{side}-color: {tok} !important;')
        else:
            for sd in ('top', 'right', 'bottom', 'left'):
                add_inline([b + side_guard(sd) for b in bounded], f'border-{sd}-color: {tok} !important;')

# 스크립트가 el.style.*를 한 번이라도 건드리면 브라우저가 style 속성 전체를
# "prop: rgb(r, g, b);" 형태로 다시 직렬화하므로, 인라인에서 쓰인 모든 hex 값의 정규화 형태도 매칭
norm_text, norm_bg, norm_border = set(), set(), set()
for st in styles:
    for m in re.finditer(r'(^|[;\s"])color\s*:\s*(#[0-9a-fA-F]{3,6})\b', st): norm_text.add(m.group(2).lower())
    for m in re.finditer(r'background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})\b', st): norm_bg.add(m.group(1).lower())
    for m in re.finditer(r'border(?:-(?:top|right|bottom|left))?(?:-color)?\s*:\s*[^;"#]*?(#[0-9a-fA-F]{3,6})\b', st): norm_border.add(m.group(1).lower())
for hx in norm_text:
    rgb = hex_rgb(hx); tok = role_text(rgb) if rgb else None
    if not tok: continue
    r = f'rgb({rgb[0]}, {rgb[1]}, {rgb[2]})'
    add_inline([f'[style^="color: {r}"]', f'[style*="; color: {r}"]'], f'color: {tok} !important;')
for hx in norm_bg:
    rgb = hex_rgb(hx); tok = role_bg(rgb) if rgb else None
    if not tok: continue
    r = f'rgb({rgb[0]}, {rgb[1]}, {rgb[2]})'
    add_inline([f'[style*="background: {r}"]', f'[style*="background-color: {r}"]'], f'background: {tok} !important;')
for hx in norm_border:
    rgb = hex_rgb(hx); tok = role_border(rgb) if rgb else None
    if not tok: continue
    r = f'rgb({rgb[0]}, {rgb[1]}, {rgb[2]})'
    sels = [f'[style*="{kind} {r}"]' for kind in ('solid', 'dashed', 'dotted')]
    for sd in ('top', 'right', 'bottom', 'left'):
        add_inline([x + side_guard(sd) for x in sels], f'border-{sd}-color: {tok} !important;')

# JS style property assignments -> serialized rgb() form
for m in re.finditer(r"\.style\.(color|background|backgroundColor|borderColor)\s*=\s*'(#[0-9a-fA-F]{3,6})'", inline_text):
    prop, hx = m.groups()
    rgb = hex_rgb(hx)
    if not rgb: continue
    rgbs = f'rgb({rgb[0]}, {rgb[1]}, {rgb[2]})'
    if prop == 'color':
        tok = role_text(rgb)
        if tok: add_inline([f'[style^="color: {rgbs}"]', f'[style*="; color: {rgbs}"]'], f'color: {tok} !important;')
    elif prop in ('background', 'backgroundColor'):
        tok = role_bg(rgb)
        if tok: add_inline([f'[style*="background: {rgbs}"]', f'[style*="background-color: {rgbs}"]'], f'background: {tok} !important;')
    else:
        tok = role_border(rgb)
        if tok: add_inline([f'[style*="border-color: {rgbs}"]'], f'border-color: {tok} !important;')

# ---------------------------------------------------------------- emit
out = []
out.append('/* ======== GENERATED: hardcoded retro color -> token remap (class rules) ======== */')
by_media = {}
for (media, decl), sels in class_out.items():
    by_media.setdefault(media, {}).setdefault(decl, set()).update(sels)
for media in sorted(by_media, key=lambda x: (x is not None, x or '')):
    blocks = by_media[media]
    ind = '    ' if media else ''
    if media: out.append(f'{media} {{')
    for decl in sorted(blocks):
        sels = sorted(blocks[decl])
        out.append(ind + (',\n' + ind).join(sels) + ' {')
        out.append(f'{ind}    {decl}')
        out.append(ind + '}')
    if media: out.append('}')
out.append('')
out.append('/* ======== GENERATED: hardcoded retro color -> token remap (inline style="" attributes) ======== */')
for decl in sorted(inline_rules):
    sels = sorted(f'{P} {s}' for s in inline_rules[decl])
    out.append(',\n'.join(sels) + ' {')
    out.append(f'    {decl}')
    out.append('}')
text = '\n'.join(out) + '\n'
HEADER = ('/* ===================== 3. [자동 생성] 레트로 하드코딩 색 → 토큰 매핑 =====================\n'
          '   tools/gen-modern-remap.py로 생성 — 직접 고치지 말고 스크립트를 다시 실행할 것.\n'
          '   회색은 밝기 순위를 그대로 텍스트 위계(--m-text > -2 > -3 > -4)로, 어두운 배경은 표면색으로,\n'
          '   채도 있는 색은 색상별 의미 토큰(danger/gold/success/info/purple)으로 옮긴다.\n'
          '   정당 색 등 인라인으로 동적으로 넣은 색은 :not(:where(...)) 가드로 건드리지 않는다. */\n')
target = os.path.join(ROOT, 'css', 'modern.css')
css = open(target, encoding='utf-8').read()
b, e = '/*@@GENERATED-REMAP-BEGIN@@*/', '/*@@GENERATED-REMAP-END@@*/'
i, j = css.index(b), css.index(e)
css = css[:i + len(b)] + '\n' + HEADER + text + css[j:]
open(target, 'w', encoding='utf-8').write(css)
print(f'css/modern.css updated — class decl groups: {len(class_out)}, inline decl groups: {len(inline_rules)}, '
      f'selectors: {sum(len(v) for v in class_out.values()) + sum(len(v) for v in inline_rules.values())}')
