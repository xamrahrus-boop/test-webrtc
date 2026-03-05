// WebRTC Configuration
const RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

console.log('WebRTC App script loaded');

// Global state
let localStream = null;
let peerConnection = null;
let ws = null;
let peerId = null;
let remotePeerId = null;
let incomingCall = null;
let isAudioEnabled = true;
let isVideoEnabled = true;

// DOM elements (will be initialized after DOM is ready)
let localVideo = null;
let remoteVideo = null;
let statusEl = null;
let peerIdInput = null;
let copyPeerIdBtn = null;
let remotePeerIdInput = null;
let callPeerBtn = null;
let peersList = null;
let noPeersDiv = null;
let toggleAudioBtn = null;
let toggleVideoBtn = null;
let toggleScreenBtn = null;
let hangupBtn = null;
let callModal = null;
let acceptCallBtn = null;
let rejectCallBtn = null;
let incomingCallerIdEl = null;
let videoDeviceSelect = null;
let audioDeviceSelect = null;
let enableMediaBtn = null;
let mediaStatusEl = null;

function getDOMElements() {
  console.log('Getting DOM elements...');
  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');
  statusEl = document.getElementById('status');
  peerIdInput = document.getElementById('peerId');
  copyPeerIdBtn = document.getElementById('copyPeerId');
  remotePeerIdInput = document.getElementById('remotePeerId');
  callPeerBtn = document.getElementById('callPeer');
  peersList = document.getElementById('peersList');
  noPeersDiv = document.getElementById('noPeers');
  toggleAudioBtn = document.getElementById('toggleAudio');
  toggleVideoBtn = document.getElementById('toggleVideo');
  toggleScreenBtn = document.getElementById('toggleScreen');
  hangupBtn = document.getElementById('hangup');
  callModal = document.getElementById('callModal');
  acceptCallBtn = document.getElementById('acceptCall');
  rejectCallBtn = document.getElementById('rejectCall');
  incomingCallerIdEl = document.getElementById('incomingCallerId');
  videoDeviceSelect = document.getElementById('videoDevice');
  audioDeviceSelect = document.getElementById('audioDevice');
  enableMediaBtn = document.getElementById('enableMedia');
  mediaStatusEl = document.getElementById('mediaStatus');
  
  console.log('DOM elements loaded:', {
    localVideo: !!localVideo,
    videoDeviceSelect: !!videoDeviceSelect,
    audioDeviceSelect: !!audioDeviceSelect,
    enableMediaBtn: !!enableMediaBtn,
    mediaStatusEl: !!mediaStatusEl
  });
}

// Initialize
async function initialize() {
  try {
    console.log('Initializing app...');
    
    // Get DOM elements first
    getDOMElements();
    
    // Generate unique peer ID
    peerId = generatePeerId();
    peerIdInput.value = peerId;
    console.log('Peer ID generated:', peerId);

    // Enumerate media devices
    console.log('Enumerating media devices...');
    await enumerateMediaDevices();
    console.log('Device enumeration complete');

    // Connect to WebSocket
    console.log('Connecting to WebSocket...');
    connectWebSocket();

    // Setup event listeners
    console.log('Setting up event listeners...');
    setupEventListeners();

    console.log('Initialization complete');
    updateStatus('Готово', true);
  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus('Ошибка: ' + error.message, false);
  }
}

function generatePeerId() {
  return 'peer-' + Math.random().toString(36).substr(2, 9);
}

