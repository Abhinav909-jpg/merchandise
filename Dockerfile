# --- STAGE 1: BUILD ENVIRONMENT ---
# Use the official PHP image with Apache pre-installed.
# This base image is lightweight and handles the web server setup for us.
FROM php:8.2-apache

# Set the working directory inside the container.
# All subsequent commands will run from here unless specified otherwise.
WORKDIR /var/www/html

# --- STAGE 2: INSTALL PHP EXTENSIONS AND DEPENDENCIES ---
# The deployment service needs to run shell commands to install extensions.
# 1. Update the package list.
# 2. Install necessary system dependencies (like libzip for ZIP support).
# 3. Install common PHP extensions required for typical web apps:
#    - pdo: PHP Data Objects (abstract database layer)
#    - pdo_mysql / mysqli: Required for connecting to MySQL databases.
#    - zip: Useful for handling compressed files.
# The '&& \' is just a way to run multiple commands in one step efficiently.
RUN apt-get update && \
    apt-get install -y libzip-dev unzip && \
    docker-php-ext-install pdo pdo_mysql mysqli zip

# --- STAGE 3: COPY APPLICATION FILES ---
# Copy all the application files from your local project (the current folder '.') 
# into the web root directory of the Apache server inside the container.
# This includes your .php, .html, .css, images, etc.
COPY . /var/www/html/

# --- STAGE 4: CONFIGURATION (OPTIONAL BUT RECOMMENDED) ---
# Set the server to listen on the port provided by the hosting environment.
# Render automatically injects the PORT environment variable.
# We are creating a small configuration file to tell Apache to use the environment's port.
RUN echo "Listen ${PORT}" > /etc/apache2/conf-available/port.conf && \
    a2enconf port

# --- STAGE 5: START THE SERVER ---
# The default command for the 'php:8.2-apache' image is to start Apache.
# We don't need a custom CMD instruction, as the base image handles it.

# The server runs on port 80 by default, but the configuration above adapts it to Render's required PORT.
EXPOSE 80
