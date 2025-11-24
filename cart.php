<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

$products = [
  1 => ['name'=>'DHH Hoodie', 'price'=>2500],
  2 => ['name'=>'DHH Cap', 'price'=>1200],
  3 => ['name'=>'DHH T-Shirt', 'price'=>1500]
];

$cart = $_SESSION['cart'] ?? [];
$total = 0;
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Your Cart</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
<header>
  <nav>
    <a href="products.php">Home</a>
    <a href="cart.php" class="active">Cart</a>
    <a href="orders.php">My Orders</a>
    <a href="track.php">Track Delivery</a>
    <a href="contact.php">Customer Care</a>
    <a href="logout.php">Logout</a>
  </nav>
</header>

<div class="container">
  <h2>Your Cart</h2>
  <?php if (!$cart): ?>
    <p>Your cart is empty.</p>
  <?php else: ?>
    <ul>
      <?php foreach ($cart as $id => $qty): 
        $product = $products[$id];
        $subtotal = $qty * $product['price'];
        $total += $subtotal;
      ?>
        <li><?php echo $product['name']; ?> x<?php echo $qty; ?> - ₹<?php echo number_format($subtotal); ?></li>
      <?php endforeach; ?>
    </ul>
    <p><strong>Total: ₹<?php echo number_format($total); ?></strong></p>
    <form method="POST" action="orders.php">
      <button name="place_order" type="submit">Place Order</button>
    </form>
  <?php endif; ?>
</div>

<footer class="footer">
  &copy; 2025 DHH Merch
</footer>
</body>
</html>
