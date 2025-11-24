<?php
// Common helpers for the small project
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        // Random 32-byte token
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token($token) {
    if (empty($_SESSION['csrf_token']) || empty($token)) return false;
    return hash_equals($_SESSION['csrf_token'], $token);
}

function get_products_map() {
    // central product list so handlers can validate ids
        return [
            1 => ['name'=>'DHH Hoodie', 'price'=>2500, 'image'=>'images/hoodie.svg'],
            2 => ['name'=>'DHH Cap', 'price'=>1200, 'image'=>'images/cap.svg'],
            3 => ['name'=>'DHH T-Shirt', 'price'=>1500, 'image'=>'images/tshirt.svg']
        ];
}

?>
