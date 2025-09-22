# Stage 1: Build the Vite application
FROM node:18-alpine AS build-stage
# Use the root user to ensure build commands can run
USER root
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
# Stage 2: Serve the compiled application with Nginx
FROM nginx:1.26.2-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]