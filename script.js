const templateMeta = [
    { id: 'app', icon: 'fa-rocket', langKey: 'tplApp' },
    { id: 'logic', icon: 'fa-microchip', langKey: 'tplLogic' },
    { id: 'ux', icon: 'fa-palette', langKey: 'tplUx' },
    { id: 'security', icon: 'fa-shield-halved', langKey: 'tplSecurity' },
    { id: 'api', icon: 'fa-network-wired', langKey: 'tplApi' },
    { id: 'review', icon: 'fa-code-compare', langKey: 'tplReview' },
    { id: 'doc', icon: 'fa-file-lines', langKey: 'tplDoc' },
    { id: 'market', icon: 'fa-bullseye', langKey: 'tplMarket' }
];

let currentLang = 'zh';
let activeTemplateId = null;

function changeLanguage(lang) {
    currentLang = lang;
    const dict = translations[lang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerText = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
    });

    const langZh = document.getElementById('langZh');
    const langEn = document.getElementById('langEn');
    if (langZh) langZh.className = `px-5 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${lang === 'zh' ? 'active-lang' : 'text-slate-400'}`;
    if (langEn) langEn.className = `px-5 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${lang === 'en' ? 'active-lang' : 'text-slate-400'}`;
    
    if (typeof renderLibrary === 'function' && document.getElementById('templateList')) {
        renderLibrary();
    }

    if (typeof renderHomeLibrary === 'function' && document.getElementById('homeTemplateList')) {
        renderHomeLibrary();
    }

    if (homeActiveTemplateId) {
        const editor = document.getElementById('promptEditor');
        if (editor) {
            editor.value = templateData[currentLang][homeActiveTemplateId].replace(/\\n/g, '\n');
            detectVariables();
        }
    }
}

let homeActiveTemplateId = null;

function renderHomeLibrary() {
    const list = document.getElementById('homeTemplateList');
    if (!list) return;
    list.innerHTML = '';
    templateMeta.forEach(tpl => {
        const item = document.createElement('div');
        item.className = `p-4 cursor-pointer flex items-center group glass-card border-white/5 mb-3 transition-all hover:bg-sky-500/10 ${homeActiveTemplateId === tpl.id ? 'border-sky-500 bg-sky-500/5' : ''}`;
        item.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <i class="fas ${tpl.icon} text-slate-500 group-hover:text-sky-400 text-xs"></i>
            </div>
            <span class="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-wider">${translations[currentLang][tpl.langKey]}</span>
        `;
        item.onclick = () => {
            homeActiveTemplateId = tpl.id;
            const editor = document.getElementById('promptEditor');
            if (editor) {
                editor.value = templateData[currentLang][tpl.id].replace(/\\n/g, '\n');
                detectVariables();
            }
            renderHomeLibrary();
        };
        list.appendChild(item);
    });
}

function renderLibrary() {
    const list = document.getElementById('templateList');
    if (!list) return;
    list.innerHTML = '';
    templateMeta.forEach(tpl => {
        const item = document.createElement('div');
        item.className = `p-4 cursor-pointer flex items-center group glass-card border-white/5 mb-3 transition-all hover:bg-sky-500/10 ${activeTemplateId === tpl.id ? 'border-sky-500 bg-sky-500/5' : ''}`;
        item.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <i class="fas ${tpl.icon} text-slate-500 group-hover:text-sky-400 text-xs"></i>
            </div>
            <span class="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-wider">${translations[currentLang][tpl.langKey]}</span>
        `;
        item.onclick = () => {
            activeTemplateId = tpl.id;
            const editor = document.getElementById('promptEditor');
            editor.value = templateData[currentLang][tpl.id];
            renderLibrary();
            detectVariables();
            editor.scrollTop = 0;
        };
        list.appendChild(item);
    });
}

function detectVariables() {
    const editor = document.getElementById('promptEditor');
    if (!editor) return;
    const text = editor.value;
    const regex = /\[([A-Z0-9_]+)\]/g;
    const vars = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (!['TITLE', 'FRAMEWORK'].includes(match[1])) vars.add(match[1]);
    }

    const varPanel = document.getElementById('varPanel');
    const badge = document.getElementById('varCountBadge');
    const container = document.getElementById('dynamicInputs');

    if (!varPanel || !badge || !container) return;

    if (vars.size > 0) {
        varPanel.classList.remove('hidden');
        badge.classList.remove('hidden');
        container.innerHTML = '';
        vars.forEach(v => {
            const div = document.createElement('div');
            div.innerHTML = `
                <label class="block text-[8px] text-slate-500 font-black mb-2 uppercase tracking-widest">${v.replace(/_/g, ' ')}</label>
                <input type="text" data-var="${v}" placeholder="..." class="var-input input-tech w-full px-4 py-3 text-[11px] font-bold">
            `;
            container.appendChild(div);
        });
    } else {
        varPanel.classList.add('hidden');
        badge.classList.add('hidden');
    }
}

function compilePrompt() {
    const editor = document.getElementById('promptEditor');
    if (!editor || !editor.value.trim()) return null;

    const title = document.getElementById('appTitle').value || "PROJECT_CORE";
    const tech = document.getElementById('appTech').value || "LATEST_TECH";

    let res = editor.value;
    res = res.replace(/\[TITLE\]/g, title).replace(/\[FRAMEWORK\]/g, tech);
    
    document.querySelectorAll('.var-input').forEach(i => {
        const v = i.getAttribute('data-var');
        res = res.replace(new RegExp(`\\[${v}\\]`, 'g'), i.value.trim() || `[${v}]`);
    });

    return res;
}

function compileAndShow() {
    const compiled = compilePrompt();
    if (!compiled) {
        showToast(translations[currentLang].errorNoPrompt);
        return;
    }

    const outputSec = document.getElementById('outputSection');
    const outputEl = document.getElementById('compiledOutput');

    outputEl.textContent = compiled;
    outputSec.classList.remove('hidden');
    outputSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyOutput() {
    const outputEl = document.getElementById('compiledOutput');
    const text = outputEl && outputEl.textContent ? outputEl.textContent : null;

    if (!text) {
        // If no compiled output yet, compile first then copy
        const compiled = compilePrompt();
        if (!compiled) {
            showToast(translations[currentLang].errorNoPrompt);
            return;
        }
        const outputSec = document.getElementById('outputSection');
        document.getElementById('compiledOutput').textContent = compiled;
        outputSec.classList.remove('hidden');
        doCopy(compiled);
        return;
    }
    doCopy(text);
}

function doCopy(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(translations[currentLang].toastCopy);
    }).catch(() => {
        const dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        showToast(translations[currentLang].toastCopy);
    });
}

function showToast(message) {
    const t = document.getElementById('toast');
    const span = t.querySelector('span');
    if (span) span.textContent = message;
    t.style.opacity = '1';
    t.style.bottom = '4rem';
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.bottom = '3rem';
    }, 3000);
}

function scrollToTemplates() {
    document.getElementById('templateSection').scrollIntoView({ behavior: 'smooth' });
}

function switchToApp() {
    window.location.href = 'main.html';
}

function switchToLanding() {
    window.location.href = 'homepage.html';
}

window.onload = () => {
    changeLanguage('zh');
    const editor = document.getElementById('promptEditor');
    if (editor) {
        editor.addEventListener('input', () => {
            homeActiveTemplateId = null;
            activeTemplateId = null;
            detectVariables();
        });
    }
};
