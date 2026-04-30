// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadMenu();
    renderStudents();
    renderSimilarities();
    renderParches();
    lucide.createIcons();
});

// --- GLOBAL DATA & PERSISTENCE ---
let students = JSON.parse(localStorage.getItem('unad_students')) || [
    { id: 1, name: "Carlos Mario Restrepo", phone: "3002542000", email: "cmrestrepo@unad.edu.co", program: "PsicologÃ­a", semester: 4, zone: "ZOCC", center: "MedellÃ­n", status: 'accepted', color: '#004d99', role: 'Estudiante' },
    { id: 2, name: "Lina Maria Gomez", phone: "3104445566", email: "lmgomez@unad.edu.co", faculty: "ECSAH", program: "PsicologÃ­a", research: "Neurociencia", zone: "ZCBC", center: "BogotÃ¡", status: 'accepted', color: '#d93025', role: 'Docente' },
    { id: 3, name: "Jorge IvÃ¡n Zuluaga", phone: "3158889900", email: "jizuluaga@unad.edu.co", program: "Ing. Sistemas", semester: 8, zone: "ZOCC", center: "MedellÃ­n", status: 'pending', color: '#f59e0b', role: 'Estudiante' },
    { id: 4, name: "Diana Carolina Velez", phone: "3007771122", email: "dcvelez@unad.edu.co", program: "Admin. Empresas", semester: 2, zone: "ZSUR", center: "Neiva", status: 'none', color: '#10b981', role: 'Estudiante' },
    { id: 5, name: "AndrÃ©s Felipe Ruiz", phone: "3125556677", email: "afruiz@unad.edu.co", program: "Ing. Industrial", semester: 5, zone: "ZCBC", center: "BogotÃ¡", status: 'none', color: '#8b5cf6', role: 'Estudiante' }
];

let parchesData = JSON.parse(localStorage.getItem('unad_parches')) || [
    { id: 1, name: "CÃ¡tedra Unadista (80017)", course: "CÃ¡tedra Unadista", code: "80017", members: 45, type: "Transversal", activity: "Alta" },
    { id: 2, name: "Pensamiento LÃ³gico y MatemÃ¡tico", course: "Pensamiento LÃ³gico", code: "200611", members: 32, type: "ECACEN", activity: "Media" },
    { id: 3, name: "Fundamentos de ProgramaciÃ³n", course: "ProgramaciÃ³n", code: "202011", members: 28, type: "ECBTI", activity: "Alta" }
];

let parcheMessages = JSON.parse(localStorage.getItem('unad_parche_messages')) || {};
let currentParcheId = null;

// --- MODULAR MENU LOADER & NAVIGATION ---
async function loadMenu() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    
    try {
        const response = await fetch('menu.html');
        const html = await response.text();
        container.innerHTML = html;
        
        const navItems = container.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.getAttribute('data-target');
                
                // Switch Views
                document.querySelectorAll('.app-view').forEach(v => {
                    v.style.display = (v.id === targetId) ? 'block' : 'none';
                });

                // Update Active Link
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                // Trigger Render Logic
                if (targetId === 'view-contacto') renderStudents();
                if (targetId === 'view-comunidad') renderSimilarities();
                if (targetId === 'view-parche') {
                    document.getElementById('parches-main-view').style.display = 'block';
                    document.getElementById('parche-chat-view').style.display = 'none';
                    renderParches();
                }
            });
        });
        
        lucide.createIcons();
    } catch (err) {
        console.error("Error cargando el menÃº:", err);
    }
}

// --- DOM ELEMENTS ---
const contactsContainer = document.getElementById('contacts-container');
const similaritiesContainer = document.getElementById('similarities-container');
const parchesGrid = document.getElementById('parches-grid');

// --- CONTACTOS ---
function renderStudents(filter = "") {
    if (!contactsContainer) return;
    const connected = students.filter(s => s.status === 'accepted' && 
        (s.name.toLowerCase().includes(filter.toLowerCase()) || s.program.toLowerCase().includes(filter.toLowerCase()))
    );
    document.getElementById('count-agenda').innerText = `(${connected.length})`;
    renderStudentTable(contactsContainer, connected);
}

