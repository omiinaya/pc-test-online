# Bootable USB ISO Guide - MMIT QA Tools

## 🎯 **Project Goal**

Create a minimal bootable USB ISO that is UEFI compatible and can run the MMIT QA Tools Electron
application for hardware testing on any computer without requiring OS installation.

---

## 📋 **Requirements Analysis**

### **Core Requirements:**

- ✅ UEFI compatible bootable ISO
- ✅ Buildable from Windows or WSL
- ✅ Minimal footprint for fast boot
- ✅ Run Electron app for hardware testing
- ✅ Support modern hardware (webcam, microphone, speakers, touch, etc.)

### **Technical Constraints:**

- Must work on various hardware configurations
- Should boot quickly (under 60 seconds ideally)
- Needs graphics support for Electron/Chromium
- Requires audio/video device access
- Should handle different screen resolutions
- Must support USB device detection

---

## 🔍 **Solution Comparison**

### **Option 1: Alpine Linux (RECOMMENDED)**

**Pros:**

- ✅ Extremely lightweight (~150MB base)
- ✅ Fast boot times (10-30 seconds)
- ✅ Excellent UEFI support
- ✅ Strong package management (apk)
- ✅ Good hardware detection
- ✅ Can run Electron apps
- ✅ Easy to customize

**Cons:**

- ⚠️ Requires learning Alpine-specific configurations
- ⚠️ Smaller community than Ubuntu/Debian

**Build Complexity:** ⭐⭐⭐ (Medium) **Boot Speed:** ⭐⭐⭐⭐⭐ (Excellent) **Hardware Support:**
⭐⭐⭐⭐ (Very Good)

### **Option 2: Ubuntu Live CD (Custom)**

**Pros:**

- ✅ Excellent hardware support
- ✅ Large community and documentation
- ✅ Pre-built tools for live systems
- ✅ Well-tested UEFI support
- ✅ Easy Electron deployment

**Cons:**

- ❌ Larger size (~1.5GB+)
- ❌ Slower boot times (60-120 seconds)
- ❌ More complex to minimize

**Build Complexity:** ⭐⭐ (Easy) **Boot Speed:** ⭐⭐ (Slow) **Hardware Support:** ⭐⭐⭐⭐⭐
(Excellent)

### **Option 3: Buildroot (Custom Linux)**

**Pros:**

- ✅ Ultimate customization
- ✅ Minimal size (50-200MB)
- ✅ Fast boot (5-15 seconds)
- ✅ Only includes what you need

**Cons:**

- ❌ Very complex to configure
- ❌ Requires deep Linux knowledge
- ❌ Hardware driver management
- ❌ Long development time

**Build Complexity:** ⭐⭐⭐⭐⭐ (Very Hard) **Boot Speed:** ⭐⭐⭐⭐⭐ (Excellent) **Hardware
Support:** ⭐⭐ (Depends on configuration)

### **Option 4: Arch Linux Live**

**Pros:**

- ✅ Rolling release (latest drivers)
- ✅ Good hardware support
- ✅ Customizable
- ✅ Strong UEFI support

**Cons:**

- ⚠️ Steeper learning curve
- ⚠️ Less stable than LTS distros
- ⚠️ Medium size (~800MB)

**Build Complexity:** ⭐⭐⭐⭐ (Hard) **Boot Speed:** ⭐⭐⭐ (Good) **Hardware Support:** ⭐⭐⭐⭐
(Very Good)

### **Option 5: Windows PE (WinPE)**

**Pros:**

- ✅ Native Windows environment
- ✅ Excellent hardware support
- ✅ Familiar development environment
- ✅ Good UEFI support

**Cons:**

- ❌ Licensing restrictions
- ❌ Larger size (~500MB+)
- ❌ Limited customization
- ❌ Windows-only build environment

**Build Complexity:** ⭐⭐⭐ (Medium) **Boot Speed:** ⭐⭐⭐ (Good) **Hardware Support:** ⭐⭐⭐⭐⭐
(Excellent)

---

## 🏆 **RECOMMENDED SOLUTION: Alpine Linux**

Based on the requirements analysis, **Alpine Linux** provides the best balance of:

- Small size and fast boot
- UEFI compatibility
- Hardware support
- Ease of customization
- Ability to run Electron apps

