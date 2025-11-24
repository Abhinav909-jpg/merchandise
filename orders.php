<?php
session_start();
if (!isset($_SESSION['user'])) {
  header("Location: index.html");
  exit();
}

require_once __DIR__ . '/includes/functions.php';

// persistent orders storage (JSON file)
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
  @mkdir($dataDir, 0755, true);
}
$ordersFile = $dataDir . '/orders.json';
if (!file_exists($ordersFile)) {
  @file_put_contents($ordersFile, json_encode([], JSON_PRETTY_PRINT));
}

// Load existing orders from disk
$allOrders = json_decode(@file_get_contents($ordersFile), true) ?: [];

if (isset($_POST['place_order'])) {
  $token = $_POST['csrf_token'] ?? '';
  if (!verify_csrf_token($token)) {
    header("Location: cart.php");
    exit();
  }

  $cart = $_SESSION['cart'] ?? [];
  if ($cart) {
    // validate product ids
    $products = get_products_map();
    $valid_items = [];
    foreach ($cart as $id => $qty) {
      if (isset($products[$id])) $valid_items[$id] = (int)$qty;
    }
    if ($valid_items) {
      $newOrder = ['items' => $valid_items, 'time' => date('Y-m-d H:i:s'), 'status' => 'Processing', 'user' => $_SESSION['user']];
      $allOrders[] = $newOrder;
      // persist to disk atomically
      @file_put_contents($ordersFile, json_encode($allOrders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    unset($_SESSION['cart']);
  }
}

// Show only current user's orders
$orders = array_values(array_filter($allOrders, function($o) {
  return isset($o['user']) && $o['user'] === ($_SESSION['user'] ?? '');
}));
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Orders</title>
  <link rel="stylesheet" href="style.css" />
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
