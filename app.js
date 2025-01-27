const canvas = new fabric.Canvas('mainCanvas', {
    selection: true,
    preserveObjectStacking: true,
    allowTouchScrolling: true
});

let originalImage = null;
let currentText = null;

// تهيئة سحب وإفلات الأشكال
document.querySelectorAll('.shape-item').forEach(item => {
    item.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', this.dataset.type);
    });
});

canvas.wrapperEl.addEventListener('dragover', e => e.preventDefault());

canvas.wrapperEl.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    const rect = canvas.wrapperEl.getBoundingClientRect();
    const scale = canvas.getZoom(); // احصل على مقياس التكبير/التصغير
    const x = (e.clientX - rect.left - canvas.viewportTransform[4]) / scale;
    const y = (e.clientY - rect.top - canvas.viewportTransform[5]) / scale;
    addShape(type, x, y);
});

// وظائف إدارة الأشكال
function addShape(type, x, y) {
    let shape;
    switch(type) {
        case 'rect':
            shape = new fabric.Rect({
                left: x,
                top: y,
                width: 100,
                height: 60,
                fill: '#f0f0f0',
                stroke: '#333',
                strokeWidth: 2
            });
            break;
        case 'circle':
            shape = new fabric.Circle({
                left: x,
                top: y,
                radius: 40,
                fill: '#f0f0f0',
                stroke: '#333',
                strokeWidth: 2
            });
            break;
        case 'triangle':
            shape = new fabric.Triangle({
                left: x,
                top: y,
                width: 80,
                height: 80,
                fill: '#f0f0f0',
                stroke: '#333',
                strokeWidth: 2
            });
            break;
    }
    if (shape) {
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
    }
}

// إدارة تحميل الصور
document.getElementById('bgImageUpload').addEventListener('change', e => loadImage(e.target.files[0], true));
document.getElementById('elementImageUpload').addEventListener('change', e => loadImage(e.target.files[0], false));

function loadImage(file, isBackground) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        fabric.Image.fromURL(e.target.result, img => {
            if (isBackground) {
                if (originalImage) canvas.remove(originalImage);
                originalImage = img;
                updateCanvasSize(img);
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            } else {
                img.set({
                    left: canvas.width/2,
                    top: canvas.height/2,
                    hasControls: true,
                    borderColor: '#4CAF50',
                    originX: 'center',
                    originY: 'center'
                });
                canvas.add(img);
                canvas.setActiveObject(img);
            }
        });
    };
    reader.readAsDataURL(file);
}

function updateCanvasSize(img) {
    const container = document.querySelector('.canvas-wrapper');
    const scale = Math.min(
        (container.clientWidth - 40) / img.width,
        (container.clientHeight - 40) / img.height
    );
    canvas.setDimensions({
        width: img.width * scale,
        height: img.height * scale
    });
    img.scale(scale);
    canvas.requestRenderAll();
}

// إضافة مستمع جديد لحقل النص
document.getElementById('fullName').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // منع السلوك الافتراضي للمتصفح
        
        addText();
        
        // مسح حقل النص بعد الإضافة
        this.value = '';
    }
});
// إدارة النصوص
function addText() {
    const text = document.getElementById('fullName').value.trim();
    if (!text) return;
	const center = canvas.getCenter();
    const textbox = new fabric.Textbox(text.toUpperCase(), {
        left: center.left,
        top: center.top,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000',
        hasControls: true,
        borderColor: '#2196F3',
        originX: 'center',
        originY: 'center'
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
}

// تخزين العنصر المنسوخ
let copiedObject = null;
const PASTE_OFFSET = 20; // مقدار الإزاحة بالبيكسل

// إضافة مستمع لأحداث لوحة المفاتيح للنسخ واللصق
document.addEventListener('keydown', function(e) {
    // التحقق من النسخ (Ctrl+C)
    if (e.ctrlKey && e.key === 'c') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            // نسخ العنصر المحدد
            activeObject.clone(function(cloned) {
                copiedObject = cloned;
            });
        }
    }
    
    // التحقق من اللصق (Ctrl+V)
    if (e.ctrlKey && e.key === 'v') {
        if (copiedObject) {
            // نسخ العنصر مرة أخرى لتجنب المشاكل مع المراجع
            copiedObject.clone(function(clonedObj) {
                canvas.discardActiveObject();
                
                // تعيين الموقع الجديد مع إزاحة
                clonedObj.set({
                    left: clonedObj.left + PASTE_OFFSET,
                    top: clonedObj.top + PASTE_OFFSET,
                    evented: true,
                });
                
                // إذا كان العنصر المنسوخ مجموعة
                if (clonedObj.type === 'activeSelection') {
                    clonedObj.canvas = canvas;
                    clonedObj.forEachObject(function(obj) {
                        canvas.add(obj);
                    });
                    clonedObj.setCoords();
                } else {
                    canvas.add(clonedObj);
                }
                
                canvas.setActiveObject(clonedObj);
                canvas.requestRenderAll();
            });
        }
    }
});

// تحديث مستمع الأحداث الحالي للمفاتيح لدمج الوظائف الجديدة
const existingKeydownListener = document.listeners?.keydown?.[0];
document.removeEventListener('keydown', existingKeydownListener);
// التحكم بالعناصر
document.addEventListener('keydown', e => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const step = e.shiftKey ? 5 : 1;
    switch(e.key) {
        case 'ArrowUp': obj.top -= step; break;
        case 'ArrowDown': obj.top += step; break;
        case 'ArrowLeft': obj.left -= step; break;
        case 'ArrowRight': obj.left += step; break;
        case 'Delete': canvas.remove(obj); break;
		case '+': obj.bringForward(); break;
		case '-': obj.sendToBack(); break;
		//case 'l': obj.selectable = false; obj.evented = false;obj.hoverCursor ='default'; break;
    }
    canvas.requestRenderAll();
});


// تعديل النصوص
canvas.on('mouse:dblclick', e => {
    if (e.target?.isType('textbox')) {
        currentText = e.target;
        const modal = document.getElementById('editModal');
        
        // التحقق من وجود العناصر قبل تعيين القيم
        const editText = document.getElementById('editText');
        const editFontSize = document.getElementById('editFontSize');
        const editColor = document.getElementById('editColor');
        const editFont = document.getElementById('editFont');
        
        if (editText && editFontSize && editColor && editFont) {
            editText.value = currentText.text;
            editFontSize.value = currentText.fontSize;
            editColor.value = currentText.fill;
            editFont.value = currentText.fontFamily;
            new bootstrap.Modal(modal).show();
        } else {
            console.error('One or more form elements are missing!');
        }
    }
});

function saveTextChanges() {
    currentText.set({
        text: document.getElementById('editText').value.toUpperCase(),
        fontSize: parseInt(document.getElementById('editFontSize').value),
        fill: document.getElementById('editColor').value,
        fontFamily: document.getElementById('editFont').value
    });
    canvas.requestRenderAll();
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
}

// حفظ الصورة
function saveImage() {
    if (!originalImage) return alert('الرجاء تحميل خلفية أولاً');
    const link = document.createElement('a');
    link.download = `design-${Date.now()}.png`;
    link.href = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
    });
    link.click();
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (originalImage) updateCanvasSize(originalImage);
    }, 250);
});