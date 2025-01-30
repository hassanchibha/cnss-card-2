const canvas = new fabric.Canvas('mainCanvas', {
    selection: true,
    preserveObjectStacking: true,
    allowTouchScrolling: true
});

let originalImage = null;
let currentSelectedText = null;
let selectedPreset = null;
const elementModal = document.getElementById('elementSelectionModal');
const elementModalUploadInput = document.getElementById('elementImageUploadModal');
const elementButton = document.getElementById('elementButton');
const panelContent = document.querySelector('.panel-content');
let originalScale = 1; // لتخزين نسبة التحجيم الأصلية

// تحديث معالجات الأحداث للصور
document.getElementById('bgImageUpload').addEventListener('change', e => loadBackgroundImage(e.target.files[0]));
document.getElementById('elementImageUpload').addEventListener('change', e => loadElementImage(e.target.files[0]));

const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
// دالة تحميل صورة الخلفية
function loadBackgroundImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // تمكين CORS
        img.onload = () => {
            const fabricImage = new fabric.Image(img);
            if (originalImage) canvas.remove(originalImage);
            originalImage = fabricImage;
            updateCanvasSize(fabricImage);
            canvas.setBackgroundImage(fabricImage, canvas.renderAll.bind(canvas));
        };
        img.src = proxyUrl + e.target.result;
    };
    reader.readAsDataURL(file);
}

// دالة تحميل الصور كعناصر
function loadElementImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // تمكين CORS
        img.onload = () => {
            const fabricImage = new fabric.Image(img);
            const maxSize = 200;
            const scale = Math.min(maxSize/fabricImage.width, maxSize/fabricImage.height);
            
            fabricImage.scale(scale);
            fabricImage.set({
                left: canvas.width/2,
                top: canvas.height/2,
                hasControls: true,
                borderColor: '#4CAF50',
                originX: 'center',
                originY: 'center'
            });
            canvas.add(fabricImage);
            canvas.setActiveObject(fabricImage);
            canvas.requestRenderAll();
        };
        img.src = proxyUrl + e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateCanvasSize(img) {
    const container = document.querySelector('.canvas-wrapper');
    const scale = Math.min(
        (container.clientWidth - 40) / img.width,
        (container.clientHeight - 40) / img.height
    );

    // حساب نسبة التحجيم الجديدة مقارنة بالأصلية
    const scaleRatio = scale / originalScale;
    originalScale = scale; // تحديث النسبة الأصلية

    // تحديث حجم Canvas
    canvas.setDimensions({
        width: img.width * scale,
        height: img.height * scale
    });
    img.scale(scale);
    canvas.requestRenderAll();

    // تحديث حجم النصوص بناءً على نسبة التحجيم
    canvas.forEachObject(obj => {
        if (obj.type === 'textbox') {
            obj.scaleX *= scaleRatio;
            obj.scaleY *= scaleRatio;
            obj.setCoords(); // تحديث إحداثيات النص
        }
    });

    canvas.requestRenderAll();
}

// Text Addition
document.getElementById('fullName').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addText();
        this.value = '';
    }
});

function addText() {
    const text = document.getElementById('fullName').value.trim();
    if (!text) return;
    const center = canvas.getCenter();
    const textbox = new fabric.Textbox(text.toUpperCase(), {
        left: center.left,
        top: center.top,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        hasControls: true,
        borderColor: '#2196F3',
        originX: 'center',
        originY: 'center',
        textAlign: 'right' // اتجاه النص الافتراضي
    });
	document.getElementById('fullName').value = '';
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
}

// Properties Panel
canvas.on('selection:created', updatePropertiesPanel);
canvas.on('selection:updated', updatePropertiesPanel);
canvas.on('selection:cleared', hidePropertiesPanel);

function updatePropertiesPanel(e) {
    const selectedObject = canvas.getActiveObject();
    if (selectedObject && selectedObject.type === 'textbox') {
        currentSelectedText = selectedObject;
        showTextProperties(selectedObject);
    } else {
        hidePropertiesPanel();
    }
}

function showTextProperties(textObject) {
    panelContent.style.display = 'block';
    
    document.getElementById('textContent').value = textObject.text;
    document.getElementById('fontSize').value = textObject.fontSize;
    document.getElementById('fontFamily').value = textObject.fontFamily;
    document.getElementById('fontWeight').value = textObject.fontWeight || 'normal';
	document.getElementById('textColor').value = textObject.fill || '#000000';
	// تعيين قيمة اتجاه النص
    document.getElementById('textAlign').value = textObject.textAlign || 'right'; // القيمة الافتراضية 'right'

    setupPropertyListeners();
}