async function enumerateMediaDevices() {
  try {
    console.log('Starting device enumeration...');
    
    // Special handling for iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    console.log('Device:', { isIOS, isSafari });
    
    if (isIOS && isSafari) {
      console.log('iOS Safari detected - using simplified device enumeration');
      // On iOS Safari, detailed device info is limited, so we'll just show generic options
      videoDeviceSelect.innerHTML = '<option value="">Камера</option><option value="user">Фронтальная</option>';
      audioDeviceSelect.innerHTML = '<option value="">Микрофон</option><option value="user">По умолчанию</option>';
      videoDeviceSelect.value = 'user';
      audioDeviceSelect.value = 'user';
      mediaStatusEl.textContent = '✓ iOS: камера и микрофон доступны';
      mediaStatusEl.className = 'media-status success';
      return;
    }
    
    // Try to enumerate devices (don't request permissions yet)
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log('Devices found:', devices);
    
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const audioDevices = devices.filter(device => device.kind === 'audioinput');

    console.log('Video devices:', videoDevices.length, 'Audio devices:', audioDevices.length);

    // Populate video devices
    videoDeviceSelect.innerHTML = '<option value="">Выбрать камеру...</option>';
    videoDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Камера ${index + 1}`;
      videoDeviceSelect.appendChild(option);
      console.log('Added video device:', option.text);
    });

    // Populate audio devices
    audioDeviceSelect.innerHTML = '<option value="">Выбрать микрофон...</option>';
    audioDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Микрофон ${index + 1}`;
      audioDeviceSelect.appendChild(option);
      console.log('Added audio device:', option.text);
    });

    // Auto-select first devices
    if (videoDevices.length > 0) {
      videoDeviceSelect.value = videoDevices[0].deviceId;
    }
    if (audioDevices.length > 0) {
      audioDeviceSelect.value = audioDevices[0].deviceId;
    }

    if (videoDevices.length === 0 || audioDevices.length === 0) {
      mediaStatusEl.textContent = `⚠️ Найдено: ${videoDevices.length} камер, ${audioDevices.length} микрофонов`;
      mediaStatusEl.className = 'media-status';
    } else {
      mediaStatusEl.textContent = `✓ Найдено: ${videoDevices.length} камер, ${audioDevices.length} микрофонов`;
      mediaStatusEl.className = 'media-status success';
    }
  } catch (error) {
    console.error('Error enumerating devices:', error);
    mediaStatusEl.textContent = '❌ Ошибка при поиске устройств: ' + error.message;
    mediaStatusEl.className = 'media-status error';
  }
}

async function enableMedia() {
  try {
    console.log('Enabling media...');
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    console.log('Platform:', { isIOS, isSafari });

    // Stop existing stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
    }

    let constraints;
    
    if (isIOS && isSafari) {
      // iOS Safari: simplified constraints
      console.log('Using iOS Safari constraints');
      constraints = {
        video: {
          width: { max: 640 },
          height: { max: 480 }
        },
        audio: true
      };
    } else {
      // Desktop/Android: full constraints with deviceId
      const videoDeviceId = videoDeviceSelect.value;
      const audioDeviceId = audioDeviceSelect.value;

      if (!videoDeviceId || !audioDeviceId) {
        showMediaError('Выберите камеру и микрофон');
        return;
      }

      constraints = {
        video: videoDeviceId ? {
          deviceId: { exact: videoDeviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : { width: { max: 640 }, height: { max: 480 } },
        audio: audioDeviceId ? {
          deviceId: { exact: audioDeviceId }
        } : true
      };
    }

    console.log('Requesting media with constraints:', constraints);

    // Get new stream
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.warn('First attempt failed, trying fallback constraints:', error.name);
      
      // Fallback: simpler constraints
      if (!isIOS) {
        constraints = {
          video: { width: { max: 640 }, height: { max: 480 } },
          audio: true
        };
        console.log('Trying fallback constraints:', constraints);
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        throw error;
      }
    }

    localStream = stream;
    console.log('Media stream obtained:', localStream);
    
    if (localVideo) {
      localVideo.srcObject = localStream;
    }

    // Enable control buttons
    if (toggleAudioBtn) toggleAudioBtn.disabled = false;
    if (toggleVideoBtn) toggleVideoBtn.disabled = false;
    if (toggleScreenBtn) toggleScreenBtn.disabled = false;
    if (callPeerBtn) callPeerBtn.disabled = false;

    mediaStatusEl.textContent = '✓ Камера и микрофон включены';
    mediaStatusEl.className = 'media-status success';

    showMediaSuccess('Камера и микрофон готовы!');
    console.log('Local media enabled successfully');
  } catch (error) {
    console.error('Error enabling media:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    let errorMsg = error.message;
    if (error.name === 'NotAllowedError') {
      errorMsg = 'Нет доступа. Разрешите камеру и микрофон в настройках браузера.';
    } else if (error.name === 'NotFoundError') {
      errorMsg = 'Устройство не найдено. Проверьте камеру и микрофон.';
    } else if (error.name === 'NotReadableError') {
      errorMsg = 'Устройство занято. Закройте другие приложения.';
    } else if (error.name === 'PermissionDeniedError' || error.name === 'SecurityError') {
      errorMsg = 'Требуется HTTPS для доступа к медиа-устройствам.';
    } else if (error.name === 'TypeError') {
      errorMsg = 'Ошибка типа. Убедитесь, что вы используете HTTPS.';
    }
    
    showMediaError(errorMsg);
  }
}

function showMediaError(message) {
  mediaStatusEl.textContent = message;
  mediaStatusEl.className = 'media-status error';
}

function showMediaSuccess(message) {
  mediaStatusEl.textContent = '✓ ' + message;
  mediaStatusEl.className = 'media-status success';
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    // Register peer
    sendMessage({
      type: 'register',
      peerId: peerId
    });
    updateStatus('Подключено', true);
  };

  ws.onmessage = (event) => {
    handleMessage(JSON.parse(event.data));
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateStatus('Ошибка подключения', false);
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
    updateStatus('Отключено', false);
    // Try to reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000);
  };
}

