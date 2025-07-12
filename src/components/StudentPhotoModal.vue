<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content card">
            <h3>Foto für {{ student.name }}</h3>

            <div class="photo-editor-grid">
                <!-- Linke Seite: Kamera oder Bild zum zuschneiden -->
                <div class="camera-container">
                    <video ref="videoRef" autoplay playsinline class="camera-video" :class="{ 'd-none': imageToCrop }"></video>
                    <div v-if="imageToCrop" class="cropper-wrapper">
                        <img ref="imageRef" :src="imageToCrop" alt="Schülerfoto zum zuschneiden"/>
                    </div>
                    <div v-if="!cameraStarted && !imageToCrop" class="camera-placeholder">
                        <p>Kamera ist aus.</p>
                    </div>
                </div>

                <!-- Rechte Seite: Vorschau -->
                <div class="preview-container">
                    <h4>Vorschau</h4>
                    <div ref="previewRef" class="preview-box"></div>
                    <div class="id-card-preview">
                        <div class="id-card-photo">
                            <div ref="idCardPreviewRef" class="preview-box-id"></div>
                        </div>
                        <div class="id-card-details">
                            <strong>{{ student.name }}</strong>
                            <span>Schülerausweis</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="error" class="status-error">{{ error }}</div>

            <div class="modal-actions camera-controls">
                <button v-if="!cameraStarted && !imageToCrop" @click="startCamera" class="btn">📷 Kamera starten</button>
                <button v-if="cameraStarted && !imageToCrop" @click="takePhoto" class="btn btn-primary">📸 Foto aufnehmen</button>
                <button v-if="imageToCrop" @click="retakePhoto" class="btn">🔁 Wiederholen</button>
                <button v-if="imageToCrop" @click="uploadPhoto" class="btn btn-primary" :disabled="isUploading">
                    {{ isUploading ? 'Lade hoch...' : '⬆️ Zuschneiden & Speichern' }}
                </button>
                <button @click="close" class="btn">Schließen</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue';
import Cropper from 'cropperjs';
// KORRIGIERT: Der CSS-Import für Cropper.js, der mit Vite kompatibel ist.
// KORRIGIERT: Der Pfad zum Store verwendet jetzt den '@'-Alias.
import { useStudentStore } from '@/stores/students.js';

const props = defineProps({
    modelValue: Boolean,
    student: { type: Object, required: true }
});
const emit = defineEmits(['update:modelValue']);

const studentStore = useStudentStore();
const videoRef = ref(null);
const imageRef = ref(null);
const previewRef = ref(null);
const idCardPreviewRef = ref(null);

const error = ref('');
const cameraStarted = ref(false);
const imageToCrop = ref(null);
const isUploading = ref(false);

let stream = null;
let cropper = null;

async function startCamera() {
    error.value = '';
    imageToCrop.value = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
        if (videoRef.value) {
            videoRef.value.srcObject = stream;
        }
        cameraStarted.value = true;
    } catch (err) {
        error.value = "Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen.";
    }
}

function takePhoto() {
    if (!videoRef.value) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.value.videoWidth;
    canvas.height = videoRef.value.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.value, 0, 0);
    imageToCrop.value = canvas.toDataURL('image/png');
    stopCamera();
    
    nextTick(() => {
        initCropper();
    });
}

function initCropper() {
    if (!imageRef.value) return;
    cropper = new Cropper(imageRef.value, {
        aspectRatio: 1,
        viewMode: 2,
        dragMode: 'move',
        background: false,
        autoCropArea: 0.8,
        preview: [previewRef.value, idCardPreviewRef.value]
    });
}

function retakePhoto() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    imageToCrop.value = null;
    startCamera();
}

async function uploadPhoto() {
    if (!cropper) return;
    isUploading.value = true;
    error.value = '';
    
    cropper.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingQuality: 'high',
    }).toBlob(async (blob) => {
        try {
            await studentStore.uploadStudentPhoto(props.student.id, blob);
            close();
        } catch (err) {
            error.value = err.message;
        } finally {
            isUploading.value = false;
        }
    }, 'image/png');
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    cameraStarted.value = false;
}

function close() {
    stopCamera();
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    emit('update:modelValue', false);
}

watch(() => props.modelValue, (newValue) => {
    if (!newValue) {
        close();
    }
});

onUnmounted(() => {
    close();
});
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}
.modal-content{width:100%;max-width:900px; text-align: center;}
.photo-editor-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    margin-bottom: 15px;
}
.camera-container { position: relative; width: 100%; background-color: #000; border-radius: 8px; overflow: hidden;}
.camera-video { width: 100%; height: auto; display: block; }
.cropper-wrapper img { max-width: 100%; }
.camera-placeholder { display: flex; align-items: center; justify-content: center; color: white; height: 100%; min-height: 300px; }
.preview-container h4 { margin-bottom: 10px; }
.preview-box {
    width: 150px;
    height: 150px;
    overflow: hidden;
    border-radius: 50%;
    margin: 0 auto 20px auto;
    border: 2px solid #ddd;
    background-color: #f1f1f1;
}
.id-card-preview {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #f9f9f9;
}
.id-card-photo {
    width: 60px;
    height: 60px;
    overflow: hidden;
    border-radius: 4px;
    flex-shrink: 0;
}
.preview-box-id { width: 100%; height: 100%; }
.id-card-details { text-align: left; }
.id-card-details strong { display: block; }
.id-card-details span { font-size: 12px; color: #666; }
.camera-controls { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }
.status-error{color:#dc3545;font-size:14px; margin-bottom: 10px;}
.d-none { display: none; }
</style>