function hidePropertiesPanel() {
    panelContent.style.display = 'none';
    currentSelectedText = null;
}

function setupPropertyListeners() {
    document.getElementById('textContent').oninput = (e) => {
        if (currentSelectedText) {
            currentSelectedText.set('text', e.target.value);
            canvas.renderAll();
        }
    };

    document.getElementById('fontSize').oninput = (e) => {
        if (currentSelectedText) {
            currentSelectedText.set('fontSize', parseInt(e.target.value));
            canvas.renderAll();
        }
    };

    document.getElementById('fontFamily').onchange = (e) => {
        if (currentSelectedText) {
            currentSelectedText.set('fontFamily', e.target.value);
            canvas.renderAll();
        }
    };

    document.getElementById('fontWeight').onchange = (e) => {
        if (currentSelectedText) {
            currentSelectedText.set('fontWeight', e.target.value);
            canvas.renderAll();
        }
    };
	// إضافة مستمع حدث اللون
    document.getElementById('textColor').oninput = (e) => {
        if (currentSelectedText) {
            currentSelectedText.set('fill', e.target.value);
            canvas.renderAll();
        }
    };
	// إضافة مستمع حدث لاتجاه النص
    document.getElementById('textAlign').onchange = (e) => {
        if (currentSelectedText) {
            currentSelectedText.set('textAlign', e.target.value);
            canvas.renderAll();
        }
    };
	// حذف العنصر المحدد
	document.getElementById('deleteElement').addEventListener('click', () => {
		const activeObject = canvas.getActiveObject();
		if (activeObject) {
			canvas.remove(activeObject);
			canvas.requestRenderAll();
			hidePropertiesPanel(); // إخفاء لوحة الخصائص بعد الحذف
		}
	});
	// إحضار العنصر للأمام
	document.getElementById('bringForward').addEventListener('click', () => {
		const activeObject = canvas.getActiveObject();
		if (activeObject) {
			activeObject.bringForward();
			canvas.requestRenderAll();
		}
	});

	// إرسال العنصر للخلف
	document.getElementById('sendBackward').addEventListener('click', () => {
		const activeObject = canvas.getActiveObject();
		if (activeObject) {
			activeObject.sendBackwards();
			canvas.requestRenderAll();
		}
	});
}

// Copy/Paste Functionality
let copiedObject = null;
const PASTE_OFFSET = 40;

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'c') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone(function(cloned) {
                copiedObject = cloned;
            });
        }
    }
    
    if (e.ctrlKey && e.key === 'v') {
        if (copiedObject) {
            copiedObject.clone(function(clonedObj) {
                canvas.discardActiveObject();
                clonedObj.set({
                    left: clonedObj.left + PASTE_OFFSET,
                    top: clonedObj.top + PASTE_OFFSET,
                    evented: true,
                });
                
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

// Keyboard Controls
document.addEventListener('keydown', e => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const step = e.shiftKey ? 5 : 1;
    switch(e.key) {
        case 'ArrowUp': obj.top -= step; break;
        case 'ArrowDown': obj.top += step; break;
        case 'ArrowLeft': obj.left -= step; break;
        case 'ArrowRight': obj.left += step; break;
        case 'Delete':
			// إذا كان العنصر المحدد هو مجموعة من العناصر
            if (obj.type === 'activeSelection') {
                obj.forEachObject(function(objc) {
                    canvas.remove(objc);
                });
                canvas.discardActiveObject();
            } else {
                // إذا كان العنصر المحدد عنصر واحد فقط
                canvas.remove(obj);
            }
			//canvas.remove(obj);
			break;
        case '+': obj.bringForward(); break;
        case '-': obj.sendBackwards(); break;
    }
    canvas.requestRenderAll();
});

// Save Image
function saveImage() {
    if (!originalImage) return alert('الرجاء تحميل خلفية أولاً');
	const canvas = document.getElementById(mainCanvas');
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'صورة_مخصصة.png';
    link.click();
}

// Resize Handler
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (originalImage) {
            updateCanvasSize(originalImage);
        }
    }, 250);
});

