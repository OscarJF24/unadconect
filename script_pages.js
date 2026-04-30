// --- FIREBASE CONFIGURATION (MANDATORY: PASTE YOUR CONFIG HERE) ---
const firebaseConfig = {
    apiKey: "AIzaSyBjMK7DUaCTWGWgVx0v5iKT_4fh0iQ095E",
    authDomain: "unadconect.firebaseapp.com",
    projectId: "unadconect",
    storageBucket: "unadconect.firebasestorage.app",
    messagingSenderId: "715903675087",
    appId: "1:715903675087:web:4d795e735535f8dcede5ba"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
} else {
    console.error("Firebase SDK not loaded. Check your HTML script tags.");
}

const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

// --- SHARED DATA ---
let students = [];
let globalParches = []; // Ahora los parches también iniciarán vacíos
let parcheMessages = {};
let currentParcheId = null;
let currentProfile = JSON.parse(localStorage.getItem('unad_profile')) || null;
let profileCameraStream = null;

// Función para LIMPIAR toda tu base de datos de Firebase (Uso manual)
window.nukeDatabase = async function() {
    if (!db) return;
    if (!confirm("¿Estás seguro de que quieres BORRAR todos los contactos de la nube?")) return;
    
    const snapshot = await db.collection('students').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    showToast("Base de datos de Firebase limpiada con éxito.");
    location.reload();
};

// Force reset if profile is from the old simulated system
if (currentProfile && (currentProfile.id === 'me' || !currentProfile.id.startsWith('user_'))) {
    console.log("Old profile detected. Resetting for Firebase...");
    localStorage.removeItem('unad_profile');
    localStorage.removeItem('unad_user_id');
    currentProfile = null;
}

// Function to listen to students real-time
function startStudentsListener() {
    if (!db) return;
    db.collection('students').onSnapshot(snapshot => {
        students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Database synchronized:", students.length, "users.");
        
        // Auto-refresh the current view
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const cleanPage = page.split('?')[0];
        
        if (cleanPage === 'index.html' || cleanPage === 'contacto.html' || cleanPage === '') {
            const filter = document.getElementById('search-agenda')?.value || "";
            renderContacto(filter);
        } else if (cleanPage === 'comunidad.html') {
            const filter = document.getElementById('search-community')?.value || "";
            renderComunidad(filter);
        }
    }, error => {
        console.error("Firestore Listener Error:", error);
    });
}

