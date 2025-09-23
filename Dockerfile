# Stage 1: Build the Vite application
FROM node:18-alpine AS build-stage
# Ensure necessary build tools and permissions
RUN apk add --no-cache bash git python3 make g++
WORKDIR /app
# Copy package manifests first for better caching
COPY package.json package-lock.json ./
# Use npm ci for reproducible installs
RUN npm ci --silent
# Copy rest of the source
COPY . .
# Ensure node_modules binaries are executable
RUN chmod -R a+rx node_modules/.bin || true

# Make sure files are owned by the non-root `node` user and switch to it
RUN chown -R node:node /app
USER node

# Build the app as non-root
RUN npm run build

# Ensure Three's Draco decoder is available in the built assets
# Some parts of three reference the decoder at /node_modules/three/examples/jsm/libs/draco
RUN mkdir -p dist/node_modules/three/examples/jsm/libs && \
    cp -R node_modules/three/examples/jsm/libs dist/node_modules/three/examples/jsm/libs || true
# Stage 2: Serve the compiled application with Nginx
FROM nginx:1.26.2-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]