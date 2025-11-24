<?php
session_start();
if (!isset($_SESSION['user'])) {
  header("Location: index.html");
  exit();
}
require_once __DIR__ . '/includes/functions.php';

$products = [
  ['id'=>1, 'name'=>'DHH Hoodie', 'price'=>2500, 'image'=>'hoodie.png'],
  ['id'=>2, 'name'=>'DHH Cap', 'price'=>1200, 'image'=>'cap.png'],
  ['id'=>3, 'name'=>'DHH T-Shirt', 'price'=>1500, 'image'=>'tshirt.png']
];

$search = $_GET['search'] ?? '';
$filtered = [];

if ($search) {
    foreach ($products as $p) {
        if (stripos($p['name'], $search) !== false) {
            $filtered[] = $p;
        }
    }
} else {
    $filtered = $products;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Merch Store</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
<header>
  <nav>
    <a href="products.php" class="active">Home</a>
    <a href="cart.php">Cart</a>
    <a href="orders.php">My Orders</a>
    <a href="track.php">Track Delivery</a>
    <a href="contact.php">Customer Care</a>
    <a href="logout.php">Logout</a>
  </nav>
</header>

<div class="container">
  <form method="GET" action="products.php">
    <input class="search-bar" type="text" name="search" placeholder="Search merchandise..." value="<?php echo htmlspecialchars($search); ?>" />
  </form>

  <div class="products">
    <?php foreach ($filtered as $product): ?>
    <div class="product">
      <img src="<?php echo $product['image']; ?>" alt="<?php echo $product['name']; ?>" />
      <h3><?php echo $product['name']; ?></h3>
      <p>₹<?php echo number_format($product['price']); ?></p>
      <form method="POST" action="add_to_cart.php">
        <input type="hidden" name="id" value="<?php echo $product['id'] ?>" />
        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(generate_csrf_token()); ?>" />
        <button type="submit">Add to Cart</button>
      </form>
    </div>
    <?php endforeach; ?>
  </div>
</div>

<footer class="footer">
  &copy; 2025 DHH Merch
</footer>
</body>
</html>