// Modal Functionality
const modal = document.getElementById('bgSelectionModal');
const closeModalBtn = modal.querySelector('.close-modal');
const modalUploadInput = document.getElementById('bgImageUploadModal');

// إغلاق النافذة المنبثقة
closeModalBtn.addEventListener('click', () => {
    if (selectedPreset) {
        selectedPreset.classList.remove('selected');
        selectedPreset = null;
    }
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// إغلاق النافذة عند النقر خارجها
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        if (selectedPreset) {
            selectedPreset.classList.remove('selected');
            selectedPreset = null;
        }
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

const presetBackgrounds = document.querySelectorAll('#bgSelectionModal .preset-image');

presetBackgrounds.forEach(preset => {
    preset.addEventListener('click', () => {
        if (selectedPreset) {
            selectedPreset.classList.remove('selected');
        }

        preset.classList.add('selected');
        selectedPreset = preset;

        const imageUrl = preset.dataset.src;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const fabricImage = new fabric.Image(img);
            if (originalImage) canvas.remove(originalImage);
            originalImage = fabricImage;
            updateCanvasSize(fabricImage);
            canvas.setBackgroundImage(fabricImage, canvas.renderAll.bind(canvas));
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        img.src = imageUrl;
    });
});

document.querySelectorAll('#elementSelectionModal .preset-image').forEach(preset => {
    preset.removeEventListener('click', addElementImage); // إزالة أي استماع سابق
    preset.addEventListener('click', addElementImage);
});

function addElementImage(event) {
    const imageUrl = event.target.dataset.src;
    
    // معالجة ملفات SVG
    if (imageUrl && imageUrl.endsWith('.svg')) {
        fabric.loadSVGFromURL(imageUrl, function(objects, options) {
            const svg = fabric.util.groupSVGElements(objects, options);
            
            svg.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                hasControls: true,
                borderColor: '#4CAF50',
                originX: 'center',
                originY: 'center'
            });

            canvas.add(svg);
            canvas.setActiveObject(svg);
            elementModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            canvas.requestRenderAll();
        }, function() {}, { crossOrigin: 'anonymous' }); // إضافة خيار CORS لتحميل SVG
    } else {
        // معالجة أنواع الصور الأخرى
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const fabricImage = new fabric.Image(img);
            const maxSize = 200;
            const scale = Math.min(maxSize / fabricImage.width, maxSize / fabricImage.height);

            fabricImage.scale(scale);
            fabricImage.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                hasControls: true,
                borderColor: '#4CAF50',
                originX: 'center',
                originY: 'center'
            });

            canvas.add(fabricImage);
            canvas.setActiveObject(fabricImage);
            elementModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            canvas.requestRenderAll();
        };
        img.src = imageUrl;
    }
}

// معالجة تحميل الصور من الجهاز
modalUploadInput.addEventListener('change', e => {
    loadBackgroundImage(e.target.files[0]);
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Background Button Click Handler
document.getElementById('backgroundButton').addEventListener('click', function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // منع التمرير
});

// إضافة معالجات الأحداث للنافذة المنبثقة للعناصر
elementButton.addEventListener('click', function() {
    elementModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

elementModal.querySelector('.close-modal').addEventListener('click', () => {
    elementModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

elementModal.addEventListener('click', (e) => {
    if (e.target === elementModal) {
        elementModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// معالجة اختيار الصور المحملة مسبقاً في نافذة العناصر
elementModal.querySelectorAll('.preset-image').forEach(preset => {
    preset.addEventListener('click', () => {
        const imageUrl = preset.dataset.src;
        fabric.Image.fromURL(imageUrl, img => {
            // تعيين حجم معقول للصورة المضافة
            const maxSize = 200; // الحجم الأقصى المطلوب
            const scale = Math.min(maxSize/img.width, maxSize/img.height);
            
            img.scale(scale); // تطبيق المقياس المناسب
            
            img.set({
                left: canvas.width/2,
                top: canvas.height/2,
                hasControls: true,
                hasBorders: true,
                borderColor: '#4CAF50',
                cornerColor: '#4CAF50',
                cornerSize: 10,
                transparentCorners: false,
                originX: 'center',
                originY: 'center',
                selectable: true,
                evented: true
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            elementModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            canvas.requestRenderAll();
        });
    });
});

// معالجة تحميل الصور من الجهاز في نافذة العناصر
elementModalUploadInput.addEventListener('change', e => {
    loadElementImage(e.target.files[0]);
    elementModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});
