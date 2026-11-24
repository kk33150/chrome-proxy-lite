import math
import os
import struct
import zlib

SIZES = (16, 32, 48, 128)
SS = 4
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'chrome-proxy-lite', 'icons')


def dist_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / length_sq))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def draw(size, color, on):
    hi = size * SS
    acc = [[0.0, 0.0, 0.0, 0.0] for _ in range(size * size)]

    for hy in range(hi):
        ny = (hy + 0.5) / hi
        for hx in range(hi):
            nx = (hx + 0.5) / hi
            if math.hypot(nx - 0.5, ny - 0.5) > 0.42:
                continue

            if on:
                on_shape = (
                    dist_to_segment(nx, ny, 0.30, 0.51, 0.44, 0.65) < 0.055
                    or dist_to_segment(nx, ny, 0.44, 0.65, 0.71, 0.36) < 0.055
                )
            else:
                on_shape = dist_to_segment(nx, ny, 0.32, 0.5, 0.68, 0.5) < 0.06

            r, g, b = (255, 255, 255) if on_shape else color
            x, y = hx // SS, hy // SS
            cell = acc[y * size + x]
            cell[0] += r
            cell[1] += g
            cell[2] += b
            cell[3] += 255

    pixels = []
    count = SS * SS
    for r, g, b, a in acc:
        if a == 0:
            pixels.append((0, 0, 0, 0))
            continue
        pixels.append((round(r / count), round(g / count), round(b / count), round(a / count)))
    return pixels


def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path, size, color, on):
    pixels = draw(size, color, on)
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(pixels[y * size + x])

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')

    with open(path, 'wb') as handle:
        handle.write(png)
    print(path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in SIZES:
        write_png(os.path.join(OUT_DIR, f'icon{size}.png'), size, (136, 135, 128), False)
        write_png(os.path.join(OUT_DIR, f'icon{size}-on.png'), size, (29, 158, 117), True)


if __name__ == '__main__':
    main()
