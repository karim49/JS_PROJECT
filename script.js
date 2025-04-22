let productsData = {};
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = null;
let sliderData = [];
let currentSlide = 0;
let sliderInterval;

async function loadData() {
  try {
    const response = await fetch("jsonData");
    productsData = await response.json();
    sliderData = productsData.sliderData;
    if (document.getElementById('slider')) {
      renderSlider();
      startSlider();
    }
    displayCategories();
  } catch (error) {
    console.error("Error loading JSON data:", error);
  }
}

function displayCategories() {
  const categoryContainer = document.querySelector(".category-container");
  if (!categoryContainer)
    return;
  categoryContainer.innerHTML = "";
  productsData.categories.forEach(category => {
    const div = document.createElement("div");
    div.classList.add("category");
    div.onclick = () => showItems(category.name.toLowerCase());
    div.innerHTML = `
      <img src="${category.image}" alt="${category.name}" />
      <h3>${category.name}</h3>
    `;
    categoryContainer.appendChild(div);
  });
}

function showItems(categoryName) {
  currentCategory = categoryName;
  const productSection = document.getElementById("products");
  if (!productSection)
    return;
  productSection.innerHTML = "";
  const prodList = productsData.products[capitalize(categoryName)];
  if (!prodList) return;
  prodList.forEach(product => {
    const div = document.createElement("div");
    div.classList.add("product");
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>$${product.price}</p>
      <div id="product-btn-${product.id}">
        <button onclick="addToCart(${product.id}, '${categoryName}')">Add to Cart</button>
      </div>
    `;
    productSection.appendChild(div);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function addToCart(productId, category) {
  const prodList = productsData.products[capitalize(category)];
  const product = prodList.find(item => item.id === productId);
  if (!product) return;
  const existingProduct = cart.find(item => item.id === productId);
  if (existingProduct) {
    existingProduct.count++;
  } else {
    cart.push({ ...product, count: 1 });
  }
  updateCartCount();
  localStorage.setItem("cart", JSON.stringify(cart));
  updateProductButton(productId);
}

function updateProductButton(productId) {
  const btnContainer = document.getElementById(`product-btn-${productId}`);
  const product = cart.find(item => item.id === productId);
  if (btnContainer && product) {
    btnContainer.innerHTML = `
      <div class="btn-group">
        <button onclick="updateCartFromHome(${productId}, -1)">-</button>
        <span id="home-count-${productId}">${product.count}</span>
        <button onclick="updateCartFromHome(${productId}, 1)">+</button>
      </div>
    `;
  }
}

function updateCartFromHome(productId, delta) {
  updateCart(productId, delta);
  const product = cart.find(item => item.id === productId);
  const btnContainer = document.getElementById(`product-btn-${productId}`);
  if (!product) {
    btnContainer.innerHTML = `<button onclick="addToCart(${productId}, '${currentCategory}')">Add to Cart</button>`;
  } else {
    updateProductButton(productId);
  }
}

function updateCart(productId, delta) {
  const product = cart.find(item => item.id === productId);
  if (product) {
    product.count += delta;
    if (product.count <= 0) { cart = cart.filter(item => item.id !== productId); }
  }
  updateCartCount();
  localStorage.setItem("cart", JSON.stringify(cart));
  if (document.getElementById("cart-items")) displayCart();
}

function updateCartCount() {
  const cartCount = cart.reduce((total, item) => total + item.count, 0);
  document.querySelectorAll("#cart-count").forEach(el => el.innerText = cartCount);
  const proceedBtn = document.getElementById("proceed-to-payment");
  if (proceedBtn) proceedBtn.disabled = (cartCount === 0);
}
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartCount();
  localStorage.setItem("cart", JSON.stringify(cart));
  displayCart();
}
function displayCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  if (!cartItems) return;
  cartItems.innerHTML = "";
  let subtotal = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.count;
    subtotal += itemTotal;
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <span class="cart-name">${item.name}</span>
      <span class="cart-price">$${item.price} each</span>
      <span class="cart-delivery">Est. Delivery: ${getEstimatedDelivery()}</span>
      <div class="btn-group">
        <button onclick="updateCart(${item.id}, -1)">-</button>
        <span>${item.count}</span>
        <button onclick="updateCart(${item.id}, 1)">+</button>
        <button onclick="removeFromCart(${item.id})">Remove</button>
      </div>
      <span class="cart-total">Total: $${itemTotal}</span>
    `;
    cartItems.appendChild(div);
  });
  if (cartTotal) cartTotal.innerHTML = `Subtotal: $${subtotal}`;
}
function displayInvoice() {
  const breakdown = document.getElementById("invoice-breakdown");
  if (!breakdown) return;
  let invoiceHTML = "";
  let subtotal = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.count;
    subtotal += itemTotal;
    invoiceHTML += `<p>${item.name} (x${item.count}): $${itemTotal} - Delivery: ${getEstimatedDelivery()}</p>`;
  });
  const deliveryFee = 5;
  const grandTotal = subtotal + deliveryFee;
  invoiceHTML += `<p><strong>Subtotal:</strong> $${subtotal}</p>`;
  invoiceHTML += `<p><strong>Delivery Fee:</strong> $${deliveryFee}</p>`;
  invoiceHTML += `<p><strong>Grand Total:</strong> $${grandTotal}</p>`;
  invoiceHTML += `<p><strong>Estimated Delivery Date:</strong> ${getEstimatedDelivery()}</p>`;
  breakdown.innerHTML = invoiceHTML;
  breakdown.style.display = "block";
}
const paymentForm = document.getElementById("payment-form");
if (paymentForm) {
  paymentForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const orderNum = Math.floor(Math.random() * 10000);
    const deliveryDate = getEstimatedDelivery();
    document.getElementById("order-number").innerText = orderNum;
    document.getElementById("estimated-delivery").innerText = deliveryDate;
    document.getElementById("order-confirmation").style.display = "block";
    paymentForm.style.display = "none";
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  });
}
const paymentMethod = document.getElementById("payment-method");
if (paymentMethod) {
  paymentMethod.addEventListener("change", function () {
    const cardInfo = document.getElementById("card-info");
    if (cardInfo)
      cardInfo.style.display = (this.value === "credit") ? "block" : "none";
  });
}