const programsBySchool = {
    ECACEN: [
        'Doctorado en Gestión e Innovación Sostenible',
        'Maestría en Administración de Organizaciones',
        'Maestría en Gestión Analítica y Estratégica de Personas',
        'Maestría en Gestión Financiera',
        'Maestría en Marketing',
        'Maestría en Prospectiva e Innovación Sostenible',
        'Maestría en Turismo Inteligente',
        'Especialización en Alta Gerencia y Desarrollo Organizacional',
        'Especialización en Auditoría y Aseguramiento de la Información Financiera',
        'Especialización en Dirección y Desarrollo de Talento Humano',
        'Especialización en Finanzas Corporativas',
        'Especialización en Gerencia Estratégica de Mercadeo',
        'Especialización en Gestión de Destinos Turísticos',
        'Especialización en Gestión de Proyectos',
        'Especialización en Inteligencia e Innovación Organizacional',
        'Administración de Empresas',
        'Contaduría Pública',
        'Economía',
        'Finanzas y Comercio Internacional',
        'Marketing y Negocios Digitales',
        'Negocios Internacionales',
        'Tecnología en Gestión Comercial y de Negocios',
        'Tecnología en Gestión de Agronegocios',
        'Tecnología en Gestión de Empresas y Organizaciones Solidarias',
        'Tecnología en Gestión de Obras Civiles y Construcciones',
        'Tecnología en Gestión de Transportes',
        'Tecnología en Gestión Industrial'
    ],
    ECAPMA: [
        'Doctorado en Sustentabilidad, Territorio y Ruralidad',
        'Maestría en Agronegocios',
        'Maestría en Desarrollo Rural',
        'Maestría en Geoinformación del Territorio',
        'Maestría en Política, Derecho y Gestión Ambiental',
        'Especialización en Biotecnología Agroambiental',
        'Especialización en Nutrición y Alimentación Animal Sostenible',
        'Especialización en Responsabilidad Social y Ambiental',
        'Administración Ambiental y de los Recursos Naturales',
        'Agronomía',
        'Ingeniería Agroforestal',
        'Ingeniería Ambiental',
        'Zootecnia',
        'Tecnología en Manejo y Comercialización Agroforestal',
        'Tecnología en Producción Agrícola',
        'Tecnología en Producción Animal',
        'Tecnología en Saneamiento Ambiental'
    ],
    ECBTI: [
        'Doctorado en Tecnologías de Información',
        'Maestría en Biotecnología Alimentaria',
        'Maestría en Ciberseguridad',
        'Maestría en Ciencia de Datos y Analítica',
        'Maestría en Diseño de Experiencia de Usuario',
        'Maestría en Gerencia de proyectos',
        'Maestría en Gestión de Tecnología de Información',
        'Maestría en Internet de las Cosas',
        'Maestría en Logística y Redes de Valor',
        'Especialización en Ciencia de Datos y Analítica',
        'Especialización en Gerencia de Procesos Logísticos en Redes de Valor',
        'Especialización en Redes de Telecomunicaciones',
        'Especialización en Seguridad Informática',
        'Diseño Industrial',
        'Ingeniería de Alimentos',
        'Ingeniería de Sistemas',
        'Ingeniería de Telecomunicaciones',
        'Ingeniería Electrónica',
        'Ingeniería en Energías',
        'Ingeniería Industrial',
        'Ingeniería Multimedia',
        'Tecnología en Automatización Electrónica Industrial',
        'Tecnología en Calidad Alimentaria',
        'Tecnología en Desarrollo de Software',
        'Tecnología en Gestión de Redes Inalámbricas',
        'Tecnología en Logística Industrial',
        'Tecnología en Producción de Audio'
    ],
    ECEDU: [
        'Doctorado en Educación, Tecnología y Pedagogías Emergentes',
        'Maestría en Educación',
        'Maestría en Educación Intercultural',
        'Maestría en Educación Matemática',
        'Maestría en Mediación Pedagógica en el Aprendizaje del Inglés',
        'Especialización en Educación Superior y Transformación Digital',
        'Especialización en Educación, Cultura y Política',
        'Especialización en Neuropedagogía y Aprendizaje Autónomo',
        'Licenciatura en Educación Infantil',
        'Licenciatura en Etnoeducación',
        'Licenciatura en Filosofía',
        'Licenciatura en Lenguas Extranjeras con Énfasis en Inglés',
        'Licenciatura en Matemáticas'
    ],
    ECISA: [
        'Maestría en Bioética',
        'Maestría en Salud Pública',
        'Maestría en Telesalud',
        'Especialización en Gerencia y Auditoría de la Calidad en Salud',
        'Administración en Salud',
        'Profesional en seguridad y salud en el trabajo',
        'Tecnología en Radiología e Imágenes Diagnósticas',
        'Tecnología en Regencia de Farmacia',
        'Tecnología en Seguridad y Salud en el Trabajo'
    ],
    ECJP: [
        'Maestría en Derecho',
        'Maestría en Gobierno, Políticas Públicas y Desarrollo Territorial',
        'Maestría en Política, Derecho y Gestión Ambiental',
        'Especialización en Derecho Administrativo',
        'Especialización en Gestión Pública',
        'Especialización en Psicología Jurídica',
        'Administración Pública',
        'Ciencia Política',
        'Derecho',
        'Tecnología en Gestión Jurídica de la Información'
    ],
    ECSAH: [
        'Maestría en Bioética',
        'Doctorado en Cliodinámica',
        'Maestría en Comunicación',
        'Maestría en Desarrollo Alternativo Sostenible y Solidario',
        'Maestría en Filosofía de la Tecnología',
        'Maestría en Psicología Comunitaria',
        'Especialización en Salud Mental Comunitaria',
        'Artes visuales',
        'Comunicación social',
        'Filosofía',
        'Gestión deportiva',
        'Historia',
        'Música',
        'Psicología',
        'Sociología'
    ]
};

const centersByZone = {
    ZAMAZ: ["CEAD Acacias", "CEAD Yopal", "CEAD Puerto Carreño", "CCAV San José del Guaviare", "UDR Cumaral", "UDR Guainía", "UDR Leticia"],
    ZCAR: ["CCAV Puerto Colombia", "CEAD Valledupar", "CEAD Guajira", "CEAD Santa Marta", "CEAD Curumaní", "CCAV Cartagena", "CCAV Corozal", "CCAV Sahagún", "UDR Plato", "UDR El Banco"],
    ZCBC: ["CEAD Bogotá", "CEAD Gachetá", "CEAD Girardot", "CEAD Arbeláez", "Fusagasugá", "CCAV Facatativa", "CCAV Zipaquirá", "UDR Soacha"],
    ZBOY: ["CEAD Tunja", "CEAD Chiquinquirá", "CEAD Duitama", "CEAD Sogamoso", "Soatá", "Garagoa", "UDR Boavita", "UDR Socha", "UDR Cubará"],
    ZCORI: ["CEAD Bucaramanga", "CEAD Ocaña", "CEAD Málaga", "CEAD Vélez", "CCAV Pamplona", "CCAV Cúcuta", "UDR Barrancabermeja"],
    ZCSUR: ["CEAD Palmira", "CEAD Popayán", "CEAD Santander de Quilichao", "CCAV Pasto", "UDR Cali", "UDR El Bordo", "UDR Tumaco"],
    ZOCC: ["CEAD Medellín", "CEAD La Dorada", "CEAD Turbo", "CCAV Quibdó", "CCAV Dosquebradas"],
    ZSUR: ["CCAV Neiva", "CEAD Florencia", "CEAD Ibagué", "CCAV Pitalito", "UDR La Plata", "UDR San Vicente del Caguán", "Mariquita", "Líbano", "Valle del Guamuez", "Puerto Asís"],
    FLORIDA: ["Florida"]
};

