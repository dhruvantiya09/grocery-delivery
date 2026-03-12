
console.log("js loaded");


// ---------------------- Global Variables ----------------------
let allProducts = {}; // products grouped by category
let selectedProduct = null;
let quantity = 1;
const isHomePage = window.location.pathname === "/" || window.location.pathname === "/home";

// ---------------------- Fetch Products ----------------------
async function fetchProducts() {
  try {
    const res = await fetch("/products"); // fetch from backend
    const products = await res.json();

    // Group by category
    allProducts = products.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {});

    // Load first category by default
    const firstBtn = document.querySelector(".category-btn");
    const firstCategory = Object.keys(allProducts)[0];
    if (firstBtn && firstCategory) loadCategory(firstCategory, firstBtn);

  } catch (err) {
    console.error("Failed to fetch products:", err);
  }
}

// ---------------------- Category Loading ----------------------
function loadCategory(category, clickedBtn) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  // Reset all category buttons
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("bg-green-600", "text-white", "border-green-600");
    btn.classList.add("bg-white", "text-gray-700", "border-gray-300");
  });

  // Activate clicked button
  clickedBtn.classList.remove("bg-white", "text-gray-700", "border-gray-300");
  clickedBtn.classList.add("bg-green-600", "text-white", "border-green-600");

  // Load products
 const productsToShow = isHomePage
  ? allProducts[category]?.slice(0, 4)
  : allProducts[category];

