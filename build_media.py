"""Generate responsive photographs and social cards from supplied/official media."""
from pathlib import Path
import json
import re
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'dist/assets'
CATALOG = ROOT / 'dist/properties.json'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def lines(draw, text, width, face):
    output, current = [], ''
    for word in text.split():
        candidate = (current + ' ' + word).strip()
        if current and draw.textlength(candidate, font=face) > width:
            output.append(current)
            current = word
        else:
            current = candidate
    return output + [current]

def social_card(photo, title, subtitle, output, home=False):
    canvas = Image.new('RGB', (1200, 630), '#202b24')
    canvas.paste(ImageOps.fit(photo.convert('RGB'), (620, 630), method=Image.Resampling.LANCZOS), (580, 0))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, 579, 629), fill='#202b24')
    logo = Image.open(ASSETS / 'ferrari-logo.png').convert('RGBA')
    logo.thumbnail((66, 76), Image.Resampling.LANCZOS)
    draw.rounded_rectangle((48, 42, 134, 135), radius=8, fill='white')
    canvas.paste(logo, (58, 50), logo)
    draw.text((155, 55), 'FERRARI', font=font(27, True), fill='white')
    draw.text((155, 92), 'ASSESSORIA IMOBILIÁRIA', font=font(14), fill='#d4dccf')
    face = font(44 if home else 42, True)
    y = 209
    for line in lines(draw, title, 484, face):
        draw.text((48, y), line, font=face, fill='white')
        y += 56
    subface = font(19)
    for line in lines(draw, subtitle, 475, subface):
        draw.text((48, y + 23), line, font=subface, fill='#cbd7c5')
        y += 29
    draw.rectangle((48, 512, 126, 516), fill='#e34146')
    draw.text((48, 541), 'ferrariassessoria.com', font=font(22), fill='white')
    draw.text((600, 596), 'Perspectiva ilustrativa', font=font(12), fill='white', stroke_width=1, stroke_fill='#202b24')
    canvas.save(output, 'JPEG', quality=90, optimize=True, progressive=True)

def main():
    props = json.loads(CATALOG.read_text())
    for prop in props:
        sources = list((ROOT / 'media-source').glob(prop['id'] + '.*'))
        originals = [p for p in sources if p.suffix.lower() in {'.jpg', '.png', '.webp', '.jpeg'}]
        source = originals[0] if originals else ROOT / 'dist' / prop['image']
        photo = Image.open(source).convert('RGB')
        variants = []
        for width in sorted({480, 960, 1600, 2000, min(photo.width, 2000)}):
            if width > photo.width:
                continue
            image = photo.resize((width, round(width * photo.height / photo.width)), Image.Resampling.LANCZOS)
            name = f"{prop['id']}-{width}.webp"
            image.save(ASSETS / name, 'WEBP', quality=82 if width <= 960 else 86, method=6)
            variants.append({'src': 'assets/' + name, 'width': width})
        prop['responsive'] = variants
        social_card(photo, prop['name'], prop['neighborhood'] + ' · ' + prop['city'] + ' | ' + prop['area'] + ' m²', ASSETS / f"social-{prop['id']}.jpg")
        if prop['id'] == 'sinfonia':
            social_card(photo, 'Seu próximo capítulo começa em casa.', 'Imóveis em São Paulo e Jundiaí. Conheça as possibilidades com a Ferrari.', ASSETS / 'og-ferrari-v2.jpg', home=True)
    CATALOG.write_text(json.dumps(props, ensure_ascii=False, indent=2) + '\n')
    logo = Image.open(ASSETS / 'ferrari-logo.png').convert('RGBA')
    for size, name in [(180, 'apple-touch-icon.png'), (512, 'icon-512.png')]:
        icon = Image.new('RGB', (size, size), 'white')
        mark = logo.copy()
        mark.thumbnail((round(size * .68), round(size * .78)), Image.Resampling.LANCZOS)
        icon.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
        icon.save(ASSETS / name, optimize=True)
    print('Responsive WebP images, 1200 × 630 social cards and touch icons generated.')

if __name__ == '__main__':
    main()
