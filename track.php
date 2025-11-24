<?php
session_start();
if (!isset($_SESSION['user'])) {
  header("Location: index.html");
  exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Track Delivery</title>
  <link rel="stylesheet" href="style.css" />
  <!-- Leaflet CSS (OpenStreetMap) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map {
      height: 400px;
      width: 100%;
      margin-top: 15px;
      border-radius: 10px;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
<header>
  <nav>
    <a href="products.php">Home</a>
    <a href="cart.php">Cart</a>
    <a href="orders.php">My Orders</a>
    <a href="track.php" class="active">Track Delivery</a>
    <a href="contact.php">Customer Care</a>
    <a href="logout.php">Logout</a>
  </nav>
</header>

<div class="container">
  <h2>Track Your Delivery</h2>
  <p>Delivery Guy: <strong>Aman Sharma</strong> | Contact: <a href="tel:+911234567890">+91 12345 67890</a></p>
</div>

<div id="map"></div>

<div class="container" style="margin-top:20px;">
  <p><strong>Status:</strong> Your delivery is on the way! Expected arrival in 2-3 hours.</p>
</div>

<footer class="footer">
  &copy; 2025 DHH Merch
</footer>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const deliveryLocation = [28.6139, 77.2090];
    const map = L.map('map').setView(deliveryLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker(deliveryLocation).addTo(map).bindPopup('Delivery Location').openPopup();
  });
</script>
</body>
</html>
