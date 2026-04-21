let invoices = JSON.parse(localStorage.getItem("voklo_all")) || [{ items: [] }];
let currentIndex = 0;
let items = invoices[currentIndex].items;

// RENDER
function render() {
  let el = document.getElementById("items");
  el.innerHTML = "";

  items.forEach((item, i) => {
    el.innerHTML += `
<div class="card p-4 flex gap-3 items-center group transition-colors hover:border-indigo-300">
<input value="${item.name}" placeholder="Item description" oninput="items[${i}].name=this.value" class="flex-1 outline-none text-gray-800 font-medium bg-transparent">
<div class="flex items-center gap-1">
  <span class="text-gray-400 text-sm">$</span>
  <input type="number" value="${item.price}" oninput="updatePrice(${i},this.value)" class="w-16 text-right outline-none font-semibold text-gray-900 bg-transparent">
</div>
<button onclick="removeItem(${i})" class="remove-btn w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
</button>
</div>`;
  });

  updateTotal();
  save();
}

// UPDATE
function updatePrice(i, val) {
  items[i].price = parseFloat(val) || 0;
  updateTotal();
}

function updateTotal() {
  let t = items.reduce((a, b) => a + b.price, 0);
  document.getElementById("total").innerText = "$" + t;
}

// CRUD
function addItem() {
  items.push({ name: "", price: 0 });
  render();
  // Auto focus last item
  setTimeout(() => {
    const inputs = document.getElementById('items').querySelectorAll('input[type="text"]');
    if (inputs.length > 0) inputs[inputs.length - 1].focus();
  }, 50);
}

function removeItem(i) {
  items.splice(i, 1);
  render();
}

// STORAGE
function save() {
  invoices[currentIndex].items = items;
  localStorage.setItem("voklo_all", JSON.stringify(invoices));
}

// PREVIEW
function openPreview() {
  let el = document.getElementById("previewContent");
  el.innerHTML = "";
  let total = 0;

  items.forEach(i => {
    total += i.price;
    el.innerHTML += `
<div class="flex justify-between items-center py-1">
<span class="font-medium text-gray-800">${i.name || 'Unnamed Item'}</span>
<span>$${i.price}</span>
</div>`;
  });

  el.innerHTML += `
<div class="h-px bg-gray-200 my-3"></div>
<div class="flex justify-between items-center font-semibold text-gray-900 text-base">
<span>Total</span>
<span>$${total}</span>
</div>`;

  const modal = document.getElementById("previewModal");
  const card = document.getElementById("previewCard");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  // trigger reflow
  void modal.offsetWidth;
  modal.classList.remove("opacity-0");
  card.classList.remove("scale-95");
}

function closePreview() {
  const modal = document.getElementById("previewModal");
  const card = document.getElementById("previewCard");
  modal.classList.add("opacity-0");
  card.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 300);
}

// EXPORT
function cloneInvoice() {
  const clone = document.getElementById("invoice").cloneNode(true);
  clone.style.position = "fixed";
  clone.style.top = "-9999px";
  clone.style.width = "794px";
  clone.style.background = "#ffffff";
  clone.style.padding = "40px";
  clone.style.boxSizing = "border-box";

  // Add VokLo Logo header to export
  const headerHTML = `
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; font-family: 'Inter', sans-serif;">
    <div style="font-weight: 700; font-size: 28px; color: #4f46e5; letter-spacing: -0.5px;">VokLo</div>
    <div style="font-size: 16px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">INVOICE</div>
  </div>
`;
  clone.insertAdjacentHTML('afterbegin', headerHTML);

  // Remove UI elements
  const addBtn = clone.querySelector('#add-item-btn');
  if (addBtn) addBtn.remove();
  const removeBtns = clone.querySelectorAll('.remove-btn');
  removeBtns.forEach(btn => btn.remove());

  // Convert inputs to spans to ensure they render text properly
  const textInputs = clone.querySelectorAll('input[type="text"], input:not([type])');
  textInputs.forEach(input => {
    const span = document.createElement('span');
    span.innerText = input.value || input.placeholder;
    span.className = input.className;
    span.style.display = "inline-block";
    input.parentNode.replaceChild(span, input);
  });

  const numInputs = clone.querySelectorAll('input[type="number"]');
  numInputs.forEach(input => {
    const span = document.createElement('span');
    span.innerText = input.value;
    span.className = input.className;
    span.style.display = "inline-block";
    input.parentNode.replaceChild(span, input);
  });

  document.body.appendChild(clone);
  return clone;
}

async function exportPNG() {
  let c = cloneInvoice();
  let canvas = await html2canvas(c, { scale: 4, backgroundColor: '#ffffff' });

  let link = document.createElement("a");
  link.download = "voklo.png";
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();

  c.remove();
}

async function exportPDF() {
  let c = cloneInvoice();
  // Use scale 4 to match high resolution of PNG
  let canvas = await html2canvas(c, { scale: 4, backgroundColor: '#ffffff' });

  let img = canvas.toDataURL("image/png", 1.0);
  let { jsPDF } = window.jspdf;

  let pdf = new jsPDF("p", "px", "a4");
  const imgProps = pdf.getImageProperties(img);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("voklo.pdf");

  c.remove();
}

// WHATSAPP SHARE
async function sendWhatsApp() {
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.innerText = "Wait...";
  }

  try {
    let c = cloneInvoice();
    let canvas = await html2canvas(c, { scale: 3, backgroundColor: '#ffffff' });
    c.remove();

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'voklo-invoice.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'VokLo Invoice',
          });
        } catch (error) {
          console.log('Error sharing:', error);
        }
      } else {
        // Fallback if browser doesn't support file sharing
        let t = document.getElementById("total").innerText;
        let msg = encodeURIComponent(`VokLo Invoice\nTotal: ${t}`);
        window.open(`https://wa.me/?text=${msg}`);
        alert("Direct image sharing not supported by this browser. Opened WhatsApp text link instead.");
      }

      if (shareBtn) shareBtn.innerText = "Share";
    }, 'image/png');
  } catch (e) {
    if (shareBtn) shareBtn.innerText = "Share";
    console.error("Share failed", e);
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  render();
});