---

## 📋 **Detailed Implementation Plan**

### **Phase 1: Environment Setup (Day 1)**

#### **1.1 Development Environment**

```bash
# Install required tools on Windows/WSL
# Option A: Native Windows
choco install docker-desktop
choco install git
choco install nodejs

# Option B: WSL2 Ubuntu
sudo apt update
sudo apt install docker.io git nodejs npm
sudo usermod -aG docker $USER
```

#### **1.2 Alpine Linux Development Setup**

```bash
# Create project structure
mkdir mmit-bootable-iso
cd mmit-bootable-iso
mkdir alpine-config
mkdir electron-app
mkdir scripts
mkdir output
```

### **Phase 2: Alpine Linux Base System (Day 2-3)**

#### **2.1 Create Alpine Extended ISO**

```bash
# Download Alpine Extended (includes more drivers)
wget https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-extended-3.19.0-x86_64.iso

# Create custom Alpine configuration
mkdir -p alpine-config/etc/apk
mkdir -p alpine-config/etc/init.d
mkdir -p alpine-config/home/mmit
```

#### **2.2 Custom Alpine Configuration**

**File: `alpine-config/etc/apk/repositories`**

```
https://dl-cdn.alpinelinux.org/alpine/v3.19/main
https://dl-cdn.alpinelinux.org/alpine/v3.19/community
https://dl-cdn.alpinelinux.org/alpine/edge/testing
```

**File: `alpine-config/etc/init.d/mmit-startup`**

```bash
#!/sbin/openrc-run

name="MMIT QA Tools Startup"
description="Start MMIT QA Tools Application"

start() {
    ebegin "Starting MMIT QA Tools"

    # Wait for X11 to be ready
    while ! pgrep Xorg > /dev/null; do
        sleep 1
    done

    # Start the Electron app
    su - mmit -c "cd /home/mmit/mmit-qa-tools && npm start" &

    eend $?
}

stop() {
    ebegin "Stopping MMIT QA Tools"
    pkill -f "mmit-qa-tools"
    eend $?
}
```

#### **2.3 Hardware Support Configuration**

**File: `alpine-config/etc/modprobe.d/mmit-hardware.conf`**

```
# Audio drivers
options snd-hda-intel model=auto
options snd-usb-audio index=1

# Video drivers
options i915 modeset=1
options nouveau modeset=1
options radeon modeset=1

# Webcam drivers
options uvcvideo nodrop=1
```

### **Phase 3: Electron App Integration (Day 4-5)**

#### **3.1 Prepare Electron App for Linux**

**File: `package.json` (add Linux build target)**

```json
{
  "build": {
    "linux": {
      "target": [
        {
          "target": "dir",
          "arch": ["x64"]
        }
      ],
      "category": "Utility"
    }
  },
  "scripts": {
    "build:linux": "electron-builder --linux dir",
    "build:alpine": "npm run build:linux && ./scripts/prepare-alpine.sh"
  }
}
```

#### **3.2 Alpine-Specific App Preparation**

**File: `scripts/prepare-alpine.sh`**

```bash
#!/bin/bash
set -e

echo "Building Electron app for Alpine Linux..."

# Build the app
npm run build:linux

# Create Alpine package structure
mkdir -p alpine-config/home/mmit/mmit-qa-tools
cp -r dist/linux-unpacked/* alpine-config/home/mmit/mmit-qa-tools/

# Create startup script
cat > alpine-config/home/mmit/start-mmit.sh << 'EOF'
#!/bin/sh
export DISPLAY=:0
export XDG_RUNTIME_DIR=/tmp/runtime-mmit
mkdir -p $XDG_RUNTIME_DIR
cd /home/mmit/mmit-qa-tools
./mmit-qa-tools --no-sandbox --disable-dev-shm-usage
EOF

chmod +x alpine-config/home/mmit/start-mmit.sh
```

### **Phase 4: Live System Creation (Day 6-7)**

#### **4.1 Alpine Live System Builder**

**File: `scripts/build-alpine-iso.sh`**