// Initialize Page-Specific Logic
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize data from Cloud
    if (db) {
        try {
            startStudentsListener();
        } catch (error) {
            console.error("Firebase Init Error:", error);
        }
    }

    const path = window.location.pathname;
    const page = path.split("/").pop().split("?")[0] || 'index.html';

    if (page === 'index.html' || page === '' || page === 'conect') {
        renderIndex();
        renderContacto();
    }
    if (page.includes('contacto.html')) renderContacto();
    if (page.includes('comunidad.html')) renderComunidad();
    if (page.includes('parche.html')) renderParcheModule();
    if (page.includes('perfil.html')) initProfile();
    
    setupGlobalSearch();
    renderProfileAvatar();
    
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.toggle('collapsed');
    });
    
    lucide.createIcons();
});

function renderProfileAvatar() {
    const avatar = document.getElementById('user-avatar-top');
    if (!avatar) return;
    avatar.innerText = getInitials(currentProfile?.name);
}

function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
}

function initProfile() {
    const form = document.getElementById('profile-form');
    if (!form) return;

    document.getElementById('open-profile-modal-btn')?.addEventListener('click', () => {
        document.getElementById('profile-modal-overlay').style.display = 'flex';
        lucide.createIcons();
    });

    function stateResetProfileForm() {
        document.getElementById('profile-modal-overlay').style.display = 'none';
        form.reset();
        loadProfileForm();
        updateProfileRoleFields();
        renderProfilePreview();
    }

    document.getElementById('close-profile-modal-btn')?.addEventListener('click', stateResetProfileForm);
    document.getElementById('profile-clear-btn')?.addEventListener('click', stateResetProfileForm);

    document.getElementById('take-photo-btn')?.addEventListener('click', handleTakeProfilePhoto);

    document.getElementById('upload-photo-btn')?.addEventListener('click', () => {
        document.getElementById('profile-photo-input')?.click();
    });

    document.getElementById('profile-camera-input')?.addEventListener('change', handleProfilePhoto);
    document.getElementById('profile-photo-input')?.addEventListener('change', handleProfilePhoto);

    const roleSelect = document.getElementById('profile-role');
    roleSelect.addEventListener('change', updateProfileRoleFields);
    document.getElementById('profile-school')?.addEventListener('change', () => populateProgramsBySchool());
    document.getElementById('profile-zone')?.addEventListener('change', () => populateCentersByZone());

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        let userId = localStorage.getItem('unad_user_id');
        if (!userId) {
            userId = 'user_' + Date.now();
            localStorage.setItem('unad_user_id', userId);
        }

        const role = roleSelect.value;
        const profileData = {
            id: userId,
            name: document.getElementById('profile-name').value.trim(),
            phone: document.getElementById('profile-phone').value.trim(),
            email: document.getElementById('profile-email').value.trim(),
            birthday: document.getElementById('profile-birthday').value,
            role,
            city: document.getElementById('profile-city').value.trim(),
            school: document.getElementById('profile-school').value,
            program: document.getElementById('profile-program').value.trim(),
            semester: document.getElementById('profile-semester').value,
            zone: document.getElementById('profile-zone').value,
            center: document.getElementById('profile-center').value.trim(),
            department: document.getElementById('profile-department') ? document.getElementById('profile-department').value.trim() : '',
            photo: currentProfile?.photo || '',
            status: currentProfile?.status || 'none'
        };

        if (role !== 'Estudiante') {
            profileData.semester = '';
            profileData.program = profileData.program || profileData.department;
        }

        // Save locally
        currentProfile = profileData;
        localStorage.setItem('unad_profile', JSON.stringify(currentProfile));

        // Save to Cloud
        if (db) {
            try {
                await db.collection('students').doc(userId).set(profileData, { merge: true });
                showProfileStatus('Perfil guardado en la nube.');
            } catch (e) {
                console.error("Error saving to Firestore:", e);
                showProfileStatus('Guardado localmente (Sin conexión a la nube).');
            }
        }

        renderProfilePreview();
        renderProfileAvatar();
        document.getElementById('profile-modal-overlay').style.display = 'none';
    });

    loadProfileForm();
    populateProgramsBySchool(currentProfile?.program || '');
    populateCentersByZone(currentProfile?.center || '');
    updateProfileRoleFields();
    renderProfilePreview();
}

function loadProfileForm() {
    if (!currentProfile) return;
    const fields = {
        'profile-name': currentProfile.name,
        'profile-phone': currentProfile.phone,
        'profile-email': currentProfile.email,
        'profile-birthday': currentProfile.birthday,
        'profile-role': currentProfile.role,
        'profile-city': currentProfile.city,
        'profile-school': currentProfile.school,
        'profile-semester': currentProfile.semester,
        'profile-zone': currentProfile.zone,
        'profile-center': currentProfile.center,
        'profile-department': currentProfile.department,
        'profile-work-center': currentProfile.workCenter
    };

    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && value !== undefined) input.value = value;
    });
}

