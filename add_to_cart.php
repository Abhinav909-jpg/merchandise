<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: index.html");
    exit();
}

require_once __DIR__ . '/includes/functions.php';

$id = intval($_POST['id'] ?? 0);
$token = $_POST['csrf_token'] ?? '';

// verify CSRF token before mutating session
if (!verify_csrf_token($token)) {
    // invalid token: redirect back to products
    @file_put_contents(__DIR__ . '/logs/debug.log', sprintf("%s ADD_TO_CART BAD_CSRF: sess=%s id=%s token=%s\n", date('c'), session_id(), $id, substr($token,0,8)), FILE_APPEND);
    header("Location: products.php");
    exit();
}

$products = get_products_map();
if ($id > 0 && isset($products[$id])) {
    @file_put_contents(__DIR__ . '/logs/debug.log', sprintf("%s ADD_TO_CART OK: sess=%s id=%d\n", date('c'), session_id(), $id), FILE_APPEND);
    if (!isset($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }
    if (isset($_SESSION['cart'][$id])) {
        $_SESSION['cart'][$id]++;
    } else {
        $_SESSION['cart'][$id] = 1;
    }
}

header("Location: cart.php");
exit();
