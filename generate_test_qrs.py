import qrcode
import os

qrs = {
    "untrusted_ssl.png": "https://untrusted-root.badssl.com",
    "deceptive_url.png": "https://accounts.google.com-signin-secure-v2-passive@scam-url-holder.com",
    "typosquat_scam.png": "https://fifaa.com",
    "clean_safe_site.png": "https://www.fifaworldcup.com"
}

dest_dir = r"c:\Users\SAI AMOGH\Desktop\bhai"

for filename, content in qrs.items():
    path = os.path.join(dest_dir, filename)
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(content)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(path)
    print(f"Generated {filename} at {path} pointing to: {content}")