// --- COMUNIDAD ---
function renderSimilarities(filter = "") {
    if (!similaritiesContainer) return;
    const centerFilter = document.getElementById('filter-center')?.value || "";
    const discoverable = students.filter(s => s.status !== 'accepted' && 
        (s.name.toLowerCase().includes(filter.toLowerCase()) || s.program.toLowerCase().includes(filter.toLowerCase())) &&
        (centerFilter === "" || s.center === centerFilter)
    );
    
    similaritiesContainer.innerHTML = `
        <div class="table-header" style="display: grid; grid-template-columns: 2fr 1.5fr 0.8fr 1fr 1fr; padding: 0.5rem 2rem; color: #94a3b8; font-size: 0.7rem; font-weight: 400; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">
            <div style="text-align: left;">estduaitnes/docente</div>
            <div style="text-align: left;">programa</div>
            <div style="text-align: left;">semestre</div>
            <div style="text-align: left;">zona</div>
            <div style="text-align: left;">centro</div>
        </div>
        ${discoverable.map(s => `
            <div class="contact-row" style="display: grid; grid-template-columns: 2fr 1.5fr 0.8fr 1fr 1fr; align-items: center; padding: 0.6rem 2rem; background: white; border-radius: 16px; border: 1px solid var(--border-light); margin-bottom: 0.5rem; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 0.8rem; text-align: left;">
                    <div class="avatar" style="background: ${s.color}; width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 400; font-size: 0.8rem;">${s.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 400; font-size: 0.9rem; color: var(--text-primary); line-height: 1.2;">${s.name}</div>
                        <div style="font-size: 0.65rem; color: var(--text-secondary); font-weight: 400;">${s.role}</div>
                    </div>
                </div>
                <div style="font-size: 0.8rem; font-weight: 400; color: var(--text-primary); text-align: left;">${s.program || s.faculty}</div>
                <div style="font-size: 0.8rem; text-align: left; font-weight: 400; color: var(--text-primary);">${s.semester ? s.semester + ' Sem' : '--'}</div>
                <div style="font-size: 0.8rem; font-weight: 400; color: #64748b; text-align: left;">${s.zone}</div>
                <div style="font-size: 0.8rem; font-weight: 400; color: #64748b; text-align: left;">${s.center}</div>
            </div>
        `).join('')}
    `;
    lucide.createIcons();
}

// --- TABLE RENDERER ---
function renderStudentTable(container, data) {
    container.innerHTML = `
        <div class="table-header" style="display: grid; grid-template-columns: 1.8fr 1fr 1.5fr 1.5fr 0.8fr 1fr 0.8fr; padding: 0.5rem 2rem; color: #94a3b8; font-size: 0.7rem; font-weight: 400; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">
            <div style="text-align: left;">estudante /docente</div>
            <div style="text-align: left;">telefono</div>
            <div style="text-align: left;">correo</div>
            <div style="text-align: left;">programa</div>
            <div style="text-align: left;">semestre</div>
            <div style="text-align: left;">centro</div>
            <div style="text-align: left;">accion</div>
        </div>
        ${data.map(s => `
            <div class="contact-row" style="display: grid; grid-template-columns: 1.8fr 1fr 1.5fr 1.5fr 0.8fr 1fr 0.8fr; align-items: center; padding: 0.6rem 2rem; background: white; border-radius: 16px; border: 1px solid var(--border-light); margin-bottom: 0.5rem; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 0.8rem; text-align: left;">
                    <div class="avatar" style="background: ${s.color}; width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 400; font-size: 0.8rem;">${s.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 400; font-size: 0.9rem; color: var(--text-primary); line-height: 1.2;">${s.name}</div>
                        <div style="font-size: 0.65rem; color: var(--text-secondary); font-weight: 400;">${s.role}</div>
                    </div>
                </div>
                <div style="font-size: 0.8rem; font-weight: 400; color: #64748b; text-align: left;">${s.phone || '--'}</div>
                <div style="font-size: 0.8rem; color: var(--accent-primary); font-weight: 400; text-align: left;">${s.email}</div>
                <div style="font-size: 0.8rem; font-weight: 400; color: var(--text-primary); text-align: left;">${s.program || s.faculty}</div>
                <div style="font-size: 0.8rem; text-align: left; font-weight: 400; color: var(--text-primary);">${s.semester ? s.semester + ' Sem' : '--'}</div>
                <div style="font-size: 0.8rem; font-weight: 400; color: #64748b; text-align: left;">${s.center}</div>
                <div style="display: flex; align-items: center; justify-content: flex-start;">
                    <button class="action-anchor-btn" style="width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid var(--accent-primary); background: white; color: var(--accent-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <i data-lucide="anchor" style="width: 14px;"></i>
                    </button>
                </div>
            </div>
        `).join('')}
    `;
    lucide.createIcons();
}

function renderConnectionButton(s) {
    if (s.status === 'accepted') return `<span style="color: #10b981; font-size: 0.8rem; font-weight: 400;"><i data-lucide="check-circle" style="width:16px; vertical-align:middle;"></i> CONECTADO</span>`;
    if (s.status === 'pending') return `<span style="color: #f59e0b; font-size: 0.8rem; font-weight: 400;"><i data-lucide="clock" style="width:16px; vertical-align:middle;"></i> PENDIENTE</span>`;
    return `<button class="btn-connect-circular" onclick="handleConnect(${s.id})" style="background: var(--accent-primary); color: white; border: none; padding: 0.7rem 1.2rem; border-radius: 8px; font-weight: 400; font-size: 0.8rem; cursor: pointer;">CONECTAR</button>`;
}

window.handleConnect = function(id) {
    const s = students.find(x => x.id === id);
    if (s) {
        s.status = 'pending';
        localStorage.setItem('unad_students', JSON.stringify(students));
        renderStudents(); renderSimilarities();
    }
};

// --- MARKETPLACE ---
function renderParches() {
    if (!parchesGrid) return;
    parchesGrid.innerHTML = parchesData.map(p => `
        <div style="padding: 2rem; border: 1px solid var(--border-light); border-radius: 8px; background: white; transition: 0.3s; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" onclick="openParcheChat(${p.id})">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
                <span style="background: ${p.type === 'Transversal' ? '#dcfce7' : '#e0e7ff'}; color: ${p.type === 'Transversal' ? '#166534' : '#3730a3'}; font-size: 0.7rem; font-weight: 400; padding: 0.4rem 1rem; border-radius: 10px;">${p.type}</span>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 400; font-size: 0.85rem; color: var(--text-secondary);"><i data-lucide="users" style="width:16px;"></i> ${p.members}</div>
            </div>
            <h3 style="font-size: 1.3rem; color: var(--accent-primary); font-weight: 400; margin-bottom: 0.5rem;">${p.name}</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); font-weight: 400;">${p.course} â€¢ <span style="color: var(--accent-primary);">${p.code}</span></p>
            <div style="margin-top: 2rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary);">ESTADO: <span style="color: #10b981;">ACTIVO</span></span>
                <div style="background: var(--accent-primary); color: white; width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><i data-lucide="message-square" style="width:18px;"></i></div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

window.openParcheChat = function(id) {
    currentParcheId = id;
    const p = parchesData.find(x => x.id === id);
    document.getElementById('parches-main-view').style.display = 'none';
    const chat = document.getElementById('parche-chat-view');
    chat.style.display = 'flex';
    document.getElementById('chat-title').innerText = p.name;
    document.getElementById('chat-members-count').innerText = `${p.members} miembros activos`;
    renderMessages();
};

window.backToParches = function() {
    document.getElementById('parches-main-view').style.display = 'block';
    document.getElementById('parche-chat-view').style.display = 'none';
};

function renderMessages() {
    const container = document.getElementById('chat-messages');
    const messages = parcheMessages[currentParcheId] || [];
    container.innerHTML = messages.map(m => `
        <div style="align-self: ${m.isMe ? 'flex-end' : 'flex-start'}; max-width: 80%;">
            <div style="background: ${m.isMe ? 'var(--accent-primary)' : 'white'}; color: ${m.isMe ? 'white' : 'var(--text-primary)'}; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); font-size: 0.95rem; border: 1px solid #f1f5f9;">
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
    parcheMessages[currentParcheId].push({ sender: "TÃº", text: input.value, isMe: true });
    localStorage.setItem('unad_parche_messages', JSON.stringify(parcheMessages));
    input.value = ""; renderMessages();
};

// --- MODAL LOGIC ---
document.getElementById('btn-open-create-parche')?.addEventListener('click', () => {
    document.getElementById('parche-modal-overlay').style.display = 'flex';
});
document.querySelector('.btn-close-parche')?.addEventListener('click', () => {
    document.getElementById('parche-modal-overlay').style.display = 'none';
});

document.querySelectorAll('input[name="academic-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        e.target.closest('.type-tab').classList.add('active');
        document.getElementById('school-select-container').style.display = (e.target.value === 'Escuela') ? 'block' : 'none';
    });
});

document.getElementById('create-parche-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="academic-type"]:checked').value;
    const finalType = type === 'Escuela' ? document.getElementById('p-type-select').value : 'Transversal';
    
    const newP = {
        id: Date.now(),
        name: document.getElementById('p-name').value,
        course: document.getElementById('p-course').value,
        code: document.getElementById('p-code').value,
        type: finalType,
        members: 1, activity: "Alta"
    };

    parchesData.unshift(newP);
    localStorage.setItem('unad_parches', JSON.stringify(parchesData));
    renderParches();
    document.getElementById('parche-modal-overlay').style.display = 'none';
});

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    renderStudents();
    lucide.createIcons();
});