function populateProgramsBySchool(selectedProgram = '') {
    const school = document.getElementById('profile-school')?.value || '';
    const programSelect = document.getElementById('profile-program');
    if (!programSelect) return;

    const programs = programsBySchool[school] || [];
    if (!programs.length) {
        programSelect.innerHTML = '<option value="">Selecciona primero una escuela</option>';
        programSelect.disabled = true;
        return;
    }

    programSelect.disabled = false;
    programSelect.innerHTML = [
        '<option value="">Selecciona un programa</option>',
        ...programs.map(program => `<option value="${program}">${program}</option>`)
    ].join('');

    if (selectedProgram && programs.includes(selectedProgram)) {
        programSelect.value = selectedProgram;
    }
}

function populateCentersByZone(selectedCenter = '') {
    const zone = document.getElementById('profile-zone')?.value || '';
    const centerSelect = document.getElementById('profile-center');
    if (!centerSelect) return;

    const centers = centersByZone[zone] || [];
    if (!centers.length) {
        centerSelect.innerHTML = '<option value="">Selecciona primero una zona</option>';
        centerSelect.disabled = true;
        return;
    }

    centerSelect.disabled = false;
    centerSelect.innerHTML = [
        '<option value="">Selecciona un centro</option>',
        ...centers.map(center => `<option value="${center}">${center}</option>`)
    ].join('');

    if (selectedCenter && centers.includes(selectedCenter)) {
        centerSelect.value = selectedCenter;
    }
}

function updateProfileRoleFields() {
    const role = document.getElementById('profile-role')?.value || 'Estudiante';
    const isStudent = role === 'Estudiante';
    ['profile-school', 'profile-program', 'profile-semester'].forEach(id => {
        const wrap = document.getElementById(id)?.closest('div');
        if (wrap) wrap.style.display = isStudent ? 'block' : 'none';
    });
    const departmentWrap = document.getElementById('profile-department-wrap');
    if (departmentWrap) departmentWrap.style.display = isStudent ? 'none' : 'block';
}