function setupEventListeners() {
  enableMediaBtn.addEventListener('click', enableMedia);
  videoDeviceSelect.addEventListener('change', () => {
    if (localStream) enableMedia();
  });
  audioDeviceSelect.addEventListener('change', () => {
    if (localStream) enableMedia();
  });
  copyPeerIdBtn.addEventListener('click', copyPeerId);
  callPeerBtn.addEventListener('click', initiateCall);
  toggleAudioBtn.addEventListener('click', toggleAudio);
  toggleVideoBtn.addEventListener('click', toggleVideo);
  toggleScreenBtn.addEventListener('click', toggleScreenShare);
  hangupBtn.addEventListener('click', endCall);
  acceptCallBtn.addEventListener('click', acceptIncomingCall);
  rejectCallBtn.addEventListener('click', rejectIncomingCall);
}

function copyPeerId() {
  navigator.clipboard.writeText(peerId).then(() => {
    alert('ID скопирован в буфер обмена!');
  });
}

function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function handleMessage(message) {
  switch (message.type) {
    case 'peers-list':
      updatePeersList(message.peers);
      break;
    case 'peer-connected':
      console.log('Peer connected:', message.peerId);
      updatePeersList([message.peerId]);
      break;
    case 'peer-disconnected':
      console.log('Peer disconnected:', message.peerId);
      break;
    case 'offer':
      handleOffer(message);
      break;
    case 'answer':
      handleAnswer(message);
      break;
    case 'ice-candidate':
      handleIceCandidate(message);
      break;
  }
}

function updatePeersList(peers) {
  if (peers.length === 0) {
    peersList.innerHTML = '';
    noPeersDiv.style.display = 'block';
  } else {
    noPeersDiv.style.display = 'none';
    peersList.innerHTML = peers.map(peer => `
      <li class="peer-item">
        <span class="peer-name">${peer.substring(0, 20)}...</span>
        <button onclick="selectPeerAndCall('${peer}')">Позвонить</button>
      </li>
    `).join('');
  }
}

function selectPeerAndCall(peer) {
  remotePeerIdInput.value = peer;
  initiateCall();
}

