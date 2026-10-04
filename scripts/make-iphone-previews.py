"""Compose real Lefrig screenshots into photoreal-ish iPhone frames for App Store preview."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "store-assets" / "play" / "screenshots"
OUT_DIR = Path.home() / "Desktop" / "lefrig-iphone-preview"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# iPhone 15/16 Pro-ish logical canvas
W, H = 1290, 2796
FRAME = 48
RADIUS = 180
ISLAND_W, ISLAND_H = 340, 96


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def make_background(size: tuple[int, int]) -> Image.Image:
    w, h = size
    bg = Image.new("RGB", size, (214, 223, 217))
    px = bg.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(214 + (232 - 214) * t)
        g = int(223 + (236 - 223) * t)
        b = int(217 + (228 - 217) * t)
        for x in range(w):
            # soft vignette
            cx, cy = (x / w) - 0.5, (y / h) - 0.45
            v = min(1.0, (cx * cx + cy * cy) * 1.35)
            px[x, y] = (
                int(r * (1 - 0.12 * v)),
                int(g * (1 - 0.12 * v)),
                int(b * (1 - 0.1 * v)),
            )
    return bg.filter(ImageFilter.GaussianBlur(0.6))


def compose_phone(screenshot: Path, out_name: str) -> Path:
    canvas_w, canvas_h = 1600, 2800
    canvas = make_background((canvas_w, canvas_h))

    # Scale phone to fit nicely
    phone_h = 2300
    phone_w = int(phone_h * W / H)
    phone = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(phone)

    # Outer titanium body
    body_color = (55, 58, 60, 255)
    draw.rounded_rectangle((0, 0, phone_w - 1, phone_h - 1), radius=int(RADIUS * phone_w / W), fill=body_color)

    # Inner bezel
    inset = max(10, int(FRAME * phone_w / W * 0.35))
    bezel = (18, 18, 20, 255)
    draw.rounded_rectangle(
        (inset, inset, phone_w - 1 - inset, phone_h - 1 - inset),
        radius=int((RADIUS - 20) * phone_w / W),
        fill=bezel,
    )

    # Screen area
    screen_pad = max(18, int(FRAME * phone_w / W))
    screen_box = (screen_pad, screen_pad, phone_w - screen_pad, phone_h - screen_pad)
    sw, sh = screen_box[2] - screen_box[0], screen_box[3] - screen_box[1]

    shot = Image.open(screenshot).convert("RGB")
    shot = shot.resize((sw, sh), Image.Resampling.LANCZOS)
    screen = Image.new("RGBA", (sw, sh))
    screen.paste(shot, (0, 0))
    screen.putalpha(rounded_mask((sw, sh), int((RADIUS - 40) * phone_w / W)))
    phone.paste(screen, (screen_box[0], screen_box[1]), screen)

    # Dynamic Island
    iw = int(ISLAND_W * phone_w / W)
    ih = int(ISLAND_H * phone_w / W)
    ix = (phone_w - iw) // 2
    iy = screen_pad + int(28 * phone_w / W)
    draw.rounded_rectangle((ix, iy, ix + iw, iy + ih), radius=ih // 2, fill=(8, 8, 10, 255))

    # Soft shadow under phone
    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    px = (canvas_w - phone_w) // 2
    py = (canvas_h - phone_h) // 2 + 20
    sd.rounded_rectangle(
        (px + 30, py + 50, px + phone_w - 30, py + phone_h + 10),
        radius=int(RADIUS * phone_w / W),
        fill=(20, 30, 26, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(36))
    canvas = canvas.convert("RGBA")
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(phone, (px, py), phone)

    out = OUT_DIR / out_name
    canvas.convert("RGB").save(out, "JPEG", quality=92, optimize=True)
    return out


def compose_trio() -> Path:
    files = [
        ("01-inicio.jpg", "Inicio"),
        ("06-mercado.jpg", "Mercado"),
        ("02-transporte.jpg", "Transporte"),
    ]
    phones: list[Image.Image] = []
    for name, _ in files:
        # Build each phone on transparent then crop to phone bounds
        tmp = compose_phone(SHOTS / name, f"_tmp_{name}.jpg")
        img = Image.open(tmp).convert("RGBA")
        # Approximate crop of phone area from single compose
        phones.append(img)
        tmp.unlink(missing_ok=True)

    # Simpler dedicated trio layout
    canvas_w, canvas_h = 2400, 1500
    canvas = make_background((canvas_w, canvas_h)).convert("RGBA")

    phone_h = 1180
    phone_w = int(phone_h * W / H)
    positions = [
        (220, 220),
        (canvas_w // 2 - phone_w // 2, 140),
        (canvas_w - phone_w - 220, 220),
    ]
    scales = [0.92, 1.0, 0.92]

    for (name, _), (x, y), scale in zip(files, positions, scales):
        # recreate single phone only
        single = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(single)
        draw.rounded_rectangle((0, 0, phone_w - 1, phone_h - 1), radius=int(RADIUS * phone_w / W), fill=(55, 58, 60, 255))
        pad = max(16, int(FRAME * phone_w / W))
        sw, sh = phone_w - 2 * pad, phone_h - 2 * pad
        shot = Image.open(SHOTS / name).convert("RGB").resize((sw, sh), Image.Resampling.LANCZOS)
        screen = Image.new("RGBA", (sw, sh))
        screen.paste(shot, (0, 0))
        screen.putalpha(rounded_mask((sw, sh), int((RADIUS - 36) * phone_w / W)))
        single.paste(screen, (pad, pad), screen)
        iw = int(ISLAND_W * phone_w / W * 0.85)
        ih = int(ISLAND_H * phone_w / W * 0.85)
        draw.rounded_rectangle(
            ((phone_w - iw) // 2, pad + 18, (phone_w - iw) // 2 + iw, pad + 18 + ih),
            radius=ih // 2,
            fill=(8, 8, 10, 255),
        )

        if scale != 1.0:
            nw, nh = int(phone_w * scale), int(phone_h * scale)
            single = single.resize((nw, nh), Image.Resampling.LANCZOS)
            x = x + (phone_w - nw) // 2
            y = y + (phone_h - nh) // 2

        # shadow
        shimg = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shimg)
        sd.rounded_rectangle(
            (x + 20, y + 40, x + single.width - 20, y + single.height + 8),
            radius=60,
            fill=(20, 30, 26, 55),
        )
        shimg = shimg.filter(ImageFilter.GaussianBlur(28))
        canvas = Image.alpha_composite(canvas, shimg)
        canvas.paste(single, (x, y), single)

    out = OUT_DIR / "lefrig-iphone-appstore-trio-real.jpg"
    canvas.convert("RGB").save(out, "JPEG", quality=92, optimize=True)
    return out


def main() -> None:
    outs = [
        compose_phone(SHOTS / "01-inicio.jpg", "lefrig-iphone-inicio-real.jpg"),
        compose_phone(SHOTS / "06-mercado.jpg", "lefrig-iphone-mercado-real.jpg"),
        compose_phone(SHOTS / "02-transporte.jpg", "lefrig-iphone-transporte-real.jpg"),
        compose_trio(),
    ]
    for p in outs:
        print(p)


if __name__ == "__main__":
    main()
