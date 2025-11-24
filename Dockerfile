# --- STAGE 1: BUILD ENVIRONMENT ---
FROM php:8.2-apache

# Set the working directory inside the container.
WORKDIR /var/www/html

# --- STAGE 2: INSTALL PHP EXTENSIONS AND DEPENDENCIES ---
RUN apt-get update && \
    apt-get install -y libzip-dev unzip && \
    docker-php-ext-install pdo pdo_mysql mysqli zip

# --- STAGE 3: COPY APPLICATION FILES ---
# Copy all the application files from your local project into the web root.
COPY . /var/www/html/

# --- STAGE 4: EXPOSE PORT ---
# EXPOSE 80 tells Docker that the container is configured to listen on port 80.
# Render will automatically map its external PORT environment variable to this internal port 80.
EXPOSE 80