async function initiateCall() {
  const remotePeer = remotePeerIdInput.value.trim();
  if (!remotePeer) {
    alert('Выберите пользователя или введите ID');
    return;
  }

  if (!localStream) {
    alert('Сначала включите камеру и микрофон');
    return;
  }

  remotePeerId = remotePeer;

  try {
    // Create peer connection
    peerConnection = new RTCPeerConnection(RTCConfiguration);

    // Add local tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.parentElement.classList.add('active');
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ice-candidate',
          targetPeerId: remotePeerId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        endCall();
      }
    };

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    sendMessage({
      type: 'offer',
      targetPeerId: remotePeerId,
      offer: offer
    });

    hangupBtn.disabled = false;
    callPeerBtn.disabled = true;
    updateStatus('Звонок...', true);
  } catch (error) {
    console.error('Error initiating call:', error);
    updateStatus('Ошибка: ' + error.message, false);
  }
}

async function handleOffer(message) {
  remotePeerId = message.peerId;
  incomingCall = message.offer;

  // Show incoming call modal
    incomingCallerIdEl.textContent = `От: ${message.peerId.substring(0, 20)}...`;
  callModal.classList.remove('hidden');
}

async function acceptIncomingCall() {
  callModal.classList.add('hidden');

  try {
    // Create peer connection
    peerConnection = new RTCPeerConnection(RTCConfiguration);

    // Add local tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.parentElement.classList.add('active');
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ice-candidate',
          targetPeerId: remotePeerId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        endCall();
      }
    };

    // Set remote description
    await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCall));

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    sendMessage({
      type: 'answer',
      targetPeerId: remotePeerId,
      answer: answer
    });

    hangupBtn.disabled = false;
    callPeerBtn.disabled = true;
    updateStatus('В звонке', true);
  } catch (error) {
    console.error('Error accepting call:', error);
    updateStatus('Error: ' + error.message, false);
  }
}

function rejectIncomingCall() {
  callModal.classList.add('hidden');
  incomingCall = null;
  remotePeerId = null;
}

async function handleAnswer(message) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    updateStatus('In call', true);
  } catch (error) {
    console.error('Error handling answer:', error);
  }
}

async function handleIceCandidate(message) {
  try {
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
}

function toggleAudio() {
  isAudioEnabled = !isAudioEnabled;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = isAudioEnabled;
  });
  toggleAudioBtn.textContent = isAudioEnabled ? '🎤 Микрофон ВКЛ' : '🎤 Микрофон ВЫКЛ';
  toggleAudioBtn.classList.toggle('inactive', !isAudioEnabled);
}

function toggleVideo() {
  isVideoEnabled = !isVideoEnabled;
  localStream.getVideoTracks().forEach(track => {
    track.enabled = isVideoEnabled;
  });
  toggleVideoBtn.textContent = isVideoEnabled ? '📹 Камера ВКЛ' : '📹 Камера ВЫКЛ';
  toggleVideoBtn.classList.toggle('inactive', !isVideoEnabled);
}

async function toggleScreenShare() {
  try {
    if (!peerConnection) {
      alert('Вы не в звонке');
      return;
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');

    if (sender) {
      await sender.replaceTrack(screenTrack);
      toggleScreenBtn.textContent = '🖥️ Экран ВКЛ';
      toggleScreenBtn.classList.add('inactive');

      screenTrack.onended = async () => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          await sender.replaceTrack(videoTrack);
          toggleScreenBtn.textContent = '🖥️ Поделиться';
          toggleScreenBtn.classList.remove('inactive');
        }
      };
    }
  } catch (error) {
    console.error('Error sharing screen:', error);
  }
}

function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  remotePeerId = null;
  remoteVideo.srcObject = null;
  remoteVideo.parentElement.classList.remove('active');

  hangupBtn.disabled = true;
  callPeerBtn.disabled = false;
  remotePeerIdInput.value = '';

  updateStatus('Готово', true);
}

function updateStatus(message, connected) {
  statusEl.textContent = message;
  statusEl.className = connected ? 'connected' : 'disconnected';
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);

// Handle window close
window.addEventListener('beforeunload', () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
  if (ws) {
    ws.close();
  }
});
