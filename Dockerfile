# Stage 1: Build the React application
FROM node:18-alpine as build-stage

# Switch to the root user for permissions
USER root

# Set the working directory
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