///////////////////////slider/////////////////////////
function updateSlider() {
  const slider = document.getElementById('slider');
  slider.style.transform = `translateX(-${currentSlide * 100}%)`;
}
function nextSlide() {
  currentSlide = (currentSlide + 1) % sliderData.length;
  updateSlider();
}
function prevSlide() {
  currentSlide = (currentSlide - 1 + sliderData.length) % sliderData.length;
  updateSlider();
}
function startSlider() { sliderInterval = setInterval(nextSlide, 3000); }
function stopSlider() { clearInterval(sliderInterval); }

if (document.getElementById('banner')) {
  document.getElementById('banner').addEventListener('mouseover', stopSlider);
  document.getElementById('banner').addEventListener('mouseout', startSlider);
}
function renderSlider() {
  const slider = document.getElementById('slider');
  if (!slider) return;
  slider.innerHTML = "";
  sliderData.forEach(slide => {
    const slideDiv = document.createElement('div');
    slideDiv.classList.add('slide');
    slideDiv.innerHTML = `<img src="${slide.image}" alt="${slide.name}" />`;
    slider.appendChild(slideDiv);
  });
  updateSlider();
}
///////////////////////slider end /////////////////////////


///////////////////////invoice  /////////////////////////
if (document.getElementById("invoice-breakdown"))
  displayInvoice();
function displayInvoice() {
  const breakdown = document.getElementById("invoice-breakdown");
  console.log("invoice-breakdown", breakdown)
  if (!breakdown)
    return;
  let invoiceHTML = "<h3>Invoice Breakdown</h3>";
  let subtotal = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.count;
    subtotal += itemTotal;
    invoiceHTML += `<p>${item.name} (x${item.count}): $${itemTotal}</p>`;
  });
  const deliveryFee = 5;
  const grandTotal = subtotal + deliveryFee;
  invoiceHTML += `<p><strong>Subtotal:</strong> $${subtotal}</p>`;
  invoiceHTML += `<p><strong>Delivery Fee:</strong> $${deliveryFee}</p>`;
  invoiceHTML += `<p><strong>Grand Total:</strong> $${grandTotal}</p>`;
  breakdown.innerHTML = invoiceHTML;
}
///////////////////////invoice end /////////////////////////

function getEstimatedDelivery() {
  let deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  return (deliveryDate.getMonth() + 1) + "/" + deliveryDate.getDate() + "/" + deliveryDate.getFullYear();
}

window.onload = function () {
  updateCartCount();
  if (document.getElementById("cart-items")) displayCart();
  if (document.getElementById("products")) loadData();
};
