<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

if (!isset($_SESSION['orders'])) {
    $_SESSION['orders'] = [];
}

if (isset($_POST['place_order'])) {
    $cart = $_SESSION['cart'] ?? [];
    if ($cart) {
        $_SESSION['orders'][] = ['items' => $cart, 'time' => date('Y-m-d H:i:s'), 'status' => 'Processing'];
        unset($_SESSION['cart']);
    }
}

$orders = $_SESSION['orders'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Orders</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
<header>
  <nav>
    <a href="products.php">Home</a>
    <a href="cart.php">Cart</a>
    <a href="orders.php" class="active">My Orders</a>
    <a href="track.php">Track Delivery</a>
    <a href="contact.php">Customer Care</a>
    <a href="logout.php">Logout</a>
  </nav>
</header>

<div class="container">
  <h2>My Orders</h2>
  <?php if (!$orders): ?>
    <p>No orders placed yet.</p>
  <?php else: ?>
    <ul>
      <?php foreach ($orders as $index => $order): ?>
      <li>Order <?php echo $index+1 ?> - Placed on <?php echo $order['time']; ?> - Status: <?php echo $order['status']; ?></li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</div>

<footer class="footer">
  &copy; 2025 DHH Merch
</footer>
</body>
</html>