productsToShow?.forEach(item => {

    container.innerHTML += `
      <div onclick="location.href='/shop'"
           class="min-w-[260px] h-[380px] flex-shrink-0 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col p-4 cursor-pointer">
        
        <div class="h-36 flex items-center justify-center">
          <img src="${item.image || item.img}" class="max-h-full object-contain"
               onerror="this.src='https://via.placeholder.com/150'" />
        </div>

        <div class="flex flex-col flex-grow text-center mt-4">
          <h3 class="font-semibold text-lg h-12 flex items-center justify-center">${item.name}</h3>
          <p class="text-emerald-600 font-bold text-lg h-8">₹${item.price}</p>
          <div class="mt-auto">
            <button onclick=location.href="/shop"
                    class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

// ---------------------- Open / Close Product Modal ----------------------
function openProduct(product) {
  if (typeof product === "string") {
    console.error("openProduct received ID instead of object ❌");
    return;
  }

  selectedProduct = product;
  quantity = 1;

  document.getElementById("modalImg").src =
    selectedProduct.image ||
    selectedProduct.img ||
    "https://via.placeholder.com/150";

  document.getElementById("modalName").innerText = selectedProduct.name;
  document.getElementById("modalPrice").innerText = `₹${selectedProduct.price}`;
  document.getElementById("qty").innerText = quantity;

  document.getElementById("productModal").classList.remove("hidden");
  document.getElementById("productModal").classList.add("flex");
}

function closeProduct() {
  document.getElementById("productModal").classList.add("hidden");
  document.getElementById("productModal").classList.remove("flex");
}

// ---------------------- Change Quantity ----------------------
function changeQty(val) {
  quantity = Math.max(1, quantity + val);
  document.getElementById("qty").innerText = quantity;
}

// ---------------------- Open Product By ID ----------------------
function openProductById(id) {
  console.log("Clicked ID:", id);

  for (let cat in allProducts) {
    const product = allProducts[cat].find(
      p => p._id.toString() === id.toString()
    );

    if (product) {
      console.log("Found product:", product);
      return openProduct(product);
    }
  }

  console.log("Product NOT found ❌");
}

// ---------------------- Place Order ----------------------
async function placeDirectOrder() {
  if (!selectedProduct) {
    alert("No product selected");
    return;
  }

  const orderData = {
    cart: [
      { productId: selectedProduct._id, qty: quantity }
    ]
  };

  try {
    const res = await fetch("/order/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();
    console.log("Order response:", data);

    if (data.success) {
      alert("Order placed successfully ✅");

      closeProduct();

      quantity = 1;
      document.getElementById("qty").innerText = quantity;

      // optional: redirect to my-orders
      // window.location.href = "/my-orders";

    } else {
      alert("Order failed ❌: " + (data.message || ""));
    }

  } catch (err) {
    console.error(err);
    alert("Server error ❌");
  }
}


// ---------------------- Scroll Products ----------------------
function scrollProducts(direction) {
  const container = document.getElementById("products");
  const scrollAmount = 300;
  container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
}

// ---------------------- Smooth Scroll & Navbar ----------------------
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    window.scrollTo({ top: target.offsetTop - 80, behavior: "smooth" });
  });
});

const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("shadow-lg", window.scrollY > 40);
  });
}

// ---------------------- Active Menu + Section Reveal ----------------------
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(section => {
    if (scrollY >= section.offsetTop - 120) current = section.id;
    if (section.getBoundingClientRect().top < window.innerHeight - 100) section.classList.add("show");
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) link.classList.add("active");
  });
});

window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

function changeQty(value) {
  quantity += value;

  if (quantity < 1) quantity = 1;

  document.getElementById("qty").innerText = quantity;
}

  function decreaseQty(id) {
    let qtyInput = document.getElementById("qty-" + id);
    let hiddenInput = document.getElementById("hidden-qty-" + id);

    if (qtyInput.value > 1) {
      qtyInput.value = parseInt(qtyInput.value) - 1;
      hiddenInput.value = qtyInput.value;
    }
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function assignNearestDelivery(orderId) {

  const order = await Order.findById(orderId);

  if (!order.deliveryLocation) return;

  const availableBoys = await DeliveryBoy.find({
    isAvailable: true,
    isActive: true
  });

  if (!availableBoys.length) return;

  let nearestBoy = null;
  let shortestDistance = Infinity;

  for (let boy of availableBoys) {

    if (!boy.location) continue;

    const distance = calculateDistance(
      order.deliveryLocation.lat,
      order.deliveryLocation.lng,
      boy.location.lat,
      boy.location.lng
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestBoy = boy;
    }
  }

  if (nearestBoy) {
    order.deliveryBoy = nearestBoy._id;
    order.status = "Confirmed";
    await order.save();

    nearestBoy.isAvailable = false;
    await nearestBoy.save();
  }
}

// ---------------------- Initialize ----------------------
document.addEventListener("DOMContentLoaded", fetchProducts);

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products");

  if (!container) return;

  try {
    const res = await fetch("/api/home-products");
    const products = await res.json();

    if (!products.length) {
      container.innerHTML = "<p>No products available.</p>";
      return;
    }

    container.innerHTML = products.map(product => `
      <div onclick="location.href='/shop'" class="bg-white rounded-2xl shadow-md w-64 flex flex-col overflow-hidden hover:shadow-xl transition">
        
        <img 
          src="${product.image || '/images/default.png'}"
          class="h-40 object-cover"
          onerror="this.src='/images/default.png'"
        />

        <div class="p-4 flex flex-col flex-grow">
          <h3 class="font-semibold text-lg truncate">
            ${product.name}
          </h3>

          <p class="text-green-600 font-bold mt-2">
            ₹ ${product.price}
          </p>

          <button onclick="location.href='/shop'"
            class="mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
            View
          </button>
        </div>

      </div>
    `).join("");

  } catch (err) {
    console.error("Failed to load home products:", err);
  }
});

  function openLearn() {
    const modal = document.getElementById("learnModal");
    const overlay = document.getElementById("learnOverlay");
    const box = document.getElementById("learnBox");
    const main = document.getElementById("mainContent");

    modal.classList.remove("hidden");
    main.classList.add("blur-sm");

    setTimeout(() => {
      overlay.classList.remove("opacity-0");
      box.classList.remove("opacity-0", "scale-95", "translate-y-6");
      box.classList.add("scale-100", "translate-y-0", "opacity-100");
    }, 50);
  }

  function closeLearn() {
    const modal = document.getElementById("learnModal");
    const overlay = document.getElementById("learnOverlay");
    const box = document.getElementById("learnBox");
    const main = document.getElementById("mainContent");

    overlay.classList.add("opacity-0");
    box.classList.add("opacity-0", "scale-95", "translate-y-6");
    box.classList.remove("scale-100", "translate-y-0");
    main.classList.remove("blur-sm");

    setTimeout(() => {
      modal.classList.add("hidden");
    }, 400);
  }

  // ESC close only
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeLearn();
    }
  });

  function showWhy() {
    const section = document.getElementById("whySection");
    section.classList.remove("hidden");

    section.scrollIntoView({ behavior: "smooth" });

    animateCounter("count1", 5000);
    animateCounter("count2", 1200);
    animateCounter("count3", 350);
  }

  function animateCounter(id, target) {
    const element = document.getElementById(id);
    let count = 0;
    const speed = target / 100;

    const update = setInterval(() => {
      count += speed;
      if (count >= target) {
        element.innerText = target + "+";
        clearInterval(update);
      } else {
        element.innerText = Math.floor(count);
      }
    }, 20);
  }

  function flyToCart(imgElement){

  const cart = document.getElementById("cartIcon");

  if(!cart) return;

  const imgRect = imgElement.getBoundingClientRect();
  const cartRect = cart.getBoundingClientRect();

  const flyingImg = imgElement.cloneNode(true);

  flyingImg.classList.add("fly-img");

  flyingImg.style.top = imgRect.top + "px";
  flyingImg.style.left = imgRect.left + "px";

  document.body.appendChild(flyingImg);

  setTimeout(()=>{

    flyingImg.style.top = cartRect.top + "px";
    flyingImg.style.left = cartRect.left + "px";
    flyingImg.style.width = "30px";
    flyingImg.style.height = "30px";
    flyingImg.style.opacity = "0.5";

  },50);

  setTimeout(()=>{
    flyingImg.remove();
  },800);
}

document.addEventListener("click", function(e){
  if(!searchBox.contains(e.target) && !container.contains(e.target)){
    container.classList.add("hidden");
  }
});

const searchBox = document.getElementById("searchBox");
const container = document.getElementById("searchResults");

let debounceTimer;

searchBox.addEventListener("input", function () {

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {

    const query = searchBox.value.trim();

    if (query.length === 0) {
      container.classList.add("hidden");
      container.innerHTML = "";
      return;
    }

    const res = await fetch(`/api/search?q=${query}`);
    const products = await res.json();

    if (products.length === 0) {
      container.innerHTML = `<div class="p-3 text-gray-500">No products found</div>`;
      container.classList.remove("hidden");
      return;
    }

    container.innerHTML = products.map(p => {

      const highlighted = p.name.replace(
        new RegExp(query, "gi"),
        match => `<span class="font-semibold text-green-600">${match}</span>`
      );

      return `
      <div onclick="window.location='/shop#${p._id}'"
           class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b">

        <img src="${p.image}" 
             class="w-10 h-10 object-cover rounded">

        <div class="flex-1">
          <div class="text-sm">${highlighted}</div>
          <div class="text-xs text-gray-500">₹${p.price}</div>
        </div>

      </div>
      `;
    }).join("");

    container.classList.remove("hidden");

  }, 300); // debounce delay

});