function renderProfilePreview() {
    const largeAvatar = document.getElementById('profile-avatar-large');
    const photoPreview = document.getElementById('profile-photo-preview');
    if (photoPreview) {
        if (currentProfile?.photo) {
            photoPreview.innerHTML = `<img src="${currentProfile.photo}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            photoPreview.innerHTML = '<i data-lucide="camera" style="width: 34px; height: 34px;"></i>';
        }
    }
    if (!largeAvatar) {
        // If not on profile page, we might still want to update the top avatar
        renderProfileAvatar();
        lucide.createIcons();
        return;
    }
    if (currentProfile?.name) {
        if (currentProfile.photo) {
            largeAvatar.innerHTML = `<img src="${currentProfile.photo}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover;">`;
            largeAvatar.style.background = '#f1f5f9';
        } else {
            largeAvatar.innerHTML = getInitials(currentProfile.name);
            largeAvatar.style.background = 'var(--accent-primary)';
            largeAvatar.style.color = 'white';
        }
        
        const displayName = document.getElementById('profile-display-name');
        const displayDesc = document.getElementById('profile-display-desc');
        const openBtn = document.getElementById('open-profile-modal-btn');
        
        if (displayName) displayName.innerText = currentProfile.name;
        if (displayDesc) {
            const isStudent = currentProfile.role === 'Estudiante';
            let detailsHtml = `
                <div style="font-weight: 500; color: #475569; margin-bottom: 0.5rem; text-align: center; font-size: 0.95rem;">${currentProfile.role}</div>
                <div style="display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1.2rem; font-size: 0.85rem;">
                    <div style="color: var(--accent-primary); display: flex; align-items: center;"><i data-lucide="mail" style="width: 14px; margin-right: 4px;"></i>${currentProfile.email || '--'}</div>
                    <div style="color: var(--text-secondary); display: flex; align-items: center;"><i data-lucide="phone" style="width: 14px; margin-right: 4px;"></i>${currentProfile.phone || '--'}</div>
                </div>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1.2rem 2.5rem; text-align: center; font-size: 0.85rem; background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; color: var(--text-primary);">
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Fecha nac.</strong> ${currentProfile.birthday || '--'}</div>
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Ciudad</strong> ${currentProfile.city || '--'}</div>
            `;
            
            if (isStudent) {
                detailsHtml += `
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Escuela</strong> ${currentProfile.school || '--'}</div>
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Programa</strong> ${currentProfile.program || '--'}</div>
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Semestre</strong> ${currentProfile.semester ? currentProfile.semester + ' Sem' : '--'}</div>
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Zona</strong> ${currentProfile.zone || '--'}</div>
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Centro</strong> ${currentProfile.center || '--'}</div>
                `;
            } else {
                detailsHtml += `
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Dependencia o área</strong> ${currentProfile.department || '--'}</div>
                    <div><strong style="color: var(--text-secondary); font-size: 0.72rem; display: block; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Centro de trabajo</strong> ${currentProfile.workCenter || '--'}</div>
                `;
            }
            
            detailsHtml += `</div>`;
            displayDesc.innerHTML = detailsHtml;
        }
        if (openBtn) openBtn.innerText = 'Editar perfil';
        
        return;
    }
    largeAvatar.innerHTML = '<i data-lucide="camera" style="width: 42px; height: 42px;"></i>';
    largeAvatar.style.background = '#f1f5f9';
    largeAvatar.style.color = 'var(--text-secondary)';
    
    const displayName = document.getElementById('profile-display-name');
    const displayDesc = document.getElementById('profile-display-desc');
    const openBtn = document.getElementById('open-profile-modal-btn');
    
    if (displayName) displayName.innerText = 'Crear mi perfil';
    if (displayDesc) displayDesc.innerText = 'Registra tus datos para empezar a aparecer en Comunidad y conectar con tus compañeros.';
    
    if (openBtn) {
        openBtn.innerText = 'Crear mi perfil';
        openBtn.style.display = 'inline-block'; // Asegurar visibilidad
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    stopProfileCamera();
    const reader = new FileReader();
    reader.onload = () => {
        currentProfile = currentProfile || {};
        currentProfile.photo = reader.result;
        renderProfilePreview();
    };
    reader.readAsDataURL(file);
}

async function handleTakeProfilePhoto() {
    const button = document.getElementById('take-photo-btn');
    const preview = document.getElementById('profile-photo-preview');
    if (!button || !preview) return;

    const activeVideo = document.getElementById('profile-camera-video');
    if (activeVideo) {
        captureProfileCameraFrame(activeVideo);
        button.innerText = 'Tomar foto';
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        document.getElementById('profile-camera-input')?.click();
        return;
    }

    try {
        profileCameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        preview.innerHTML = '<video id="profile-camera-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>';
        const video = document.getElementById('profile-camera-video');
        video.srcObject = profileCameraStream;
        button.innerText = 'Capturar';
    } catch (error) {
        document.getElementById('profile-camera-input')?.click();
    }
}

function captureProfileCameraFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    currentProfile = currentProfile || {};
    currentProfile.photo = canvas.toDataURL('image/jpeg', 0.9);
    stopProfileCamera();
    renderProfilePreview();
}

function stopProfileCamera() {
    if (!profileCameraStream) return;
    profileCameraStream.getTracks().forEach(track => track.stop());
    profileCameraStream = null;
}

function showProfileStatus(message) {
    const status = document.getElementById('profile-save-status');
    if (!status) return;
    status.innerText = message;
    window.clearTimeout(showProfileStatus.timer);
    showProfileStatus.timer = window.setTimeout(() => {
        status.innerText = '';
    }, 2200);
}

// --- PAGE: INDEX ---
function renderIndex() {
    const statContacts = document.getElementById('stat-contacts');
    const statParches = document.getElementById('stat-parches');
    if (statContacts) statContacts.innerText = students.filter(s => s.status === 'accepted').length;
    if (statParches) statParches.innerText = parchesData.length;
}

// --- PAGE: CONTACTO ---
function renderContacto(filter = "") {
    const container = document.getElementById('contacts-container');
    if (!container) return;
    const connected = students.filter(s => s.status === 'accepted' && 
        (s.name.toLowerCase().includes(filter.toLowerCase()) || s.program.toLowerCase().includes(filter.toLowerCase()))
    );
    const countEl = document.getElementById('count-agenda');
    if (countEl) countEl.innerText = `(${connected.length})`;
    renderContactsTable(container, connected);
}

// --- PAGE: COMUNIDAD ---
function renderComunidad(filter = "") {
    const container = document.getElementById('similarities-container');
    if (!container) return;
    const centerFilter = document.getElementById('filter-center')?.value || "";
    const discoverable = students.filter(s => s.status !== 'accepted' && 
        (s.name.toLowerCase().includes(filter.toLowerCase()) || s.program.toLowerCase().includes(filter.toLowerCase())) &&
        (centerFilter === "" || s.center === centerFilter)
    );
    renderCommunityTable(container, discoverable);
}

// --- PAGE: PARCHE ---
function renderParcheModule() {
    const grid = document.getElementById('parches-grid');
    if (!grid) return;
    const filterText = document.getElementById('search-parches')?.value.toLowerCase() || "";
    const filterType = document.getElementById('filter-academic-type')?.value || "all";

    const filtered = parchesData.filter(p => {
        const matchesText = p.name.toLowerCase().includes(filterText) || p.course?.toLowerCase().includes(filterText) || p.code?.includes(filterText);
        const matchesType = (filterType === "all") || (filterType === p.type);
        return matchesText && matchesType;
    });

    grid.innerHTML = filtered.map(p => `
        <div style="padding: 1rem; border: 1px solid var(--border-light); border-radius: 12px; transition: all 0.2s; background: white; cursor: pointer; box-shadow: 0 3px 8px rgba(15,23,42,0.04);" onclick="openParcheChat(${p.id})">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
                <span style="background: ${p.type === 'Transversal' ? '#e8f6ee' : '#fff7da'}; color: ${p.type === 'Transversal' ? '#166534' : '#854d0e'}; font-size: 0.68rem; font-weight: 400; padding: 0.25rem 0.55rem; border-radius: 7px;">${p.type}</span>
                <div style="display: flex; align-items: center; gap: 0.35rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 400;">
                    <i data-lucide="users" style="width:16px;"></i> ${p.members}
                </div>
            </div>
            <h3 style="font-size: 0.98rem; color: var(--accent-primary); font-weight: 400; margin: 0 0 0.35rem; line-height: 1.25;">${p.name}</h3>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0; font-weight: 400;">${p.course} â€¢ ${p.code}</p>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- CONTACTS TABLE RENDERER ---
function renderContactsTable(container, data) {
    container.innerHTML = `
        <div class="table-header" style="display: grid; grid-template-columns: 1.7fr 0.9fr 1.5fr 1.2fr 0.7fr 1fr 0.8fr; padding: 0.35rem 1rem; color: var(--text-secondary); font-size: 0.78rem; font-weight: 400; margin-bottom: 0.55rem;">
            <div>Estudiante/Docente</div>
            <div>Teléfono</div>
            <div>Correo</div>
            <div>Programa</div>
            <div>Semestre</div>
            <div>Centro</div>
            <div>Acción</div>
        </div>
        ${data.map(s => `
            <div class="contact-row" style="display: grid; grid-template-columns: 1.7fr 0.9fr 1.5fr 1.2fr 0.7fr 1fr 0.8fr; align-items: center; padding: 0.55rem 1rem; border-radius: 10px; margin-bottom: 0.45rem;">
                <div style="display: flex; align-items: center; gap: 0.7rem; min-width: 0;">
                    <div class="avatar" style="background: ${s.color}; width:32px; height:32px; border-radius: 50%; display:flex; align-items:center; justify-content:center; color:white; font-weight: 400; font-size:0.8rem; flex: 0 0 auto;">${s.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 400; font-size: 0.88rem; color: var(--text-primary); line-height: 1.15;">${s.name}</div>
                        <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 400;">${s.role}</div>
                    </div>
                </div>
                <div style="font-size: 0.82rem; font-weight: 400; color: var(--text-secondary);">${s.phone || '--'}</div>
                <div style="font-size: 0.82rem; color: var(--accent-primary); font-weight: 400; overflow: hidden; text-overflow: ellipsis;">${s.email}</div>
                <div style="font-size: 0.82rem; font-weight: 400;">${s.program || s.faculty || '--'}</div>
                <div style="font-size: 0.82rem; font-weight: 400;">${formatSemester(s.semester)}</div>
                <div style="font-size: 0.82rem; font-weight: 400; color: var(--text-secondary);">${s.center || '--'}</div>
                <div>${renderContactActions(s)}</div>
            </div>
        `).join('')}
    `;
    lucide.createIcons();
}

// --- COMMUNITY TABLE RENDERER ---
function renderCommunityTable(container, data) {
    container.innerHTML = `
        <div class="table-header" style="display: grid; grid-template-columns: 1.8fr 1fr 1.5fr 0.8fr 0.6fr; padding: 0.35rem 1rem; color: var(--text-secondary); font-size: 0.78rem; font-weight: 400; margin-bottom: 0.55rem;">
            <div>Estudiante/Docente</div>
            <div>Centro</div>
            <div>Programa</div>
            <div>Semestre</div>
            <div>Enlazar</div>
        </div>
        ${data.map(s => `
            <div class="contact-row" style="display: grid; grid-template-columns: 1.8fr 1fr 1.5fr 0.8fr 0.6fr; align-items: center; padding: 0.55rem 1rem; border-radius: 10px; margin-bottom: 0.45rem;">
                <div style="display: flex; align-items: center; gap: 0.7rem; min-width: 0;">
                    <div class="avatar" style="background: ${s.color}; width:32px; height:32px; border-radius: 50%; display:flex; align-items:center; justify-content:center; color:white; font-weight: 400; font-size:0.8rem; flex: 0 0 auto;">${s.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 400; font-size: 0.88rem; color: var(--text-primary); line-height: 1.15;">${s.name}</div>
                        <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 400;">${s.role}</div>
                    </div>
                </div>
                <div style="font-size: 0.82rem; font-weight: 400; color: var(--text-secondary);">${s.center || '--'}</div>
                <div style="font-size: 0.82rem; font-weight: 400;">${s.program || s.faculty || '--'}</div>
                <div style="font-size: 0.82rem; font-weight: 400;">${formatSemester(s.semester)}</div>
                <div>${renderAnchorAction(s)}</div>
            </div>
        `).join('')}
    `;
    lucide.createIcons();
}

function formatSemester(semester) {
    return semester ? `${semester} Sem` : '--';
}

function renderContactActions(s) {
    const waUrl = s.phone ? `https://wa.me/57${s.phone}` : '#';
    const teamsUrl = s.email ? `msteams://teams.microsoft.com/l/chat/0/0?users=${s.email}` : '#';
    return `
        <div style="display: flex; gap: 0.4rem; align-items: center;">
            <a href="${waUrl}" target="_blank" title="WhatsApp" style="width: 28px; height: 28px; border-radius: 50%; background: #e8f5e9; color: #10b981; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: 0.2s;">
                <i data-lucide="message-circle" style="width: 14px;"></i>
            </a>
            <a href="${teamsUrl}" title="Microsoft Teams" style="width: 28px; height: 28px; border-radius: 50%; background: #e0e7ff; color: #6366f1; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: 0.2s;">
                <i data-lucide="video" style="width: 14px;"></i>
            </a>
            <button onclick="unlinkContact(${s.id})" title="Desanclar (Remover de Agenda)" style="width: 28px; height: 28px; border-radius: 50%; border: none; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
                <i data-lucide="anchor" style="width: 14px;"></i>
            </button>
        </div>
    `;
}

window.unlinkContact = function(studentId) {
    if (!db) return;
    const s = students.find(x => x.id == studentId);
    if (s) {
        db.collection('students').doc(String(studentId)).update({ status: 'none' })
            .then(() => {
                showToast(`Has desanclado a ${s.name.split(' ')[0]} y ha vuelto a la Comunidad.`);
            });
    }
};

function renderAnchorAction(s) {
    if (s && s.status === 'pending') {
        return `
            <button class="action-anchor-btn btn-pending" onclick="handleAnchorClick(this, ${s.id})" title="Esperando respuesta..." style="width: 30px; height: 30px; border-radius: 50%; border: none; background: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; box-shadow: 0 3px 6px rgba(139, 92, 246, 0.3);">
                <i data-lucide="clock" style="width: 14px;"></i>
            </button>
        `;
    }
    return `
        <button class="action-anchor-btn" onclick="handleAnchorClick(this, ${s ? s.id : 'null'})" title="Invitar (Anclar)" style="width: 30px; height: 30px; border-radius: 50%; border: none; background: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; box-shadow: 0 3px 6px rgba(139, 92, 246, 0.3);">
            <i data-lucide="anchor" style="width: 14px;"></i>
        </button>
    `;
}

window.handleAnchorClick = function(btn, studentId) {
    if (!db) return;
    const s = studentId ? students.find(x => x.id == studentId) : null;
    
    if (btn.classList.contains('btn-pending')) {
        // Revert to anchor (Cancel invitation)
        db.collection('students').doc(String(studentId)).update({ status: 'none' });
        return;
    }
    
    // Feeling effect (Purple Hearts)
    const rect = btn.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
        const heart = document.createElement('div');
        heart.className = 'bubble-feeling';
        heart.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#8b5cf6" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
        heart.style.left = (rect.left + rect.width / 2 - 8 + (Math.random() * 30 - 15)) + 'px';
        heart.style.top = (rect.top + rect.height / 2 - 8 + (Math.random() * 30 - 15)) + 'px';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
    }
    
    // Change to pending state
    btn.classList.add('btn-pending');
    btn.title = "Esperando respuesta...";
    btn.innerHTML = '<i data-lucide="clock" style="width: 14px;"></i>';
    lucide.createIcons();
    
    if (s) {
        db.collection('students').doc(String(studentId)).update({ status: 'pending' });
        
        // SIMULATION: Accept invitation after 3-5 seconds
        const delay = Math.floor(Math.random() * 2000) + 3000;
        setTimeout(() => {
            const currentStudent = students.find(x => x.id == studentId);
            if (currentStudent && currentStudent.status === 'pending') {
                db.collection('students').doc(String(studentId)).update({ status: 'accepted' })
                    .then(() => {
                        showToast(`¡${currentStudent.name.split(' ')[0]} aceptó tu invitación!`);
                    });
            }
        }, delay);
    }
};

window.showToast = function(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="check-circle" style="color: #10b981; width: 18px;"></i> <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons({root: toast});
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

function renderConnectionButton(s) {
    if (s.status === 'accepted') return `<span style="color: #10b981; font-size: 0.8rem; font-weight: 400; display: flex; align-items: center; gap: 0.4rem;"><i data-lucide="check-circle" style="width:16px;"></i> CONECTADO</span>`;
    if (s.status === 'pending') return `<span style="color: #f59e0b; font-size: 0.8rem; font-weight: 400; display: flex; align-items: center; gap: 0.4rem;"><i data-lucide="clock" style="width:16px;"></i> PENDIENTE</span>`;
    return `<button class="btn-connect-circular" onclick="handleConnect(${s.id})" style="background: var(--accent-primary); color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 400; font-size: 0.8rem; cursor: pointer;">CONECTAR</button>`;
}

window.handleConnect = function(id) {
    const s = students.find(x => x.id === id);
    if (s) {
        s.status = 'pending';
        localStorage.setItem('unad_students', JSON.stringify(students));
        location.reload(); // Refresh to update states
    }
};

// --- CHAT & PARCHE HELPERS ---
window.openParcheChat = function(id) {
    currentParcheId = id;
    const p = parchesData.find(x => x.id === id);
    document.getElementById('parches-main-view').style.display = 'none';
    const chatView = document.getElementById('parche-chat-view');
    chatView.style.display = 'flex';
    document.getElementById('chat-title').innerText = p.name;
    document.getElementById('chat-course-subtitle').innerText = `${p.course} · ${p.code}`;
    document.getElementById('chat-members-count').innerText = `${p.members} miembros`;
    renderMessages();
};

window.backToParches = function() {
    document.getElementById('parches-main-view').style.display = 'block';
    document.getElementById('parche-chat-view').style.display = 'none';
};

function renderMessages() {
    const container = document.getElementById('chat-messages');
    const messages = parcheMessages[currentParcheId] || [];
    if (!messages.length) {
        container.innerHTML = `
            <div style="height: 100%; min-height: 220px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
                <div style="text-align: center; border: 1px dashed #cbd5e1; background: white; border-radius: 8px; padding: 1.2rem 1.6rem; max-width: 360px;">
                    <div style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.25rem;">Aún no hay mensajes</div>
                    <div style="font-size: 0.8rem;">Inicia la conversación del parche con una pregunta o recurso.</div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(m => `
        <div style="align-self: ${m.isMe ? 'flex-end' : 'flex-start'}; width: min(76%, 620px);">
            <div style="display: flex; justify-content: ${m.isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 0.18rem;">
                <span style="font-size: 0.68rem; color: var(--text-secondary);">${m.isMe ? 'Tú' : (m.sender || 'Compañero')} ${m.time ? '· ' + m.time : ''}</span>
            </div>
            <div style="background: ${m.isMe ? '#eef5ff' : 'white'}; color: var(--text-primary); padding: 0.72rem 0.85rem; border-radius: 6px; box-shadow: none; font-size: 0.86rem; line-height: 1.35; border: 1px solid ${m.isMe ? '#cfe0f5' : '#e2e8f0'};">
                ${m.text}
            </div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

window.sendParcheMessage = function() {
    const input = document.getElementById('chat-input');
    if (!input.value.trim() || !currentParcheId) return;
    if (!parcheMessages[currentParcheId]) parcheMessages[currentParcheId] = [];
    parcheMessages[currentParcheId].push({
        sender: "Tú",
        text: input.value,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true
    });
    localStorage.setItem('unad_parche_messages', JSON.stringify(parcheMessages));
    input.value = "";
    renderMessages();
};

// --- GLOBAL SEARCH ---
function setupGlobalSearch() {
    document.getElementById('search-contacts')?.addEventListener('input', (e) => renderContacto(e.target.value));
    document.getElementById('search-community')?.addEventListener('input', (e) => renderComunidad(e.target.value));
    document.getElementById('search-parches')?.addEventListener('input', () => renderParcheModule());
    document.getElementById('filter-center')?.addEventListener('change', () => renderComunidad());
    document.getElementById('filter-academic-type')?.addEventListener('change', () => renderParcheModule());
}

// Modal Toggle for Parche
document.getElementById('btn-open-create-parche')?.addEventListener('click', () => {
    document.getElementById('parche-modal-overlay').style.display = 'flex';
});
document.querySelector('.btn-close-parche')?.addEventListener('click', () => {
    document.getElementById('parche-modal-overlay').style.display = 'none';
});

document.querySelectorAll('input[name="parche-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const isSchool = e.target.value === 'Escuela';
        const schoolContainer = document.getElementById('school-select-container');
        schoolContainer.style.visibility = isSchool ? 'visible' : 'hidden';
        schoolContainer.style.opacity = isSchool ? '1' : '0';
        schoolContainer.style.pointerEvents = isSchool ? 'auto' : 'none';
        document.querySelectorAll('.parche-type-option').forEach(option => {
            const selected = option.querySelector('input')?.checked;
            option.classList.toggle('active', selected);
            option.style.background = selected ? '#e9edf3' : '#f4f6f9';
            option.style.color = selected ? '#252a31' : '#64748b';
        });
    });
});

document.getElementById('create-parche-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const typeChoice = document.querySelector('input[name="parche-type"]:checked')?.value || 'Transversal';
    const finalType = typeChoice === 'Escuela' ? document.getElementById('p-school-select').value : 'Transversal';
    const newP = {
        id: Date.now(),
        name: document.getElementById('p-name').value,
        course: document.getElementById('p-course').value,
        code: document.getElementById('p-phase').value,
        type: finalType,
        members: 1,
        activity: "Alta"
    };
    parchesData.unshift(newP);
    localStorage.setItem('unad_parches', JSON.stringify(parchesData));
    renderParcheModule();
    document.getElementById('parche-modal-overlay').style.display = 'none';
});


