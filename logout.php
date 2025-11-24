<?php
session_start();
// destroy session data and redirect to the login page
session_unset();
session_destroy();
header("Location: index.html");
exit();
?>