import pdfplumber, collections, sys
pdf = pdfplumber.open(sys.argv[1] if len(sys.argv) > 1 else "pdf/SwarmFolio_Project_Report.pdf")
MM = 72 / 25.4
L, R, T, B = 31 * MM, 595.3 - 25 * MM, 20 * MM, 841.9 - 20 * MM
print(f"margins pt: left {L:.1f} right {R:.1f} top {T:.1f} bottom {B:.1f}")
sizes = collections.Counter(); fonts = collections.Counter()
for n, pg in enumerate(pdf.pages, 1):
    ch = [c for c in pg.chars if c["text"].strip()]
    if not ch: continue
    x0, x1 = min(c["x0"] for c in ch), max(c["x1"] for c in ch)
    y0, y1 = min(c["top"] for c in ch), max(c["bottom"] for c in ch)
    flags = []
    if x0 < L - 1.5: flags.append(f"left {x0:.0f}<{L:.0f}")
    if x1 > R + 1.5: flags.append(f"right {x1:.0f}>{R:.0f}")
    if y1 > B + 1.5 and n > 2: pass
    for c in ch:
        sizes[round(c["size"], 1)] += 1; fonts[c["fontname"].split("+")[-1]] += 1
    imgs = [i for i in pg.images if i["x0"] < L - 1.5 or i["x1"] > R + 1.5]
    if imgs: flags.append("image outside margins")
    if flags: print("page", n, flags)
print("font sizes:", sorted(sizes.items(), key=lambda x: -x[1])[:14])
print("fonts:", fonts.most_common(8))
