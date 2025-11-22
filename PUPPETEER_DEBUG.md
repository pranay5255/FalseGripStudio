# Puppeteer Debugging Guide

This guide helps you debug Puppeteer setup issues on Linux Ubuntu.

## Quick Setup Check

Run these commands to verify your environment:

```bash
# Check if Chrome/Chromium is installed
which google-chrome google-chrome-stable chromium chromium-browser

# Check Chrome version
google-chrome-stable --version

# Verify system dependencies
ldd /usr/bin/google-chrome-stable | grep "not found"
```

## Common Issues and Solutions

### 1. Chrome/Chromium Not Found

**Symptoms:**
- Error: `Executable doesn't exist`
- Warning: `Chrome/Chromium not found in common paths`

**Solutions:**

```bash
# Install Google Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt-get install -y ./google-chrome-stable_current_amd64.deb

# OR Install Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser

# Set custom path via environment variable
export CHROME_PATH=/path/to/chrome
```

### 2. Missing System Dependencies

**Symptoms:**
- Error: `Failed to launch browser`
- Error: `error while loading shared libraries`

**Solutions:**

```bash
# Install all required dependencies
sudo apt-get install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libcairo2 \
  libatspi2.0-0 \
  libxshmfence1
```

### 3. Sandbox Issues (Docker/Containers)

**Symptoms:**
- Error: `No usable sandbox`
- Error: `Failed to move to new namespace`

**Solutions:**

The code already includes `--no-sandbox` and `--disable-setuid-sandbox` flags. If issues persist:

```bash
# Run with additional flags
export PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"
```

### 4. Memory/Shared Memory Issues

**Symptoms:**
- Browser crashes
- Error: `/dev/shm` related errors

**Solutions:**

```bash
# Increase shared memory size (if using Docker)
docker run --shm-size=2g ...

# Or mount /dev/shm with more space
sudo mount -o remount,size=2G /dev/shm
```

## Debug Mode

Enable debug mode to see the browser window and detailed logs:

```bash
# Run in debug mode (non-headless)
DEBUG=true pnpm start

# Or set in .env file
echo "DEBUG=true" >> .env
```

## Verification Steps

The code includes automatic Puppeteer verification that:

1. ✅ Checks for Chrome/Chromium installation
2. ✅ Launches a test browser instance
3. ✅ Navigates to a test page
4. ✅ Verifies browser functionality
5. ✅ Provides helpful error messages

## Post-Authentication Debugging

After successful authentication, the bot logs:

- `✅ WhatsApp authentication successful.`
- `🔄 Initializing client...`
- `⏳ Loading: X% - [message]` (loading progress)
- `🔄 State changed: [state]` (state transitions)
- `🤖 WhatsApp bot is ready and waiting for messages...`
- `📊 Client info:` (client information)

## Event Listeners Added

The enhanced code includes these event listeners for debugging:

- `qr` - QR code generation
- `loading_screen` - Loading progress
- `authenticated` - Authentication success
- `auth_failure` - Authentication failure
- `ready` - Client ready
- `disconnected` - Disconnection events
- `change_state` - State changes
- `remote_session_saved` - Session save events

## Testing Puppeteer Independently

You can test Puppeteer setup independently:

```bash
# Create a test file
cat > test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable'
  });
  
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  const title = await page.title();
  console.log('Success! Page title:', title);
  await browser.close();
})();
EOF

# Run the test
node test-puppeteer.js
```

## Environment Variables

You can configure Puppeteer via environment variables:

```bash
# Set custom Chrome path
export CHROME_PATH=/usr/bin/google-chrome-stable

# Enable debug mode
export DEBUG=true

# Set Node environment
export NODE_ENV=development
```

## Troubleshooting Checklist

- [ ] Chrome/Chromium is installed and accessible
- [ ] System dependencies are installed
- [ ] Permissions are correct (executable files)
- [ ] No firewall blocking browser connections
- [ ] Sufficient disk space in `/tmp` and `/dev/shm`
- [ ] User has necessary permissions
- [ ] Not running in restricted environment (some VPS providers)

## Getting Help

If issues persist:

1. Run with `DEBUG=true` to see browser window
2. Check browser console for errors
3. Review full error stack traces
4. Verify Chrome version compatibility
5. Check system logs: `journalctl -xe` or `dmesg | tail`

