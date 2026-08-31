#!/usr/bin/env bash
# Zero 2 W digital-signage kiosk  ->  https://dshaker.space/signup/
# Run as your normal user (NOT root):  bash kiosk-setup.sh
# Prep: flash Raspberry Pi OS Lite (64-bit), enable SSH + wifi in Imager first.

set -euo pipefail

SITE_URL="${KIOSK_URL:-https://dshaker.space/signup/}"
KIOSK_USER="${USER:-pi}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Updating packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Installing lean kiosk stack (no full desktop)..."
# xserver + xinit + a featherweight WM + chromium + cursor hider
sudo apt-get install -y --no-install-recommends \
    xserver-xorg xinit \
    openbox \
    chromium \
    unclutter \
    x11-xserver-utils \
    fonts-dejavu-core

echo "==> Console auto-login (boot straight to a logged-in tty)..."
# raspi-config sets console autologin for our user; edit cmdline if absent
if ! grep -q "consoleblank" /boot/firmware/cmdline.txt; then
  sudo sed -i 's/$/ consoleblank=0/' /boot/firmware/cmdline.txt   # never blank the console
fi
sudo raspi-config nonint do_boot_behaviour B2   # B2 = console autologin as current user

echo "==> Writing openbox autostart (launches kiosk on login)..."
mkdir -p ~/.config/openbox
cat > ~/.config/openbox/autostart.sh <<EOF
#!/usr/bin/env bash
# Start the kiosk browser
xset s off          # no screensaver
xset -dpms          # no display power management (monitor stays on)
xset s noblank
unclutter -idle 1 & # hide the mouse after 1s
exec chromium \\
  --kiosk \\
  --noerrdialogs \\
  --disable-infobars \\
  --check-for-update-interval=31536000 \\
  --autoplay-policy=no-user-gesture-required \\
  --app=$SITE_URL
EOF
chmod +x ~/.config/openbox/autostart.sh

echo "==> Tell X to start openbox + the autostart on 'startx'..."
cat > ~/.xinitrc <<'EOF'
exec openbox-session
EOF

# Auto-run startx from the console login for KIOSK_USER
if ! grep -q "startx" ~/.bash_profile 2>/dev/null; then
  echo '[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && exec startx' >> ~/.bash_profile
fi

echo "==> Force HDMI output (in case of blank-monitor handshake issues)..."
grep -q "hdmi_force_hotplug" /boot/firmware/config.txt || \
  sudo sh -c 'echo "hdmi_force_hotplug=1" >> /boot/firmware/config.txt'

echo
echo "DONE. Reboot:  sudo reboot"
echo "After reboot it should boot straight into the SignUp kiosk."
echo "To change the URL later: KIOSK_URL=https://your.url bash $SCRIPT_DIR/kiosk-setup.sh  (or edit ~/.config/openbox/autostart.sh)"