```bash
#!/bin/bash
set -e

ALPINE_VERSION="3.19.0"
WORK_DIR="build"
ISO_NAME="mmit-qa-tools-${ALPINE_VERSION}.iso"

echo "Building MMIT QA Tools Alpine ISO..."

# Clean previous builds
rm -rf $WORK_DIR
mkdir -p $WORK_DIR

# Extract base Alpine ISO
7z x alpine-extended-${ALPINE_VERSION}-x86_64.iso -o$WORK_DIR/

# Copy our customizations
cp -r alpine-config/* $WORK_DIR/

# Create package list for Alpine
cat > $WORK_DIR/packages.txt << 'EOF'
# Base system
alpine-base
linux-lts
linux-firmware

# Hardware support
alsa-utils
alsa-lib
eudev
mesa-dri-gallium
xf86-video-intel
xf86-video-nouveau
xf86-video-ati

# X11 and desktop
xorg-server
xf86-input-evdev
xf86-input-synaptics
openbox
chromium

# Audio/Video
pulseaudio
v4l-utils
ffmpeg

# Network
networkmanager
wireless-tools
wpa_supplicant

# Node.js for Electron
nodejs
npm

# USB and storage
udisks2
dosfstools
EOF

# Create init script for live system
cat > $WORK_DIR/init << 'EOF'
#!/bin/sh

# Mount filesystems
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev

# Setup networking
setup-interfaces -a
rc-service networking start

# Install packages
setup-apkrepos
apk update
apk add $(cat /packages.txt)

# Setup X11
rc-update add eudev sysinit
rc-update add dbus
rc-service eudev start
rc-service dbus start

# Setup user
adduser -D -h /home/mmit -s /bin/sh mmit
echo "mmit:mmit" | chpasswd

# Setup autostart
cat > /home/mmit/.xinitrc << 'XEOF'
#!/bin/sh
openbox &
sleep 2
/home/mmit/start-mmit.sh
XEOF

chmod +x /home/mmit/.xinitrc
chown -R mmit:mmit /home/mmit

# Auto-login and start X
cat > /etc/inittab << 'IEOF'
::sysinit:/sbin/rc sysinit
::wait:/sbin/rc boot
tty1::respawn:/bin/login -f mmit
tty2::askfirst:/bin/sh
::ctrlaltdel:/sbin/reboot
::shutdown:/sbin/rc shutdown
IEOF

# Start X automatically
echo "startx" >> /home/mmit/.profile

exec /sbin/init
EOF

chmod +x $WORK_DIR/init

# Build the ISO
genisoimage -r -J -b isolinux/isolinux.bin -c isolinux/boot.cat \
    -no-emul-boot -boot-load-size 4 -boot-info-table \
    -eltorito-alt-boot -e boot/grub/efi.img -no-emul-boot \
    -o output/$ISO_NAME $WORK_DIR/

echo "ISO created: output/$ISO_NAME"
```

### **Phase 5: UEFI Compatibility (Day 8)**

#### **5.1 UEFI Boot Configuration**

**File: `alpine-config/boot/grub/grub.cfg`**

```
set timeout=5
set default=0

menuentry "MMIT QA Tools Live" {
    linux /boot/vmlinuz-lts root=/dev/ram0 init=/init modules=loop,squashfs,sd-mod,usb-storage quiet
    initrd /boot/initramfs-lts
}

menuentry "MMIT QA Tools Live (Safe Mode)" {
    linux /boot/vmlinuz-lts root=/dev/ram0 init=/init modules=loop,squashfs,sd-mod,usb-storage nomodeset vga=normal
    initrd /boot/initramfs-lts
}
```

#### **5.2 Secure Boot Considerations**

**File: `scripts/sign-for-secure-boot.sh`**

```bash
#!/bin/bash
# Note: This requires proper certificates for production use

echo "Creating self-signed certificate for testing..."
openssl req -new -x509 -newkey rsa:2048 -keyout secure-boot.key \
    -out secure-boot.crt -nodes -days 365 \
    -subj "/CN=MMIT QA Tools Test Certificate"

# Sign the kernel and bootloader
sbsign --key secure-boot.key --cert secure-boot.crt \
    --output vmlinuz-lts.signed vmlinuz-lts

echo "Note: For production, use proper Microsoft-trusted certificates"
```

### **Phase 6: Testing and Validation (Day 9-10)**

#### **6.1 Virtual Machine Testing**

**File: `scripts/test-in-vm.sh`**

