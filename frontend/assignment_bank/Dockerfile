# Dockerfile for React Frontend (Vite + Nginx for Cloud Run)

# ---- Stage 1: Build the React App ----
    FROM node:18-alpine as builder
    # Alpine images are smaller
    
    WORKDIR /app
    
    # Copy package.json and package-lock.json (or yarn.lock)
    COPY package.json package-lock.json ./
    
    # Install dependencies using npm ci for consistency
    # If you use yarn, replace with 'yarn install --frozen-lockfile'
    RUN npm ci
    
    # Copy the rest of the application source code
    COPY . .
    
    # Build the production application
    # Reads .env.production for VITE_API_BASE_URL
    RUN npm run build
    # Build output will be in /app/dist
    
    
    # ---- Stage 2: Serve static files with Nginx ----
    FROM nginx:stable-alpine
    # Use a lightweight Nginx image
    
    # Copy the Nginx configuration template prepared earlier
    COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
    
    # Copy the built static files from the 'builder' stage
    # from /app/dist (Vite's default output dir) to Nginx's default serve directory
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # Install 'gettext' package which provides 'envsubst' utility needed to substitute $PORT
    # Then remove apk cache
    RUN apk update && apk add --no-cache gettext
    
    # Expose the port Nginx will listen on (Cloud Run default is 8080)
    # The value is determined by the PORT environment variable provided by Cloud Run.
    EXPOSE ${PORT:-8080} 
    # Expose 8080 by default if PORT isn't set externally
    
    # Define the command to start the container
    # 1. Use 'envsubst' to substitute the value of ${PORT} into the Nginx config template,
    #    outputting the result to the actual Nginx config file.
    # 2. Start Nginx in the foreground ('daemon off;') so the container keeps running.
    CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]