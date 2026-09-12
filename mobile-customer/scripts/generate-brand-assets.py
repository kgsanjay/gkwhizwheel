#!/usr/bin/env python3
"""
Generate official GK WhizWheel brand assets adhering to the F4 theme:
- Primary Gold/Amber: #F59E0B (245, 158, 11)
- Primary Dark:       #D97706 (217, 119, 6)
- Deep Navy:          #0F172A (15, 23, 42)
- Accent Teal:        #10B981 (16, 185, 129)
- White:              #FFFFFF (255, 255, 255)
"""

import os
import struct
import zlib
import math

def write_png(filepath, width, height, pixel_fn):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type: None
        for x in range(width):
            r, g, b, a = pixel_fn(x, y, width, height)
            raw_data.extend([r, g, b, a])

    compressed = zlib.compress(bytes(raw_data), level=9)

    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')

    with open(filepath, 'wb') as f:
        f.write(header + ihdr + idat + iend)

# Color tokens
NAVY = (15, 23, 42, 255)       # #0F172A
GOLD = (245, 158, 11, 255)     # #F59E0B
DARK_GOLD = (217, 119, 6, 255) # #D97706
WHITE = (255, 255, 255, 255)
EMERALD = (16, 185, 129, 255)  # #10B981
TRANSPARENT = (0, 0, 0, 0)

def draw_whizwheel_emblem(x, y, w, h, bg_color=NAVY, fg_color=GOLD, accent_color=WHITE, is_mono=False):
    cx = w / 2.0
    cy = h / 2.0
    dx = x - cx
    dy = y - cy
    dist = math.sqrt(dx * dx + dy * dy)
    angle = math.atan2(dy, dx) # -pi to pi

    # Outer radius
    outer_r = min(w, h) * 0.42
    inner_ring_outer = outer_r * 0.95
    inner_ring_inner = outer_r * 0.76
    hub_r = outer_r * 0.32

    # Background
    base_color = bg_color

    # Wheel tire & gear teeth outer rim
    if inner_ring_inner <= dist <= outer_r:
        # Radial gear teeth / spokes effect (8 spokes)
        spoke_wave = math.cos(8 * angle)
        if dist > inner_ring_outer and spoke_wave > 0.3:
            return fg_color
        elif dist <= inner_ring_outer:
            return fg_color

    # Inner wheel ring groove
    groove_r1 = outer_r * 0.81
    groove_r2 = outer_r * 0.85
    if groove_r1 <= dist <= groove_r2:
        return DARK_GOLD if not is_mono else base_color

    # Central Hub
    if dist <= hub_r:
        hub_groove = hub_r * 0.78
        if dist >= hub_groove:
            return fg_color
        else:
            return fg_color if not is_mono else fg_color

    # 6 Dynamic Spokes connecting Hub to Rim
    if hub_r < dist < inner_ring_inner:
        spoke_angle_step = (2 * math.pi) / 6.0
        normalized_angle = (angle + 2 * math.pi) % (2 * math.pi)
        spoke_idx = round(normalized_angle / spoke_angle_step)
        target_spoke_angle = spoke_idx * spoke_angle_step
        angle_diff = abs(normalized_angle - target_spoke_angle)
        if angle_diff > math.pi:
            angle_diff = 2 * math.pi - angle_diff

        spoke_half_width = 0.08 # radians
        if angle_diff < spoke_half_width:
            return fg_color

    # Central stylized "W" / chevron insignia at the center
    # Coordinate relative to center normalized (-1 to 1) in hub
    nx = dx / hub_r
    ny = dy / hub_r

    if abs(nx) <= 0.65 and abs(ny) <= 0.65 and dist < hub_r * 0.7:
        # Draw a sharp, modern WhizWheel 'W' wings
        # Left wing: line from (-0.45, -0.3) to (-0.2, 0.35)
        # Center peak: to (0.0, -0.1)
        # Right dip: to (0.2, 0.35)
        # Right wing: to (0.45, -0.3)
        thickness = 0.14
        d1 = abs(ny - (1.3 * nx + 0.28))
        d2 = abs(ny - (-1.8 * nx - 0.1))
        d3 = abs(ny - (1.8 * nx - 0.1))
        d4 = abs(ny - (-1.3 * nx + 0.28))

        is_w = False
        if -0.48 <= nx <= -0.18 and d1 < thickness:
            is_w = True
        elif -0.22 <= nx <= 0.02 and d2 < thickness:
            is_w = True
        elif -0.02 <= nx <= 0.22 and d3 < thickness:
            is_w = True
        elif 0.18 <= nx <= 0.48 and d4 < thickness:
            is_w = True

        if is_w:
            return accent_color if not is_mono else fg_color

    return base_color

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, '..', 'assets')
    os.makedirs(assets_dir, exist_ok=True)

    print("Generating official GK WhizWheel brand assets...")

    # 1. Main Icon (1024x1024)
    icon_path = os.path.join(assets_dir, 'icon.png')
    print(f"-> Generating {icon_path} (1024x1024)...")
    write_png(icon_path, 1024, 1024, lambda x, y, w, h: draw_whizwheel_emblem(x, y, w, h, bg_color=NAVY, fg_color=GOLD, accent_color=WHITE))

    # 2. Splash Icon (1024x1024)
    splash_path = os.path.join(assets_dir, 'splash-icon.png')
    print(f"-> Generating {splash_path} (1024x1024)...")
    write_png(splash_path, 1024, 1024, lambda x, y, w, h: draw_whizwheel_emblem(x, y, w, h, bg_color=NAVY, fg_color=GOLD, accent_color=WHITE))

    # 3. Android Adaptive Foreground (512x512, transparent background)
    fg_path = os.path.join(assets_dir, 'android-icon-foreground.png')
    print(f"-> Generating {fg_path} (512x512)...")
    write_png(fg_path, 512, 512, lambda x, y, w, h: draw_whizwheel_emblem(x, y, w, h, bg_color=TRANSPARENT, fg_color=GOLD, accent_color=WHITE))

    # 4. Android Adaptive Background (512x512, solid Navy)
    bg_path = os.path.join(assets_dir, 'android-icon-background.png')
    print(f"-> Generating {bg_path} (512x512)...")
    write_png(bg_path, 512, 512, lambda x, y, w, h: NAVY)

    # 5. Android Adaptive Monochrome (512x512, transparent background with pure white emblem)
    mono_path = os.path.join(assets_dir, 'android-icon-monochrome.png')
    print(f"-> Generating {mono_path} (512x512)...")
    write_png(mono_path, 512, 512, lambda x, y, w, h: draw_whizwheel_emblem(x, y, w, h, bg_color=TRANSPARENT, fg_color=WHITE, accent_color=TRANSPARENT, is_mono=True))

    # 6. Web Favicon (48x48)
    favicon_path = os.path.join(assets_dir, 'favicon.png')
    print(f"-> Generating {favicon_path} (48x48)...")
    write_png(favicon_path, 48, 48, lambda x, y, w, h: draw_whizwheel_emblem(x, y, w, h, bg_color=NAVY, fg_color=GOLD, accent_color=WHITE))

    print("All GK WhizWheel brand assets generated successfully!")

if __name__ == '__main__':
    main()