```bash
#!/bin/bash

echo "Testing ISO in QEMU with UEFI..."

# Test UEFI boot
qemu-system-x86_64 \
    -enable-kvm \
    -m 2048 \
    -boot d \
    -cdrom output/mmit-qa-tools-*.iso \
    -bios /usr/share/ovmf/OVMF.fd \
    -netdev user,id=net0 \
    -device e1000,netdev=net0 \
    -display gtk \
    -usb \
    -device usb-tablet

echo "Test completed. Check for:"
echo "1. UEFI boot successful"
echo "2. Hardware detection working"
echo "3. Electron app starts automatically"
echo "4. All device tests functional"
```

#### **6.2 Physical Hardware Testing Checklist**

- [ ] UEFI boot on modern laptops
- [ ] Legacy BIOS compatibility (if needed)
- [ ] Webcam detection and functionality
- [ ] Microphone and speaker detection
- [ ] Touchscreen support (if available)
- [ ] Keyboard and mouse functionality
- [ ] Battery status reporting
- [ ] Network connectivity
- [ ] USB device detection
- [ ] Different screen resolutions

### **Phase 7: Optimization and Polish (Day 11-12)**

#### **7.1 Boot Time Optimization**

**Techniques:**

- Remove unnecessary kernel modules
- Optimize init scripts
- Use compressed filesystem (SquashFS)
- Parallel service startup
- Preload critical libraries

#### **7.2 Size Optimization**

**File: `scripts/optimize-size.sh`**

```bash
#!/bin/bash

echo "Optimizing ISO size..."

# Remove unnecessary files
find $WORK_DIR -name "*.doc" -delete
find $WORK_DIR -name "*.pdf" -delete
find $WORK_DIR -path "*/man/*" -delete
find $WORK_DIR -path "*/doc/*" -delete

# Strip binaries
find $WORK_DIR -type f -executable -exec strip {} \; 2>/dev/null || true

# Compress with better ratio
mksquashfs $WORK_DIR/usr $WORK_DIR/usr.squashfs -comp xz -Xdict-size 100%

echo "Size optimization complete"
```

---

## 🛠️ **Build Process Summary**

### **Complete Build Command**

```bash
# 1. Clone the project
git clone <repo-url>
cd mmit-qa-tools

# 2. Build the Electron app
npm install
npm run build:alpine

# 3. Build the bootable ISO
./scripts/build-alpine-iso.sh

# 4. Test the ISO
./scripts/test-in-vm.sh

# 5. Create USB stick
dd if=output/mmit-qa-tools-*.iso of=/dev/sdX bs=4M status=progress
```

---

## 📊 **Expected Results**

### **ISO Specifications:**

- **Size:** ~200-300MB
- **Boot Time:** 15-45 seconds
- **Memory Usage:** 512MB-1GB RAM minimum
- **UEFI Compatible:** Yes
- **Secure Boot:** Optional (requires proper certificates)

### **Hardware Support:**

- Modern laptops and desktops
- USB webcams and built-in cameras
- Audio devices (ALSA/PulseAudio)
- Touchscreens and tablets
- Network adapters (WiFi/Ethernet)
- Battery reporting on laptops

---

## 🔧 **Troubleshooting Guide**

### **Common Issues:**

#### **ISO Won't Boot**

- Check UEFI settings in BIOS
- Verify secure boot status
- Try different USB creation method
- Test with legacy BIOS mode

#### **Electron App Won't Start**

- Check X11 display configuration
- Verify Node.js installation
- Check file permissions
- Review system logs (`dmesg`, `/var/log/messages`)

#### **Hardware Not Detected**

- Add specific kernel modules
- Update firmware packages
- Check device permissions
- Verify driver loading

### **Debug Commands:**

```bash
# Check hardware detection
lspci -v
lsusb -v
dmesg | grep -i error

# Check services
rc-status
ps aux

# Check X11
xrandr
xdpyinfo
```

---

## 🚀 **Next Steps After Completion**

1. **Automated Testing Pipeline**
2. **Hardware Compatibility Database**
3. **User Documentation**
4. **Distribution Packaging**
5. **Update Mechanism**
6. **Certification Process**

This plan provides a comprehensive roadmap to create a bootable UEFI-compatible ISO that can run
your MMIT QA Tools application for hardware testing purposes.
