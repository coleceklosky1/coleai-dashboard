"""Generate icon-192.png and icon-512.png for the Cole.ai PWA."""
from PIL import Image, ImageDraw
import os

NAVY = (12, 35, 64, 255)
GOLD  = (201, 168, 76, 255)
GOLD_GLOW = (201, 168, 76, 60)
WHITE = (255, 255, 255, 255)
WHITE_DIM = (255, 255, 255, 80)

def draw_atom(size):
    img = Image.new('RGBA', (size, size), NAVY)
    cx, cy = size / 2, size / 2
    rx = size * 0.38
    ry = size * 0.14
    lw = max(2, size // 64)

    rings = [
        (0,   WHITE,     int(lw * 1.1)),
        (60,  GOLD,      int(lw * 1.1)),
        (120, WHITE_DIM, int(lw * 0.85)),
    ]
    for angle, color, width in rings:
        tmp = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(tmp)
        bbox = [cx - rx, cy - ry, cx + rx, cy + ry]
        d.ellipse(bbox, outline=color, width=width)
        tmp = tmp.rotate(angle, center=(cx, cy), resample=Image.BICUBIC)
        img = Image.alpha_composite(img, tmp)

    # Nucleus glow + dot
    d = ImageDraw.Draw(img)
    r_glow = size * 0.065
    r_dot  = size * 0.045
    r_core = size * 0.022
    d.ellipse([cx-r_glow, cy-r_glow, cx+r_glow, cy+r_glow], fill=GOLD_GLOW)
    d.ellipse([cx-r_dot,  cy-r_dot,  cx+r_dot,  cy+r_dot],  fill=GOLD)
    d.ellipse([cx-r_core, cy-r_core, cx+r_core, cy+r_core], fill=WHITE)

    return img.convert('RGB')

out = os.path.dirname(os.path.abspath(__file__))
for sz in (192, 512):
    path = os.path.join(out, f'icon-{sz}.png')
    draw_atom(sz).save(path, 'PNG')
    print(f'OK {path}')
