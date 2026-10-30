import json, re, subprocess, sys, os
R = os.path.dirname(os.path.abspath(__file__))
docx = sys.argv[1]
subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", R + "/pdf", docx], check=True, capture_output=True)
pdf = R + "/pdf/" + os.path.basename(docx).replace(".docx", ".pdf")
txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout.split("\f")
if txt and not txt[-1].strip(): txt = txt[:-1]
norm = lambda s: re.sub(r"\s+", " ", s).strip()
lines = [[norm(l) for l in p.splitlines() if l.strip()] for p in txt]
first = lambda i: lines[i][0] if lines[i] else ""
lay = json.load(open(R + "/layout.json"))
rom = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"]
def find_first(pred, start=0):
    for i in range(start, len(lines)):
        if pred(i): return i
    return None
ab = find_first(lambda i: first(i) == "ABSTRACT")
ch1 = find_first(lambda i: first(i) == "Chapter 1")
pages = {}
roman = lambda i: rom[i - ab + 1]
arab = lambda i: i - ch1 + 1
for key, title in [("abstract", "ABSTRACT"), ("declaration", "DECLARATION"), ("ack", "ACKNOWLEDGEMENT"), ("lot", "LIST OF TABLES"), ("lof", "LIST OF FIGURES")]:
    i = find_first(lambda i: first(i) == title, ab); pages[key] = roman(i) if i is not None else "?"
for key, title in [("pos", "B.M.S. College of Engineering."), ("refs", "REFERENCES"), ("appA", "APPENDIX A:"), ("appB", "APPENDIX B:"), ("appC", "APPENDIX C:")]:
    i = find_first(lambda i: first(i).startswith(title), ch1); pages[key] = arab(i) if i is not None else "?"
for h in lay["heads"]:
    if h["level"] == 1:
        i = find_first(lambda i: first(i) == f"Chapter {h['num']}", ch1)
    else:
        pre = norm(h["num"] + " " + h["title"])[:28]
        i = find_first(lambda i: any(l.startswith(pre) for l in lines[i]), ch1)
    pages[h["key"]] = arab(i) if i is not None else "?"
for e in lay["figs"] + lay["tabs"]:
    i = find_first(lambda i: any(l.startswith(e["label"] + ":") for l in lines[i]), ch1)
    pages[e["key"]] = arab(i) if i is not None else "?"
json.dump(pages, open(R + "/pages.json", "w"), indent=1)
missing = [k for k, v in pages.items() if v == "?"]
print("pdf pages:", len(lines), "abstract idx", ab, "chapter1 idx", ch1, "last page", arab(len(lines) - 1), "missing:", missing)
print("front pages:", {k: pages[k] for k in ("abstract", "declaration", "ack", "lot", "lof")})
