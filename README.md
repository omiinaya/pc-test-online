# MMIT Computer Testing Suite

A cross-platform web application for testing computer hardware components in repair shops. Built
with Vue 3, Node.js, and Electron for maximum compatibility across Windows, macOS, and Linux.

## Features

- **Webcam Test**: Test camera functionality with live preview and snapshot capability
- **Microphone Test**: Test audio input with volume visualization and recording playback
- **Speaker Test**: Test audio output with stereo channel testing, frequency sweeps, and music
  playback
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Electron Support**: Can be packaged as a standalone desktop application
- **Modern UI**: Beautiful, responsive interface with step-by-step testing process

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **Backend**: Node.js + Express
- **Desktop**: Electron
- **Styling**: Pure CSS with modern design patterns

## Prerequisites

- Node.js 16+ (recommended: Node.js 18+)
- npm or yarn package manager

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd mmit-testing-app
```

### 2. Install all dependencies

```bash
npm run install:all
```

This will install dependencies for the root project, frontend, and backend.

## Development

### Run the web application (recommended for development)

```bash
npm run dev
```

This starts both the backend server (port 3000) and frontend development server (port 5173).

### Run individual components

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Run as Electron app

```bash
npm run electron:dev
```

This will start the backend, wait for the frontend to be ready, then launch the Electron app.

## Building for Production

### Build web application

```bash
npm run build
```

### Build Electron application

```bash
npm run electron:build
```

This creates platform-specific installers in the `dist` folder:

- Windows: `.exe` installer
- macOS: `.dmg` installer
- Linux: `.AppImage` file

## Project Structure

```
mmit-testing-app/
├── electron/              # Electron main process
│   └── main.js
├── frontend/              # Vue 3 frontend application
│   ├── src/
│   │   ├── components/    # Test components
│   │   │   ├── WebcamTest.vue
│   │   │   ├── MicrophoneTest.vue
│   │   │   └── SpeakerTest.vue
│   │   ├── App.vue        # Main application component
│   │   └── main.js        # Vue app entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/               # Node.js backend server
│   ├── src/
│   │   └── server.js      # Express server
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## Usage

### Web Browser

1. Start the development server: `npm run dev`
2. Open your browser to `http://localhost:5173`
3. Follow the step-by-step testing process

### Desktop Application

1. Build the Electron app: `npm run electron:build`
2. Install the generated installer for your platform
3. Launch the "MMITLab Testing App" from your applications

## Testing Process

The application guides users through a 3-step testing process:

### Step 1: Webcam Test

- Requests camera permissions
- Shows live camera preview
- Allows taking test photos
- Validates camera functionality

### Step 2: Microphone Test

- Requests microphone permissions
- Shows real-time volume visualization
- Records and plays back test audio
- Validates microphone functionality

### Step 3: Speaker Test

- Tests left and right audio channels individually
- Provides frequency sweep testing
- Includes music playback test
- Volume control testing
- User validation checklist

## Browser Compatibility

- Chrome 88+ (recommended)
- Firefox 85+
- Safari 14+
- Edge 88+

**Note**: Camera and microphone testing requires HTTPS in production or localhost for development.

## API Endpoints

The backend provides several API endpoints:

- `GET /api/health` - Health check
- `POST /api/test-results` - Save test results (future use)
- `GET /api/system-info` - Get system information

## Configuration

### Environment Variables

- `NODE_ENV` - Set to 'production' for production builds
- `PORT` - Backend server port (default: 3000)

### Electron Configuration

Electron build settings can be modified in the root `package.json` under the `build` section.

## Troubleshooting

### Camera/Microphone Not Working

- Ensure browser permissions are granted
- Check if another application is using the devices
- Try refreshing the page
- For Electron app, restart the application

### Audio Not Playing

- Check system volume settings
- Ensure speakers/headphones are connected
- Try different browsers if using web version

### Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm run install:all`
- Ensure Node.js version is 16+
- Check for platform-specific build requirements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on multiple platforms
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.
