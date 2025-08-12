// TTS and STT Module for ChatPDF Application
class VoiceModule {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isSpeaking = false;
        
        this.initializeSpeechRecognition();
        this.initializeTextToSpeech();
        
        console.log('🎤 Voice Module initialized');
    }

    // ✅ Initialize Speech Recognition (STT)
    initializeSpeechRecognition() {
        // Check browser support
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
        } else {
            console.warn('❌ Speech Recognition not supported in this browser');
            return;
        }

        // Configure speech recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Event handlers
        this.recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            this.updateRecordingUI(true);
            this.showNotification('🎤 Listening... Speak now!', 'info');
            this.dispatchEvent('voiceInputStart');
        };

        this.recognition.onresult = (event) => {
            let transcript = '';
            let isFinal = false;
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    isFinal = true;
                }
            }
            
            // Update the input field with recognized text
            this.updateInputField(transcript);
            
            // Show interim results in real-time
            if (isFinal) {
                console.log('✅ Final transcript:', transcript);
                this.stopRecording();
                this.showNotification('✅ Voice input complete!', 'success');
                this.dispatchEvent('voiceInputComplete');
            }
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.showNotification('Speech recognition error: ' + event.error, 'error');
            this.stopRecording();
        };

        this.recognition.onend = () => {
            console.log('🎤 Speech recognition ended');
            this.updateRecordingUI(false);
            this.dispatchEvent('voiceInputEnd');
        };
    }

    // ✅ Initialize Text to Speech (TTS)
    initializeTextToSpeech() {
        // Load available voices
        this.loadVoices();
        
        // Update voices when they change (some browsers load voices asynchronously)
        if (this.speechSynthesis.onvoiceschanged !== undefined) {
            this.speechSynthesis.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
    }

    // ✅ Load available voices
    loadVoices() {
        this.voices = this.speechSynthesis.getVoices();
        console.log('🔊 Available voices:', this.voices.length);
        
        // Find a good default voice (prefer English voices with neural/premium quality)
        this.defaultVoice = this.voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.toLowerCase().includes('neural') || 
             voice.name.toLowerCase().includes('premium') ||
             voice.name.toLowerCase().includes('enhanced'))
        ) || this.voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
        ) || this.voices.find(voice => 
            voice.lang.startsWith('en')
        ) || this.voices[0];
        
        if (this.defaultVoice) {
            console.log('🎭 Default voice:', this.defaultVoice.name);
        }
    }

    // ✅ Start Recording (STT)
    startRecording() {
        if (!this.recognition) {
            this.showNotification('Speech recognition not supported in this browser', 'error');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
            return;
        }

        // Stop any ongoing speech first
        this.stopSpeaking();

        try {
            this.isRecording = true;
            this.recognition.start();
        } catch (error) {
            console.error('❌ Error starting recording:', error);
            this.showNotification('Error starting recording: ' + error.message, 'error');
            this.isRecording = false;
            this.updateRecordingUI(false);
        }
    }

    // ✅ Stop Recording
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
        }
    }

    // ✅ Speak Text (TTS)
    speakText(text, voiceIndex = null) {
        // Cancel any ongoing speech
        this.stopSpeaking();

        if (!text || text.trim() === '') {
            console.warn('⚠️ No text to speak');
            return;
        }

        // Clean text for speaking (remove HTML tags and markdown)
        const cleanText = this.cleanTextForSpeaking(text);

        if (cleanText.length === 0) {
            console.warn('⚠️ No readable text found');
            return;
        }

        // Create speech utterance
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
        
        // Set voice
        if (voiceIndex !== null && this.voices[voiceIndex]) {
            this.currentUtterance.voice = this.voices[voiceIndex];
        } else if (this.defaultVoice) {
            this.currentUtterance.voice = this.defaultVoice;
        }

        // Configure speech parameters for better quality
        this.currentUtterance.rate = 0.85;     // Slightly slower for clarity
        this.currentUtterance.pitch = 1.0;     // Normal pitch
        this.currentUtterance.volume = 0.9;    // Near full volume

        // Event handlers
        this.currentUtterance.onstart = () => {
            console.log('🔊 Started speaking');
            this.isSpeaking = true;
            this.updateSpeakingUI(true);
            this.showNotification('🔊 Speaking...', 'info');
        };

        this.currentUtterance.onend = () => {
            console.log('🔊 Finished speaking');
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateSpeakingUI(false);
        };

        this.currentUtterance.onerror = (event) => {
            console.error('❌ Speech synthesis error:', event.error);
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateSpeakingUI(false);
            this.showNotification('Speech error: ' + event.error, 'error');
        };

        // Start speaking
        this.speechSynthesis.speak(this.currentUtterance);
        
        console.log('🔊 Speaking:', cleanText.substring(0, 100) + '...');
    }

    // ✅ Stop Speaking
    stopSpeaking() {
        if (this.speechSynthesis.speaking || this.speechSynthesis.pending) {
            this.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.updateSpeakingUI(false);
        console.log('🔇 Speech stopped');
    }

    // ✅ Clean text for speaking
    cleanTextForSpeaking(text) {
        return text
            // Remove HTML tags
            .replace(/<[^>]*>/g, ' ')
            // Remove markdown formatting
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            // Remove special characters and symbols
            .replace(/[📄🔗💡✅❌⚠️🎤🔊📚🎭]/g, '')
            // Replace multiple whitespace with single space
            .replace(/\s+/g, ' ')
            // Remove extra punctuation
            .replace(/[•·]/g, '')
            .trim();
    }

    // ✅ Update input field with recognized text
    updateInputField(text) {
        const inputField = document.querySelector('input[name="user_input"]');
        if (inputField) {
            inputField.value = text;
            inputField.focus();
            
            // Add visual feedback
            inputField.classList.add('voice-active');
            setTimeout(() => {
                inputField.classList.remove('voice-active');
            }, 500);
        }
    }

    // ✅ Update recording UI
    updateRecordingUI(isRecording) {
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            if (isRecording) {
                micButton.innerHTML = '<i class="fas fa-stop text-danger"></i>';
                micButton.classList.add('btn-danger', 'recording-active');
                micButton.classList.remove('btn-outline-primary');
                micButton.title = 'Stop Recording';
            } else {
                micButton.innerHTML = '<i class="fas fa-microphone"></i>';
                micButton.classList.remove('btn-danger', 'recording-active');
                micButton.classList.add('btn-outline-primary');
                micButton.title = 'Start Voice Input (Ctrl+M)';
            }
        }
    }

    // ✅ Update speaking UI
    updateSpeakingUI(isSpeaking) {
        const speakButtons = document.querySelectorAll('.speak-button');
        speakButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (isSpeaking) {
                icon.className = 'fas fa-stop text-danger';
                button.title = 'Stop Speaking';
                button.classList.add('speaking-active');
            } else {
                icon.className = 'fas fa-volume-up';
                button.title = 'Listen to Message';
                button.classList.remove('speaking-active');
            }
        });
    }

    // ✅ Show notification with better styling
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.voice-notification');
        existingNotifications.forEach(notif => notif.remove());

        const typeClasses = {
            info: 'alert-info',
            success: 'alert-success', 
            error: 'alert-danger',
            warning: 'alert-warning'
        };

        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle'
        };

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert ${typeClasses[type]} alert-dismissible fade show position-fixed voice-notification`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${icons[type]} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after duration based on message length
        const duration = Math.max(2000, Math.min(5000, message.length * 100));
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 150);
            }
        }, duration);
    }

    // ✅ Dispatch custom events
    dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { voiceModule: this }
        });
        window.dispatchEvent(event);
    }

    // ✅ Check browser support
    checkSupport() {
        const support = {
            speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
            speechSynthesis: !!window.speechSynthesis,
            userAgent: navigator.userAgent
        };
        
        console.log('🔍 Browser support:', support);
        
        // Show appropriate warnings
        if (!support.speechRecognition && !support.speechSynthesis) {
            this.showNotification('Voice features not supported in this browser', 'warning');
        } else if (!support.speechRecognition) {
            this.showNotification('Voice input not supported, but text-to-speech is available', 'warning');
        } else if (!support.speechSynthesis) {
            this.showNotification('Text-to-speech not supported, but voice input is available', 'warning');
        }
        
        return support;
    }

    // ✅ Get available voices for UI
    getAvailableVoices() {
        return this.voices.map((voice, index) => ({
            index: index,
            name: voice.name,
            lang: voice.lang,
            gender: voice.name.toLowerCase().includes('female') ? 'female' : 
                   voice.name.toLowerCase().includes('male') ? 'male' : 'unknown'
        }));
    }
}

// ✅ Initialize Voice Module when DOM is ready
let voiceModule;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Voice Module...');
    
    // Initialize voice module
    voiceModule = new VoiceModule();
    
    // Check support and initialize UI
    const support = voiceModule.checkSupport();
    
    // Initialize voice UI elements
    initializeVoiceUI(support);
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ Voice Module ready!');
});

// ✅ Initialize voice UI elements
function initializeVoiceUI(support) {
    // Hide/show features based on support
    const micButton = document.getElementById('mic-button');
    if (micButton && !support.speechRecognition) {
        micButton.style.display = 'none';
    }
    
    // Add tooltips and help text
    if (support.speechRecognition) {
        const helpText = document.querySelector('.voice-help-text');
        if (helpText) {
            helpText.style.display = 'block';
        }
    }
}

// ✅ Set up event listeners
function setupEventListeners() {
    // Handle form submission with voice integration
    const form = document.querySelector('form[hx-post]');
    const input = document.querySelector('input[name="user_input"]');
    
    if (form && input) {
        // Add visual feedback for voice events
        window.addEventListener('voiceInputStart', function() {
            input.classList.add('voice-active');
        });
        
        window.addEventListener('voiceInputEnd', function() {
            input.classList.remove('voice-active');
        });
        
        window.addEventListener('voiceInputComplete', function() {
            input.focus();
            // Optional: auto-submit after voice input
            // form.dispatchEvent(new Event('submit'));
        });
    }

    // Handle dynamic content updates (HTMX)
    document.body.addEventListener('htmx:afterSwap', function(event) {
        console.log('🔄 Content updated, refreshing voice buttons...');
        
        // Re-attach event listeners to new speak buttons
        const newSpeakButtons = event.detail.target.querySelectorAll('.speak-button');
        newSpeakButtons.forEach(button => {
            button.onclick = function() { 
                speakMessage(this); 
            };
        });
    });
}

// ✅ Global functions for button handlers
window.startVoiceInput = function() {
    if (voiceModule) {
        voiceModule.startRecording();
    } else {
        console.error('❌ Voice module not initialized');
    }
};

window.speakMessage = function(element) {
    if (!voiceModule) {
        console.error('❌ Voice module not initialized');
        return;
    }

    // If currently speaking, stop instead
    if (voiceModule.isSpeaking) {
        voiceModule.stopSpeaking();
        return;
    }

    // Get text from data-text attribute
    const text = element.getAttribute('data-text');
    
    if (text && text.trim()) {
        console.log('🔊 Speaking text:', text.substring(0, 100) + '...');
        voiceModule.speakText(text);
        
        // Update button appearance
        const icon = element.querySelector('i');
        const stopBtn = element.parentElement.querySelector('.stop-speech-btn');
        
        if (icon) {
            icon.className = 'fas fa-stop';
            element.classList.add('speaking');
        }
        
        if (stopBtn) {
            stopBtn.style.display = 'inline-block';
            element.style.display = 'none';
        }
        
        // Listen for speech end to restore buttons
        if (voiceModule.currentUtterance) {
            voiceModule.currentUtterance.onend = function() {
                if (icon) {
                    icon.className = 'fas fa-volume-up';
                    element.classList.remove('speaking');
                }
                
                if (stopBtn) {
                    stopBtn.style.display = 'none';
                    element.style.display = 'inline-block';
                }
            };
        }
    } else {
        console.warn('⚠️ No text content found to speak');
        voiceModule.showNotification('No text to speak', 'warning');
    }
};

window.stopSpeaking = function() {
    if (voiceModule) {
        voiceModule.stopSpeaking();
    }
};

// ✅ Handle keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl + M or Cmd + M to start voice input
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        startVoiceInput();
    }
    
    // Escape to stop speaking or recording
    if (event.key === 'Escape') {
        event.preventDefault();
        stopSpeaking();
        if (voiceModule && voiceModule.isRecording) {
            voiceModule.stopRecording();
        }
    }
    
    // Space bar to stop speaking when focused on speak button
    if (event.key === ' ' && event.target.classList.contains('speak-button')) {
        event.preventDefault();
        stopSpeaking();
    }
});

// ✅ Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden && voiceModule) {
        // Stop voice features when page is hidden
        voiceModule.stopSpeaking();
        if (voiceModule.isRecording) {
            voiceModule.stopRecording();
        }
    }
});

// ✅ Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (voiceModule) {
        voiceModule.stopSpeaking();
        if (voiceModule.isRecording) {
            voiceModule.stopRecording();
        }
    }
});

console.log('🎙️ Voice Module script loaded successfully!');