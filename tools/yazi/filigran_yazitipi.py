"""
CV filigranı için gömülecek yazı tipi: Source Sans 3 (OFL) alt kümesi, TTF.
Depodaki WOFF2'den üretilir ve TypeScript modülüne base64 olarak yazılır (Workers'ta dosya sistemi yok).
Kullanım: python3 tools/yazi/filigran_yazitipi.py
"""
import base64, io, pathlib
from fontTools.ttLib import TTFont
from fontTools import subset

kok = pathlib.Path(__file__).resolve().parents[2]
kaynak = kok / 'src/app/fontlar/SourceSans3Regular.woff2'
font = TTFont(str(kaynak))
font.flavor = None
harfler = ''.join(chr(c) for c in range(0x20, 0x7f)) + 'çÇğĞıİöÖşŞüÜâÂîÎûÛ·’“”–—₺'
ayar = subset.Options()
ayar.layout_features = []
ayar.name_IDs = ['*']
ayar.notdef_outline = True
alt = subset.Subsetter(ayar)
alt.populate(text=harfler)
alt.subset(font)
tampon = io.BytesIO()
font.save(tampon)
veri = tampon.getvalue()
hedef = kok / 'src/altyapi/filigranYaziTipi.ts'
hedef.write_text(
    '/* Otomatik üretildi: tools/yazi/filigran_yazitipi.py — Source Sans 3 (SIL Open Font License 1.1) alt kümesi, TTF. */\n'
    f'export const FILIGRAN_YAZI_TIPI = \'{base64.b64encode(veri).decode()}\'\n'
)
print(hedef, len(veri), 'bayt')
