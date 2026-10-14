#!/usr/bin/env python3
"""Re-embed audio/hello-*.mp3 into the HELLO table of index-1.html and index-hu.html."""
import base64, glob, json, os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = {}
for p in sorted(glob.glob(os.path.join(root, "audio", "hello-*.mp3"))):
    code = os.path.basename(p)[6:-4]
    data[code] = base64.b64encode(open(p, "rb").read()).decode()
if not data:
    sys.exit("no audio files found")
for name in ("index-1.html", "index-hu.html"):
    path = os.path.join(root, name)
    s = open(path, encoding="utf-8").read()
    new, n = re.subn(r"var HELLO = \{.*?\};\n", lambda m: "var HELLO = " + json.dumps(data) + ";\n", s, count=1, flags=re.S)
    if n != 1:
        sys.exit("HELLO table not found in " + name)
    open(path, "w", encoding="utf-8").write(new)
    print(name, "updated with", len(data), "recordings")
