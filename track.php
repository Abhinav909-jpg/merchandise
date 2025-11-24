<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Track Delivery</title>
  <link rel="stylesheet" href="css/style.css" />
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
  
  <div id="map"></div>
  
  <script>
    function initMap() {
      const deliveryLocation = { lat: 28.6139, lng: 77.2090 }; // Delhi coords
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: deliveryLocation,
      });
      new google.maps.Marker({
        position: deliveryLocation,
        map: map,
        title: "Delivery Location",
      });
    }
  </script>
  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap">
  </script>
</div>

<footer class="footer">
  &copy; 2025 DHH Merch
</footer>
</body>
</html>
