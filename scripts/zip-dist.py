"""Zippe dist/ pour l'envoyer dans public_html (chemins en « / », .htaccess compris).

Compress-Archive de PowerShell 5.1 écrit des « \\ » dans les chemins, ce qui casse
l'extraction sur l'hébergement Linux : d'où ce script.
"""
import pathlib
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
dist = root / "dist"
out = root / "richard-informatique-site.zip"
if not (dist / "index.html").exists():
    raise SystemExit("dist/ est vide : lancez d'abord « npm run build ».")

count = 0
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for f in sorted(dist.rglob("*")):
        if f.is_file():
            z.write(f, f.relative_to(dist).as_posix())
            count += 1
print(f"{out.name} : {count} fichiers, {out.stat().st_size / 1024:.0f} Ko")
